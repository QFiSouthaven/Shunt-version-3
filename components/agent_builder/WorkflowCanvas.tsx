
// components/agent_builder/WorkflowCanvas.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  NodeTypes,
  MarkerType
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { WorkflowNode, WorkflowNodeData, ExecutionLog, NodeType } from '../../types/workflow';
import { 
    PlayIcon, GlobeAltIcon, BrainIcon, BoltIcon, BookIcon, 
    CheckCircleIcon, CodeIcon, ServerStackIcon, DocumentIcon, 
    DeviceFloppyIcon, XMarkIcon, ChevronRightIcon, TerminalIcon,
    TrashIcon, BranchingIcon, UserIcon
} from '../icons';
import { orchestratorService } from '../../services/orchestrator.service';
import { appEventBus } from '../../lib/eventBus';
import NodeConfigPanel from './NodeConfigPanel';
import Loader from '../Loader';

// Specialized Nodes
import LLMNode from '../orchestrator/nodes/LLMNode';
import FileNode from '../orchestrator/nodes/FileNode';
import LogicNode from '../orchestrator/nodes/LogicNode';
import AgentSelectorNode from '../orchestrator/nodes/AgentSelectorNode';

const nodeTypes: NodeTypes = {
  flow_info: LLMNode,
  flow_start: LLMNode, 
  flow_end: LLMNode,
  web_scraping: LLMNode, 
  llm_instruction: LLMNode, 
  api_call: LLMNode,
  read_file: FileNode, 
  write_file: FileNode,
  conditional: LogicNode,
  agent_exec: AgentSelectorNode
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { strokeWidth: 2, stroke: '#3b82f6' },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#3b82f6',
  },
};

const WorkflowCanvas: React.FC = () => {
  const initialState = orchestratorService.getState();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialState.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialState.edges);
  const [isRunning, setIsRunning] = useState(initialState.isRunning);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  useEffect(() => {
      const handleUpdate = (payload: { type: string, data: any }) => {
          if (payload.type === 'orchestrator_update') {
              setNodes(payload.data.nodes);
              setEdges(payload.data.edges);
              setIsRunning(payload.data.isRunning);
          }
          if (payload.type === 'orchestrator_log') {
              setLogs(prev => [payload.data, ...prev].slice(0, 50));
          }
      };
      const unsubscribe = appEventBus.on('telemetry', handleUpdate);
      return () => unsubscribe();
  }, [setNodes, setEdges]);

  useEffect(() => {
      if (!isRunning) {
          orchestratorService.saveGraph(nodes, edges);
      }
  }, [nodes, edges, isRunning]);

  const onConnect = (params: Connection) => setEdges((eds) => addEdge(params, eds));

  const onNodeClick = (_: React.MouseEvent, node: WorkflowNode) => {
    setSelectedNode(node);
  };

  // Added: Implementation of updateNodeData to handle data changes from NodeConfigPanel
  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: newData,
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const addNode = (type: NodeType, label: string) => {
    const newNode: WorkflowNode = {
      id: uuidv4(),
      type,
      position: { x: 250, y: 250 },
      data: { 
          label, 
          type, 
          config: type === 'conditional' ? { conditionOperator: 'equals' } : {}, 
          status: 'idle' 
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div className="flex h-full relative bg-[#050505]">
      {/* Visual Workspace Sidebar */}
      <div className="w-16 flex-shrink-0 bg-[#0a0a0a] border-r border-gray-800 flex flex-col items-center py-6 gap-5 z-10 shadow-2xl">
        <button 
          onClick={() => addNode('flow_start', 'Genesis')} 
          title="Start Node"
          className="p-3 rounded-xl bg-gray-900 text-green-400 border border-gray-800 hover:border-green-500/50 hover:scale-110 transition-all shadow-lg active:scale-95"
        >
          <PlayIcon className="w-6 h-6" />
        </button>
        
        <div className="h-px w-8 bg-gray-800 my-1" />
        
        <button 
          onClick={() => addNode('web_scraping', 'Scraper')} 
          title="Scrape Web Content"
          className="p-3 rounded-xl bg-gray-900 text-orange-400 border border-gray-800 hover:border-orange-500/50 hover:scale-110 transition-all shadow-lg"
        >
          <GlobeAltIcon className="w-6 h-6" />
        </button>
        
        <button 
          onClick={() => addNode('llm_instruction', 'Intelligence')} 
          title="AI Logic Step"
          className="p-3 rounded-xl bg-gray-900 text-fuchsia-400 border border-gray-800 hover:border-fuchsia-500/50 hover:scale-110 transition-all shadow-lg"
        >
          <BrainIcon className="w-6 h-6" />
        </button>

        <button 
          onClick={() => addNode('agent_exec', 'Registry Agent')} 
          title="Execute Custom Agent"
          className="p-3 rounded-xl bg-gray-900 text-indigo-400 border border-gray-800 hover:border-indigo-500/50 hover:scale-110 transition-all shadow-lg"
        >
          <UserIcon className="w-6 h-6" />
        </button>

        <button 
          onClick={() => addNode('conditional', 'Logic Gate')} 
          title="Conditional Branch"
          className="p-3 rounded-xl bg-gray-900 text-amber-400 border border-gray-800 hover:border-amber-500/50 hover:scale-110 transition-all shadow-lg"
        >
          <BranchingIcon className="w-6 h-6" />
        </button>
        
        <div className="h-px w-8 bg-gray-800 my-1" />

        <button 
          onClick={() => addNode('read_file', 'Read Drive')} 
          title="Read File"
          className="p-3 rounded-xl bg-gray-900 text-emerald-400 border border-gray-800 hover:border-emerald-500/50 hover:scale-110 transition-all shadow-lg"
        >
          <DocumentIcon className="w-6 h-6" />
        </button>
        
        <button 
          onClick={() => addNode('write_file', 'Write Drive')} 
          title="Write File"
          className="p-3 rounded-xl bg-gray-900 text-cyan-400 border border-gray-800 hover:border-cyan-500/50 hover:scale-110 transition-all shadow-lg"
        >
          <DeviceFloppyIcon className="w-6 h-6" />
        </button>

        <div className="mt-auto flex flex-col gap-4">
          <button 
            onClick={() => addNode('flow_end', 'Terminal')} 
            title="End Flow"
            className="p-3 rounded-xl bg-gray-900 text-red-400 border border-gray-800 hover:border-red-500/50 hover:scale-110 transition-all shadow-lg"
          >
            <CheckCircleIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-grow h-full relative">
        {/* Floating Controls */}
        <div className="absolute top-6 left-6 z-10 flex gap-3 pointer-events-auto">
            <button
                onClick={() => orchestratorService.runWorkflow()}
                disabled={isRunning}
                className={`group flex items-center gap-3 px-8 py-3 rounded-full font-black tracking-widest uppercase text-xs shadow-[0_0_25px_rgba(0,0,0,0.5)] transition-all active:scale-95 border-2 ${
                  isRunning 
                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-wait' 
                    : 'bg-green-600 border-green-500 hover:bg-green-500 text-white hover:shadow-green-500/20'
                }`}
            >
                {isRunning ? <Loader className="w-4 h-4" /> : <PlayIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                {isRunning ? 'PIPELINE_ACTIVE' : 'IGNITE_PIPELINE'}
            </button>
            
            <button 
              onClick={() => { setNodes([]); setEdges([]); }}
              className="p-3 bg-gray-900 border border-gray-800 rounded-full text-gray-500 hover:text-red-400 hover:border-red-500/30 transition-all"
              title="Clear Canvas"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
        </div>

        <ReactFlow
            nodes={nodes} 
            edges={edges}
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange}
            onConnect={onConnect} 
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes} 
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            className="bg-[#050505]"
            snapToGrid
            snapGrid={[15, 15]}
        >
            <Background color="#111" gap={30} size={1.5} />
            <Controls className="bg-gray-900 border-gray-800 fill-white text-white" />
            <MiniMap 
                nodeColor={n => {
                    if (n.data.status === 'running') return '#d946ef';
                    if (n.data.status === 'completed') return '#22c55e';
                    return '#334155';
                }}
                maskColor="rgba(0,0,0,0.7)"
                className="bg-gray-900 border border-gray-800"
            />
        </ReactFlow>
      </div>

      {/* Config Panel - Animates from right */}
      {selectedNode && (
        <NodeConfigPanel 
          node={selectedNode} 
          onClose={() => setSelectedNode(null)} 
          onUpdate={updateNodeData} 
        />
      )}

      {/* Persistent Execution HUD */}
      <div className="absolute bottom-8 left-24 w-[28rem] max-h-80 bg-black/80 border border-gray-800 rounded-2xl shadow-2xl backdrop-blur-2xl flex flex-col z-20 overflow-hidden ring-1 ring-white/5">
        <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <TerminalIcon className="w-4 h-4 text-cyan-500" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Neural Pipeline Trace</span>
            </div>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
            </div>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-3 font-mono text-[10px] custom-scrollbar selection:bg-cyan-500/30">
            {logs.map((log, i) => (
                <div key={i} className={`flex flex-col gap-1 border-l-2 pl-3 py-1.5 transition-colors ${
                  log.status === 'error' ? 'border-red-500 bg-red-950/10' : 
                  log.status === 'running' ? 'border-blue-500 bg-blue-950/10' : 
                  'border-green-500 bg-green-950/5'
                }`}>
                    <div className="flex justify-between items-center">
                        <span className={`font-bold ${log.status === 'error' ? 'text-red-400' : 'text-gray-300'}`}>{log.nodeLabel}</span>
                        <span className="text-[9px] text-gray-600 italic">{log.timestamp}</span>
                    </div>
                    <div className={`break-words ${log.status === 'error' ? 'text-red-300' : 'text-gray-400'}`}>
                      {log.status.toUpperCase()}: {String(log.output || log.error || 'Initializing logic gates...') }
                    </div>
                </div>
            ))}
            {logs.length === 0 && (
              <div className="h-40 flex flex-col items-center justify-center text-center opacity-20 grayscale">
                <BoltIcon className="w-12 h-12 mb-4" />
                <p className="uppercase tracking-[0.3em] font-black">Awaiting System Ignition</p>
              </div>
            )}
        </div>
        <div className="px-4 py-2 bg-gray-900/80 border-t border-gray-800 text-[9px] flex justify-between text-gray-500">
           <span>LOG_STREAM_CONNECTED</span>
           <span>CPU_USAGE: 0.2%</span>
        </div>
      </div>
    </div>
  );
};

export default WorkflowCanvas;
