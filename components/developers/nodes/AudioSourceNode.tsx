
// components/developers/nodes/AudioSourceNode.tsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Radio as SignalIcon, AlertTriangle as ExclamationTriangleIcon, CheckCircle as CheckCircleIcon } from 'lucide-react';

const AudioSourceNode: React.FC<{ data: any }> = ({ data }) => {
    const { label, status, circuitState, connectionType, errorMessage } = data;

    let statusColor = 'border-gray-600 bg-gray-800';
    let icon = <SignalIcon className="w-4 h-4 text-gray-400" />;

    if (status === 'PROCESSING') {
        statusColor = 'border-blue-500 bg-blue-900/40 animate-pulse';
        icon = <SignalIcon className="w-4 h-4 text-blue-400" />;
    } else if (status === 'VALIDATED') {
        statusColor = 'border-green-500 bg-green-900/40 shadow-[0_0_15px_rgba(34,197,94,0.3)]';
        icon = <CheckCircleIcon className="w-4 h-4 text-green-400" />;
    } else if (status === 'ERROR' || circuitState === 'OPEN') {
        statusColor = 'border-red-500 bg-red-900/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
        icon = <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />;
    }

    return (
        <div className={`p-3 border-2 rounded-lg ${statusColor} min-w-[200px] transition-all duration-300 relative group`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-gray-500 uppercase">{connectionType} SOURCE</span>
                {icon}
            </div>
            
            <div className="text-sm font-bold text-gray-200 mb-1">{label}</div>
            
            <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                {status === 'PROCESSING' && <div className="h-full bg-blue-500 animate-progress w-full origin-left" />}
            </div>

            {status === 'ERROR' && errorMessage && (
                <div className="mt-2 text-[9px] bg-red-950 text-red-300 p-1 rounded border border-red-900 font-mono">
                    {errorMessage}
                </div>
            )}

            <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex items-center">
                <span className="text-[8px] text-gray-500 mr-1 bg-black px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">STR</span>
                <Handle type="source" position={Position.Right} className="!bg-gray-400 !w-3 !h-3 !border-2 !border-gray-800" />
            </div>
        </div>
    );
};

export default AudioSourceNode;
