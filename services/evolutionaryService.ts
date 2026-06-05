
// services/evolutionaryService.ts
import { v4 as uuidv4 } from 'uuid';
import { dbService } from './db';
import { AgentManifest, ExecutionRecord, OptimizationReport, GeneratedTest } from '../types/agentSystem';
import { generateRawText } from './geminiService';
import { Type } from "@google/genai";

// --- Persistence ---

export const saveExecutionRecord = async (record: ExecutionRecord) => {
    await dbService.set(dbService.STORES.EVOLUTION, record.id, record);
};

export const getAgentHistory = async (agentId: string): Promise<ExecutionRecord[]> => {
    const allRecords = await dbService.getAll<ExecutionRecord>(dbService.STORES.EVOLUTION);
    return allRecords.filter(r => r.agentId === agentId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// --- The Optimizer Agent ---

export const generateIntegrationTest = async (manifest: AgentManifest): Promise<GeneratedTest> => {
    // Optimized Prompt: Minified Keys (i=input, ec=expectedCriteria)
    const prompt = `Role:QA. Agent:${manifest.role}. Instr:${manifest.systemInstruction}.
Task:Gen robust integration test.
JSON Schema: { i: string (challenging prompt), ec: string[] (3 verifications) }`;

    try {
        const { resultText } = await generateRawText(prompt, 'gemini-3-flash-preview');
        const jsonStr = resultText.replace(/```json\n?|\n?```/g, '').trim();
        const raw = JSON.parse(jsonStr);
        
        return {
            input: raw.i || "Explain functionality.",
            expectedCriteria: raw.ec || ["Response validity"]
        };
    } catch (e) {
        console.error("Test gen failed", e);
        return { input: "Explain primary function.", expectedCriteria: ["Mentions role", "Clear explanation"] };
    }
};

export const optimizeAgent = async (
    manifest: AgentManifest, 
    history: ExecutionRecord[], 
    feedback?: string
): Promise<OptimizationReport> => {
    
    // summarize history
    const failures = history.filter(h => h.score !== undefined && h.score < 7).slice(0, 5);
    const historySummary = failures.map(f => `In:"${f.input.substring(0,50)}..."->Score:${f.score}.`).join('\n');

    // Optimized Prompt: Minified Keys (c=critique, nsi=newSystemInstruction, ch=changes, r=reasoning)
    const prompt = `Role:Agent Optimizer. Target:${manifest.role}. CurrInstr:"${manifest.systemInstruction}".
Context:${historySummary || "None."} Feedback:${feedback || "Improve."}
Task:Refine logic.
JSON Schema: { c: string (weakness), nsi: string (optimized prompt), ch: string[] (edits), r: string (why) }`;

    const { resultText } = await generateRawText(prompt, 'gemini-3-pro-preview');
    const jsonStr = resultText.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(jsonStr);

    const improvedManifest = {
        ...manifest,
        systemInstruction: result.nsi,
        version: incrementVersion(manifest.version || '1.0.0')
    };

    return {
        originalManifest: manifest,
        improvedManifest,
        critique: result.c,
        changes: result.ch,
        reasoning: result.r
    };
};

const incrementVersion = (version: string) => {
    const parts = version.split('.');
    if (parts.length === 3) {
        return `${parts[0]}.${parts[1]}.${parseInt(parts[2]) + 1}`;
    }
    return version + ".1";
};
