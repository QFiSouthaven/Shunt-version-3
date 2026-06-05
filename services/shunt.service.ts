
// services/shunt.service.ts
import { dbService } from './db';
import { performShuntStream, executeModularPrompt } from './geminiService';
import { performLocalLlmShunt } from './localLlmService';
import { getPromptForAction } from './prompts';
import { appEventBus } from '../lib/eventBus';
import { ShuntAction, PromptModuleKey, TokenUsage } from '../types';
import { scraperService } from './scraperService';
import { audioService } from './audioService';
import { parseApiError } from '../utils/errorLogger';

interface ShuntRequest {
    text: string;
    action: ShuntAction | string; // string for custom actions
    model: string;
    context?: string;
    priority?: string;
    customInstruction?: string;
    modules?: Set<PromptModuleKey>; // For modular shunt
    useLocalLlm?: boolean;
    localLlmConfig?: {
        baseUrl: string;
        modelId: string;
        provider: 'lm-studio' | 'ollama';
    };
}

class ShuntService {
    private isProcessing: boolean = false;
    private currentStreamController: AbortController | null = null;

    constructor() {
        // Optional: Recover state or listeners on init
    }

    public isBusy(): boolean {
        return this.isProcessing;
    }

    public cancel(): void {
        if (this.currentStreamController) {
            this.currentStreamController.abort();
            this.currentStreamController = null;
            this.isProcessing = false;
            // Notify UI
            appEventBus.emit('telemetry', { 
                type: 'system_action', 
                data: { eventType: 'shunt_cancelled', timestamp: new Date().toISOString() } 
            });
        }
    }

    /**
     * Executes a Standard or Custom Shunt Action.
     * Supports both Cloud (Gemini) and Local (Ollama/LM Studio) backends.
     */
    public async executeShunt(params: ShuntRequest): Promise<string> {
        if (this.isProcessing) throw new Error("Shunt is already processing a request.");
        
        this.isProcessing = true;
        this.currentStreamController = new AbortController();
        const { text, action, model, context, priority, customInstruction, useLocalLlm, localLlmConfig } = params;
        let accumulatedText = '';

        try {
            // 1. Pre-computation / Special Cases
            if (action === ShuntAction.DEEP_CRAWL) {
                accumulatedText = await this.handleDeepCrawl(text);
                return accumulatedText;
            }

            // 2. Clear Output in DB
            await dbService.set(dbService.STORES.KEY_VALUE, 'shunt_outputText', '');

            // 3. Execution
            if (useLocalLlm && localLlmConfig) {
                // --- LOCAL LLM PATH ---
                // Construct prompt manually as we aren't using the Gemini Stream helper
                const prompt = typeof action === 'string' && customInstruction 
                    ? `${customInstruction}\n\n${text}` 
                    : getPromptForAction(text, action as ShuntAction, context, priority);

                const { resultText, tokenUsage } = await performLocalLlmShunt(
                    prompt,
                    undefined, // System instruction handled in prompt for now or passed if supported
                    localLlmConfig
                );
                
                accumulatedText = resultText;
                
                // For local, we currently do a single update since streaming isn't fully implemented in the adapter
                await dbService.set(dbService.STORES.KEY_VALUE, 'shunt_outputText', accumulatedText);
                appEventBus.emit('shunt_update', accumulatedText);
                appEventBus.emit('shunt_complete', { text: accumulatedText, tokenUsage });
            } else {
                // --- CLOUD GEMINI PATH ---
                const generator = performShuntStream(
                    text,
                    action,
                    model,
                    context,
                    priority,
                    customInstruction
                );

                for await (const chunk of generator) {
                    if (this.currentStreamController?.signal.aborted) {
                        break;
                    }
                    
                    accumulatedText += chunk;
                    
                    // Optimized: Update DB periodically or on chunks to ensure persistence
                    await dbService.set(dbService.STORES.KEY_VALUE, 'shunt_outputText', accumulatedText);
                    
                    // Emit event for active UI to update without polling DB
                    appEventBus.emit('shunt_update', accumulatedText);
                }
                
                appEventBus.emit('shunt_complete', { text: accumulatedText });
            }

            // 4. Finalize
            audioService.playSound('receive');
            return accumulatedText;

        } catch (error: any) {
            console.error("ShuntService Error:", error);
            // Use standard error parser to clean up message (e.g. 429 Quota Exceeded)
            const friendlyMessage = parseApiError(error);
            appEventBus.emit('shunt_error', friendlyMessage);
            audioService.playSound('error');
            throw error;
        } finally {
            this.isProcessing = false;
            this.currentStreamController = null;
        }
    }

    /**
     * Executes a Modular Shunt (Stacked Prompts).
     */
    public async executeModular(params: ShuntRequest): Promise<string> {
        if (this.isProcessing) throw new Error("Shunt is already processing.");
        if (!params.modules) throw new Error("Modules required for modular shunt.");

        this.isProcessing = true;
        
        try {
            await dbService.set(dbService.STORES.KEY_VALUE, 'shunt_outputText', '');
            appEventBus.emit('shunt_update', 'Processing Modular Stack...');

            const { resultText, tokenUsage } = await executeModularPrompt(
                params.text,
                params.modules,
                params.context,
                params.priority
            );

            await dbService.set(dbService.STORES.KEY_VALUE, 'shunt_outputText', resultText);
            appEventBus.emit('shunt_update', resultText);
            appEventBus.emit('shunt_complete', { text: resultText, tokenUsage });
            audioService.playSound('receive');
            
            return resultText;

        } catch (error: any) {
            console.error("ShuntService Modular Error:", error);
            const friendlyMessage = parseApiError(error);
            appEventBus.emit('shunt_error', friendlyMessage);
            audioService.playSound('error');
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    private async handleDeepCrawl(urlOrTopic: string): Promise<string> {
        const startMsg = `> Initializing Deep-Crawl Strategy...\n> Target: ${urlOrTopic}\n> Spawning recursive spiders...\n`;
        await dbService.set(dbService.STORES.KEY_VALUE, 'shunt_outputText', startMsg);
        appEventBus.emit('shunt_update', startMsg);

        const result = await scraperService.deepCrawl(urlOrTopic);
        
        await dbService.set(dbService.STORES.KEY_VALUE, 'shunt_outputText', result);
        appEventBus.emit('shunt_update', result);
        appEventBus.emit('shunt_complete', { text: result });
        audioService.playSound('success');
        this.isProcessing = false;
        
        return result;
    }
}

export const shuntService = new ShuntService();
