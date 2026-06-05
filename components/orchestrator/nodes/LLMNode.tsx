
// components/orchestrator/nodes/LLMNode.tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { BrainIcon, SparklesIcon, BoltIcon } from '../../icons';
import { WorkflowNodeData } from '../../../types/workflow';

const LLMNode = ({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <div className={`w-72 rounded-xl border-2 p-4 transition-all duration-300 bg-gray-900/90 backdrop-blur-xl shadow-2xl ${
      selected ? 'border-fuchsia-500 ring-4 ring-fuchsia-500/20' : 'border-gray-800'
    } ${data.status === 'running' ? 'border-fuchsia-400 animate-pulse' : ''}`}>
      
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-fuchsia-500 border-2 border-gray-900" />
      
      <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-fuchsia-900/30 text-fuchsia-400`}>
            <BrainIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">{data.label}</h3>
            <span className="text-[8px] text-gray-500 font-mono">NODE::INTELLIGENCE</span>
          </div>
        </div>
        {data.status === 'completed' && <BoltIcon className="w-4 h-4 text-green-400 shadow-lg shadow-green-500/50" />}
      </div>

      <div className="space-y-3">
        <div className="bg-black/40 rounded p-2 border border-gray-800">
           <label className="text-[8px] font-bold text-gray-600 uppercase mb-1 block">Prompt Context</label>
           <div className="text-[10px] text-gray-300 line-clamp-3 font-mono leading-relaxed italic">
            {data.config.instruction || "No instructions defined..."}
           </div>
        </div>

        <div className="flex justify-between items-center px-1">
          <span className="text-[9px] text-gray-500 font-bold uppercase">{data.config.model || 'Gemini 3 Pro'}</span>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500"></span>
          </div>
        </div>
      </div>

      {data.output && (
        <div className="mt-3 pt-2 border-t border-gray-800 animate-fade-in">
          <div className="text-[9px] text-green-400 font-mono bg-green-950/20 p-1.5 rounded truncate">
            OUT: {typeof data.output === 'string' ? data.output : 'OBJECT_BUFFER'}
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-fuchsia-500 border-2 border-gray-900" />
    </div>
  );
};

export default memo(LLMNode);
