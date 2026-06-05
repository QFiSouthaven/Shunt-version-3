
// services/workflowEngine.ts
import { WorkflowNode, WorkflowEdge, ExecutionLog } from '../types/workflow';
import { generateRawText } from './geminiService';
import { scraperService } from './scraperService';
import { fileSystemService } from './fileSystem';
import { agentManagementService } from './agentManagement.service';

export class WorkflowEngine {
  private nodes: WorkflowNode[];
  private edges: WorkflowEdge[];
  private onLog: (log: ExecutionLog) => void;
  private onNodeStatusChange: (nodeId: string, status: 'idle' | 'running' | 'completed' | 'error', output?: any) => void;
  private context: Record<string, any> = {}; 

  constructor(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    onLog: (log: ExecutionLog) => void,
    onNodeStatusChange: (nodeId: string, status: 'idle' | 'running' | 'completed' | 'error', output?: any) => void
  ) {
    this.nodes = nodes;
    this.edges = edges;
    this.onLog = onLog;
    this.onNodeStatusChange = onNodeStatusChange;
  }

  private interpolate(text: string): string {
    if (!text) return '';
    return text.replace(/\$\{([^}]+)\}/g, (_, key) => {
      return this.context[key] !== undefined ? String(this.context[key]) : `\${${key}}`;
    });
  }

  private async executeNode(node: WorkflowNode): Promise<any> {
    this.onNodeStatusChange(node.id, 'running');
    this.onLog({ 
        nodeId: node.id, 
        nodeLabel: node.data.label, 
        timestamp: new Date().toLocaleTimeString(), 
        status: 'running' 
    });

    try {
      let output: any = null;

      switch (node.data.type) {
        case 'flow_start':
          node.data.config.variables?.forEach(v => {
            this.context[v.name] = v.defaultValue;
          });
          output = { status: "Variables Initialized" };
          break;

        case 'conditional':
          const varValue = String(this.context[node.data.config.conditionVariable || ''] || '');
          const target = node.data.config.conditionValue || '';
          const op = node.data.config.conditionOperator;
          
          let result = false;
          if (op === 'equals') result = varValue === target;
          else if (op === 'contains') result = varValue.includes(target);
          else if (op === 'not_empty') result = varValue.trim().length > 0;
          
          output = result; 
          break;

        case 'agent_exec':
            const agentId = node.data.config.agentId;
            const inputVar = node.data.config.inputVariable || 'input';
            const agentInput = String(this.context[inputVar] || '');
            
            if (!agentId) throw new Error("Agent configuration incomplete: No Agent selected.");
            
            output = await agentManagementService.runAgent(agentId, agentInput);
            if (node.data.config.resultVariable) this.context[node.data.config.resultVariable] = output;
            break;

        case 'read_file':
          const readPath = this.interpolate(node.data.config.filePath || '');
          output = await fileSystemService.readFile(readPath);
          if (node.data.config.resultVariable) this.context[node.data.config.resultVariable] = output;
          break;

        case 'write_file':
          const writePath = this.interpolate(node.data.config.filePath || '');
          const writeContent = this.interpolate(node.data.config.content || '');
          await fileSystemService.writeFile(writePath, writeContent);
          output = `Successfully written to ${writePath}`;
          break;

        case 'web_scraping':
          const url = this.interpolate(node.data.config.url || '');
          const rawHtml = await scraperService.fetchRawHtml(url);
          output = scraperService.cleanDom(rawHtml);
          if (node.data.config.resultVariable) this.context[node.data.config.resultVariable] = output;
          break;

        case 'llm_instruction':
          const instruction = this.interpolate(node.data.config.instruction || '');
          const inputContent = this.interpolate(node.data.config.inputContent || '');
          const prompt = `${instruction}\n\n[CONTEXT]\n${inputContent}`;
          
          const response = await generateRawText(prompt, node.data.config.model || 'gemini-3-flash-preview');
          output = response.resultText;
          if (node.data.config.resultVariable) this.context[node.data.config.resultVariable] = output;
          break;

        case 'api_call':
          const apiUrl = this.interpolate(node.data.config.url || '');
          const res = await fetch(apiUrl, { 
              method: node.data.config.method || 'GET',
              headers: { 'Content-Type': 'application/json' },
              body: node.data.config.body ? this.interpolate(node.data.config.body) : undefined
          });
          output = await res.text();
          if (node.data.config.resultVariable) this.context[node.data.config.resultVariable] = output;
          break;

        case 'flow_end':
          output = "Pipeline Complete.";
          break;
          
        default:
          output = "Pass";
      }

      this.onNodeStatusChange(node.id, 'completed', output);
      this.onLog({ 
          nodeId: node.id, 
          nodeLabel: node.data.label, 
          timestamp: new Date().toLocaleTimeString(), 
          status: 'completed', 
          output: typeof output === 'string' ? output.substring(0, 100) + '...' : output 
      });

      return output;

    } catch (error: any) {
      this.onNodeStatusChange(node.id, 'error', error.message);
      this.onLog({ 
          nodeId: node.id, 
          nodeLabel: node.data.label, 
          timestamp: new Date().toLocaleTimeString(), 
          status: 'error', 
          error: error.message 
      });
      throw error;
    }
  }

  public async run() {
    const startNode = this.nodes.find(n => n.data.type === 'flow_start');
    if (!startNode) throw new Error("Graph logic error: Missing Flow Start block.");

    let currentNode: WorkflowNode | undefined = startNode;
    const visited = new Set<string>();

    while (currentNode) {
      if (visited.has(currentNode.id)) break; 
      visited.add(currentNode.id);
      
      const result = await this.executeNode(currentNode);
      
      const outgoingEdges = this.edges.filter(e => e.source === currentNode?.id);
      
      if (currentNode.data.type === 'conditional') {
          const branchName = result === true ? 'true' : 'false';
          const targetEdge = outgoingEdges.find(e => e.sourceHandle === branchName) || outgoingEdges[0];
          currentNode = this.nodes.find(n => n.id === targetEdge?.target);
      } else {
          currentNode = this.nodes.find(n => n.id === outgoingEdges[0]?.target);
      }
    }
  }
}
