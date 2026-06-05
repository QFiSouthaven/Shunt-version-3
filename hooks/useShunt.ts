
// hooks/useShunt.ts
import { useState, useCallback, useRef, useEffect, useTransition, useOptimistic, startTransition as reactStartTransition } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAsyncState } from './useAsyncState';
import { useTelemetry } from '../context/TelemetryContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useSettings } from '../context/SettingsContext';
import { determineBestAction, gradeOutput } from '../services/geminiService';
import { audioService } from '../services/audioService';
import { logFrontendError, ErrorSeverity } from '../utils/errorLogger';
import { sanitizeInput } from '../utils/security';
import { ShuntAction, PromptModuleKey, HistoryEntry } from '../types';
import { promptModules } from '../services/prompts';
import { dbService } from '../services/db';
import { shuntService } from '../services/shunt.service';
import { appEventBus } from '../lib/eventBus';

interface BulletinDocument {
    name: string;
    content: string;
}

export const useShunt = () => {
    const [inputText, setInputText, isInputTextLoading] = useAsyncState<string>('shunt_inputText', '', dbService.STORES.KEY_VALUE);
    const [outputText, setOutputText, isOutputTextLoading] = useAsyncState<string>('shunt_outputText', '', dbService.STORES.KEY_VALUE);
    const [priority, setPriority] = useAsyncState<string>('shunt_priority', 'Medium', dbService.STORES.KEY_VALUE);
    const [history, setHistory] = useAsyncState<HistoryEntry[]>('shunt_history', [], dbService.STORES.KEY_VALUE);
    const [initialPrompt, setInitialPrompt] = useAsyncState<string>('shunt_initialPrompt', '', dbService.STORES.KEY_VALUE);
    const [bulletinDocuments, setBulletinDocuments] = useAsyncState<BulletinDocument[]>('shunt_bulletinDocuments', [], dbService.STORES.FILES);

    const [isPending, startTransition] = useTransition();
    const [optimisticInput, setOptimisticInput] = useOptimistic(
        inputText,
        (currentState: string, newValue: string) => newValue
    );

    const [isEvolving, setIsEvolving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeShunt, setActiveShunt] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string>('gemini-3-pro-preview');
    const [modulesForLastRun, setModulesForLastRun] = useState<string[] | null>(null);
    const [showAmplifyX2, setShowAmplifyX2] = useState(false);

    const { telemetryService } = useTelemetry();
    const { usage, tierDetails, incrementUsage } = useSubscription();
    const { settings } = useSettings();

    const submitShunt = useCallback((action: ShuntAction | string, customInstruction?: string, overrideInput?: string) => {
        const textToProcess = overrideInput !== undefined ? overrideInput : inputText;
        
        if (tierDetails.shuntRuns !== 'unlimited' && usage.shuntRuns >= tierDetails.shuntRuns) {
            setError("Quota reached.");
            return;
        }
        if (!textToProcess.trim()) {
            setError("Input cannot be empty.");
            return;
        }

        setError(null);
        setOutputText('');
        setModulesForLastRun(null);
        setShowAmplifyX2(false);
        setActiveShunt(typeof action === 'string' ? action : 'Action');
        audioService.playSound('send');

        if (history.length === 0) setInitialPrompt(textToProcess);

        startTransition(async () => {
            const sanitizedText = settings.inputSanitizationEnabled ? sanitizeInput(textToProcess) : textToProcess;
            const useLocalLlm = selectedModel.includes('local') || settings.forceLocalForAll;

            try {
                await shuntService.executeShunt({
                    text: sanitizedText,
                    action,
                    model: selectedModel,
                    context: bulletinDocuments.length > 0 ? bulletinDocuments.map(d => `--- ${d.name} ---\n${d.content}`).join('\n\n') : undefined,
                    priority,
                    customInstruction,
                    useLocalLlm,
                    localLlmConfig: useLocalLlm ? {
                        baseUrl: settings.localLlmBaseUrl,
                        modelId: settings.localLlmModelId,
                        provider: settings.localLlmProvider
                    } : undefined
                });
            } catch (e: any) {
                setError(e.message);
                setActiveShunt(null);
            }
        });
    }, [inputText, priority, selectedModel, history.length, settings, bulletinDocuments, tierDetails, usage, setOutputText, setInitialPrompt]);

    const submitModularShunt = useCallback((modules: Set<PromptModuleKey>) => {
        if (!inputText.trim()) return;
        if (tierDetails.shuntRuns !== 'unlimited' && usage.shuntRuns >= tierDetails.shuntRuns) {
            setError("Quota reached.");
            return;
        }

        setError(null);
        setOutputText('');
        setActiveShunt('Modular Stack');
        setModulesForLastRun(Array.from(modules));
        audioService.playSound('send');

        startTransition(async () => {
            const useLocalLlm = selectedModel.includes('local') || settings.forceLocalForAll;
            try {
                await shuntService.executeModular({
                    text: inputText,
                    action: 'Modular',
                    model: selectedModel,
                    modules,
                    priority,
                    useLocalLlm,
                    localLlmConfig: useLocalLlm ? {
                        baseUrl: settings.localLlmBaseUrl,
                        modelId: settings.localLlmModelId,
                        provider: settings.localLlmProvider
                    } : undefined
                });
            } catch (e: any) {
                setError(e.message);
                setActiveShunt(null);
            }
        });
    }, [inputText, priority, selectedModel, settings, tierDetails, usage, setOutputText]);

    const submitCombinedShunt = useCallback((draggedAction: ShuntAction, targetAction: ShuntAction) => {
        if (!inputText.trim()) return;
        
        setError(null);
        setOutputText('');
        setActiveShunt(`${draggedAction} + ${targetAction}`);
        audioService.playSound('send');

        startTransition(async () => {
            const combinedInstruction = `Perform ${draggedAction} then perform ${targetAction} on the result.`;
            const useLocalLlm = selectedModel.includes('local') || settings.forceLocalForAll;

            try {
                await shuntService.executeShunt({
                    text: inputText,
                    action: 'Combined',
                    model: selectedModel,
                    customInstruction: combinedInstruction,
                    priority,
                    useLocalLlm,
                    localLlmConfig: useLocalLlm ? {
                        baseUrl: settings.localLlmBaseUrl,
                        modelId: settings.localLlmModelId,
                        provider: settings.localLlmProvider
                    } : undefined
                });
            } catch (e: any) {
                setError(e.message);
                setActiveShunt(null);
            }
        });
    }, [inputText, priority, selectedModel, settings, setOutputText]);

    useEffect(() => {
        const unsubUpdate = appEventBus.on('shunt_update', (text: string) => {
            reactStartTransition(() => setOutputText(text));
        });

        const unsubComplete = appEventBus.on('shunt_complete', (payload: any) => {
            setActiveShunt(null);
            if (payload.text) reactStartTransition(() => setOutputText(payload.text));
            if (activeShunt === ShuntAction.AMPLIFY) setShowAmplifyX2(true);
            incrementUsage('shuntRuns');
            telemetryService?.recordEvent({
                eventType: 'ai_response',
                interactionType: 'shunt_complete',
                tab: 'Shunt',
                tokenUsage: payload.tokenUsage,
                outcome: 'success'
            });
        });

        const unsubError = appEventBus.on('shunt_error', (msg: string) => {
            setActiveShunt(null);
            setError(msg);
        });

        const unsubTrigger = appEventBus.on('trigger_shunt_action', (payload) => {
            if (payload.data) {
                setInputText(payload.data);
                setOptimisticInput(payload.data);
                if (typeof payload.action === 'string') {
                    submitShunt(payload.action, undefined, payload.data);
                }
            }
        });

        return () => {
            unsubUpdate(); unsubComplete(); unsubError(); unsubTrigger();
        };
    }, [activeShunt, incrementUsage, telemetryService, setOutputText, setInputText, submitShunt, setOptimisticInput]);

    const handleInputTextChange = useCallback((text: string) => {
        startTransition(() => {
            setOptimisticInput(text);
            setInputText(text);
        });
    }, [setInputText, setOptimisticInput]);

    const submitSmartShunt = useCallback(() => {
        if (!inputText.trim()) return;
        setError(null);
        setOutputText('');
        setActiveShunt('Smart Shunt');
        audioService.playSound('send');

        startTransition(async () => {
            try {
                const analysis = await determineBestAction(inputText);
                reactStartTransition(() => {
                    setActiveShunt(`${analysis.action} (Smart)`);
                    appEventBus.emit('shunt_update', `**Analysis:** ${analysis.reasoning}\n\n**Executing:** ${analysis.action}...\n\n---\n\n`);
                });
                const useLocalLlm = selectedModel.includes('local') || settings.forceLocalForAll;
                await shuntService.executeShunt({
                    text: inputText,
                    action: analysis.action,
                    model: selectedModel,
                    priority,
                    useLocalLlm,
                    localLlmConfig: useLocalLlm ? {
                        baseUrl: settings.localLlmBaseUrl,
                        modelId: settings.localLlmModelId,
                        provider: settings.localLlmProvider
                    } : undefined
                });
            } catch (e: any) {
                setError(e.message);
                setActiveShunt(null);
            }
        });
    }, [inputText, priority, selectedModel, settings, setOutputText]);

    const evolve = useCallback(() => {
        if (!outputText) return;
        setIsEvolving(true);
        (async () => {
            try {
                const { score } = await gradeOutput(outputText, history.length > 0 ? history[history.length - 1].prompt : initialPrompt);
                const newHistoryEntry: HistoryEntry = {
                    id: uuidv4(),
                    prompt: history.length > 0 ? history[history.length - 1].output : initialPrompt,
                    output: outputText,
                    score: score,
                };
                setHistory(prev => [...prev, newHistoryEntry]);
                setInputText(outputText);
                setOptimisticInput(outputText);
                setOutputText('');
                setError(null);
            } catch (e: any) {
                logFrontendError(e, ErrorSeverity.Medium, { context: 'useShunt.evolve' });
            } finally {
                setIsEvolving(false);
            }
        })();
    }, [outputText, history, initialPrompt, setHistory, setInputText, setOutputText, setOptimisticInput]);

    return {
        state: {
            inputText: optimisticInput,
            outputText, priority, history, initialPrompt, bulletinDocuments,
            isLoading: isPending,
            isHydrating: isInputTextLoading, isEvolving, error, activeShunt,
            selectedModel, modulesForLastRun, showAmplifyX2
        },
        actions: {
            setInputText: handleInputTextChange,
            setOutputText, 
            setPriority,
            setHistory, setInitialPrompt, setBulletinDocuments,
            setSelectedModel, setShowAmplifyX2, 
            submitShunt, submitSmartShunt, submitModularShunt, submitCombinedShunt, evolve
        }
    };
};
