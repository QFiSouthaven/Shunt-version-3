
import React from 'react';
import { AgentTool } from '../../types';
import { WrenchIcon, CheckCircleIcon } from '../icons'; // Using fallback icons

interface ToolsSelectorProps {
  tools: AgentTool[];
  onToggle: (toolId: string) => void;
}

export function ToolsSelector({ tools, onToggle }: ToolsSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
        <WrenchIcon className="w-5 h-5 text-orange-400" />
        Capabilities & Tools
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToggle(tool.id)}
            className={`
              flex items-start p-3 rounded-lg border transition-all text-left group
              ${tool.enabled 
                ? 'bg-slate-800/50 border-orange-500/50 hover:bg-slate-800' 
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }
            `}
          >
            <div className={`mt-0.5 mr-3 ${tool.enabled ? 'text-orange-400' : 'text-slate-600'}`}>
              {tool.enabled ? <CheckCircleIcon className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border border-current" />}
            </div>
            <div>
              <div className={`font-medium ${tool.enabled ? 'text-slate-200' : 'text-slate-400'}`}>
                {tool.name}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {tool.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
