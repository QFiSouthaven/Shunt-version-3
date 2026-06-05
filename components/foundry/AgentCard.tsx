
import React from 'react';
import { ExtractionAgent } from '../../types/refinery';
import { Activity, Globe, Database, Cpu } from 'lucide-react';

interface AgentCardProps {
  agent: ExtractionAgent;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fetching': return 'bg-blue-500 animate-pulse';
      case 'parsing': return 'bg-purple-500 animate-pulse';
      case 'cooldown': return 'bg-yellow-500';
      case 'idle': default: return 'bg-gray-500';
    }
  };

  const getIcon = (role: string) => {
    switch (role) {
      case 'Navigator': return <Globe className="w-5 h-5 text-blue-400" />;
      case 'Extractor': return <Cpu className="w-5 h-5 text-fuchsia-400" />;
      case 'Archivist': return <Database className="w-5 h-5 text-emerald-400" />;
      default: return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4 flex flex-col gap-3 shadow-lg transition-all hover:border-gray-600">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-gray-200 font-bold text-sm">
          {getIcon(agent.role)}
          <span>{agent.name}</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
      </div>
      
      <div className="text-xs text-gray-400 font-mono bg-black/40 p-2 rounded border border-gray-800 truncate" title={agent.currentTask}>
        {agent.currentTask || "Waiting for queue..."}
      </div>

      <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1 border-t border-gray-800 pt-2">
        <span>Throughput</span>
        <span className="font-mono text-cyan-400">{agent.itemsProcessed} items/min</span>
      </div>
    </div>
  );
};

export default AgentCard;
