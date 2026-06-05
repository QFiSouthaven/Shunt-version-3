
import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  MiniMap
} from 'reactflow';
import { BoltIcon, ShieldCheckIcon, PlayIcon, XMarkIcon, ServerStackIcon } from '../icons';
import TabFooter from '../common/TabFooter';
import AudioSourceNode from './nodes/AudioSourceNode';
import UIEventNode from './nodes/UIEventNode';
import AudioOutputNode from './nodes/AudioOutputNode';
import RhythmClickNode from './nodes/RhythmClickNode';
import { audioService } from '../../services/audioService';

// Register custom node types
const nodeTypes = {
  audioSource: AudioSourceNode,
  uiEvent: UIEventNode,
  audioOutput: AudioOutputNode,
  rhythmClick: RhythmClickNode,
};

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
type NodeStatus = 'IDLE' | 'PROCESSING' | 'ERROR' | 'VALIDATED';

const initialNodes: Node[] = [
  { id: '1', type: 'audioSource', position: { x: 50, y: 50 }, data: { label: 'Microphone Input', status: 'IDLE', connectionType: 'String' } },
  { id: '2', type: 'uiEvent', position: { x: 300, y: 50 }, data: { label: 'Click Trigger', status: 'IDLE', connectionType: 'String' } },
  { id: '3', type: 'rhythmClick', position: { x: 300, y: 200 }, data: { label: 'Metronome (120 BPM)', status: 'IDLE', connectionType: 'String' } },
  { id: '4', type: 'audioOutput', position: { x: 600, y: 125 }, data: { label: 'Master Output', status: 'IDLE', connectionType: 'String' } },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#3b82f6' } },
  { id: 'e2-4', source: '2', target: '4', animated: true, style: { stroke: '#3b82f6' } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#a855f7' } },
];

const DevelopersContent: React.FC = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [circuitState, setCircuitState] = useState<CircuitState>('CLOSED');
    const [errorCount, setErrorCount] = useState(0);
    const [isSimulating, setIsSimulating] = useState(false);

    const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    // Update all nodes with the current circuit state
    useEffect(() => {
        setNodes((nds) => nds.map(node => ({
            ...node,
            data: { ...node.data, circuitState }
        })));
    }, [circuitState, setNodes]);

    const resetSystem = () => {
        setCircuitState('CLOSED');
        setErrorCount(0);
        setNodes((nds) => nds.map(node => ({
            ...node,
            data: { ...node.data, status: 'IDLE', errorMessage: undefined }
        })));
        audioService.playSound('success');
    };

    const runDiagnostics = async () => {
        if (circuitState === 'OPEN') return;
        setIsSimulating(true);
        audioService.playSound('click');

        // Simulate a sequence
        const sequence = ['1', '2', '3', '4'];
        let currentErrors = 0;

        for (const nodeId of sequence) {
            // Check Circuit Breaker
            if (currentErrors >= 2) {
                setCircuitState('OPEN');
                audioService.playSound('error');
                break;
            }

            // Set Processing
            setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'PROCESSING' } } : n));
            await new Promise(r => setTimeout(r, 600));

            // Simulate Validation / Error
            const isFailure = Math.random() > 0.8; // 20% chance of failure per node
            
            if (isFailure) {
                currentErrors++;
                setErrorCount(prev => prev + 1);
                setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'ERROR', errorMessage: 'Invalid String Format' } } : n));
                audioService.playSound('error');
            } else {
                setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'VALIDATED' } } : n));
                audioService.playSound('receive');
            }
        }

        setIsSimulating(false);
    };

    return (
        <div className={`flex flex-col h-full bg-[#050505] text-white font-sans relative overflow-hidden transition-colors duration-500 ${circuitState === 'OPEN' ? 'border-4 border-red-900/50' : ''}`}>
            
            {/* Toolbar Header */}
            <div className={`flex items-center justify-between p-4 border-b z-10 backdrop-blur-md transition-colors duration-300 ${circuitState === 'OPEN' ? 'bg-red-950/80 border-red-700' : 'bg-gray-900/50 border-gray-800'}`}>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <BoltIcon className={`w-5 h-5 ${circuitState === 'OPEN' ? 'text-red-500' : 'text-indigo-400'}`} />
                        <h1 className="text-lg font-bold tracking-tight text-gray-200">
                            Logic Grid <span className="text-xs font-mono text-gray-500 ml-2">v2.1.0</span>
                        </h1>
                    </div>
                    
                    {/* Circuit Breaker Indicator */}
                    <div className={`flex items-center gap-2 px-3 py-1 rounded border text-xs font-bold uppercase tracking-wider ${
                        circuitState === 'CLOSED' ? 'bg-green-900/30 border-green-600 text-green-400' :
                        circuitState === 'OPEN' ? 'bg-red-900/30 border-red-600 text-red-500 animate-pulse' :
                        'bg-yellow-900/30 border-yellow-600 text-yellow-500'
                    }`}>
                        <ShieldCheckIcon className="w-4 h-4" />
                        Circuit: {circuitState}
                    </div>
                </div>

                <div className="flex gap-2">
                    {circuitState === 'OPEN' ? (
                        <button 
                            onClick={resetSystem}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold shadow-lg shadow-red-900/50 flex items-center gap-2"
                        >
                            <XMarkIcon className="w-4 h-4" />
                            RESET BREAKER
                        </button>
                    ) : (
                        <button 
                            onClick={runDiagnostics}
                            disabled={isSimulating}
                            className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${
                                isSimulating 
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                            }`}
                        >
                            <PlayIcon className="w-4 h-4" />
                            {isSimulating ? 'VALIDATING...' : 'RUN DIAGNOSTICS'}
                        </button>
                    )}
                </div>
            </div>

            {/* Error Overlay */}
            {circuitState === 'OPEN' && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-950/90 border border-red-500 text-red-200 px-6 py-4 rounded-lg shadow-2xl backdrop-blur-xl flex items-center gap-4 animate-bounce">
                    <ShieldCheckIcon className="w-8 h-8" />
                    <div>
                        <h3 className="font-bold text-lg">CIRCUIT BREAKER TRIPPED</h3>
                        <p className="text-xs font-mono">Operation Error Threshold Exceeded ({errorCount}). Flow Halted.</p>
                    </div>
                </div>
            )}

            {/* Canvas */}
            <div className={`flex-grow relative transition-opacity duration-500 ${circuitState === 'OPEN' ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-[#09090b]"
                >
                    <Background color="#1e293b" gap={20} size={1} />
                    <Controls className="bg-gray-800 border-gray-700 fill-white text-white" />
                    <MiniMap 
                        nodeColor={(n) => {
                            if (n.data.status === 'ERROR') return '#ef4444';
                            if (n.data.status === 'VALIDATED') return '#22c55e';
                            if (n.type === 'audioSource') return '#374151';
                            return '#1d4ed8';
                        }} 
                        className="bg-gray-900 border border-gray-800"
                    />
                </ReactFlow>
            </div>
            
            <TabFooter />
        </div>
    );
};

const Developers: React.FC = () => {
    return (
        <ReactFlowProvider>
            <DevelopersContent />
        </ReactFlowProvider>
    );
};

export default Developers;
