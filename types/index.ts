
// types/index.ts
import React, { ReactNode } from 'react';
import { z } from 'zod';
import { 
    tokenUsageSchema, 
    implementationTaskSchema, 
    geminiDevelopmentPlanResponseSchema
} from './schemas';

export * from './auth';
export * from './GapAnalysis';

// --- Core Data Structures ---

export interface VirtualFile {
    path: string;
    content: string; 
    lastModified?: number;
    language?: string;
    mimeType?: string; 
    encoding?: 'utf-8' | 'base64'; 
}

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    createdAt: string;
}

export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: {
      [key: string]: {
        type: string;
        description: string;
      };
    };
    required: string[];
  };
  cache_control?: { type: 'ephemeral' };
}

export interface CustomPrompt {
    id: string;
    name: string;
    description?: string;
    instruction: string;
    group: 'Custom';
}

export enum ShuntAction {
  SUMMARIZE = 'Summarize',
  AMPLIFY = 'Amplify',
  AMPLIFY_X2 = 'Amplify x2',
  MAKE_ACTIONABLE = 'Make Actionable',
  BUILD_A_SKILL = 'Build a Skill',
  GENERATE_APPLICATION = 'Generate Application',
  EXPLAIN_LIKE_IM_FIVE = 'Explain Like I\'m 5',
  EXPLAIN_LIKE_A_SENIOR = 'Explain Like a Senior',
  EXTRACT_KEYWORDS = 'Extract Keywords',
  EXTRACT_ENTITIES = 'Extract Entities',
  ENHANCE_WITH_KEYWORDS = 'Enhance with Keywords',
  CHANGE_TONE_FORMAL = 'Make More Formal',
  CHANGE_TONE_CASUAL = 'Make More Casual',
  PROOFREAD = 'Proofread & Fix',
  TRANSLATE_SPANISH = 'Translate to Spanish',
  FORMAT_JSON = 'Format as JSON',
  PARSE_JSON = 'Parse JSON to Text',
  INTERPRET_SVG = 'Interpret SVG',
  GENERATE_VAM_PRESET = 'Generate VAM Preset',
  MY_COMMAND = 'Analyze & Clarify',
  GENERATE_ORACLE_QUERY = 'Generate Oracle Query',
  REFINE_PROMPT = 'Refine Prompt',
  MODERNIZE_CODE = 'Modernize & Update Code',
  DEEP_CRAWL = 'Deep Crawl (Crawl4AI)',
  GENERATE_UTILITY_SCRIPT = 'Generate Utility Script',
  GENERATE_SHELL_COMMAND = 'Generate Shell/CLI Command',
}

export enum TransformerAction {
    AUDIT_STRUCTURE = 'Audit Structure',
    GENERATE_SCHEMA = 'Generate Schema',
    EXTRACT_DATA = 'Extract Data',
    VALIDATE_PAYLOAD = 'Validate Payload',
}

export type TransformerState = 'idle' | 'analyzing' | 'analyzed' | 'transforming' | 'active' | 'generating_schema' | 'extracting' | 'validating';

export enum PromptModuleKey {
  CORE = 'CORE',
  COMPLEX_PROBLEM = 'COMPLEX_PROBLEM',
  AGENTIC = 'AGENTIC',
  CONSTRAINT = 'CONSTRAINT',
  META = 'META',
  COMPUTER_OPS = 'COMPUTER_OPS',
}

export type TokenUsage = z.infer<typeof tokenUsageSchema>;
export type ImplementationTask = z.infer<typeof implementationTaskSchema>;
export type GeminiResponse = z.infer<typeof geminiDevelopmentPlanResponseSchema> & {
  tokenUsage?: TokenUsage;
};

export interface HistoryEntry {
    id: string;
    prompt: string;
    output: string;
    score: number;
}

export type MissionControlTabKey = 'dashboard' | 'shunt' | 'weaver' | 'foundry' | 'ui_builder' | 'chat' | 'orchestrator' | 'image_analysis' | 'terminal' | 'oraculum' | 'documentation' | 'settings' | 'anthropic_chat' | 'developers' | 'subscription' | 'serendipity_engine' | 'chronicle' | 'deploy' | 'tool_for_ai' | 'agent_builder' | 'system_2001' | 'persistent_developer' | 'ecosystem' | 'app_forge' | 'computer' | 'network_hub' | 'todo';

export type TabCategory = 'workspace' | 'lab' | 'ops' | 'system';

export interface MissionControlTab {
    key: MissionControlTabKey;
    label: string;
    icon: ReactNode;
    component: React.FC | React.LazyExoticComponent<React.FC>;
    keywords?: string[];
    colorTheme?: string;
    primaryColor?: string;
    description?: string;
    architecturalContext?: string;
    category?: TabCategory;
}

export interface Documentation {
  geminiContext: string;
  progressLog: string;
  decisions: string;
  issuesAndFixes: string;
  featureTimeline: string;
}

export interface MailboxFile {
    id: string;
    path: string;
    content: string;
    timestamp: string;
    isRead: boolean;
    versionId: string;
}

export interface MiaMessage {
  id: string;
  sender: 'user' | 'mia' | 'system-error' | 'system-progress';
  text: string;
  timestamp: string;
  isHtml?: boolean;
  action?: {
    type: 'suggest_refresh' | 'clear_cache' | 'link_to_docs' | 'run_automated_fix';
    payload?: any;
    label?: string;
  };
  diagnosableError?: MiaAlert;
  fixProposal?: GeminiResponse;
}

export interface MiaAlert {
  id: string;
  type: 'system_health' | 'predictive_bug' | 'onboarding_tip' | 'error_diagnosis' | string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  actions?: { label: string; actionType: string; payload?: any }[];
}

// --- Network Hub Types ---

export type SocketStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface SocketMessage {
    id: string;
    direction: 'in' | 'out';
    timestamp: string;
    data: string;
    isJson: boolean;
}

export interface SocketConfig {
    id: string;
    label: string;
    url: string;
    protocol?: string;
    status: SocketStatus;
    messages: SocketMessage[];
    autoReconnect: boolean;
}

export type AgentName = 'Strategist' | 'Architect' | 'Engineer' | 'Critic' | 'Advocate' | 'Futurist';
export type AgentStatus = 'Idle' | 'Auditing' | 'Designing' | 'Reviewing' | 'Refining' | 'Done';
export interface FoundryAgent {
    name: AgentName;
    status: AgentStatus;
    designScore?: number;
    currentTask?: string;
    auditFindings?: string;
    design?: string;
}
export type FoundryPhase = 'Idle' | 'Audit' | 'Design' | 'Review' | 'Converged';
export type LogEntryType = 'PHASE' | 'SUCCESS' | 'DECISION' | 'INFO';

export interface LogEntry {
    id: string;
    timestamp: string;
    type: LogEntryType;
    message: string;
}

export interface JobLog {
    timestamp: string;
    message: string;
    type?: 'info' | 'tool_call' | 'tool_result' | 'thought' | 'inverse_analysis';
}

export type JobStatus = 'Pending' | 'Running' | 'Completed' | 'Failed' | 'Cancelled';

export interface AgentState {
    scratchpad: string;
    plan: string[];
    completedSteps: string[];
    inverseAnalysis: string[];
}

export interface Job {
    id: string;
    prompt: string;
    status: JobStatus;
    logs: JobLog[];
    result: string | null;
    startTime: number;
    endTime: number | null;
    agentState?: AgentState;
}

export type LLMModel = 'gemini-3-pro-preview' | 'gemini-3-flash-preview' | 'gemini-2.5-flash';
export type AgentRole = 'assistant' | 'coder' | 'researcher' | 'architect';

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  model: LLMModel;
  temperature: number;
  systemPrompt: string;
  maxTokens: number;
  tools: AgentTool[];
}

export const INITIAL_AGENT_CONFIG: AgentConfig = {
  id: '',
  name: '',
  role: 'assistant',
  model: 'gemini-3-pro-preview',
  temperature: 0.7,
  systemPrompt: '',
  maxTokens: 8192,
  tools: [
    { id: 'web_search', name: 'Web Search', description: 'Search the web for real-time info', enabled: true },
    { id: 'code_interpreter', name: 'Code Execution', description: 'Execute Python code', enabled: false },
    { id: 'read_file', name: 'Read File', description: 'Read local files', enabled: false },
    { id: 'write_file', name: 'Write File', description: 'Write local files', enabled: false },
    { id: 'list_files', name: 'List Files', description: 'List directory contents', enabled: false },
  ]
};

export interface ShuntApp {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    instruction: string;
    category: string;
    createdAt: string;
}
