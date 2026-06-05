
// services/weaver.service.ts
import { dbService } from './db';
import { appEventBus } from '../lib/eventBus';
import { requestDevelopmentPlan } from './IntelligenceRouter';
import { Documentation, GeminiResponse } from '../types';
import { INITIAL_DOCUMENTATION } from '../context/constants';
import { audioService } from './audioService';
import { generateMockEmbedding } from './etlService';

const WEAVER_MEMORY_KEY = 'weaver-project-memory';
const WEAVER_PLAN_KEY = 'weaver_active_plan';

class WeaverService {
    // Fixed: Added missing class properties for documentation and plans
    private documentation: Documentation = INITIAL_DOCUMENTATION;
    private activePlan: GeminiResponse | null = null;
    private isInitialized = false;

    constructor() {
        this.init();
    }

    private async init() {
        if (this.isInitialized) return;
        const [savedMemory, savedPlan] = await Promise.all([
            dbService.get<Documentation>(dbService.STORES.KEY_VALUE, WEAVER_MEMORY_KEY),
            dbService.get<GeminiResponse>(dbService.STORES.KEY_VALUE, WEAVER_PLAN_KEY)
        ]);
        if (savedMemory) this.documentation = savedMemory;
        if (savedPlan) this.activePlan = savedPlan;
        this.isInitialized = true;
        this.broadcast();
    }

    // Fixed: Implemented getState for hook consumption
    public getState() {
        return {
            documentation: this.documentation,
            activePlan: this.activePlan
        };
    }

    // Fixed: Implemented getMemoryResource for Concurrent React Suspense pattern in Weaver.tsx
    public async getMemoryResource(): Promise<Documentation> {
        if (!this.isInitialized) {
            const savedMemory = await dbService.get<Documentation>(dbService.STORES.KEY_VALUE, WEAVER_MEMORY_KEY);
            if (savedMemory) this.documentation = savedMemory;
        }
        return this.documentation;
    }

    // Fixed: Implemented updateDocumentation for memory edits
    public async updateDocumentation(field: keyof Documentation, value: string) {
        this.documentation = { ...this.documentation, [field]: value };
        await dbService.set(dbService.STORES.KEY_VALUE, WEAVER_MEMORY_KEY, this.documentation);
        this.broadcast();
    }

    // Fixed: Implemented broadcast to keep UI in sync
    private broadcast() {
        appEventBus.emit('telemetry', {
            type: 'weaver_update',
            data: this.getState()
        });
    }

    public async generatePlan(goal: string) {
        audioService.playSound('send');
        appEventBus.emit('telemetry', { 
            type: 'system_action', 
            data: { eventType: 'knowledge_retrieval_init', goal } 
        });

        try {
            const queryVector = generateMockEmbedding(goal);
            const results = await dbService.queryVectors(queryVector, 5);
            
            const semanticContext = results.length > 0 
                ? `### RETRIEVED KNOWLEDGE\n${results.map(r => r.metadata.text).join('\n\n')}`
                : '';
            
            // Fixed: Reference to documentation now valid
            const enhancedContext = `${this.documentation.geminiContext}\n\n${semanticContext}`;
            
            // Delegate plan generation to the unified intelligence router
            const plan = await requestDevelopmentPlan(goal, enhancedContext);
            this.activePlan = plan;
            
            // Fixed: Correct persistence with constant key
            await dbService.set(dbService.STORES.KEY_VALUE, WEAVER_PLAN_KEY, this.activePlan);
            this.broadcast();
            return plan;
        } catch (e) {
            audioService.playSound('error');
            throw e;
        }
    }
}

export const weaverService = new WeaverService();
