
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { AgentData, AgentStatus, AgentTier } from './types';
import { 
    CpuChipIcon, // Bot
    ShieldCheckIcon, // ShieldCheck
    TerminalIcon, // Terminal
    UserIcon, // Users
    BrainIcon, // BrainCircuit
    SignalIcon // Activity
} from '../icons';

const statusColors = {
  [AgentStatus.IDLE]: 'border-gray-700 bg-gray-800',
  [AgentStatus.PROCESSING]: 'border-blue-500 bg-blue-900/20 shadow-blue-500/50 shadow-lg ring-1 ring-blue-400',
  [AgentStatus.WAITING]: 'border-yellow-500 bg-yellow-900/20',
  [AgentStatus.SUCCESS]: 'border-green-500 bg-green-900/20',
  [AgentStatus.FAILURE]: 'border-red-500 bg-red-900/20',
};

const TierIcon = ({ tier }: { tier: AgentTier }) => {
  switch (tier) {
    case AgentTier.GOVERNANCE: return <BrainIcon className="w-4 h-4" />;
    case AgentTier.INGESTION: return <UserIcon className="w-4 h-4" />;
    case AgentTier.OPERATIONS: return <SignalIcon className="w-4 h-4" />;
    case AgentTier.FOUNDRY: return <TerminalIcon className="w-4 h-4" />;
    case AgentTier.VALIDATION: return <ShieldCheckIcon className="w-4 h-4" />;
    default: return <CpuChipIcon className="w-4 h-4" />;
  }
};

const AgentNode = ({ data }: NodeProps<AgentData>) => {
  return (
    <div className={`w-64 rounded-lg border-2 p-3 transition-all duration-300 ${statusColors[data.status]} text-gray-200`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-gray-500" />
      
      <div className="flex items-center justify-between mb-2 border-b pb-2 border-gray-600/50">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          <TierIcon tier={data.tier} />
          <span>{data.role}</span>
        </div>
        {data.status === AgentStatus.PROCESSING && (
           <span className="flex h-2 w-2 relative">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
           </span>
        )}
      </div>

      <div className="mb-2">
        <h3 className="font-bold text-sm text-gray-100 leading-tight">{data.label}</h3>
      </div>

      <div className="text-[10px] text-gray-400 bg-black/20 p-2 rounded min-h-[40px] font-mono">
        <span className="font-semibold text-gray-500">Activity: </span>
        {data.currentTask || "Awaiting signal..."}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-gray-500" />
    </div>
  );
};

export default memo(AgentNode);
