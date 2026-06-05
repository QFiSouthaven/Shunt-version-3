# Coding Patterns & Standards
> **Developer Note:** Refer to these patterns when asking Gemini to generate new components or logic.

## 1. React Component Structure
All new components must follow this structure:

```tsx
import React, { useState, useCallback } from 'react';
import { useSomeContext } from '../../context/SomeContext';
import { SomeIcon } from '../icons';
import Loader from '../Loader';

interface ComponentNameProps {
    someProp: string;
}

const ComponentName: React.FC<ComponentNameProps> = ({ someProp }) => {
    // 1. Context Hooks
    const { someValue } = useSomeContext();
    
    // 2. Local State
    const [isLoading, setIsLoading] = useState(false);

    // 3. Handlers (Memoized)
    const handleClick = useCallback(() => {
        // Logic
    }, []);

    return (
        <div className="aether-panel p-4 flex flex-col gap-4">
            <header className="flex items-center justify-between border-b border-gray-700/50 pb-2">
                <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                    <SomeIcon className="w-5 h-5 text-cyan-400" />
                    Title
                </h3>
            </header>
            <main>
                {isLoading ? <Loader /> : <div>Content</div>}
            </main>
        </div>
    );
};

export default ComponentName;
```

## 2. Styling Tokens (Tailwind)
*   **Panel Container:** `aether-panel` (defined in globals.css).
*   **Backgrounds:** `bg-[#050505]` (App), `bg-gray-800/50` (Cards), `bg-gray-900/50` (Inputs).
*   **Borders:** `border-gray-700/50` (Subtle), `border-cyan-500/50` (Active/Focus).
*   **Text:** `text-gray-200` (Primary), `text-gray-400` (Secondary), `text-gray-500` (Muted).
*   **Accents:**
    *   **Cyan:** Info/Connectivity.
    *   **Fuchsia:** AI/Generative.
    *   **Emerald:** Success/Stability.
    *   **Amber:** Warning/Processing.
    *   **Red:** Error/Critical.

## 3. Data Persistence Strategy
*   **Light Config:** Use `usePersistedState('key', default)` (localStorage).
*   **Heavy Data (Files/Logs):** Use `useAsyncState('key', default, dbService.STORES.KEY_VALUE)` (IndexedDB).

## 4. API & AI Calls
*   **Never** call `GoogleGenAI` directly in UI components.
*   **Always** use `services/geminiService.ts`:
    *   `generateRawText(prompt, model)` for generic tasks.
    *   `performShunt(...)` for structured transformations.
*   **Always** wrap calls in `try/catch` and use `parseApiError(e)` for user feedback.

## 5. Audio Feedback
*   Trigger sound effects for interactions:
    ```ts
    import { audioService } from '../../services/audioService';
    // ...
    audioService.playSound('click'); // Button press
    audioService.playSound('success'); // Task complete
    audioService.playSound('error'); // Failure
    ```
