
// services/cloudflareAIService.ts
import { TokenUsage } from '../types';

interface CFSettings {
  accountId: string;
  apiToken: string;
  modelId: string;
}

export const queryCloudflareAI = async (
  prompt: string, 
  systemInstruction: string | undefined, 
  settings: CFSettings
): Promise<{ resultText: string, tokenUsage: TokenUsage }> => {
  
  if (!settings.accountId || !settings.apiToken) {
    throw new Error("Cloudflare Account ID or API Token missing in Settings.");
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/ai/run/${settings.modelId}`;
  
  const messages = [];
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
  messages.push({ role: 'user', content: prompt });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Cloudflare AI Error: ${errorData.errors?.[0]?.message || response.statusText}`);
  }

  const data = await response.json();
  const resultText = data.result?.response || "";

  return {
    resultText,
    tokenUsage: {
      prompt_tokens: 0, // CF doesn't always provide granular counts in simple response
      completion_tokens: 0,
      total_tokens: resultText.length / 4, // Heuristic
      model: settings.modelId
    }
  };
};
