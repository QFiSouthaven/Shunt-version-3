# Aether Shunt OS: Project Scope & Architecture Definition

**Version:** 3.0.0
**Status:** Alpha / Active Development
**Classification:** Cognitive Operating System Interface

---

## 1. Executive Summary
**Aether Shunt** is a local-first, professional-grade interface designed for advanced AI interaction, system orchestration, and agentic development. Unlike standard chat interfaces, Shunt operates as an **Operating System (OS)** for cognitive tasks, providing specialized "Modules" (apps) for distinct workflows ranging from text transformation to multi-agent simulation.

It is built to be **model-agnostic** (supporting Google Gemini and Local LLMs via LM Studio/Ollama) and **privacy-centric** (storing data in IndexedDB/LocalStorage).

---

## 2. System Architecture

### 2.1 Core Stack
*   **Runtime:** React 19 (Single Page Application)
*   **Build System:** Vite + TypeScript
*   **Styling:** Tailwind CSS ("Obsidian Glass" Design System)
*   **State Management:** Hybrid approach using React Context for session state and `idb` (IndexedDB) for heavy persistence (chat history, vectors).

### 2.2 AI Services Layer
*   **Primary Intelligence:** Google Gemini API (`gemini-3-pro-preview`, `gemini-3-flash-preview`).
*   **Local Intelligence:** Adapter pattern for OpenAI-compatible endpoints (LM Studio, Ollama).
*   **Orchestration:** `geminiService.ts` handles routing, retries, and token counting.
*   **Tooling:** `toolApi.ts` provides a mock file system and Git simulation for AI agents.

### 2.3 Connectivity
*   **MCP (Model Context Protocol):** Experimental support for browser-based extensions to bridge the web app with the local host file system.
*   **Telemetry:** Internal `TelemetryService` allows for self-diagnosis and "Oraculum" insights without external tracking pixels.

---

## 3. Functional Modules

### 3.1 Workspace (Production Ready)
*   **Dashboard:** Central hub with system vitals, quick launch, and recent file access.
*   **Shunt:** The flagship text transformation engine. Features:
    *   **Atomic Actions:** Summarize, Amplify, Modernize Code, etc.
    *   **Modular Prompting:** Stacking prompt "modules" (e.g., Chain of Thought + Critic) for complex tasks.
    *   **Lifecycle Panel:** Tracks the evolution of a prompt through multiple iterations.
*   **Weaver:** Strategic planning module. Converts high-level goals into structured JSON development plans, maintaining a persistent "Project Memory".
*   **Chat:** Standard conversational interface supporting code execution via Pyodide/WebWorkers.

### 3.2 Laboratory (Experimental / Simulations)
*   **Foundry:** A Multi-Agent System (MAS) simulator implementing the "Cognitive Council" pattern. Agents (Strategist, Architect, Engineer) debate and converge on solutions.
*   **Image Analysis:** Multimodal vision analysis tool.
*   **System 2001:** Visual experiment replicating the HAL 9000 interface.
*   **Serendipity Engine:** Lateral thinking generator using a slot-machine mechanic to combine disparate concepts.

### 3.3 Operations (System Management)
*   **Oraculum:** Live telemetry feed and AI-driven insight generator for system performance.
*   **Chronicle:** Version control history viewer for all generated content (prompts, code, plans).
*   **Tool for AI (Jobs):** Asynchronous task runner allowing agents to perform multi-step jobs (e.g., "Refactor this directory").
*   **Deploy:** Simulated deployment dashboard managing environments (Dev, Staging, Prod) and tier limits.
*   **Documentation:** RAG-lite knowledge base generator that ingests project files to create documentation.

### 3.4 Suspended Modules (Under Construction)
The following modules have been visually integrated but are currently feature-flagged as **Locked/Under Construction** to conserve development resources:
*   **Orchestrator:** Node-based workflow editor for chaining prompts.
*   **UI Builder:** Generative React component designer.
*   **Developers:** Visual logic graph compiler.
*   **Ecosystem:** Corporate agent hierarchy visualization.

---

## 4. Security & Governance
*   **Input Sanitization:** Configurable stripping of HTML/Script tags.
*   **Prompt Injection Guard:** System-level wrapping of user inputs to prevent jailbreaks.
*   **Rate Limiting:** Client-side throttling to prevent API quota exhaustion.
*   **Local Storage:** User data never leaves the client unless explicitly sent to the AI model.

---

## 5. Roadmap & Future Scope
*   **v3.1:** Full integration of the **Orchestrator** to allow users to build custom "Shunt" pipelines visually.
*   **v3.2:** "Real" file system access via standardized File System Access API (beyond the current mock MCP).
*   **v4.0:** "Self-Hosting" capability where the Agent Builder can modify the OS source code directly.
