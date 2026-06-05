
// context/SettingsContext.tsx
import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { CustomPrompt } from '../types';
import { usePersistedState } from '../hooks/usePersistedState';
import { LocalProvider } from '../services/localLlmService';
import { encryptString, decryptString } from '../utils/crypto';

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

    // Decrypt sensitive fields when reading from persisted state
    const settings = useMemo(() => ({
        ...rawSettings,
        cfApiToken: decryptString(rawSettings.cfApiToken)
    }), [rawSettings]);

    const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setRawSettings(prevSettings => {
            let valueToStore = value;
            
            // Encrypt sensitive fields before persisting to localStorage
            if (key === 'cfApiToken' && typeof value === 'string') {
                valueToStore = encryptString(value) as any;
            }

            return {
                ...prevSettings,
                [key]: valueToStore,
            };
        });
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
