
import { EcosystemNode, EcosystemEdge, AgentStatus, AgentTier } from './types';

const createNode = (id: string, label: string, role: string, tier: AgentTier, x: number, y: number): EcosystemNode => ({
  id,
  type: 'agent',
  position: { x, y },
  data: { label, role, tier, status: AgentStatus.IDLE, logs: [] },
});

export const initialNodes: EcosystemNode[] = [
  // Tier 2: Ingestion (Top)
  createNode('sales', 'Sales Agent', 'Signal Ingestion', AgentTier.INGESTION, 0, 0),
  createNode('cs', 'Customer Service', 'Signal Ingestion', AgentTier.INGESTION, 300, 0),
  createNode('complaint', 'Complaint Agent', 'Sentiment Analysis', AgentTier.INGESTION, 600, 0),

  // Tier 3: Operational Backbone (Middle-Top)
  createNode('pm', 'Product Manager', 'Logic Gate & Filter', AgentTier.OPERATIONS, 150, 200),
  createNode('ds', 'Data Scientist', 'Heuristic Optimization', AgentTier.OPERATIONS, 450, 200),

  // Tier 1: Governance (Central Control)
  createNode('cto', 'Chief Tech Officer', 'Strategic Alignment', AgentTier.GOVERNANCE, 0, 400),
  createNode('vp', 'VP Engineering', 'Resource Arbitration', AgentTier.GOVERNANCE, 300, 400),

  // Tier 4: The Asset Foundry (The Core)
  createNode('architect', 'Architect', 'Orchestrator', AgentTier.FOUNDRY, 150, 600),
  // Parallel Workers
  createNode('artist', 'Artist', 'Visual Generation', AgentTier.FOUNDRY, -150, 800),
  createNode('librarian', 'Librarian', 'Schema Compliance', AgentTier.FOUNDRY, 150, 800),
  createNode('quartermaster', 'Quartermaster', 'File System', AgentTier.FOUNDRY, 450, 800),
  createNode('artificer', 'Artificer', 'Binary Tool Wrapper', AgentTier.FOUNDRY, 750, 800),
  
  // Ops Support for Foundry
  createNode('devops', 'DevOps Agent', 'Infrastructure', AgentTier.OPERATIONS, 900, 600),

  // Tier 5: Validation (Bottom)
  createNode('qa', 'QA Agent', 'Deterministic Validator', AgentTier.VALIDATION, 150, 1000),
  createNode('hacker', 'Hacker Agent', 'Red Team Security', AgentTier.VALIDATION, 450, 1000),
  createNode('release', 'Release Manager', 'Deployment', AgentTier.VALIDATION, 150, 1200),
];

export const initialEdges: EcosystemEdge[] = [
  // Ingestion -> Ops
  { id: 'e1', source: 'sales', target: 'pm', animated: true },
  { id: 'e2', source: 'cs', target: 'pm', animated: true },
  { id: 'e3', source: 'complaint', target: 'pm', style: { strokeDasharray: '5,5' } }, // Advisory
  { id: 'e4', source: 'ds', target: 'pm', style: { strokeDasharray: '5,5' } }, // Advisory

  // Ops -> Governance
  { id: 'e5', source: 'pm', target: 'cto', animated: true },
  { id: 'e6', source: 'cto', target: 'vp', animated: true },

  // Governance -> Foundry Entry
  { id: 'e7', source: 'vp', target: 'architect', animated: true },

  // Foundry Orchestration (Architect controls workers)
  { id: 'e8', source: 'architect', target: 'artist', animated: true },
  { id: 'e9', source: 'architect', target: 'librarian', animated: true },
  { id: 'e10', source: 'architect', target: 'quartermaster', animated: true },
  { id: 'e11', source: 'architect', target: 'artificer', animated: true },
  
  // Ops Support
  { id: 'e12', source: 'devops', target: 'artificer', style: { stroke: '#22c55e' } }, // Maintaining env

  // Foundry -> QA
  { id: 'e13', source: 'artist', target: 'qa', animated: true },
  { id: 'e14', source: 'librarian', target: 'qa', animated: true },
  { id: 'e15', source: 'artificer', target: 'qa', animated: true },

  // QA -> Security -> Release
  { id: 'e16', source: 'qa', target: 'hacker', animated: true },
  { id: 'e17', source: 'qa', target: 'release', animated: true },
];
