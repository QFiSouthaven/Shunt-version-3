
// services/chatSession.service.ts
import { dbService } from './db';
import { appEventBus } from '../lib/eventBus';
import { requestIntelligence, requestStream, ChatMessage as RouterChatMessage } from './IntelligenceRouter';

export interface ChatMessage {
    id: string;
    role: 'user' | 'model' | 'error' | 'system-progress' | 'code-output';
    content: string;
    isLoading?: boolean;
    provider?: string;
}

const CHAT_STORE_KEY = 'chat_history_v3';
const CHAT_SETTINGS_KEY = 'chat_settings';

class ChatSessionService {
    private messages: ChatMessage[] = [];
    private currentModel: string = 'gemini-3-pro-preview';
    private initialized = false;

    async initialize(): Promise<{ messages: ChatMessage[], model: string }> {
        if (this.initialized) return { messages: this.messages, model: this.currentModel };

        const [savedMessages, settings] = await Promise.all([
            dbService.get<ChatMessage[]>(dbService.STORES.KEY_VALUE, CHAT_STORE_KEY),
            dbService.get<{ model: string }>(dbService.STORES.KEY_VALUE, CHAT_SETTINGS_KEY)
        ]);
        
        if (savedMessages) this.messages = savedMessages;
        if (settings?.model) this.currentModel = settings.model;

        this.initialized = true;
        return { messages: this.messages, model: this.currentModel };
    }

    public async setModel(model: string) {
        if (this.currentModel === model) return;
        this.currentModel = model;
        await dbService.set(dbService.STORES.KEY_VALUE, CHAT_SETTINGS_KEY, { model });
        appEventBus.emit('telemetry', { type: 'chat_model_changed', data: { model } });
    }

    async sendMessageStream(text: string, onChunk: (text: string) => void): Promise<void> {
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
        this.messages.push(userMsg);
        await this.persist();

        // Map internal messages to Router history format
        const history: RouterChatMessage[] = this.messages
            .filter(m => m.role === 'user' || m.role === 'model')
            .slice(0, -1) // Exclude current message
            .map(m => ({
                role: m.role === 'model' ? 'model' : 'user',
                content: m.content
            }));

        const settings = JSON.parse(localStorage.getItem('ai-shunt-settings') || '{}');
        const activeProvider = settings.masterProvider || 'gemini';

        try {
            const stream = requestStream({
                prompt: text,
                model: this.currentModel,
                history,
                systemInstruction: "You are the Aether Shunt OS Neural Interface. Be helpful, concise, and technically accurate."
            });

            let fullText = '';
            for await (const chunk of stream) {
                fullText += chunk;
                onChunk(fullText);
            }

            this.messages.push({ 
                id: (Date.now() + 1).toString(), 
                role: 'model', 
                content: fullText,
                provider: activeProvider
            });
            await this.persist();

        } catch (error: any) {
            this.messages.push({ id: Date.now().toString(), role: 'error', content: error.message });
            await this.persist();
            throw error;
        }
    }

    async addSystemMessage(role: ChatMessage['role'], content: string) {
        this.messages.push({ id: Date.now().toString(), role, content });
        await this.persist();
        return this.messages;
    }

    async clearHistory() {
        this.messages = [];
        await this.persist();
        return this.messages;
    }

    private async persist() {
        await dbService.set(dbService.STORES.KEY_VALUE, CHAT_STORE_KEY, this.messages);
    }
}

export const chatSessionService = new ChatSessionService();
