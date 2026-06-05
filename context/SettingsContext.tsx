
// context/SettingsContext.tsx
import React, { createContext, useContext, ReactNode, useCallback, useMemo, useState, useEffect } from 'react';
import { CustomPrompt } from '../types';
import { usePersistedState } from '../hooks/usePersistedState';
import { LocalProvider } from '../services/localLlmService';
import { encryptStringAsync, decryptStringAsync, isVaultCiphertext } from '../utils/crypto';

export type MasterIntelligenceProvider = 'gemini' | 'local' | 'cloudflare';

interface AppSettings {
    backgroundColor: string;
    miaFontColor: string;
    backgroundImage: string;
    animationsEnabled: boolean;
    audioFeedbackEnabled: boolean;
    developerPanelColor: string;
    miniMapColor: string;
    
    // Security Settings
    inputSanitizationEnabled: boolean;
    promptInjectionGuardEnabled: boolean;
    clientSideRateLimitingEnabled: boolean;
    
    // Intelligence Routing
    masterProvider: MasterIntelligenceProvider;
    forceLocalForAll: boolean;
    
    // Local LLM Settings
    localLlmProvider: LocalProvider;
    localLlmBaseUrl: string;
    localLlmModelId: string;
    
    // Cloudflare Workers AI Settings (SENSITIVE)
    cfAccountId: string;
    cfApiToken: string; // Stored encrypted
    cfModelId: string;
    
    // Custom Prompts
    customPrompts: CustomPrompt[];
}

const defaultSettings: AppSettings = {
    backgroundColor: '#111827',
    miaFontColor: '#22d3ee',
    backgroundImage: '',
    animationsEnabled: true,
    audioFeedbackEnabled: true,
    developerPanelColor: '#1f2937',
    miniMapColor: '#334155',
    inputSanitizationEnabled: true,
    promptInjectionGuardEnabled: true,
    clientSideRateLimitingEnabled: true,
    
    masterProvider: 'gemini',
    forceLocalForAll: false,
    
    localLlmProvider: 'lm-studio',
    localLlmBaseUrl: 'http://localhost:1234/v1',
    localLlmModelId: 'local-model',
    
    cfAccountId: '',
    cfApiToken: '',
    cfModelId: '@cf/meta/llama-3-8b-instruct',
    
    customPrompts: [],
};

const SETTINGS_STORAGE_KEY = 'ai-shunt-settings';

interface SettingsContextType {
    settings: AppSettings;
    updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
    addCustomPrompt: (prompt: CustomPrompt) => void;
    removeCustomPrompt: (id: string) => void;
    resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rawSettings, setRawSettings] = usePersistedState<AppSettings>(SETTINGS_STORAGE_KEY, defaultSettings);

    // Plaintext token lives only in memory; localStorage holds AES-GCM ciphertext ("v2:...").
    const [plainCfToken, setPlainCfToken] = useState<string>('');

    // Decrypt on load, and transparently migrate legacy (v1/plaintext) values to v2.
    useEffect(() => {
        let cancelled = false;
        const stored = rawSettings.cfApiToken;
        if (!stored) {
            setPlainCfToken('');
            return;
        }
        (async () => {
            try {
                const plain = await decryptStringAsync(stored);
                if (cancelled) return;
                setPlainCfToken(plain);
                // One-time migration: re-encrypt legacy values with real encryption
                if (plain && !isVaultCiphertext(stored)) {
                    const upgraded = await encryptStringAsync(plain);
                    if (!cancelled) {
                        setRawSettings(prev => ({ ...prev, cfApiToken: upgraded }));
                    }
                }
            } catch {
                if (!cancelled) setPlainCfToken('');
            }
        })();
        return () => { cancelled = true; };
    }, [rawSettings.cfApiToken, setRawSettings]);

    const settings = useMemo(() => ({
        ...rawSettings,
        cfApiToken: plainCfToken
    }), [rawSettings, plainCfToken]);

    const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        // Sensitive field: expose plaintext to the app immediately, persist ciphertext asynchronously.
        if (key === 'cfApiToken' && typeof value === 'string') {
            setPlainCfToken(value);
            encryptStringAsync(value)
                .then(encrypted => {
                    setRawSettings(prev => ({ ...prev, cfApiToken: encrypted }));
                })
                .catch(() => {
                    // If encryption is unavailable, do not persist the secret at all.
                    setRawSettings(prev => ({ ...prev, cfApiToken: '' }));
                });
            return;
        }
        setRawSettings(prevSettings => ({
            ...prevSettings,
            [key]: value,
        }));
    }, [setRawSettings]);
    
    const addCustomPrompt = useCallback((prompt: CustomPrompt) => {
        setRawSettings(prev => ({
            ...prev,
            customPrompts: [...(prev.customPrompts || []), prompt]
        }));
    }, [setRawSettings]);

    const removeCustomPrompt = useCallback((id: string) => {
        setRawSettings(prev => ({
            ...prev,
            customPrompts: (prev.customPrompts || []).filter(p => p.id !== id)
        }));
    }, [setRawSettings]);
    
    const resetSettings = useCallback(() => {
        setRawSettings(defaultSettings);
    }, [setRawSettings]);

    return (
        <SettingsContext.Provider value={{ settings, updateSetting, addCustomPrompt, removeCustomPrompt, resetSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
