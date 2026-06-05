
// services/orchestrator.service.ts
import { WorkflowNode, WorkflowEdge, ExecutionLog } from '../types/workflow';
import { WorkflowEngine } from './workflowEngine';
import { dbService } from './db';
import { appEventBus } from '../lib/eventBus';
import { audioService } from './audioService';

const GRAPH_STORAGE_KEY = 'orchestrator_graph_v1';

class OrchestratorService {
    private nodes: WorkflowNode[] = [];
    private edges: WorkflowEdge[] = [];
    private isRunning: boolean = false;
    private engine: WorkflowEngine | null = null;

    constructor() {
        this.loadGraph();
    }

    private async loadGraph() {
        const saved = await dbService.get<{nodes: WorkflowNode[], edges: WorkflowEdge[]}>(
            dbService.STORES.KEY_VALUE, 
            GRAPH_STORAGE_KEY
        );
        if (saved) {
            this.nodes = saved.nodes;
            this.edges = saved.edges;
            this.broadcast();
        }
    }

    public async saveGraph(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
        this.nodes = nodes;
        this.edges = edges;
        await dbService.set(dbService.STORES.KEY_VALUE, GRAPH_STORAGE_KEY, { nodes, edges });
        this.broadcast();
    }

    public getState() {
        return {
            nodes: this.nodes,
            edges: this.edges,
            isRunning: this.isRunning
        };
    }

    private broadcast() {
        appEventBus.emit('telemetry', {
            type: 'orchestrator_update',
            data: this.getState()
        });
    }

    public async runWorkflow() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.broadcast();
        audioService.playSound('send');

        // Reset all nodes to idle before starting
        this.nodes = this.nodes.map(n => ({ ...n, data: { ...n.data, status: 'idle', output: undefined } }));
        this.broadcast();

        this.engine = new WorkflowEngine(
            this.nodes,
            this.edges,
            (log: ExecutionLog) => {
                appEventBus.emit('telemetry', { type: 'orchestrator_log', data: log });
            },
            (nodeId, status, output) => {
                this.nodes = this.nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status, output } } : n);
                this.broadcast();
                if (status === 'completed') audioService.playSound('receive');
                if (status === 'error') audioService.playSound('error');
            }
        );

        try {
            await this.engine.run();
            audioService.playSound('success');
        } catch (e) {
            console.error("Workflow Engine Failure:", e);
        } finally {
            this.isRunning = false;
            this.broadcast();
        }
    }

    public stopWorkflow() {
        // Implementation for abortion if engine supports it
        this.isRunning = false;
        this.broadcast();
    }
}

export const orchestratorService = new OrchestratorService();
