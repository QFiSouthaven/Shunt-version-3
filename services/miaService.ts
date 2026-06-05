
// services/miaService.ts
import { GeminiResponse } from '../types';
import { logFrontendError, ErrorSeverity } from "../utils/errorLogger";
import { requestIntelligence, requestDevelopmentPlan } from "./IntelligenceRouter";

export const getMiaChatResponse = async (history: { role: string, parts: { text: string }[] }[], newMessage: string): Promise<string> => {
    try {
        const { resultText } = await requestIntelligence({
            prompt: newMessage,
            model: 'gemini-3-flash-preview',
            history: history.map(h => ({
                role: h.role === 'model' ? 'model' : 'user',
                content: h.parts[0].text
            }))
        });
        return resultText;
    } catch (error) {
        logFrontendError(error, ErrorSeverity.High, { context: 'getMiaChatResponse' });
        throw error;
    }
};

export const getMiaErrorAnalysis = async (errorLog: Record<string, any>): Promise<string> => {
    const prompt = `
You are Mia, an expert software engineer AI. Analyze this error log:
${JSON.stringify(errorLog, null, 2)}

1. Explain the error.
2. Identify likely cause.
3. Suggest a solution (with code if possible).
`;
    try {
        const { resultText } = await requestIntelligence({
            prompt,
            model: 'gemini-3-flash-preview'
        });
        return resultText;
    } catch (error) {
        logFrontendError(error, ErrorSeverity.Critical, { context: 'getMiaErrorAnalysis' });
        throw error;
    }
};

export const generateCodeFixPlan = async (errorLog: Record<string, any>, projectContext: string): Promise<GeminiResponse> => {
  const goal = `Fix the following error based on the provided context.\nError: ${JSON.stringify(errorLog)}`;
  
  try {
      return await requestDevelopmentPlan(goal, projectContext);
  } catch (error) {
    logFrontendError(error, ErrorSeverity.Critical, { context: 'generateCodeFixPlan' });
    throw error;
  }
};
