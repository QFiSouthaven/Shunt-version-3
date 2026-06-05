
// hooks/useComponentGenerator.ts
import { useState, useCallback } from 'react';
import { generateRawText } from '../services/geminiService';
import { audioService } from '../services/audioService';
import { parseApiError } from '../utils/errorLogger';

interface UseComponentGeneratorReturn {
    prompt: string;
    setPrompt: (val: string) => void;
    generatedCode: string | null;
    isGenerating: boolean;
    error: string | null;
    handleGenerate: () => Promise<void>;
}

export const useComponentGenerator = (): UseComponentGeneratorReturn => {
    const [prompt, setPrompt] = useState('');
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim() || isGenerating) return;

        setIsGenerating(true);
        setError(null);
        setGeneratedCode(null);
        audioService.playSound('send');

        try {
            const systemPrompt = `
                You are a Senior React UI Engineer.
                Your task is to generate a single, functional React component based on the user's description.
                
                **Requirements:**
                - Use Tailwind CSS for styling.
                - Use Lucide React icons if mentioned (assume 'lucide-react' import).
                - Use React Hooks (useState, useEffect) as needed.
                - Output ONLY the code block. No markdown wrapper, no explanation.
                - Ensure the component is exported as default.
                
                User Request: ${prompt}
            `;

            const { resultText } = await generateRawText(systemPrompt, 'gemini-3-pro-preview');
            
            // Clean up markdown if present
            const cleanCode = resultText.replace(/^```tsx|```$/g, '').replace(/^```jsx|```$/g, '').trim();
            
            setGeneratedCode(cleanCode);
            audioService.playSound('success');

        } catch (e) {
            const msg = parseApiError(e);
            setError(msg);
            audioService.playSound('error');
        } finally {
            setIsGenerating(false);
        }
    }, [prompt, isGenerating]);

    return {
        prompt,
        setPrompt,
        generatedCode,
        isGenerating,
        error,
        handleGenerate
    };
};
