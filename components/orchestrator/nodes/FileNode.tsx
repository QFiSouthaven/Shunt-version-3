
// components/orchestrator/nodes/FileNode.tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { DocumentIcon, DeviceFloppyIcon, ServerStackIcon } from '../../icons';
import { WorkflowNodeData } from '../../../types/workflow';

const FileNode = ({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const isRead = data.type === 'read_file';
  
  return (
    <div className={`w-64 rounded-xl border-2 p-4 transition-all duration-300 bg-gray-900/90 backdrop-blur-xl shadow-2xl ${
      selected ? (isRead ? 'border-emerald-500 ring-4 ring-emerald-500/20' : 'border-cyan-500 ring-4 ring-cyan-500/20') : 'border-gray-800'
    } ${data.status === 'running' ? 'border-indigo-400 animate-pulse' : ''}`}>
      
      <Handle type="target" position={Position.Top} className={`w-3 h-3 border-2 border-gray-900 ${isRead ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
      
      <div className="flex items-center gap-3 mb-3 border-b border-gray-800 pb-2">
        <div className={`p-1.5 rounded-lg ${isRead ? 'bg-emerald-900/30 text-emerald-400' : 'bg-cyan-900/30 text-cyan-400'}`}>
          {isRead ? <DocumentIcon className="w-5 h-5" /> : <DeviceFloppyIcon className="w-5 h-5" />}
        </div>
        <div>
          <h3 className="font-bold text-xs text-white uppercase tracking-wider">{data.label}</h3>
          <span className="text-[8px] text-gray-500 font-mono">{isRead ? 'STORAGE::INGEST' : 'STORAGE::EGRESS'}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="bg-black/40 rounded p-2 border border-gray-800 flex items-center gap-2">
           <ServerStackIcon className="w-3 h-3 text-gray-500" />
           <span className="text-[10px] text-gray-400 truncate font-mono">{data.config.filePath || "undefined_path"}</span>
        </div>
        {isRead && data.config.resultVariable && (
            <div className="text-[9px] text-indigo-400 font-bold uppercase text-right px-1">
                MEM_HOOK: ${data.config.resultVariable}
            </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className={`w-3 h-3 border-2 border-gray-900 ${isRead ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
    </div>
  );
};

export default memo(FileNode);
