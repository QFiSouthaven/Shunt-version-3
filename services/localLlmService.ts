
// services/localLlmService.ts
import { TokenUsage } from '../types';

export type LocalProvider = 'lm-studio' | 'ollama';

interface LocalSettings {
    provider: LocalProvider;
    baseUrl: string;
    modelId: string;
    contextWindow?: number;
}

const DEFAULT_TIMEOUT_MS = 60000; // 60 seconds timeout for local inference

const fetchWithTimeout = async (url: string, options: RequestInit, timeout = DEFAULT_TIMEOUT_MS) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

/**
 * Adapter for OpenAI-compatible endpoints (LM Studio, vLLM, etc.)
 */
const queryOpenAICompatible = async (prompt: string, systemInstruction: string | undefined, image: { base64Data: string; mimeType: string } | undefined, settings: LocalSettings): Promise<{ resultText: string, tokenUsage: TokenUsage }> => {
    const messages = [];
    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
    
    // Construct user message (text or multimodal)
    let userContent: any = prompt;
    
    if (image) {
        // OpenAI-compatible vision payload
        userContent = [
            { type: 'text', text: prompt },
            { 
                type: 'image_url', 
                image_url: { 
                    url: `data:${image.mimeType};base64,${image.base64Data}` 
                } 
            }
        ];
    }

    messages.push({ role: 'user', content: userContent });

    const payload = {
        model: settings.modelId || 'local-model',
        messages: messages,
        temperature: 0.7,
        stream: false
    };

    const response = await fetchWithTimeout(`${settings.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`LM Studio Error: ${response.status} ${response.statusText}`);

    const data = await response.json();
    return {
        resultText: data.choices?.[0]?.message?.content || '',
        tokenUsage: {
            prompt_tokens: data.usage?.prompt_tokens || 0,
            completion_tokens: data.usage?.completion_tokens || 0,
            total_tokens: data.usage?.total_tokens || 0,
            model: data.model || settings.modelId,
        }
    };
};

/**
 * Adapter for Ollama API
 */
const queryOllama = async (prompt: string, systemInstruction: string | undefined, image: { base64Data: string; mimeType: string } | undefined, settings: LocalSettings): Promise<{ resultText: string, tokenUsage: TokenUsage }> => {
    const payload: any = {
        model: settings.modelId || 'llama3', // Default to llama3 if mostly undefined
        prompt: prompt,
        system: systemInstruction,
        stream: false,
        options: {
            num_ctx: settings.contextWindow || 4096
        }
    };

    if (image) {
        // Ollama specific 'images' array field in the payload
        payload.images = [image.base64Data];
    }

    // Note: Ollama uses /api/generate for raw completion or /api/chat for chat. 
    // Using /api/generate here for direct prompt control equivalent to Shunt needs.
    const response = await fetchWithTimeout(`${settings.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Ollama Error: ${response.status} ${response.statusText}`);

    const data = await response.json();
    return {
        resultText: data.response || '',
        tokenUsage: {
            prompt_tokens: data.prompt_eval_count || 0,
            completion_tokens: data.eval_count || 0,
            total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
            model: data.model,
        }
    };
};

export const performLocalLlmShunt = async (
    prompt: string,
    systemInstruction: string | undefined,
    settings: { baseUrl: string; modelId: string; provider?: LocalProvider },
    jsonSchema?: any,
    image?: { base64Data: string; mimeType: string }
): Promise<{ resultText: string; tokenUsage: TokenUsage }> => {
    
    const provider = settings.provider || 'lm-studio';
    
    // Inject Schema into System Instruction if provided (Simulate JSON mode)
    let finalSystemInstruction = systemInstruction || '';
    if (jsonSchema) {
        const schemaString = JSON.stringify(jsonSchema, null, 2);
        finalSystemInstruction += `\n\nCRITICAL: You must output strictly valid JSON matching the following schema. Do not output markdown code blocks. Just the raw JSON.\n\n${schemaString}`;
    }

    try {
        if (provider === 'ollama') {
            return await queryOllama(prompt, finalSystemInstruction, image, { ...settings, provider });
        } else {
            return await queryOpenAICompatible(prompt, finalSystemInstruction, image, { ...settings, provider: 'lm-studio' });
        }
    } catch (error: any) {
        console.error(`Failed to connect to Local LLM (${provider}):`, error);
        
        let tip = '';
        if (provider === 'ollama' && error.name === 'TypeError') {
            tip = ' Ensure Ollama is running (`ollama serve`) and CORS is allowed (OLLAMA_ORIGINS="*").';
        } else if (provider === 'lm-studio') {
            tip = ' Ensure the Local Server is started in LM Studio.';
        }

        throw new Error(`Local AI Connection Failed: ${error.message}.${tip}`);
    }
};
