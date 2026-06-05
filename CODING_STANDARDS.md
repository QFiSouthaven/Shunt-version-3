# Coding Standards & Patterns
> **Developer Note:** strict rules for generating Aether Shunt code.

## 1. React & TypeScript
*   **Components:** Functional components with Hooks. Use `React.FC<Props>`.
*   **Imports:** Group imports: React -> Contexts -> Components -> Icons -> Services/Types.
*   **Strict Mode:** No `any`. Use defined types from `types/index.ts`.

## 2. State Management Strategy
*   **Session/UI State:** Use `React.useState` or `React.useContext`.
*   **Persistent Configuration:** Use `usePersistedState('key', default)` (wraps localStorage).
*   **Heavy Data (Files, History):** Use `useAsyncState('key', default, dbService.STORES.STORE_NAME)` (wraps IndexedDB).
    *   *Example:* `const [history, setHistory] = useAsyncState<HistoryEntry[]>('chat_history', [], dbService.STORES.KEY_VALUE);`

## 3. AI Service Integration
*   **Do NOT** call `GoogleGenAI` directly in UI components.
*   **USE** `services/geminiService.ts`:
    *   `performShunt(...)`: For text transformation tasks.
    *   `generateRawText(...)`: For generic prompts (handles local/cloud routing).
    *   `generateDevelopmentPlan(...)`: For structured JSON output.

## 4. UI/UX Patterns (Tailwind)
*   **Containers:** Use `.aether-panel` utility class for main cards/panels.
*   **Buttons:** Use `.aether-btn` or `.aether-btn-primary`.
*   **Icons:** Use `components/icons.tsx`. Do NOT import new icons from lucide-react unless necessary.
*   **Animations:** Use `animate-fade-in` for entering elements.

## 5. Error Handling
*   **Catch Blocks:** Always wrap async operations in try/catch.
*   **Logging:** Use `logFrontendError(error, ErrorSeverity.High, context)` from `utils/errorLogger`.
*   **User Feedback:** Use `audioService.playSound('error')` and display a friendly message.
