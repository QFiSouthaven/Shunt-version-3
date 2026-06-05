
// hooks/useAsyncState.ts
import { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/db';

/**
 * A hook for managing state that persists to IndexedDB.
 * Unlike usePersistedState (localStorage), this is asynchronous.
 * 
 * @param key The unique key for the data.
 * @param initialValue Default value if nothing exists in DB.
 * @param storeName The IndexedDB store to use (default: key_value_store).
 */
export function useAsyncState<T>(key: string, initialValue: T, storeName: string = dbService.STORES.KEY_VALUE) {
    const [value, setInternalValue] = useState<T>(initialValue);
    const [isLoading, setIsLoading] = useState(true);

    // Load from DB on mount
    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            try {
                const stored = await dbService.get<T>(storeName, key);
                if (isMounted) {
                    if (stored !== null) {
                        setInternalValue(stored);
                    }
                    setIsLoading(false);
                }
            } catch (error) {
                console.error(`Error loading ${key} from DB:`, error);
                if (isMounted) setIsLoading(false);
            }
        };
        load();
        return () => { isMounted = false; };
    }, [key, storeName]);

    // Save to DB on change
    const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
        setInternalValue(prev => {
            const valueToStore = newValue instanceof Function ? newValue(prev) : newValue;
            
            // Fire and forget save (with error logging)
            dbService.set(storeName, key, valueToStore).catch(err => 
                console.error(`Error saving ${key} to DB:`, err)
            );
            
            return valueToStore;
        });
    }, [key, storeName]);

    return [value, setValue, isLoading] as const;
}
