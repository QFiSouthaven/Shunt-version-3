
import React from 'react';
import { useCortex } from '../../hooks/useCortex';
import { KnowledgeNode } from '../../types/cortex';
import { SignalIcon, ServerStackIcon, DocumentIcon, TerminalIcon, SparklesIcon, BoltIcon } from '../icons';

const StageIcon = ({ stage }: { stage: string }) => {
  switch (stage) {
    case 'DISCOVERY': return <SparklesIcon className="w-4 h-4 text-blue-400" />;
    case 'EXTRACTION': return <DocumentIcon className="w-4 h-4 text-yellow-400" />;
    case 'VECTORIZATION': return <ServerStackIcon className="w-4 h-4 text-purple-400" />;
    case 'PROTOTYPING': return <TerminalIcon className="w-4 h-4 text-green-400" />;
    case 'SYNTHESIS': return <BoltIcon className="w-4 h-4 text-red-400" />;
    default: return <SignalIcon className="w-4 h-4 text-gray-500" />;
  }
};

const NodeCard: React.FC<{ node: KnowledgeNode }> = ({ node }) => (
  <div className="bg-gray-900/80 border border-gray-800 p-3 rounded-md mb-2 flex flex-col gap-1 animate-fade-in shadow-md">
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-mono text-gray-500">{node.id.slice(0, 8)}</span>
      <span className="text-[9px] bg-gray-800 px-2 py-0.5 rounded text-gray-400 font-bold">{node.type}</span>
    </div>
    <div className="font-semibold text-sm text-gray-200 truncate pr-2">{node.metadata?.title || 'Unknown Signal'}</div>
    
    <div className="flex items-center gap-2 mt-2">
      <div className="p-1.5 bg-black rounded-full border border-gray-700">
        <StageIcon stage={node.stage} />
      </div>
      <div className="flex-1">
        <div className="text-[9px] uppercase text-gray-600 font-bold tracking-wider">Current Phase</div>
        <div className="text-xs text-cyan-400 font-mono">{node.stage}</div>
      </div>
    </div>

    {node.summary && (
      <div className="mt-2 text-xs text-gray-400 border-t border-gray-800 pt-2 font-mono">
        <span className="text-green-500">System_2001:</span> {node.summary}
      </div>
    )}
    
    {node.error && (
        <div className="mt-2 text-xs text-red-400 border-t border-red-900/30 pt-2">
            Error: {node.error}
        </div>
    )}
  </div>
);

export const LiveFeed: React.FC = () => {
  const { pipeline, isActive, toggleSystem, stats } = useCortex();

  return (
    <div className="h-full flex flex-col bg-[#050505] border-l border-gray-800/50 w-80 shadow-xl z-30">
      <div className="p-4 border-b border-gray-800/50 flex justify-between items-center bg-gray-900/20 backdrop-blur-md">
        <div>
          <h2 className="text-xs font-bold text-gray-300 tracking-widest uppercase flex items-center gap-2">
            <SignalIcon className="w-4 h-4 text-fuchsia-500" />
            Aether Cortex
          </h2>
          <div className="flex gap-3 text-[10px] text-gray-500 mt-1 font-mono">
            <span>ACT: {stats.activeNodes}</span>
            <span>MEM: {stats.completedNodes}</span>
          </div>
        </div>
        <button 
          onClick={toggleSystem}
          title={isActive ? "Deactivate Cortex" : "Activate Cortex"}
          className={`w-3 h-3 rounded-full transition-all duration-500 ${isActive ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-red-900 border border-red-700'}`}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {pipeline.length === 0 ? (
          <div className="text-center text-gray-700 text-xs mt-10 font-mono">
            <p className="mb-2">NEURAL_LINK: STANDBY</p>
            <p>Awaiting autonomous signals...</p>
          </div>
        ) : (
          pipeline.slice().reverse().map(node => (
            <NodeCard key={node.id} node={node} />
          ))
        )}
      </div>

      <div className="p-2 bg-gray-900/50 border-t border-gray-800/50 text-[9px] text-gray-500 font-mono text-center uppercase tracking-widest">
        Loop Status: {isActive ? <span className="text-green-500">ENGAGED</span> : 'DISENGAGED'}
      </div>
    </div>
  );
};
