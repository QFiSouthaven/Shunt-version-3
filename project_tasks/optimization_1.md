
# Optimization 1: React 19 Architecture & Efficiency

## Strategic Recommendations (Weaver Protocol)
- [ ] **Refactor `geminiService.ts` Integration**:
    - Replace `useEffect` fetch chains with React 19 Actions (`useActionState`, `useOptimistic`).
    - **Target Modules:** `Shunt`, `Chat`.
- [ ] **Audit `reactflow` Compatibility**:
    - Verify `reactflow` (used in `Orchestrator` and `Ecosystem`) is fully compatible with React 19 concurrent rendering.
    - Check for strict mode double-invocation issues with nodes.
- [ ] **Enable React Compiler**:
    - Configure the build pipeline (Vite/Babel) to use the React Compiler.
    - Remove manual `useMemo` and `useCallback` hooks in `MissionControl` and heavy visualization components.

## Implementation Tasks
- [x] **Shunt Module - Optimistic UI**:
    - Refactor `InputPanel.tsx` to use `useOptimistic` for instant user feedback upon prompt submission.
    - Implement `useTransition` for priority toggling.
- [x] **Mission Control - Non-Blocking Navigation**:
    - Wrap tab switching logic in `useTransition` to prevent UI freezing when loading heavy modules like `Foundry` or `System 2001`.
- [x] **App Forge - Server Actions**:
    - Convert the App Creation form to use `useActionState` for streamlined error handling and loading states.
- [ ] **Data Fetching**:
    - Refactor `Dashboard` widgets to use the `use()` API for suspending resource loading.

## Verification & Maintenance
- [ ] **Dependency Audit**: Verify all `package.json` dependencies (especially `lucide-react`, `framer-motion`) have React 19 peer support.
- [ ] **Type Safety**: Ensure `types/react` and `types/react-dom` are updated to match the React 19 RC/Canary version.

**Log:**
- Initiated Optimization Phase 1.
- Implemented `useTransition` in `MissionControl` and `useShunt`.
- Verified `AppForge` uses `useActionState`.
- Pending: `Dashboard` `use()` API refactor.
