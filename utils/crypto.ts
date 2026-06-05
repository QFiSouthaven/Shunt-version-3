
// utils/crypto.ts

/**
 * Aether Vault Cryptography (v2)
 * Real client-side encryption for sensitive fields using the Web Crypto API.
 *
 * - AES-GCM 256-bit, random IV per encryption.
 * - The key is generated as NON-EXTRACTABLE and stored in IndexedDB: scripts can
 *   use it to encrypt/decrypt, but the raw key material can never be read out or
 *   copied off the device.
 * - Ciphertext format: "v2:" + base64(iv || ciphertext) — stored in localStorage.
 * - Legacy "v1" XOR-scrambled values are still readable (decrypt-only) so existing
 *   users are migrated transparently; nothing is ever written in v1 format again.
 */

const LEGACY_SALT = 'aether-shunt-v3-entropy-layer-9';

const KEY_DB_NAME = 'aether-vault';
const KEY_STORE = 'keys';
const KEY_ID = 'vault-key-v2';

let cachedKey: CryptoKey | null = null;
let keyPromise: Promise<CryptoKey> | null = null;

const openKeyDb = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        const req = indexedDB.open(KEY_DB_NAME, 1);
        req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains(KEY_STORE)) {
                req.result.createObjectStore(KEY_STORE);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

const idbGet = <T,>(db: IDBDatabase, key: string): Promise<T | undefined> =>
    new Promise((resolve, reject) => {
        const tx = db.transaction(KEY_STORE, 'readonly');
        const req = tx.objectStore(KEY_STORE).get(key);
        req.onsuccess = () => resolve(req.result as T | undefined);
        req.onerror = () => reject(req.error);
    });

const idbSet = (db: IDBDatabase, key: string, value: unknown): Promise<void> =>
    new Promise((resolve, reject) => {
        const tx = db.transaction(KEY_STORE, 'readwrite');
        tx.objectStore(KEY_STORE).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });

/** Get (or create on first use) the device-local, non-extractable AES key. */
const getVaultKey = async (): Promise<CryptoKey> => {
    if (cachedKey) return cachedKey;
    if (!keyPromise) {
        keyPromise = (async () => {
            const db = await openKeyDb();
            let key = await idbGet<CryptoKey>(db, KEY_ID);
            if (!key) {
                key = await crypto.subtle.generateKey(
                    { name: 'AES-GCM', length: 256 },
                    false, // non-extractable: key material can never leave this browser profile
                    ['encrypt', 'decrypt']
                );
                await idbSet(db, KEY_ID, key);
            }
            cachedKey = key;
            return key;
        })();
    }
    return keyPromise;
};

const bytesToBase64 = (bytes: Uint8Array): string => {
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin);
};

const base64ToBytes = (b64: string): Uint8Array =>
    Uint8Array.from(atob(b64), c => c.charCodeAt(0));

/** Encrypt a string with AES-GCM. Returns "v2:<base64>" or '' for empty input. */
export const encryptStringAsync = async (text: string): Promise<string> => {
    if (!text) return '';
    const key = await getVaultKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text))
    );
    const payload = new Uint8Array(iv.length + ciphertext.length);
    payload.set(iv);
    payload.set(ciphertext, iv.length);
    return `v2:${bytesToBase64(payload)}`;
};

/**
 * Decrypt a stored value. Supports:
 * - "v2:" AES-GCM ciphertext (current format)
 * - legacy v1 XOR-scrambled values (read-only, for migration)
 * - legacy plaintext (returned as-is)
 */
export const decryptStringAsync = async (encoded: string): Promise<string> => {
    if (!encoded) return '';
    if (encoded.startsWith('v2:')) {
        try {
            const raw = base64ToBytes(encoded.slice(3));
            const key = await getVaultKey();
            const plaintext = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: raw.slice(0, 12) },
                key,
                raw.slice(12)
            );
            return new TextDecoder().decode(plaintext);
        } catch {
            // Wrong key (e.g. cleared site data) or corrupt payload — treat as unset.
            return '';
        }
    }
    return decryptLegacy(encoded);
};

/** True if the stored value is already in the current (v2) format. */
export const isVaultCiphertext = (value: string): boolean => value.startsWith('v2:');

/** Legacy v1 XOR decrypt — kept only so old stored values can be migrated. */
export const decryptLegacy = (encoded: string): string => {
    if (!encoded) return '';
    try {
        const decoded = atob(encoded);
        const text = decoded.split('').map((char, i) =>
            String.fromCharCode(char.charCodeAt(0) ^ LEGACY_SALT.charCodeAt(i % LEGACY_SALT.length))
        ).join('');
        if (text.startsWith('v1:')) {
            return text.substring(3);
        }
        return encoded;
    } catch {
        return encoded;
    }
};
