
# Optimization 2: React 19 Deep Integration & Compiler Adoption

## Strategic Recommendations (Weaver Protocol)
- [ ] **Adopt React Compiler (React Forget)**:
    - Eliminate the need for manual `useMemo` and `useCallback` hooks.
    - **Target Modules:** `Orchestrator` (Graph rendering), `Ecosystem` (Node logic).
- [ ] **Implement `use()` API for Data Layer**:
    - Replace `useEffect` state hydration patterns with `Suspense` + `use(Promise)`.
    - **Target Modules:** `Weaver` (Project Memory), `Dashboard` (Widget Resources).
- [ ] **Enhance Conversational Latency**:
    - Implement `useOptimistic` to render user messages immediately before the LLM confirms receipt.
    - **Target Module:** `Chat`.

## Implementation Tasks
- [x] **Compiler Integration**:
    - Install `babel-plugin-react-compiler`.
    - Configure `vite.config.ts` to enable the compiler pipeline.
- [x] **Orchestrator Refactor**:
    - Audit `WorkflowCanvas.tsx`. Remove manual `useCallback` on node event handlers (e.g., `onConnect`, `onNodeClick`) to test compiler efficacy.
- [x] **Chat Module - Optimistic UI**:
    - Refactor `Chat.tsx` state to use `useOptimistic`.
    - Ensure the UI updates instantly upon "Send", reverting only if the async dispatch fails.
- [x] **Weaver Data Fetching**:
    - Refactor `useWeaver.ts` to expose a Promise resource for Project Memory.
    - Update `Weaver.tsx` to consume this resource via `use()`.
- [x] **Native Metadata**:
    - Update `Documentation.tsx` to inject `<title>` and `<meta>` tags directly via React 19 primitives (if applicable to current routing setup).

## Verification & Maintenance
- [ ] **Graph Stability**: Verify `reactflow` nodes do not re-render unnecessarily after removing `useMemo` (relying on Compiler).
- [ ] **Suspense Boundaries**: Ensure `Loading...` states in `Dashboard` widgets handle the new `use()` API promises gracefully without cascading layout shifts.

**Log:**
- [x] Analysis Report Received.
- [x] Phase 2 Initiated.
- [x] Compiler and Vite Config Updated.
- [x] Orchestrator hooks cleaned up.
- [x] Chat optimistic UI implemented.
- [x] Weaver converted to `use()` API with Suspense.
- [x] Documentation metadata added.