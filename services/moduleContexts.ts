
// services/moduleContexts.ts
import { MissionControlTabKey } from '../types';

export const getModuleContext = (tab: MissionControlTabKey): string => {
    switch (tab) {
        case 'shunt':
            return `
**Module:** Shunt
**Purpose:** Text transformation engine and prompt engineering lab.
**Key Components:**
- InputPanel: Handles raw text input, file uploads (drag & drop), and priority settings.
- ControlPanel: Contains the "Shunt Actions" buttons (Summarize, Amplify, etc.) and the "Modular Engine" toggles.
- OutputPanel: Displays the AI response with markdown rendering, copy-to-clipboard, and "Evolve" feature.
- BulletinBoardPanel: A side panel for attaching reference documents to the context.
- PromptLifecyclePanel: Visualizes the history/chain of prompt iterations.
**Key Services:**
- geminiService.performShunt: Main API call.
- geminiService.executeModularPrompt: For stacked modules.
- useShunt: Main hook managing state (history, inputs, loading).
`;
        case 'weaver':
            return `
**Module:** Weaver
**Purpose:** Strategic development planning and documentation memory.
**Key Components:**
- MemoryPanel: A tabbed interface for editing long-term project context (Gemini Context, Decisions, Progress Log).
- PlanDisplay: Renders the structured JSON plan (tasks, questions, architecture) from the AI.
- Weaver.tsx: Manages the "Goal" input and triggers plan generation.
**Key Services:**
- geminiService.generateDevelopmentPlan: Returns structured JSON.
- Persistence: Saves 'weaver-project-memory' to localStorage/IndexedDB.
`;
        case 'foundry':
            return `
**Module:** Foundry
**Purpose:** Multi-Agent System (MAS) simulation for auditing, designing, and merging code.
**Key Components:**
- AgentCard: Displays status of individual agents (Architect, Security, QA, etc.).
- LiveLog: Real-time stream of agent activities and phases.
- ProjectContextPanel: For uploading file contexts.
- MergeView: Interface for "Seamless Merge" of two codebases.
- LaunchView: Interface for generating deployment kits (Dockerfiles, etc.).
**Key Services:**
- geminiService.generateRawText: Used by agents for individual tasks.
- geminiService.generateSeamlessMerge: Specialized "Thinking" model call for merging.
`;
        case 'tool_for_ai':
            return `
**Module:** Tool for AI (Jobs)
**Purpose:** Asynchronous job runner for complex tasks using a simulated tool-use environment.
**Key Components:**
- JobList: History of submitted jobs.
- JobDetails: Detailed view of logs and results for a selected job.
- ToolforAI.tsx: Input prompt for new jobs.
**Key Services:**
- useJobManager: Manages the job queue and execution loop.
- toolApi.ts: Mock tool registry (read_file, write_file, git.*) and file system simulation.
`;
        case 'chat':
            return `
**Module:** Chat
**Purpose:** General-purpose conversational interface with "Thinking" model support.
**Key Components:**
- ChatMessage: Renders user/AI messages, supports code blocks and execution.
- ChatInput: Text area for sending messages.
**Key Services:**
- geminiService: Uses stateful chat sessions.
- codeExecutor: WebWorker/Pyodide integration for running code snippets.
`;
        case 'oraculum':
            return `
**Module:** Oraculum
**Purpose:** Telemetry dashboard and insight generator.
**Key Components:**
- KPIDashboard: Displays metrics (tokens, errors, events).
- TelemetryFeed: Live stream of system events.
- Oraculum.tsx: Generates "Insights" using Gemini based on the event log.
**Key Services:**
- appEventBus: Pub/sub system for receiving telemetry.
- geminiService.generateOraculumInsights: Analyzes raw event JSON.
`;
        case 'dashboard':
            return `
**Module:** Dashboard
**Purpose:** The landing page and central hub.
**Key Components:**
- Vitals Grid: System status, neural load, subscription, mailbox count.
- Launch Modules: Grid of buttons to navigate to other tabs.
- Recent Activity: List of recently accessed files/actions.
`;
        case 'deploy':
            return `
**Module:** Deploy
**Purpose:** Deployment management and environment monitoring dashboard.
**Key Components:**
- Deploy.tsx: Main dashboard view.
- EnvironmentCard: Displays status (Dev, Staging, Prod) and handles deployment triggers.
- DeploymentHistory: Log of past deployment actions.
**Key Services:**
- SubscriptionContext: Enforces tier limits on deployment targets.
`;
        case 'ui_builder':
            return `
**Module:** UI Builder
**Purpose:** AI-powered React component generator.
**Key Components:**
- UIBuilder.tsx: Interface for prompting and previewing components.
- PreviewPanel: Isolated renderer for generated code.
**Key Services:**
- geminiService: Generates JSX/TSX code via prompts.
`;
        case 'orchestrator':
            return `
**Module:** Orchestrator
**Purpose:** Node-based workflow editor for chaining AI tasks.
**Key Components:**
- Orchestrator.tsx: React Flow canvas wrapper.
- CustomOrchestratorNode.tsx: Specialized node component with input/output handles.
- NodeDetailsPanel: Side panel for configuring selected nodes.
**Key Services:**
- ReactFlow: Library for graph state management.
`;
        case 'image_analysis':
            return `
**Module:** Image Analysis
**Purpose:** Multimodal analysis tool for images.
**Key Components:**
- ImageAnalysis.tsx: Drag-and-drop zone and result display.
- FileUpload: Handles image selection.
**Key Services:**
- geminiService.analyzeImage: Sends image bytes + prompt to Gemini Vision model.
`;
        case 'terminal':
            return `
**Module:** Terminal
**Purpose:** In-browser command line interface for simulated file system operations.
**Key Components:**
- Terminal.tsx: Window management and tab handling.
- TerminalSession.tsx: Command input loop and history display.
**Key Services:**
- terminalUtils.ts: Mock file system and command processors (ls, cd, cat).
`;
        case 'chronicle':
            return `
**Module:** Chronicle
**Purpose:** History viewer for version-controlled content (Weaver memory, saved chats, code snapshots).
**Key Components:**
- Chronicle.tsx: Master-detail view of version history.
- VersionHistoryPanel.tsx: List of versions.
- DiffViewer.tsx: Visual diffing tool for code versions.
**Key Services:**
- VersionControlService: Retrieves version history from storage.
`;
        case 'documentation':
            return `
**Module:** Documentation
**Purpose:** Project documentation generator and RAG-lite knowledge base.
**Key Components:**
- Documentation.tsx: File upload staging area and action buttons.
- etlService.ts: Client-side pipeline for chunking and embedding documents.
**Key Services:**
- geminiService.generateProjectTome: Large context generation.
`;
        case 'settings':
            return `
**Module:** Settings
**Purpose:** Global application configuration and integrations.
**Key Components:**
- Settings.tsx: Form controls for API keys, theme preferences, and feature flags.
**Key Services:**
- SettingsContext: Persists preferences.
- MCPContext: Manages connection to local extensions.
`;
        case 'agent_builder':
            return `
**Module:** Agent Builder
**Purpose:** Self-reflective workspace for the AI/User to plan app evolution.
**Key Components:**
- AgentBuilder.tsx: Three-pane layout (Scratchpad, Roadmap, Sandbox).
**Key Services:**
- LocalStorage: Persists notes and roadmap state.
`;
        case 'developers':
            return `
**Module:** Developers
**Purpose:** Advanced graph-based logic editor (experimental).
**Key Components:**
- Developers.tsx: React Flow canvas.
- DiffViewer.tsx: Used for comparing graph states.
`;
        case 'subscription':
            return `
**Module:** Subscription
**Purpose:** Management of user tiers and feature locking.
**Key Components:**
- Subscription.tsx: Dashboard of usage stats.
- TierCard.tsx: Display of available plans.
**Key Services:**
- SubscriptionContext: Logic for incrementing usage and checking limits.
`;
        default:
            return `
**Module:** ${tab}
**Purpose:** A specialized component of the Aether Shunt OS.
**Context:** Standard Aether architecture using React, Tailwind, and Gemini services.
`;
    }
};
