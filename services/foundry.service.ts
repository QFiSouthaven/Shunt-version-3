
// services/foundry.service.ts
import { v4 as uuidv4 } from 'uuid';
import { ExtractionAgent, KnowledgeSource, ScrapedPayload } from '../types/refinery';
import { scraperService } from './scraperService';
import { requestIntelligence } from './IntelligenceRouter';
import { appEventBus } from '../lib/eventBus';
import { dbService } from './db';
import { Type } from "@google/genai";

const FEED_STORAGE_KEY = 'foundry_live_feed';

export interface CommsMessage {
    id: string;
    from: string;
    to: string;
    content: string;
    timestamp: number;
}

class FoundryService {
    // Initial agents definition for simulation
    private agents: ExtractionAgent[] = [
        { id: '1', role: 'Navigator', name: 'Aether-Nav', status: 'idle', currentTask: 'Awaiting signal...', itemsProcessed: 0 },
        { id: '2', role: 'Extractor', name: 'Aether-Ex', status: 'idle', currentTask: 'Awaiting signal...', itemsProcessed: 0 },
        { id: '3', role: 'Synthesizer', name: 'Aether-Syn', status: 'idle', currentTask: 'Awaiting signal...', itemsProcessed: 0 },
        { id: '4', role: 'Archivist', name: 'Aether-Arc', status: 'idle', currentTask: 'Awaiting signal...', itemsProcessed: 0 },
    ];
    private sources: KnowledgeSource[] = [
        { id: 'v1', category: 'AI', url: 'https://blog.google/technology/ai/google-gemini-next-generation-model-february-2024/', status: 'pending' },
        { id: 'v2', category: 'Programming', url: 'https://react.dev/blog/2024/02/15/react-19', status: 'pending' }
    ];
    private feed: ScrapedPayload[] = [];
    private comms: CommsMessage[] = [];
    private isRunning = false;
    private timer: any = null;

    constructor() {
        this.loadState();
    }

    private async loadState() {
        const savedFeed = await dbService.get<ScrapedPayload[]>(dbService.STORES.KEY_VALUE, FEED_STORAGE_KEY);
        if (savedFeed) this.feed = savedFeed;
        this.broadcast();
    }

    // Fixed: Implemented getState for component synchronization
    public getState() {
        return {
            agents: this.agents,
            sources: this.sources,
            feed: this.feed,
            comms: this.comms,
            isRunning: this.isRunning
        };
    }

    // Fixed: Implemented broadcast to notify listeners via event bus
    private broadcast() {
        appEventBus.emit('telemetry', {
            type: 'foundry_update',
            data: this.getState()
        });
    }

    // Fixed: Implemented updateAgent for modular state changes
    private updateAgent(id: string, updates: Partial<ExtractionAgent>) {
        this.agents = this.agents.map(a => a.id === id ? { ...a, ...updates } : a);
        this.broadcast();
    }

    // Fixed: Implemented logComms to track inter-agent messaging
    private logComms(from: string, to: string, content: string) {
        const msg: CommsMessage = { id: uuidv4(), from, to, content, timestamp: Date.now() };
        this.comms = [msg, ...this.comms].slice(0, 50);
        this.broadcast();
    }

    // Fixed: Implemented toggleSimulation for UI controls
    public toggleSimulation() {
        this.isRunning = !this.isRunning;
        if (this.isRunning) {
            this.startSimulation();
        } else {
            if (this.timer) clearInterval(this.timer);
        }
        this.broadcast();
    }

    private startSimulation() {
        this.timer = setInterval(() => {
            const pendingSource = this.sources.find(s => s.status === 'pending');
            if (pendingSource) {
                pendingSource.status = 'active';
                this.processSource(pendingSource, '1');
            }
        }, 10000);
    }

    // Fixed: Implemented runAutoFix for the MergeView interface
    public async runAutoFix(analysis: string, strategy: string) {
         return await requestIntelligence({
            prompt: `Analysis: ${analysis}\nStrategy: ${strategy}\nTask: Propose specific code resolutions for observed merge conflicts.`,
            jsonSchema: {
                type: Type.OBJECT,
                properties: {
                    resolutions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                filePath: { type: Type.STRING },
                                resolvedContent: { type: Type.STRING },
                                reasoning: { type: Type.STRING }
                            },
                            required: ["filePath", "resolvedContent", "reasoning"]
                        }
                    }
                },
                required: ["resolutions"]
            }
        });
    }

    private async processSource(source: KnowledgeSource, agentId: string) {
        try {
            // Fixed: updateAgent now exists on class instance
            this.updateAgent(agentId, { status: 'fetching', currentTask: `GET ${source.url}` });
            const rawHtml = await scraperService.fetchRawHtml(source.url);
            const cleanHtml = scraperService.cleanDom(rawHtml);

            // Fixed: logComms now exists on class instance
            this.logComms(agentId, '3', 'Handover: Synthesizer required for entity extraction.');
            this.updateAgent(agentId, { status: 'parsing', currentTask: `Extracting JSON Entities` });

            const systemPrompt = `
                You are a Knowledge Extraction Engine. 
                Analyze the following HTML content. 
                Extract key entities related to: ${source.category}.
                Format as JSON: { "title": "...", "summary": "...", "entities": [] }
            `;

            // Standard routing through Intelligence Router
            const { resultText } = await requestIntelligence({
                prompt: cleanHtml,
                systemInstruction: systemPrompt
            });

            let parsedData;
            try {
                parsedData = JSON.parse(resultText.replace(/```json\n?|\n?```/g, '').trim());
            } catch (e) {
                parsedData = { title: "Extraction Error", summary: "Raw output could not be parsed.", entities: ["Error"] };
            }

            const payload: ScrapedPayload = {
                sourceId: source.id,
                timestamp: Date.now(),
                title: parsedData.title,
                summary: parsedData.summary,
                rawJson: parsedData,
                confidence: 0.95,
                entities: parsedData.entities
            };

            // Fixed: Correctly updating this.feed and persisting to DB
            this.feed = [payload, ...this.feed].slice(0, 100); 
            await dbService.set(dbService.STORES.KEY_VALUE, FEED_STORAGE_KEY, this.feed);
            this.broadcast();

            // Fixed: Safe access to agents array
            const currentAgent = this.agents.find(a => a.id === agentId);
            this.updateAgent(agentId, { 
                status: 'cooldown', 
                itemsProcessed: (currentAgent?.itemsProcessed || 0) + 1 
            });
            setTimeout(() => { this.updateAgent(agentId, { status: 'idle', currentTask: 'Awaiting next vector...' }); }, 1000);

        } catch (error) {
            this.updateAgent(agentId, { status: 'idle', currentTask: 'Error: Retrying...' });
        }
    }
}

export const foundryService = new FoundryService();
