
export type ProcessingStage = 
  | 'IDLE' 
  | 'DISCOVERY'     // Serendipity_Engine
  | 'EXTRACTION'    // Agent_Builder
  | 'VECTORIZATION' // Documentation
  | 'PROTOTYPING'   // Persistent_Developer
  | 'SYNTHESIS';    // System_2001

export type KnowledgeSourceType = 'ARTICLE' | 'REPO' | 'DOCUMENTATION' | 'TREND';

export interface KnowledgeNode {
  id: string;
  timestamp: number;
  sourceUrl: string;
  type: KnowledgeSourceType;
  stage: ProcessingStage;
  
  // Data accumulated through the pipeline
  metadata?: {
    title?: string;
    description?: string;
    confidenceScore?: number;
  };
  rawContent?: string;      // From Agent_Builder
  vectorId?: string;        // From Documentation ETL
  prototypeCode?: string;   // From Persistent_Developer
  summary?: string;         // From System_2001
  
  error?: string;
}

export interface CortexState {
  isActive: boolean;
  pipeline: KnowledgeNode[];
  throughput: number; // Items per minute
  activeAgents: number;
}
