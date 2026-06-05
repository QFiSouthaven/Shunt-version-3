
import { Node, Edge } from 'reactflow';

export enum AgentStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  WAITING = 'WAITING',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
}

export enum AgentTier {
  GOVERNANCE = 'Tier 1: Control Plane',
  INGESTION = 'Tier 2: Market Interface',
  OPERATIONS = 'Tier 3: Operational Backbone',
  FOUNDRY = 'Tier 4: Asset Foundry',
  VALIDATION = 'Tier 5: Immune System',
}

export interface AgentData {
  label: string; // e.g., "Chief Technology Officer"
  role: string; // e.g., "Strategic Alignment"
  tier: AgentTier;
  status: AgentStatus;
  currentTask?: string; // What are they thinking/doing right now?
  logs: string[];
}

export type EcosystemNode = Node<AgentData>;
export type EcosystemEdge = Edge;

// The "Idea" packet that traverses the graph
export interface ProductionPacket {
  id: string;
  rawInput: string;
  structuredBrief?: any;
  assetManifest?: any;
  binaryPath?: string;
  qualityScore?: number;
}
