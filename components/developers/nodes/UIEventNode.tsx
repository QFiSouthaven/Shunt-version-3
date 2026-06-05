
// components/developers/nodes/UIEventNode.tsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { MousePointerClick as CursorArrowRaysIcon, CheckCircle as CheckCircleIcon, AlertTriangle as ExclamationTriangleIcon } from 'lucide-react';

const UIEventNode: React.FC<{ data: any }> = ({ data }) => {
    const { label, status, circuitState, connectionType, errorMessage } = data;

    let statusColor = 'border-blue-700 bg-blue-900/20';
    let icon = <CursorArrowRaysIcon className="w-4 h-4 text-blue-400" />;

    if (status === 'PROCESSING') {
        statusColor = 'border-blue-400 bg-blue-800/50 shadow-lg';
    } else if (status === 'VALIDATED') {
        statusColor = 'border-green-500 bg-green-900/40';
        icon = <CheckCircleIcon className="w-4 h-4 text-green-400" />;
    } else if (status === 'ERROR' || circuitState === 'OPEN') {
        statusColor = 'border-red-500 bg-red-900/40';
        icon = <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />;
    }

    return (
        <div className={`p-3 border-2 rounded-lg ${statusColor} min-w-[200px] text-center transition-all duration-300 relative group`}>
            
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex items-center">
                <Handle type="target" position={Position.Left} className="!bg-blue-400 !w-2 !h-2 !rounded-sm" />
                <span className="text-[8px] text-gray-500 ml-1 bg-black px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">STR</span>
            </div>

            <div className="flex flex-col items-center gap-2">
                <div className={`p-2 rounded-full bg-black/20 ${status === 'PROCESSING' ? 'animate-bounce' : ''}`}>
                    {icon}
                </div>
                <div>
                    <div className="text-xs font-mono text-blue-200/70 mb-0.5">{connectionType} EVENT</div>
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
                <Handle type="source" position={Position.Right} className="!bg-blue-400 !w-2 !h-2 !rounded-sm" />
            </div>
        </div>
    );
};

export default UIEventNode;
