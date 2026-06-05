
// services/agentManagement.service.ts
import { v4 as uuidv4 } from 'uuid';
import { AgentManifest, AgentInstance } from '../types/agentSystem';
import { dbService } from './db';
import { appEventBus } from '../lib/eventBus';
import { AgentFactory } from './agentFactory';
import { audioService } from './audioService';

const AGENT_STORE_KEY = 'unified_agent_registry';
const SKILLS_STORE_KEY = 'unified_skill_registry';

class AgentManagementService {
    private manifests: AgentManifest[] = [];
    private skills: any[] = [];
    private activeInstances: Map<string, AgentInstance> = new Map();
    private isInitialized = false;

    constructor() {
        this.init();
    }

    private async init() {
        if (this.isInitialized) return;
        
        const savedAgents = await dbService.get<AgentManifest[]>(dbService.STORES.KEY_VALUE, AGENT_STORE_KEY);
        const savedSkills = await dbService.get<any[]>(dbService.STORES.KEY_VALUE, SKILLS_STORE_KEY);
        
        if (savedAgents) this.manifests = savedAgents;
        if (savedSkills) this.skills = savedSkills;
        
        this.isInitialized = true;
        this.broadcast();
    }

    public getState() {
        return {
            agents: this.manifests,
            skills: this.skills,
            isReady: this.isInitialized
        };
    }

    private broadcast() {
        appEventBus.emit('telemetry', {
            type: 'agent_registry_update',
            data: this.getState()
        });
    }

    public async saveAgent(manifest: AgentManifest) {
        const id = manifest.id || uuidv4();
        const updatedManifest = { ...manifest, id, lastUpdated: new Date().toISOString() };
        
        const index = this.manifests.findIndex(a => a.id === id);
        if (index > -1) {
            this.manifests[index] = updatedManifest;
        } else {
            this.manifests.push(updatedManifest);
        }

        await dbService.set(dbService.STORES.KEY_VALUE, AGENT_STORE_KEY, this.manifests);
        this.broadcast();
        audioService.playSound('success');
        return updatedManifest;
    }

    public async deleteAgent(id: string) {
        this.manifests = this.manifests.filter(a => a.id !== id);
        this.activeInstances.delete(id);
        await dbService.set(dbService.STORES.KEY_VALUE, AGENT_STORE_KEY, this.manifests);
        this.broadcast();
        audioService.playSound('click');
    }

    /**
     * Instantiates or retrieves a live execution unit for a manifest.
     */
    public getExecutableAgent(agentId: string): AgentInstance | null {
        if (this.activeInstances.has(agentId)) {
            return this.activeInstances.get(agentId)!;
        }

        const manifest = this.manifests.find(a => a.id === agentId);
        if (!manifest) return null;

        const instance = AgentFactory.createAgent(manifest);
        this.activeInstances.set(agentId, instance);
        return instance;
    }

    public async runAgent(agentId: string, input: string) {
        const agent = this.getExecutableAgent(agentId);
        if (!agent) throw new Error("Agent instance not found.");

        appEventBus.emit('telemetry', {
            type: 'interaction_event',
            data: {
                id: uuidv4(),
                timestamp: new Date().toISOString(),
                userID: 'System_Manager',
                sessionID: 'Agent_Run',
                tab: 'AgentBuilder',
                eventType: 'user_input',
                interactionType: 'agent_execution',
                userInput: input,
                contextDetails: { agentName: agent.manifest.name }
            }
        });

        const output = await agent.execute(input);
        return output;
    }
}

export const agentManagementService = new AgentManagementService();
