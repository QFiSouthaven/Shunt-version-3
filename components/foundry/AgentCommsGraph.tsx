
// components/foundry/AgentCommsGraph.tsx
import React, { useMemo, useEffect } from 'react';
import ReactFlow, { 
    Background, 
    useNodesState, 
    useEdgesState, 
    Node, 
    Edge, 
    Position 
} from 'reactflow';
import { CommsMessage } from '../../services/foundry.service';

interface AgentCommsGraphProps {
    agents: any[];
    comms: CommsMessage[];
}

const AgentCommsGraph: React.FC<AgentCommsGraphProps> = ({ agents, comms }) => {
    // Generate static nodes for the 4 primary agents + System
    const initialNodes: Node[] = useMemo(() => {
        const layout = [
            { id: 'System', pos: { x: 250, y: 0 }, label: 'Central System', color: 'bg-indigo-900' },
            { id: '1', pos: { x: 50, y: 150 }, label: 'Navigator', color: 'bg-blue-900' },
            { id: '2', pos: { x: 150, y: 300 }, label: 'Extractor', color: 'bg-fuchsia-900' },
            { id: '3', pos: { x: 350, y: 300 }, label: 'Synthesizer', color: 'bg-purple-900' },
            { id: '4', pos: { x: 450, y: 150 }, label: 'Archivist', color: 'bg-emerald-900' },
        ];

        return layout.map(l => ({
            id: l.id,
            data: { label: l.label },
            position: l.pos,
            style: { 
                background: '#0a0a0a', 
                color: '#fff', 
                border: '1px solid #333', 
                borderRadius: '8px',
                padding: '10px',
                fontSize: '10px',
                fontWeight: 'bold',
                width: 100,
                textAlign: 'center'
            }
        }));
    }, []);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges] = useEdgesState([]);

    useEffect(() => {
        // Create edges from the last 10 comms messages
        const recentComms = comms.slice(0, 10);
        const newEdges: Edge[] = recentComms.map(c => ({
            id: c.id,
            source: c.from,
            target: c.to,
            animated: true,
            label: c.content.length > 20 ? c.content.substring(0, 20) + '...' : c.content,
            labelStyle: { fill: '#666', fontSize: 8, fontMono: true },
            style: { stroke: '#3b82f6', strokeWidth: 2 }
        }));
        
        setEdges(newEdges);

        // Flash active nodes
        if (comms.length > 0) {
            const last = comms[0];
            setNodes(nds => nds.map(n => {
                if (n.id === last.from || n.id === last.to) {
                    return { ...n, style: { ...n.style, border: '1px solid #8b5cf6', boxShadow: '0 0 10px #8b5cf6' }};
                }
                return { ...n, style: { ...n.style, border: '1px solid #333', boxShadow: 'none' }};
            }));
        }
    }, [comms, setEdges, setNodes]);

    return (
        <div className="h-full w-full bg-black/40 rounded-lg border border-gray-800">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                fitView
                preventScrolling={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                nodesDraggable={false}
                className="pointer-events-none"
            >
                <Background color="#222" gap={20} />
            </ReactFlow>
        </div>
    );
};

export default AgentCommsGraph;
