# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server at http://localhost:3000
npm run build      # tsc type-check + vite build
npm run preview    # Preview production build
npm run lint       # ESLint
```

There is no test suite configured. `npm run build` runs `tsc` first, so it doubles as the type-check gate.

Requires a `.env` file with `API_KEY=<google_gemini_api_key>` — injected at build time via `define` in `vite.config.ts` as `process.env.API_KEY`. The dev server proxies `/v1/*` → LM Studio (localhost:1234) and `/api/*` → Ollama (localhost:11434) for local LLM support.

Path aliases (vite.config.ts): `@services`, `@types`, `@utils`.

## What This Is

Aether Shunt OS v3 — a local-first, client-side-only "Cognitive OS" SPA for prompt engineering and multi-agent simulation. React 19 + TypeScript + Vite + Tailwind. **There is no backend server**; all logic runs in the browser and all data persists client-side.

Detailed docs exist in the repo root: `ARCHITECTURE_MAP.md` (layer breakdown), `AI_CONTEXT.md` (domain glossary), `CODING_STANDARDS.md` / `CODING_PATTERNS.md` (component templates and rules), `PROJECT_SCOPE.md`, `HANDOFF_README.md` (current sprint status).

## Architecture

### Shell and navigation — no router
`index.tsx` → `App.tsx` → `AppProviders` (context stack) → `LandingPage` gate → `MissionControl` (the OS shell). Navigation is **state-based tab switching**, not a router: `MODULE_REGISTRY` in `components/mission_control/tabsConfig.tsx` defines 30+ modules (each a folder under `components/`), all lazy-loaded via `React.lazy()` + Suspense. The active tab lives in `SystemContext` (reducer, `SET_ACTIVE_TAB`), mirrored to `?tab=<key>` URL params, switched with React 19 `useTransition`. To add a module: create a folder under `components/`, register it in `MODULE_REGISTRY`, add its key to `MissionControlTabKey` in `types/`.

### Context stack (AppProviders order matters)
Settings → Auth (mock OAuth) → Telemetry → MCP (browser-extension Model Context Protocol bridge, mock fallback) → Mailbox (AI-generated files) → Mia (global AI assistant / error diagnostician) → Subscription (tier quotas) → System (active tab, shunt I/O, "neural bus").

### Intelligence layer — never call the SDK from UI
UI components must not instantiate `GoogleGenAI` directly. The flow is:

- `services/geminiService.ts` — core executor (`executeAIRequest`), streaming (`performShuntStream`), vision, function-calling. Models: `gemini-3-pro-preview` (complex tasks), `gemini-3-flash-preview` (fast/classification).
- `services/IntelligenceRouter.ts` — dispatches to Gemini, local LLM (`localLlmService.ts`, OpenAI-compatible), or Cloudflare AI based on Settings. Code must handle both cloud and local paths.
- `services/shunt.service.ts` — main entry for Shunt actions; streams chunks over the event bus with AbortController cancellation.
- `services/toolApi.ts` — singleton `toolRegistry`; tools (read_file, write_file, execute_shell, code_execution) are passed to Gemini as `functionDeclarations` and described in-prompt for local LLMs. File ops run against a **mock in-browser filesystem** (sandbox for agents), not the real disk.
- `services/prompts.ts` — `ShuntAction` enum → prompt template mapping.

Agent orchestration: `agentFactory.ts` builds agents from validated manifests; `workflowEngine.ts` executes DAG workflows (ReactFlow canvases in `orchestrator/`, `ecosystem/`); `CortexService.ts` runs the knowledge pipeline. Services are plain singletons imported where needed.

### Persistence — two tiers, strictly separated
- **localStorage** via `usePersistedState(key, default)` — light config only (settings, auth session, Mia chat, mailbox). Cloudflare API tokens are encrypted (`utils/crypto.ts`) before storage.
- **IndexedDB** via `useAsyncState(key, default, dbService.STORES.X)` backed by `services/db.ts` (`AetherShuntDB`, stores: key_value, files, vectors, evolution, jobs, todos) — anything heavy: files, history, embeddings, job logs.

### Cross-module communication
`lib/eventBus.ts` exports the typed singleton `appEventBus` (events: `mia-alert`, `telemetry`, `trigger_shunt_action`, `inject_chat_message`, ...). Modules are decoupled through it — Oraculum consumes the telemetry stream, Mia listens for alerts. Prefer the bus over prop drilling for cross-tab effects.

## Conventions (from CODING_STANDARDS.md / CODING_PATTERNS.md)

- Functional components, `React.FC<Props>`, no `any`; types live in `types/index.ts`. Zod schemas in `lib/validations/`.
- Import grouping: React → Contexts → Components → Icons → Services/Types.
- Styling: dark "Obsidian Glass" theme. Use `.aether-panel` for cards, `.aether-btn` / `.aether-btn-primary` for buttons, `animate-fade-in` for entrances. Accents: cyan = system/connectivity, fuchsia = AI/generative, emerald = success, amber = warning, red = error.
- Icons come from `components/icons.tsx` — avoid importing new lucide-react icons unless necessary.
- Error handling: wrap async in try/catch, log via `logFrontendError(error, ErrorSeverity.X, context)` from `utils/errorLogger`, parse API errors with `parseApiError(e)`.
- Audio feedback on interactions via `audioService.playSound('click' | 'success' | 'error')`.

Note: `AI_CONTEXT.md` references `gemini-2.5-*` models, but the code currently uses `gemini-3-*-preview` — trust the code in `services/geminiService.ts`.
