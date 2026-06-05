# AI Context & Knowledge Base
> **Developer Note:** Keep this file open in a pinned tab. It provides the "Soul" and "Domain Knowledge" for Gemini Code Assist.

## 1. Project Identity: Aether Shunt OS
*   **Type:** Local-First Cognitive Operating System.
*   **Version:** 3.0.0 (Alpha).
*   **Core Philosophy:** Privacy-centric, Model-Agnostic, "Obsidian Glass" Aesthetics.
*   **Primary User:** Power User / Developer / Prompt Engineer.

## 2. Domain Glossary (The "Cognitive Modules")
*   **Shunt:** The text transformation engine. Takes raw input -> applies AI action -> returns structured output.
*   **Weaver:** Strategic planning module. Maintains persistent project memory and generates JSON-based dev plans.
*   **Foundry:** A Multi-Agent System (MAS) simulator where agents (Strategist, Architect, Engineer) debate solutions.
*   **Mia:** The system-wide AI assistant and error diagnostician. Uses `gemini-2.5-flash` for quick chat and `gemini-2.5-pro` for deep analysis.
*   **Oraculum:** Telemetry dashboard. Tracks token usage and system events locally.
*   **Chronicle:** Version control history for generated content (Time Machine).
*   **Tool for AI (Jobs):** Asynchronous task runner for complex, multi-step LLM operations using a mock file system.

## 3. Key Technical Constraints
1.  **Local-First:** All heavy data (files, chat history) MUST be stored in IndexedDB via `dbService`. Light settings go to `localStorage`.
2.  **Client-Side Only:** There is no backend server. All logic runs in the browser.
3.  **Model Agnostic:** The app supports both Google Gemini (Cloud) and Local LLMs (via LM Studio/Ollama). Code must handle both paths.
4.  **Mock Filesystem:** We use `toolApi.ts` to simulate file operations (read/write/git) for agents.

## 4. Visual Identity: "Obsidian Glass"
*   **Background:** Deepest black (`#030304`).
*   **Panels:** Translucent Zinc (`bg-gray-800/50` with `backdrop-blur`).
*   **Accents:**
    *   **Cyan:** Connectivity / System.
    *   **Fuchsia:** AI / Generative Magic.
    *   **Emerald:** Success / Stable.
    *   **Amber:** Warning / Processing.
