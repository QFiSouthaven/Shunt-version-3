
// components/developers/nodes/RhythmClickNode.tsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Clock as ClockIcon, CheckCircle as CheckCircleIcon, AlertTriangle as ExclamationTriangleIcon } from 'lucide-react';

const RhythmClickNode: React.FC<{ data: any }> = ({ data }) => {
    const { label, status, circuitState, connectionType, errorMessage } = data;

    let statusColor = 'border-purple-700 bg-purple-900/20';
    let icon = <ClockIcon className="w-4 h-4 text-purple-400" />;

    if (status === 'PROCESSING') {
        statusColor = 'border-purple-400 bg-purple-800/50 shadow-lg';
    } else if (status === 'VALIDATED') {
        statusColor = 'border-purple-400 bg-purple-900/60 shadow-[0_0_15px_rgba(168,85,247,0.4)]';
        icon = <CheckCircleIcon className="w-4 h-4 text-white" />;
    } else if (status === 'ERROR' || circuitState === 'OPEN') {
        statusColor = 'border-red-500 bg-red-900/40';
        icon = <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />;
    }

    return (
        <div className={`p-3 border-2 rounded-lg ${statusColor} min-w-[200px] text-center transition-all duration-300 relative group`}>
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex items-center">
                <Handle type="target" position={Position.Left} className="!bg-purple-400 !w-2 !h-2" />
            </div>

            <div className="flex flex-col items-center gap-2">
                <div className={`p-1.5 rounded bg-black/20 ${status === 'PROCESSING' ? 'animate-spin-slow' : ''}`}>
                    {icon}
                </div>
                <div>
                    <div className="text-[10px] font-mono text-purple-200/70">{connectionType} GEN</div>
                    <div className="text-sm font-bold text-white">{label}</div>
                </div>
            </div>

            {status === 'ERROR' && errorMessage && (
                <div className="mt-2 text-[9px] bg-red-950 text-red-300 p-1 rounded border border-red-900 font-mono">
                    {errorMessage}
                </div>
            )}

            <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex items-center">
                <span className="text-[8px] text-gray-500 mr-1 bg-black px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">STR</span>
                <Handle type="source" position={Position.Right} className="!bg-purple-400 !w-2 !h-2" />
            </div>
        </div>
    );
};

export default RhythmClickNode;
