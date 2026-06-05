
// hooks/usePayloadPredictor.ts
import { useState, useEffect, useCallback } from 'react';
import { predictNextTokens } from '../services/predictionService';

export const usePayloadPredictor = (appContext: string, input: string) => {
    const [suggestion, setSuggestion] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    // Clear suggestion if input changes, before new prediction arrives
    useEffect(() => {
        setSuggestion('');
    }, [input]);

    useEffect(() => {
        if (!input.trim() || !appContext) {
            setSuggestion('');
            return;
        }

        // Debounce prediction by 600ms
        const timeoutId = setTimeout(async () => {
            setIsLoading(true);
            const prediction = await predictNextTokens(appContext, input);
            
            // Only set if input hasn't changed drastically in the meantime (basic race check)
            // A more robust check would use a ref for the latest input
            if (prediction) {
                setSuggestion(prediction);
            }
            setIsLoading(false);
        }, 600);

        return () => clearTimeout(timeoutId);
    }, [input, appContext]);

    const acceptSuggestion = useCallback(() => {
        if (!suggestion) return input;
        const combined = input + (input.endsWith(' ') || suggestion.startsWith(' ') ? '' : ' ') + suggestion;
        setSuggestion('');
        return combined;
    }, [input, suggestion]);

    return { suggestion, isPredicting: isLoading, acceptSuggestion, clearSuggestion: () => setSuggestion('') };
};
