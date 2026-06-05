
// services/IntelligenceRouter.ts
import { GoogleGenAI } from "@google/genai";
import { executeAIRequest as executeGemini, performShuntStream as geminiStream } from './geminiService';
import { performLocalLlmShunt } from './localLlmService';
import { queryCloudflareAI } from './cloudflareAIService';
import { TokenUsage, GeminiResponse, ShuntAction } from '../types';
import { getPromptForAction } from './prompts';
import { TokenMiddleware } from './TokenMiddleware';

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export interface RouterOptions {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  jsonSchema?: any;
  provider?: 'gemini' | 'local' | 'cloudflare';
  history?: ChatMessage[];
  useTools?: boolean;
  allowedTools?: string[];
  image?: { base64Data: string; mimeType: string };
  compressPayload?: boolean;
  useGrounding?: boolean;
  useMaps?: boolean;
}

/**
 * UNIFIED INTELLIGENCE ROUTER
 * The single entry point for all AI cognitive tasks in Aether Shunt OS.
 */
export const requestIntelligence = async (options: RouterOptions): Promise<{ 
  resultText: string; 
  tokenUsage: TokenUsage; 
  parsedJson?: any;
  functionCalls?: any[];
  groundingChunks?: any[];
}> => {
  const settingsString = localStorage.getItem('ai-shunt-settings');
  const settings = settingsString ? JSON.parse(settingsString) : {};
  const provider = options.provider || settings.masterProvider || 'gemini';

  let finalPrompt = options.prompt;
  let finalSystemInstruction = options.systemInstruction || "";

  // Apply Key Aliasing to Tool Schemas
  if (options.useTools && provider !== 'gemini') {
    const { toolRegistry } = await import('./toolApi');
    const allTools = toolRegistry.getAllTools();
    const toolsToPass = options.allowedTools 
        ? allTools.filter(t => options.allowedTools!.includes(t.getName()))
        : allTools;

    const toolsDescription = toolsToPass.map(t => {
        const schema = options.compressPayload ? TokenMiddleware.compress(t.getInputSchema()) : t.getInputSchema();
        return `- ${t.getName()}: ${t.getDescription()}. Schema: ${JSON.stringify(schema)}`;
    }).join('\n');

    finalSystemInstruction += `\n\n### TOOL_PROTOCOL
You have access to the following tools:
${toolsDescription}

To call a tool, respond ONLY with a JSON block:
{ "tool_calls": [{ "name": "tool_name", "args": { ... } }] }
Wait for the system to provide the tool result before continuing.`;
  }

  try {
    switch (provider) {
      case 'local':
        const localResult = await performLocalLlmShunt(
          finalPrompt,
          finalSystemInstruction,
          {
            baseUrl: settings.localLlmBaseUrl,
            modelId: settings.localLlmModelId,
            provider: settings.localLlmProvider
          },
          options.jsonSchema,
          options.image
        );

        let functionCalls: any[] | undefined = undefined;
        if (options.useTools && localResult.resultText.includes('"tool_calls"')) {
            try {
                const parsed = JSON.parse(localResult.resultText.replace(/```json\n?|\n?```/g, '').trim());
                functionCalls = parsed.tool_calls;
            } catch (e) { /* fallback to text */ }
        }

        return { ...localResult, functionCalls };

      case 'cloudflare':
        return await queryCloudflareAI(
          finalPrompt,
          finalSystemInstruction,
          {
            accountId: settings.cfAccountId,
            apiToken: settings.cfApiToken,
            modelId: settings.cfModelId
          }
        );

      case 'gemini':
      default:
        // Handle Grounding Upgrades
        let targetModel = options.model || 'gemini-3-pro-preview';
        const tools: any[] = [];
        let toolConfig: any = undefined;

        if (options.useGrounding) {
            targetModel = 'gemini-3-pro-image-preview'; // Required for Search
            tools.push({ googleSearch: {} });
        }

        if (options.useMaps) {
            targetModel = 'gemini-2.5-flash'; // Required for Maps
            tools.push({ googleMaps: {} });
            
            // Attempt to get user location
            try {
               const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
               toolConfig = {
                  retrievalConfig: {
                    latLng: {
                      latitude: pos.coords.latitude,
                      longitude: pos.coords.longitude
                    }
                  }
               };
            } catch (e) { console.warn("Geolocation denied, proceeding without coords."); }
        }

        // Initialize AI client
        const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const config: any = {
            systemInstruction: finalSystemInstruction,
            tools: tools.length > 0 ? tools : undefined,
            toolConfig: toolConfig,
            responseMimeType: options.jsonSchema ? "application/json" : undefined,
            responseSchema: options.jsonSchema
        };

        const result = await client.models.generateContent({
            model: targetModel,
            contents: options.history ? 
                [...options.history.map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.content }] })), { role: 'user', parts: [{ text: finalPrompt }] }] :
                [{ role: 'user', parts: [{ text: finalPrompt }] }],
            config
        });

        return {
            resultText: result.text || '',
            tokenUsage: {
                prompt_tokens: result.usageMetadata?.promptTokenCount ?? 0,
                completion_tokens: result.usageMetadata?.candidatesTokenCount ?? 0,
                total_tokens: result.usageMetadata?.totalTokenCount ?? 0,
                model: targetModel,
            },
            functionCalls: result.functionCalls,
            groundingChunks: result.candidates?.[0]?.groundingMetadata?.groundingChunks
        };
    }
  } catch (error) {
    console.error(`Intelligence Router Failure [${provider}]:`, error);
    throw error;
  }
};

export const generateRawText = async (prompt: string, model?: string): Promise<{ resultText: string; tokenUsage: TokenUsage }> => {
    return requestIntelligence({ prompt, model });
};

export const performShunt = async (
    text: string, 
    action: ShuntAction | string, 
    model?: string,
    context?: string,
    priority?: string
): Promise<{ resultText: string; tokenUsage: TokenUsage }> => {
    const prompt = getPromptForAction(text, action as ShuntAction, context, priority);
    return requestIntelligence({ prompt, model });
};

export async function* requestStream(options: RouterOptions) {
    const settingsString = localStorage.getItem('ai-shunt-settings');
    const settings = settingsString ? JSON.parse(settingsString) : {};
    const provider = options.provider || settings.masterProvider || 'gemini';

    if (provider === 'gemini') {
        const gen = geminiStream(
            options.prompt,
            'Action',
            options.model || 'gemini-3-flash-preview',
            undefined,
            undefined,
            options.systemInstruction
        );
        for await (const chunk of gen) yield chunk;
    } else {
        const result = await requestIntelligence(options);
        yield result.resultText;
    }
}

export const requestDevelopmentPlan = async (goal: string, context: string): Promise<GeminiResponse> => {
  const prompt = `Goal: ${goal}\nContext: ${context}\n\nOutput strictly valid JSON based on the system instructions.`;
  const systemInstruction = `You are a Lead Architect. Output a JSON plan with: clarifyingQuestions (array), architecturalProposal (string), implementationTasks (array of {filePath, description, newContent}), testCases (array).`;

  const { resultText, tokenUsage } = await requestIntelligence({
    prompt,
    systemInstruction,
    jsonSchema: {
      type: "OBJECT",
      properties: {
        clarifyingQuestions: { type: "ARRAY", items: { type: "STRING" } },
        architecturalProposal: { type: "STRING" },
        implementationTasks: { 
          type: "ARRAY", 
          items: { 
            type: "OBJECT", 
            properties: { 
                filePath: { type: "STRING" }, 
                description: { type: "STRING" },
                newContent: { type: "STRING" }
            } 
          } 
        },
        testCases: { type: "ARRAY", items: { type: "STRING" } }
      }
    }
  });

  try {
    const data = JSON.parse(resultText.replace(/```json\n?|\n?```/g, '').trim());
    return { ...data, tokenUsage };
  } catch (e) {
    return { clarifyingQuestions: [], architecturalProposal: resultText, implementationTasks: [], testCases: [], tokenUsage };
  }
};
