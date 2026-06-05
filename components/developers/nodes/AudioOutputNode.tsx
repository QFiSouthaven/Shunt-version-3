
// components/developers/nodes/AudioOutputNode.tsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Volume2 as SpeakerWaveIcon, CheckCircle as CheckCircleIcon, Ban as NoSymbolIcon } from 'lucide-react';

const AudioOutputNode: React.FC<{ data: any }> = ({ data }) => {
    const { label, status, circuitState, connectionType } = data;

    let statusColor = 'border-green-700 bg-green-900/20';
    let icon = <SpeakerWaveIcon className="w-5 h-5 text-green-400" />;

    if (status === 'PROCESSING') {
        statusColor = 'border-green-400 bg-green-800/50 shadow-lg animate-pulse';
    } else if (status === 'VALIDATED') {
        statusColor = 'border-green-400 bg-green-900/60 shadow-[0_0_20px_rgba(34,197,94,0.4)]';
        icon = <CheckCircleIcon className="w-5 h-5 text-white" />;
    } else if (status === 'ERROR' || circuitState === 'OPEN') {
        statusColor = 'border-gray-700 bg-gray-900 opacity-50';
        icon = <NoSymbolIcon className="w-5 h-5 text-gray-500" />;
    }

    return (
        <div className={`p-4 border-2 rounded-lg ${statusColor} min-w-[200px] flex items-center gap-4 transition-all duration-300 relative group`}>
            
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex items-center">
                <Handle type="target" position={Position.Left} className="!bg-green-500 !w-3 !h-3" />
                <span className="text-[8px] text-gray-500 ml-1 bg-black px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">STR</span>
            </div>

            <div className="p-2 bg-black/30 rounded-full">
                {icon}
            </div>
            
            <div>
                <div className="text-[10px] font-mono text-green-200/70 mb-0.5">{connectionType} SINK</div>
                <div className="text-sm font-bold text-white">{label}</div>
            </div>
        </div>
    );
};

export default AudioOutputNode;
