
import { KnowledgeNode, ProcessingStage } from '../types/cortex';
import { v4 as uuidv4 } from 'uuid';
import { executeAIRequest } from './geminiService';
import { appEventBus } from '../lib/eventBus';
import { InteractionEvent } from '../types/telemetry';

class CortexService {
  private queue: KnowledgeNode[] = [];
  private listeners: ((queue: KnowledgeNode[]) => void)[] = [];
  private isRunning: boolean = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  // Configuration for the "Live Feed" loop speed
  private PULSE_RATE_MS = 6000; 

  // --- Pipeline Steps (The Build Order) ---

  // 1. Serendipity_Engine finds a new technology trend.
  private async stepDiscovery(): Promise<void> {
    const trends = [
        { url: 'https://github.com/google/gemini-api', title: 'Gemini 2.5 Flash Multimodal' },
        { url: 'https://react.dev/blog/2024/02/15/react-19', title: 'React 19 Compiler Beta' },
        { url: 'https://vercel.com/ai-sdk', title: 'Vercel AI SDK Core' },
        { url: 'https://arxiv.org/abs/2401.00001', title: 'Self-Rewarding Language Models' },
        { url: 'https://bun.sh/blog/bun-v1.1', title: 'Bun v1.1 Release Notes' }
    ];
    
    // Pick a random trend to simulate discovery
    const newTrend = trends[Math.floor(Math.random() * trends.length)];
    
    const node: KnowledgeNode = {
      id: uuidv4(),
      timestamp: Date.now(),
      sourceUrl: newTrend.url,
      type: 'REPO',
      stage: 'EXTRACTION', // Move to next stage
      metadata: { title: newTrend.title }
    };

    this.updateQueue(node);
  }

  // 2. Agent_Builder scrapes the documentation.
  private async stepExtraction(node: KnowledgeNode): Promise<void> {
    try {
      // Mocked Agent_Builder "DOM Map" extraction
      await new Promise(r => setTimeout(r, 1500)); 
      const rawContent = `Simulation of scraped content for ${node.metadata?.title}. Contains API endpoints, installation guides, and architecture diagrams.`;
      
      node.rawContent = rawContent;
      node.stage = 'VECTORIZATION';
      this.updateQueue(node);
    } catch (e) {
      this.failNode(node, 'Extraction Failed');
    }
  }

  // 3. Documentation vectorizes the text for RAG.
  private async stepVectorization(node: KnowledgeNode): Promise<void> {
    try {
      // Mocked ETL Service
      await new Promise(r => setTimeout(r, 1000)); 
      const vectorId = `vec_${node.id.substring(0, 8)}`; 
      node.vectorId = vectorId;
      node.stage = 'PROTOTYPING';
      this.updateQueue(node);
    } catch (e) {
      this.failNode(node, 'Vectorization Failed');
    }
  }

  // 4. Persistent_Developer writes a prototype.
  private async stepPrototyping(node: KnowledgeNode): Promise<void> {
    try {
      await new Promise(r => setTimeout(r, 1200)); 
      node.prototypeCode = `// Prototype for ${node.metadata?.title}\nimport { connect } from 'aether-sdk';\n\nconst init = async () => {\n  console.log("Initializing ${node.metadata?.title}...");\n};`;
      node.stage = 'SYNTHESIS';
      this.updateQueue(node);
    } catch (e) {
      this.failNode(node, 'Prototyping Failed');
    }
  }

  // 5. System_2001 presents the summary (Using Real Gemini).
  private async stepSynthesis(node: KnowledgeNode): Promise<void> {
    try {
      // Actually call Gemini to synthesize the "scraped" content
      const prompt = `You are System 2001, the synthesis engine. 
      Analyze this data packet: "${node.metadata?.title} - ${node.rawContent}".
      Output a 1-sentence executive summary verifying its utility for the Aether OS.`;

      // Use executeAIRequest to capture token usage for telemetry
      const { resultText, tokenUsage } = await executeAIRequest({
          model: 'gemini-3-flash-preview',
          prompt
      });
      
      node.summary = resultText.trim();
      node.stage = 'IDLE'; // Process complete
      
      // Pass token usage to updateQueue via a temporary property or handle broadcasting here?
      // Simpler to handle broadcasting inside updateQueue, but tokenUsage is specific to this step.
      // We'll attach it to the broadcast for this specific step update.
      this.updateQueue(node, tokenUsage);
    } catch (e) {
      // Fallback if API fails (e.g. offline)
      node.summary = `Analyzed ${node.metadata?.title}. Core utility verified (Offline Mode).`;
      node.stage = 'IDLE';
      this.updateQueue(node);
    }
  }

  // --- Orchestration Logic ---

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // The "Heartbeat" of the autonomous system
    this.intervalId = setInterval(async () => {
      // 1. Trigger Discovery if queue is low
      const activeNodes = this.queue.filter(n => n.stage !== 'IDLE');
      if (activeNodes.length < 3) {
        await this.stepDiscovery();
      }

      // 2. Advance existing nodes
      // We process a snapshot of the queue to avoid modification issues during iteration
      const currentQueue = [...this.queue];
      for (const node of currentQueue) {
        if (node.stage === 'IDLE' || node.error) continue;

        switch (node.stage) {
          case 'EXTRACTION': await this.stepExtraction(node); break;
          case 'VECTORIZATION': await this.stepVectorization(node); break;
          case 'PROTOTYPING': await this.stepPrototyping(node); break;
          case 'SYNTHESIS': await this.stepSynthesis(node); break;
        }
      }
    }, this.PULSE_RATE_MS);
  }

  public stop() {
    this.isRunning = false;
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private updateQueue(updatedNode: KnowledgeNode, tokenUsage?: any) {
    const index = this.queue.findIndex(n => n.id === updatedNode.id);
    if (index === -1) {
      this.queue.push(updatedNode);
    } else {
      this.queue[index] = updatedNode;
    }
    // Keep queue size manageable
    if (this.queue.length > 20) {
        this.queue.shift();
    }
    
    // Broadcast to the OS (Oraculum)
    this.broadcastTelemetry(updatedNode, tokenUsage);
    
    this.notify();
  }

  private failNode(node: KnowledgeNode, error: string) {
    node.error = error;
    node.stage = 'IDLE';
    this.updateQueue(node);
  }

  private broadcastTelemetry(node: KnowledgeNode, tokenUsage?: any) {
      // Avoid spamming the feed with idle/unchanged states unless it's a completion or error
      if (node.stage === 'IDLE' && !node.error && !node.summary) return;

      const event: InteractionEvent = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          userID: 'Aether_Cortex_Auto',
          sessionID: 'CTX-001', // Persistent ID for the background service
          tab: 'Cortex',
          eventType: 'system_action',
          interactionType: node.error ? 'cortex_error' : `cortex_${node.stage.toLowerCase()}`,
          userInput: node.sourceUrl,
          aiOutput: node.error || node.summary || `Processing stage: ${node.stage}`,
          outcome: node.error ? 'error' : 'success',
          tokenUsage: tokenUsage,
          contextDetails: {
              title: node.metadata?.title,
              nodeId: node.id,
              stage: node.stage
          }
      };
      
      appEventBus.emit('telemetry', { 
          type: 'interaction_event', 
          data: event 
      });
  }

  public subscribe(callback: (queue: KnowledgeNode[]) => void) {
    this.listeners.push(callback);
    callback(this.queue);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb([...this.queue]));
  }
}

export const cortexService = new CortexService();
