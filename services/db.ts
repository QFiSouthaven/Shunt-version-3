
// services/db.ts

/**
 * A lightweight wrapper around IndexedDB for asynchronous, large-capacity storage.
 * Replaces localStorage for heavy items like file content, chat history, and embeddings.
 */

const DB_NAME = 'AetherShuntDB';
const DB_VERSION = 4; // Incremented for TODOS store
const STORES = {
    KEY_VALUE: 'key_value_store', 
    FILES: 'files_store',         
    VECTORS: 'vector_store',      
    EVOLUTION: 'evolution_store', 
    JOBS: 'jobs_store',
    TODOS: 'todos_store'            
};

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const existingStores = db.objectStoreNames;

            if (!existingStores.contains(STORES.KEY_VALUE)) {
                db.createObjectStore(STORES.KEY_VALUE);
            }
            if (!existingStores.contains(STORES.FILES)) {
                db.createObjectStore(STORES.FILES);
            }
            if (!existingStores.contains(STORES.VECTORS)) {
                db.createObjectStore(STORES.VECTORS, { keyPath: 'id' });
            }
            if (!existingStores.contains(STORES.EVOLUTION)) {
                db.createObjectStore(STORES.EVOLUTION, { keyPath: 'id' });
            }
            if (!existingStores.contains(STORES.JOBS)) {
                db.createObjectStore(STORES.JOBS, { keyPath: 'id' });
            }
            if (!existingStores.contains(STORES.TODOS)) {
                db.createObjectStore(STORES.TODOS, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };
    });

    return dbPromise;
};

export const dbService = {
    async get<T>(storeName: string, key: string): Promise<T | null> {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result as T || null);
            request.onerror = () => reject(request.error);
        });
    },

    async getAll<T>(storeName: string): Promise<T[]> {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result as T[]);
            request.onerror = () => reject(request.error);
        });
    },

    async set<T>(storeName: string, key: string | undefined, value: T): Promise<void> {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(value, key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async queryVectors(queryVector: number[], limit: number = 5): Promise<any[]> {
        const allVectors = await dbService.getAll<any>(STORES.VECTORS);
        
        const cosineSimilarity = (v1: number[], v2: number[]) => {
            let dotProduct = 0;
            let mA = 0;
            let mB = 0;
            for(let i = 0; i < v1.length; i++){
                dotProduct += (v1[i] * v2[i]);
                mA += (v1[i] * v1[i]);
                mB += (v2[i] * v2[i]);
            }
            return dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
        };

        const scored = allVectors.map(v => ({
            ...v,
            score: cosineSimilarity(queryVector, v.vector)
        }));

        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    },

    async delete(storeName: string, key: string): Promise<void> {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async clear(storeName: string): Promise<void> {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
    
    STORES
};
