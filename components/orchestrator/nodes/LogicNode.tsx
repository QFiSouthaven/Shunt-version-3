
// components/orchestrator/nodes/LogicNode.tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { BranchingIcon, BoltIcon, ShieldCheckIcon } from '../../icons';
import { WorkflowNodeData } from '../../../types/workflow';

const LogicNode = ({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <div className={`w-64 rounded-xl border-2 p-4 transition-all duration-300 bg-gray-900/90 backdrop-blur-xl shadow-2xl ${
      selected ? 'border-amber-500 ring-4 ring-amber-500/20' : 'border-gray-800'
    } ${data.status === 'running' ? 'border-amber-400 animate-pulse' : ''}`}>
      
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-amber-500 border-2 border-gray-900" />
      
      <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-900/30 text-amber-400">
            <BranchingIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">{data.label}</h3>
            <span className="text-[8px] text-gray-500 font-mono">NODE::BRANCH</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-black/40 rounded p-2 border border-gray-800 flex flex-col gap-1">
           <label className="text-[8px] font-bold text-gray-600 uppercase">Variable</label>
           <div className="text-[10px] text-amber-200 font-mono">${data.config.conditionVariable || 'null'}</div>
        </div>

        <div className="flex items-center gap-2 px-1">
          <span className="text-[9px] text-gray-500 uppercase font-bold">{data.config.conditionOperator?.replace('_', ' ') || 'equals'}</span>
          <div className="flex-grow h-px bg-gray-800"></div>
          <span className="text-[9px] text-amber-400 font-mono italic">"{data.config.conditionValue || ''}"</span>
        </div>
      </div>

      {/* Decision Output Handles */}
      <div className="mt-4 flex justify-between px-2">
        <div className="flex flex-col items-center gap-1">
            <div className="text-[8px] text-green-500 font-bold uppercase">True</div>
            <Handle 
                type="source" 
                position={Position.Bottom} 
                id="true" 
                className="!relative !left-0 !transform-none w-3 h-3 bg-green-500 border-2 border-gray-900" 
            />
        </div>
        <div className="flex flex-col items-center gap-1">
            <div className="text-[8px] text-red-500 font-bold uppercase">False</div>
            <Handle 
                type="source" 
                position={Position.Bottom} 
                id="false" 
                className="!relative !left-0 !transform-none w-3 h-3 bg-red-500 border-2 border-gray-900" 
            />
        </div>
      </div>
    </div>
  );
};

export default memo(LogicNode);
