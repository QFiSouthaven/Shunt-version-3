
// components/orchestrator/nodes/AgentSelectorNode.tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { UserIcon, CpuChipIcon, BoltIcon } from '../../icons';
import { WorkflowNodeData } from '../../../types/workflow';

const AgentSelectorNode = ({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <div className={`w-64 rounded-xl border-2 p-4 transition-all duration-300 bg-gray-900/90 backdrop-blur-xl shadow-2xl ${
      selected ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-gray-800'
    } ${data.status === 'running' ? 'border-indigo-400 animate-pulse' : ''}`}>
      
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500 border-2 border-gray-900" />
      
      <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-900/30 text-indigo-400">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">{data.label}</h3>
            <span className="text-[8px] text-gray-500 font-mono">NODE::REGISTRY_AGENT</span>
          </div>
        </div>
        {data.status === 'completed' && <BoltIcon className="w-4 h-4 text-indigo-400" />}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 bg-indigo-950/20 p-2 rounded border border-indigo-900/30">
           <CpuChipIcon className="w-3 h-3 text-indigo-500" />
           <span className="text-[10px] text-indigo-200 font-bold truncate">
               {data.config.agentName || "UNLINKED_AGENT"}
           </span>
        </div>
        
        <div className="text-[9px] text-gray-500 leading-relaxed italic">
            In: ${data.config.inputVariable || 'input'}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500 border-2 border-gray-900" />
    </div>
  );
};

export default memo(AgentSelectorNode);
