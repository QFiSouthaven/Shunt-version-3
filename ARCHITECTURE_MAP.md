# System Architecture Map

## 1. Data Layer (`services/db.ts`)
Aether Shunt uses a custom wrapper around IndexedDB (`idb`) to handle storage limits that `localStorage` cannot meet.
*   **Stores:**
    *   `KEY_VALUE`: General state, chat history, Weaver memory.
    *   `FILES`: Large file content uploaded by the user.
    *   `VECTORS`: (Experimental) Embeddings for RAG.

## 2. Intelligence Layer (`services/geminiService.ts`)
The central brain that routes requests.
*   **Router:** Determines whether to use Google Cloud or a Local LLM based on `SettingsContext`.
*   **Adapters:**
    *   `GoogleGenAI`: Official SDK for Gemini.
    *   `localLlmService`: Fetch wrapper for OpenAI-compatible endpoints (LM Studio, Ollama).
*   **Capabilities:** Supports Text, Vision, and Structured JSON modes.

## 3. Agent Simulation Layer (`services/toolApi.ts`)
A self-contained "Sandbox" for the `Foundry` and `ToolForAI` modules.
*   **Mock File System:** An in-memory object `mockFileSystem` simulating a directory tree.
*   **Mock VCS:** Simulates Git operations (stage, commit, branch) for agent workflows.
*   **Permissions:** Agents must request permissions (`filesystem:write`, `vcs:commit`) before tools execute.

## 4. Event Bus (`lib/eventBus.ts`)
A lightweight Pub/Sub system to decouple modules.
*   **`mia-alert`**: Triggered by `errorLogger` or system events. Mia listens to this to offer help.
*   **`telemetry`**: All actions emit events here. The `Oraculum` module consumes this stream to visualize data.

## 5. Component Tree Highlights
*   `App.tsx` -> `AppProviders` -> `MissionControl` (The OS Shell)
    *   `MissionControl` manages the "Tabs" (Apps).
    *   `MiaAssistant` floats above the shell as a global helper.
    *   `Dashboard` is the default landing view.
