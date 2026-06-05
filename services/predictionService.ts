
// services/predictionService.ts
import { requestIntelligence } from "./IntelligenceRouter";

/**
 * Predicts the completion of a user's input based on the active App's context.
 * Uses the Global Provider for parity.
 */
export const predictNextTokens = async (
    appContext: string, 
    currentInput: string
): Promise<string> => {
    if (!currentInput || currentInput.length < 5) return "";

    const prompt = `
    You are an auto-complete engine. 
    Context: The user is using an AI tool defined as: "${appContext}".
    Current Input: "${currentInput}"
    
    Task: Predict the rest of the user's sentence or command.
    Constraint: Return ONLY the completion text. Do not repeat the input. If unsure, return empty string. Keep it short (max 10 words).
    `;

    try {
        const { resultText } = await requestIntelligence({
            prompt,
            model: 'gemini-3-flash-preview'
        });

        return resultText?.trim() || "";
    } catch (e) {
        return "";
    }
};
