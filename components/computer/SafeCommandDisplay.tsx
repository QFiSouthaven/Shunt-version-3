
// components/computer/SafeCommandDisplay.tsx
import React, { useState } from 'react';
import { auditShellCommand } from '../../services/CommandGuard';
import { ShieldCheckIcon, ErrorIcon, BoltIcon, LockIcon, PlayIcon } from '../icons';
import { useMCPContext } from '../../context/MCPContext';
import { MCPConnectionStatus } from '../../types/mcp';
import Loader from '../Loader';

interface SafeCommandDisplayProps {
  command: string;
  onExecute?: (cmd: string) => void;
  isExecuting?: boolean;
}

const SafeCommandDisplay: React.FC<SafeCommandDisplayProps> = ({ command, onExecute, isExecuting }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const { status: mcpStatus } = useMCPContext();
  
  // Extract command from potential markdown or explanatory text
  const extractCode = (str: string) => {
      const match = str.match(/```(?:bash|sh|powershell|zsh)?\n([\s\S]*?)```/);
      return match ? match[1].trim() : str.trim();
  };

  const finalCommand = extractCode(command);
  const audit = auditShellCommand(finalCommand);

  const canExecute = mcpStatus === MCPConnectionStatus.Connected && (audit.riskLevel !== 'CRITICAL' || isUnlocked);

  if (audit.riskLevel === 'CRITICAL' && !isUnlocked) {
    return (
      <div className="bg-red-900/20 border-2 border-red-500/50 p-6 rounded-xl animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.2)]">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-red-600 rounded-full">
            <ErrorIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-red-100 tracking-tighter uppercase">Security Intervention</h3>
            <p className="text-xs text-red-300 opacity-80">This command violates system safety protocols.</p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {audit.flags.map((flag, i) => (
            <div key={i} className="text-[10px] font-mono bg-red-950/50 border border-red-800 p-2 text-red-400 rounded">
              &gt; [ALERT] {flag}
            </div>
          ))}
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded border border-white/10 flex items-center justify-center z-10">
            <button 
              onClick={() => setIsUnlocked(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest rounded shadow-xl transition-all active:scale-95"
            >
              Unlock Terminal Payload
            </button>
          </div>
          <pre className="p-4 bg-black rounded font-mono text-sm opacity-20 select-none">
            {finalCommand}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group p-4 rounded-lg border transition-all ${
        audit.riskLevel === 'MEDIUM' 
        ? 'bg-amber-900/10 border-amber-500/30' 
        : 'bg-black/40 border-gray-800'
    }`}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded ${audit.riskLevel === 'LOW' ? 'text-green-500' : 'text-amber-500'}`}>
            <ShieldCheckIcon className="w-4 h-4" />
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${audit.riskLevel === 'LOW' ? 'text-green-500' : 'text-amber-500'}`}>
            Audit: {audit.riskLevel === 'LOW' ? 'PASS' : 'WARNING'}
          </span>
        </div>
        
        {onExecute && (
            <button
                onClick={() => onExecute(finalCommand)}
                disabled={!canExecute || isExecuting}
                className={`flex items-center gap-2 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${
                    canExecute 
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]' 
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }`}
            >
                {isExecuting ? <Loader className="w-3 h-3" /> : <PlayIcon className="w-3 h-3" />}
                {isExecuting ? 'Running...' : 'Execute on Host'}
            </button>
        )}
      </div>

      <pre className="font-mono text-sm text-green-400/90 whitespace-pre-wrap leading-relaxed">
        <code>{finalCommand}</code>
      </pre>

      {audit.riskLevel === 'MEDIUM' && (
        <div className="mt-3 p-2 bg-amber-950/30 border border-amber-800/50 rounded text-[10px] text-amber-300">
          <strong>Note:</strong> This command involves network activity. Ensure destination is trusted.
        </div>
      )}
      
      {!onExecute && mcpStatus !== MCPConnectionStatus.Connected && (
          <div className="mt-2 text-[9px] text-gray-500 italic">
              Connect MCP extension to enable real-time execution.
          </div>
      )}
    </div>
  );
};

export default SafeCommandDisplay;
