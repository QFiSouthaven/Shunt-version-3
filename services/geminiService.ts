// services/geminiService.ts
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ShuntAction, GeminiResponse, TokenUsage, PromptModuleKey, TransformerAction } from '../types';
import { getPromptForAction, promptModules } from './prompts';

// Helper for exponential backoff
const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 5, delay = 2000): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        let errorBody = '';
        // Extract error message from various possible shapes of the error object
        if (error instanceof Error) {
            errorBody = error.message;
        } else {
            try {
                errorBody = JSON.stringify(error);
            } catch (e) {
                errorBody = String(error);
            }
        }
        
        const lowerMsg = errorBody.toLowerCase();
        
        // Comprehensive check for rate limits
        const isRateLimit = 
            lowerMsg.includes('429') || 
            lowerMsg.includes('quota') || 
            lowerMsg.includes('resource_exhausted') || 
            lowerMsg.includes('too many requests') ||
            (error?.status === 429) ||
            (error?.error?.code === 429);

        if (retries > 0 && isRateLimit) {
            console.warn(`Rate limit hit (Gemini). Retrying in ${delay}ms... (Retries left: ${retries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            // Exponential backoff with jitter
            const nextDelay = delay * 2 + Math.random() * 500;
            return retryWithBackoff(fn, retries - 1, nextDelay);
        }
        throw error;
    }
};

/**
 * Enhanced AI request executor supporting tool use, history, and structured output.
 */
export const executeAIRequest = async (options: any): Promise<{ 
    resultText: string; 
    tokenUsage: TokenUsage; 
    parsedJson?: any; 
    functionCalls?: any[];
}> => {
    // Destructured 'image' from options to enable multimodal support
    const { model, prompt, systemInstruction, jsonSchema, config, useTools, allowedTools, history, image } = options;
    const geminiConfig: any = { ...config };
    
    if (jsonSchema) {
        geminiConfig.responseMimeType = "application/json";
        geminiConfig.responseSchema = jsonSchema;
    }
    if (systemInstruction) geminiConfig.systemInstruction = systemInstruction;

    // Handle tools
    if (useTools) {
        const { toolRegistry } = await import('./toolApi');
        const allTools = toolRegistry.getAllTools();
        const toolsToPass = allowedTools 
            ? allTools.filter(t => allowedTools.includes(t.getName()))
            : allTools;

        geminiConfig.tools = [{
            functionDeclarations: toolsToPass.map(t => ({
                name: t.getName(),
                description: t.getDescription(),
                parameters: t.getInputSchema()
            }))
        }];
    }

    // Initialize AI client right before use to ensure latest API key
    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let response: GenerateContentResponse;
    
    response = await retryWithBackoff(async () => {
        if (history) {
            const chat = client.chats.create({
                model: model,
                config: geminiConfig,
                history: history
            });
            return await chat.sendMessage({ message: prompt });
        } else {
            // Reconstructed contents array to include image parts for multimodal support
            const parts: any[] = [];
            if (image) {
                parts.push({
                    inlineData: {
                        data: image.base64Data,
                        mimeType: image.mimeType,
                    },
                });
            }
            parts.push({ text: prompt });

            return await client.models.generateContent({
                model: model,
                contents: [{ role: 'user', parts }],
                config: geminiConfig
            });
        }
    });

    return { 
        resultText: response.text || '', 
        tokenUsage: {
            prompt_tokens: response.usageMetadata?.promptTokenCount ?? 0,
            completion_tokens: response.usageMetadata?.candidatesTokenCount ?? 0,
            total_tokens: response.usageMetadata?.totalTokenCount ?? 0,
            model: model,
        },
        functionCalls: response.functionCalls
    };
};

export const generateRawText = async (prompt: string, model: string = 'gemini-3-flash-preview'): Promise<{ resultText: string; tokenUsage: TokenUsage }> => {
    return executeAIRequest({ model, prompt });
};

export const analyzeImage = async (prompt: string, image: { base64Data: string; mimeType: string }): Promise<{ resultText: string; tokenUsage: TokenUsage }> => {
    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Updated to use 'gemini-3-flash-preview' for vision analysis per modern guidelines
    const modelName = 'gemini-3-flash-preview';
    const response = await retryWithBackoff(async () => {
        return await client.models.generateContent({
            model: modelName,
            contents: {
                parts: [
                    { inlineData: { data: image.base64Data, mimeType: image.mimeType } },
                    { text: prompt }
                ]
            }
        });
    });

    return {
        resultText: response.text || '',
        tokenUsage: {
            prompt_tokens: response.usageMetadata?.promptTokenCount ?? 0,
            completion_tokens: response.usageMetadata?.candidatesTokenCount ?? 0,
            total_tokens: response.usageMetadata?.totalTokenCount ?? 0,
            model: modelName,
        }
    };
};

export const performShunt = async (
    text: string, 
    action: ShuntAction | string, 
    model: string = 'gemini-3-pro-preview',
    context?: string,
    priority?: string
): Promise<{ resultText: string; tokenUsage: TokenUsage }> => {
    const prompt = getPromptForAction(text, action as ShuntAction, context, priority);
    return executeAIRequest({ model, prompt });
};

export async function* performShuntStream(text: string, action: ShuntAction | string, model: string, context?: string, priority?: string, customInstruction?: string) {
    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = typeof action === 'string' && customInstruction 
        ? `${customInstruction}\n\n${text}` 
        : getPromptForAction(text, action as ShuntAction, context, priority);
    
    // We can't easily retry streams mid-flight, but we can retry the initial connection.
    const stream = await retryWithBackoff(async () => {
        return await client.models.generateContentStream({
            model: model,
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
    });

    for await (const chunk of stream) {
        yield chunk.text || '';
    }
}

export const executeModularPrompt = async (text: string, modules: Set<PromptModuleKey>, context?: string, priority?: string): Promise<{ resultText: string; tokenUsage: TokenUsage }> => {
    const combinedInstructions = Array.from(modules).map(m => promptModules[m].content).join('\n\n');
    const prompt = `Instructions:\n${combinedInstructions}\n\nContext:\n${context || ''}\nPriority: ${priority || 'Medium'}\n\nInput:\n${text}`;
    return executeAIRequest({ model: 'gemini-3-pro-preview', prompt });
};

export const performStateAudit = async (stateJson: string, tabKey: string): Promise<string> => {
    const prompt = `Perform a structural integrity audit on the state manifest for "${tabKey}":\n${stateJson}`;
    const { resultText } = await executeAIRequest({ model: 'gemini-3-pro-preview', prompt });
    return resultText;
};

export const performSystemSelfOptimization = async (context: any): Promise<{ resultText: string; tokenUsage: TokenUsage }> => {
    const prompt = `### SYSTEM SELF-OPTIMIZATION PROTOCOL\nAnalyze context:\n${JSON.stringify(context)}\nGenerate React 19 report.`;
    return executeAIRequest({ model: 'gemini-3-pro-preview', prompt });
};

export const generateProjectTome = async (context: string): Promise<{ resultText: string }> => {
    const prompt = `Generate a project tome for the following context:\n${context}`;
    return executeAIRequest({ model: 'gemini-3-pro-preview', prompt });
};

export const generateDevelopmentPlan = async (goal: string, context: string): Promise<GeminiResponse> => {
    // Phase 2 JSON Compression: Request dense/minified structure
    // cq: Clarifying Questions, ap: Arch Proposal, im: Internal Monologue, tc: Test Cases
    // it: Implementation Tasks (Dense: h=header, d=data array)
    const prompt = `Goal: ${goal}\nContext: ${context}
    
    CRITICAL: Output JSON ONLY. Minimal syntax.
    Format:
    {
      "cq": ["question1"], 
      "ap": "architectural proposal",
      "im": "internal monologue",
      "tc": ["test case 1"],
      "it": { 
         "h": ["fp", "d", "dt", "nc"], 
         "d": [["file/path.ts", "description", "details", "content"]] 
      }
    }`;

    const { resultText, tokenUsage } = await executeAIRequest({ 
        model: 'gemini-3-pro-preview', 
        prompt
    });
    
    try {
        const jsonStr = resultText.replace(/```json\n?|\n?```/g, '').trim();
        const raw = JSON.parse(jsonStr);
        
        // Decompress logic: Map dense keys back to Domain keys
        const implementationTasks = raw.it && raw.it.d ? raw.it.d.map((row: string[]) => ({
            filePath: row[0],
            description: row[1],
            details: row[2],
            newContent: row[3]
        })) : [];

        return { 
            clarifyingQuestions: raw.cq || [],
            architecturalProposal: raw.ap || '',
            implementationTasks: implementationTasks,
            testCases: raw.tc || [],
            internalMonologue: raw.im,
            tokenUsage 
        };
    } catch (e) {
        console.warn("Failed to parse dense JSON plan, returning raw text fallback.", e);
        return { 
            implementationTasks: [], 
            architecturalProposal: resultText, 
            clarifyingQuestions: [], 
            testCases: [], 
            tokenUsage 
        };
    }
};

export const generateOraculumInsights = async (eventsJson: string): Promise<string> => {
    const prompt = `Analyze these telemetry events and provide insights:\n${eventsJson}`;
    const { resultText } = await executeAIRequest({ model: 'gemini-3-flash-preview', prompt });
    return resultText;
};

export const generateSeamlessMerge = async (target: string, source: string, strategy: string): Promise<{ resultText: string }> => {
    const prompt = `Merge strategy: ${strategy}\nTarget:\n${target}\nSource:\n${source}`;
    return executeAIRequest({ model: 'gemini-3-pro-preview', prompt });
};

export const gradeOutput = async (output: string, prompt: string): Promise<{ score: number }> => {
    // Basic heuristics for speed, in a real app this would call a model
    let score = 7;
    if (output.length > 50) score += 1;
    if (output.includes('```')) score += 1;
    return { score: Math.min(10, score) };
};

export const generateHolisticArchitecture = async (query: string, context: any): Promise<{ resultText: string }> => {
    const prompt = `Architecture query: ${query}\nSystem Context: ${JSON.stringify(context)}`;
    return executeAIRequest({ model: 'gemini-3-pro-preview', prompt });
};

export const generateRefactoringPlan = async (tabKey: string, context: string): Promise<GeminiResponse> => {
    // Phase 2 Optimization: Dense Packing
    const prompt = `Create a strict refactoring plan for ${tabKey}. Context: ${context}.
    Output JSON ONLY. Minify keys.
    Format:
    {
      "ap": "Architectural Analysis",
      "it": { 
        "h": ["fp", "d", "dt", "nc"], 
        "d": [["file.ts", "desc", "details", "content"]] 
      }
    }`;

    const { resultText, tokenUsage } = await executeAIRequest({ model: 'gemini-3-pro-preview', prompt });
    
    try {
        const jsonStr = resultText.replace(/```json\n?|\n?```/g, '').trim();
        const raw = JSON.parse(jsonStr);

        const implementationTasks = raw.it && raw.it.d ? raw.it.d.map((row: string[]) => ({
            filePath: row[0],
            description: row[1],
            details: row[2],
            newContent: row[3]
        })) : [];

        return { 
            implementationTasks, 
            architecturalProposal: raw.ap || '', 
            clarifyingQuestions: [], 
            testCases: [], 
            tokenUsage 
        };
    } catch {
        return { implementationTasks: [], architecturalProposal: resultText, clarifyingQuestions: [], testCases: [], tokenUsage };
    }
};

export const generateArchitecturalBlueprint = async (tabKey: string, context: string): Promise<{ resultText: string }> => {
    const prompt = `Blueprint for ${tabKey}. Context: ${context}`;
    return executeAIRequest({ model: 'gemini-3-pro-preview', prompt });
};

export const generateContinuancePath = async (tabKey: string, context: string): Promise<{ resultText: string }> => {
    const prompt = `Roadmap for ${tabKey}. Context: ${context}`;
    return executeAIRequest({ model: 'gemini-3-pro-preview', prompt });
};

/**
 * Intelligent Action Classifier using Gemini Flash.
 * Determines the best ShuntAction based on the input text content.
 * OPTIMIZED (Phase 3.1): Uses executeAIRequest for DRY compliance.
 */
export const determineBestAction = async (text: string): Promise<{ action: ShuntAction | string; reasoning: string }> => {
    const sample = text.substring(0, 1500); 
    
    // Minified Prompt for Token Efficiency (Phase 2.2)
    const prompt = `Classify intent. In: "${sample}".
    Actions: Summarize, Amplify, Make Actionable, ELI5, Format JSON, Modernize Code, Proofread, Generate Utility Script, Generate Shell Command, Deep Crawl.
    Default: Analyze.
    JSON Schema: { a: string (enum|text), r: string (brief) }`;

    try {
        // Reuse the central executor
        const { resultText } = await executeAIRequest({
            model: 'gemini-3-flash-preview',
            prompt: prompt,
            jsonSchema: {
                type: Type.OBJECT,
                properties: {
                    a: { type: Type.STRING },
                    r: { type: Type.STRING }
                },
                required: ["a", "r"]
            }
        });

        const json = JSON.parse(resultText || '{}');
        
        // Map Minified Keys back to Domain Types
        const rawAction = json.a;
        const mappedAction = Object.values(ShuntAction).find(a => a === rawAction) || rawAction || ShuntAction.MY_COMMAND;

        return {
            action: mappedAction,
            reasoning: json.r || "Analysis complete."
        };
    } catch (e) {
        console.warn("Smart Shunt classification failed, defaulting to analysis.", e);
        return { action: ShuntAction.MY_COMMAND, reasoning: "Heuristic classification failed. Defaulting to general analysis." };
    }
};

export const performTransformerAction = async () => ({ resultText: 'Transformed' });
export const generateScraperSelectors = async () => ({ selectors: [] });
