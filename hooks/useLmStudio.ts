// hooks/useLmStudio.ts
import { useState, useCallback } from 'react';

// Default endpoint for LM Studio's local server
const LM_STUDIO_ENDPOINT = 'http://localhost:1234/v1/chat/completions';

interface LmStudioResponse {
  resultText: string;
}

export const useLmStudio = () => {
    const [isLmStudioLoading, setIsLoading] = useState(false);
    const [lmStudioError, setLmStudioError] = useState<string | null>(null);

    const callLmStudio = useCallback(async (prompt: string): Promise<LmStudioResponse> => {
        setIsLoading(true);
        setLmStudioError(null);

        try {
            const response = await fetch(LM_STUDIO_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'local-model', // Model name is often ignored by LM Studio server
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    stream: false,
                }),
            });

            if (!response.ok) {
                throw new Error(`LM Studio server responded with status: ${response.status}. Make sure the server is running and accessible.`);
            }

            const data = await response.json();
            const resultText = data.choices?.[0]?.message?.content || '';

            if (!resultText) {
                throw new Error("Received an empty or malformed response from LM Studio.");
            }

            return { resultText };

        } catch (error) {
            console.error("LM Studio connection error:", error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            // Provide a user-friendly error message
            if (errorMessage.includes('Failed to fetch')) {
                 setLmStudioError('Could not connect to LM Studio. Please ensure the local server is running on http://localhost:1234.');
                 throw new Error('Could not connect to LM Studio. Please ensure the local server is running on http://localhost:1234.');
            }
            setLmStudioError(errorMessage);
            throw error; // Re-throw to be caught by the calling function
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { callLmStudio, isLmStudioLoading, lmStudioError };
};
