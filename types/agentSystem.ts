
import { z } from 'zod';

// Zod Schema for strict runtime validation
export const AgentManifestSchema = z.object({
    id: z.string().optional(),
    version: z.string().default('1.0.0'),
    name: z.string().min(1, "Agent name is required"),
    role: z.string().min(1, "Agent role is required"),
    description: z.string().optional(),
    // Capabilities are high-level flags, distinct from specific tools
    capabilities: z.array(z.string()).default([]), 
    modelConfig: z.object({
        model: z.string().default('gemini-3-pro-preview'),
        temperature: z.number().min(0).max(2).default(0.7),
        maxOutputTokens: z.number().optional(),
    }).default({
        model: 'gemini-3-pro-preview',
        temperature: 0.7
    }),
    systemInstruction: z.string().min(10, "System instructions must be at least 10 characters"),
    // List of tool names (keys in ToolRegistry) this agent is allowed to use
    tools: z.array(z.string()).default([]), 
});

export type AgentManifest = z.infer<typeof AgentManifestSchema>;

export interface AgentInstance {
    id: string;
    manifest: AgentManifest;
    status: 'ready' | 'active' | 'error';
    // The executable method that runs the agent loop
    execute: (input: string, context?: any) => Promise<string>;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    manifest?: AgentManifest;
}

export interface ExecutionRecord {
    id: string;
    agentId: string;
    agentVersion?: string;
    timestamp: string;
    input: string;
    output: string;
    durationMs?: number;
    score?: number;
    feedback?: string;
}

export interface GeneratedTest {
    input: string;
    expectedCriteria: string[];
}

export interface OptimizationReport {
    originalManifest: AgentManifest;
    improvedManifest: AgentManifest;
    critique: string;
    changes: string[];
    reasoning: string;
}
