
import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  ReactFlowProvider,
  NodeTypes
} from 'reactflow';
import { PlayIcon, UndoIcon, SignalIcon, LockIcon } from '../icons';

import AgentNode from './AgentNode';
import { initialNodes, initialEdges } from './initialMap';
import { AgentStatus, AgentTier } from './types';
import TabFooter from '../common/TabFooter';
import { appEventBus } from '../../lib/eventBus';
import { InteractionEvent } from '../../types/telemetry';

const nodeTypes: NodeTypes = { agent: AgentNode };

const TAB_TO_NODE_MAP: Record<string, string[]> = {
    'shunt': ['sales', 'cs'],
    'chat': ['cs', 'complaint'],
    'weaver': ['cto', 'vp'],
    'agent_builder': ['architect'],
    'foundry': ['artist', 'librarian', 'artificer'],
    'image_analysis': ['artist'],
    'oraculum': ['ds', 'pm'],
    'chronicle': ['quartermaster'],
    'tool_for_ai': ['devops'],
    'deploy': ['release', 'qa'],
    'documentation': ['librarian'],
    'settings': ['vp'],
    'subscription': ['pm'],
};

const EcosystemMap = () => {
  // UNLOCKED: System is live.
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 49)]);
  }, []);

  const updateNodeStatus = useCallback((id: string, status: AgentStatus, task: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              status,
              currentTask: task,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // --- Telemetry Integration ---
  useEffect(() => {
      const handleTelemetry = (payload: { type: string, data: Record<string, any> }) => {
          if (payload.type === 'interaction_event') {
              const event = payload.data as InteractionEvent;
              const targetNodes = TAB_TO_NODE_MAP[event.tab] || ['pm']; // Default to PM
              
              targetNodes.forEach(nodeId => {
                  updateNodeStatus(nodeId, AgentStatus.PROCESSING, `Processing ${event.eventType} from ${event.tab}`);
                  
                  // Auto-reset after a delay
                  setTimeout(() => {
                      updateNodeStatus(nodeId, AgentStatus.IDLE, 'Awaiting signal...');
                  }, 2000);
              });

              // Add a log entry if it's a significant event
              if (event.outcome === 'success') {
                  addLog(`${targetNodes.join(', ').toUpperCase()} acknowledged event: ${event.interactionType || 'User Action'}`);
              }
          }
      };

      const unsubscribe = appEventBus.on('telemetry', handleTelemetry);
      return () => unsubscribe();
  }, [updateNodeStatus, addLog]);


  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // The "Zero-Touch E2E Pipeline" Logic
  const runSimulation = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs([]);
    
    // Reset all nodes
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, status: AgentStatus.IDLE, currentTask: '' } })));

    try {
      // 1. INGESTION LAYER
      addLog(">>> INITIALIZING PIPELINE...");
      await processNode('sales', "Ingesting market signal: 'Cyberpunk Aesthetic Request'", 1500);
      await processNode('complaint', "Analyzing sentiment polarity...", 1000);
      
      // 2. OPERATIONAL LAYER
      await processNode('pm', "Applying RICE Framework. Filtering noise...", 2000);
      addLog("PM: Feature Validated. Reach: 9/10, Impact: High.");
      
      // 3. GOVERNANCE LAYER
      await processNode('cto', "Checking tech radar & long-term viability...", 1500);
      await processNode('vp', "Allocating compute resources & assigning 'Asset Foundry' agents...", 1500);

      // 4. THE ASSET FOUNDRY (ORCHESTRATION)
      await processNode('architect', "Parsing brief. Generating Asset Manifest...", 2000);
      addLog("ARCHITECT: Dispatching parallel sub-routines.");

      // Parallel Execution
      const foundryPromises = [
        processNode('quartermaster', "Creating taxonomical path structure...", 2500),
        processNode('artist', "Generating PBR Texture Set (Diffuse, Normal, Spec)...", 4000),
        processNode('librarian', "Generating .vam/.vmi metadata schemas...", 3000),
        processNode('artificer', "Wrapping Unity build pipeline for binary generation...", 3500)
      ];
      
      // Simulate DevOps monitoring concurrently
      updateNodeStatus('devops', AgentStatus.PROCESSING, "Monitoring runtime stability...");
      await Promise.all(foundryPromises);
      updateNodeStatus('devops', AgentStatus.SUCCESS, "Runtime stable. No incidents.");

      // 5. VALIDATION LAYER
      await processNode('qa', "Validating schema against Path Map...", 2000);
      await processNode('hacker', "Red Teaming: Penetration testing asset binaries...", 2000);

      // 6. RELEASE
      await processNode('release', "Deploying package to Global CDN.", 1500);
      addLog(">>> PIPELINE COMPLETE. PRODUCT LIVE.");

    } catch (error) {
      addLog(`ERROR: Pipeline halted. ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const processNode = async (id: string, task: string, duration: number) => {
    updateNodeStatus(id, AgentStatus.PROCESSING, task);
    addLog(`[${id.toUpperCase()}] Started: ${task}`);
    await sleep(duration);
    updateNodeStatus(id, AgentStatus.SUCCESS, "Task Completed.");
    addLog(`[${id.toUpperCase()}] Finished.`);
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white font-sans">
      {/* Control Bar */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-900/50 p-4">
        <div className="flex items-center gap-3">
          <SignalIcon className="text-blue-400 w-5 h-5" />
          <h1 className="text-xl font-bold tracking-tight">Corporate Agent Ecosystem <span className="text-gray-500 text-sm font-normal">| Live Neural Link</span></h1>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={runSimulation}
            disabled={isRunning}
            className={`flex items-center gap-2 rounded px-6 py-2 font-bold transition-all ${
              isRunning 
              ? 'bg-gray-600 cursor-not-allowed opacity-50' 
              : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20'
            }`}
          >
            <PlayIcon className="w-4 h-4" />
            {isRunning ? 'PIPELINE ACTIVE...' : 'RUN SIMULATION'}
          </button>
          <button 
            onClick={() => setNodes(initialNodes)}
            className="rounded bg-gray-700 px-4 py-2 hover:bg-gray-600"
          >
            <UndoIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* React Flow Canvas */}
        <div className="flex-1 bg-[#09090b]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.5}
            maxZoom={1.5}
            defaultEdgeOptions={{ type: 'smoothstep', style: { strokeWidth: 2, stroke: '#475569' } }}
          >
            <Background color="#334155" gap={24} size={1} />
            <Controls className="bg-gray-800 border-gray-700 fill-white text-white" />
          </ReactFlow>
        </div>

        {/* Live Logs Console */}
        <div className="w-96 border-l border-gray-700 bg-gray-900/80 flex flex-col backdrop-blur-md">
          <div className="p-3 border-b border-gray-700 font-bold text-gray-400 text-sm uppercase">Live System Logs</div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2">
            {logs.length === 0 && <div className="text-gray-500 italic">Listening for system events...</div>}
            {logs.map((log, i) => (
              <div key={i} className="border-l-2 border-blue-500 pl-2 text-gray-300 animate-fade-in">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
      <TabFooter />
    </div>
  );
};

export default function Ecosystem() {
  return (
    <ReactFlowProvider>
      <EcosystemMap />
    </ReactFlowProvider>
  );
}
