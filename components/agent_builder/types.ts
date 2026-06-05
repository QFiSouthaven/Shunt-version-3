
/**
 * Domain definitions for the Agent Builder module.
 * Defines the structure for Agent identity, capabilities, and evolutionary roadmap.
 */

export type CapabilityId = 'code_generation' | 'web_browsing' | 'memory_persistence' | 'image_analysis';

export interface Capability {
  id: CapabilityId;
  label: string;
  description: string;
  isEnabled: boolean;
}

export type MilestoneStatus = 'pending' | 'analyzing' | 'implemented' | 'verified' | 'completed';

export interface EvolutionMilestone {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: MilestoneStatus;
}

export interface AgentProfile {
  id: string;
  name: string;
  systemPrompt: string;
  capabilities: Capability[];
  roadmap: EvolutionMilestone[];
  lastUpdated: string; // ISO Date
}

export interface AgentBuilderState {
  profile: AgentProfile | null;
  isLoading: boolean;
  error: string | null;
}

// --- Action Queue Types ---

export type ActionType = 'create_file' | 'modify_file' | 'delete_file' | 'run_command';

export interface AgentAction {
    id: string;
    type: ActionType;
    target: string; // File path or command
    content?: string; // File content or command args
    status: 'pending' | 'approved' | 'rejected' | 'applied';
    reasoning: string;
}

export interface BuilderMessage {
    id: string;
    role: 'user' | 'agent' | 'system';
    content: string;
    timestamp: string;
}
