
import { Edge, Node } from 'reactflow';

export type NodeType = 
  | 'flow_info'
  | 'flow_start' 
  | 'flow_end'   
  | 'web_scraping'
  | 'llm_instruction'
  | 'api_call'
  | 'read_file'
  | 'write_file'
  | 'conditional'
  | 'agent_exec'; // Added 'agent_exec' to support Registry Agent nodes

export interface WorkflowNodeData {
  label: string;
  type: NodeType;
  config: {
    // Flow Info
    flowName?: string;
    description?: string;
    
    // Flow Start / Variables
    variables?: { name: string; defaultValue: string }[];
    
    // Web Scraping
    url?: string;
    resultVariable?: string;
    
    // Read File
    filePath?: string;
    
    // Write File
    content?: string;
    
    // LLM Instruction
    instruction?: string;
    inputContent?: string;
    model?: string;
    
    // Conditional Logic
    conditionVariable?: string;
    conditionOperator?: 'contains' | 'equals' | 'not_empty';
    conditionValue?: string;

    // Generic
    [key: string]: any;
  };
  status?: 'idle' | 'running' | 'completed' | 'error';
  output?: any;
}

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge & {
    data?: {
        branch?: 'true' | 'false' | 'default';
    }
};

export interface ExecutionLog {
  nodeId: string;
  nodeLabel: string;
  timestamp: string;
  status: 'running' | 'completed' | 'error';
  output?: any;
  error?: string;
}
