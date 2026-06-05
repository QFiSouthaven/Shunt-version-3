
// utils/crypto.ts

/**
 * Aether Vault Cryptography
 * Provides client-side obfuscation and encryption for sensitive fields in localStorage.
 * While true security requires a backend, this prevents casual exposure and 
 * basic browser extension scraping.
 */

const SECRET_SALT = 'aether-shunt-v3-entropy-layer-9';

/**
 * Encrypts a string using an XOR-based cipher with a localized salt and Base64 encoding.
 */
export const encryptString = (text: string): string => {
    if (!text) return '';
    // Prepend a version flag to distinguish encrypted from potentially old plaintext data
    const payload = `v1:${text}`;
    const code = payload.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length))
    ).join('');
    return btoa(code);
};

/**
 * Decrypts a previously encrypted string. 
 * Handles fallback for older plaintext data to prevent system crashes during migration.
 */
export const decryptString = (encoded: string): string => {
    if (!encoded) return '';
    try {
        const decoded = atob(encoded);
        const text = decoded.split('').map((char, i) => 
            String.fromCharCode(char.charCodeAt(0) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length))
        ).join('');
        
        if (text.startsWith('v1:')) {
            return text.substring(3);
        }
        // If it doesn't have the version flag, it might be legacy plaintext
        return encoded; 
    } catch (e) {
        // Not base64 or failed to decrypt - treat as legacy plaintext
        return encoded;
    }
};
