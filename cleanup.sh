#!/bin/bash
echo "Initiating System Purge: Removing Legacy & Debris..."

# 1. Remove Ruby/Rails Artifacts
rm -rf app
rm -rf db
rm -rf config
rm -f Gemfile
rm -f Gemfile.lock

# 2. Remove Next.js / Legacy Src Architecture
rm -rf src
rm -f next.config.ts
rm -f tailwind.config.ts
rm -f next-env.d.ts

# 3. Remove Duplicate/Legacy Feature Folders & Files
rm -rf features
rm -f components/mia/MiaServices.tsx
rm -f components/mia/untitled.tsx
rm -f components/trim_agent/TrimAgent.tsx
rm -f components/orchestrator/NodeDetailsPanel.tsx
rm -f components/orchestrator/CustomOrchestratorNode.tsx
rm -f components/oraculum/EventLog.tsx
rm -f services/chat.types.ts
rm -f services/apiUtils.ts
rm -f hooks/useUndoRedo.ts
rm -f hooks/useTabUndoRedo.ts
rm -f context/UndoRedoContext.tsx
rm -f context/AutonomousContext.tsx
rm -f services/nodes/UIEventNode.tsx
rm -f services/nodes/AudioSourceNode.tsx
rm -f services/nodes/AudioOutputNode.tsx

echo "System Purge Complete. Architecture Normalized to Vite/React."
