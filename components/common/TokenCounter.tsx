
// components/common/TokenCounter.tsx
import React, { useState, useEffect } from 'react';
import { BoltIcon, SparklesIcon, SignalIcon } from '../icons';
import { appEventBus } from '../../lib/eventBus';

interface TokenStats {
  sessionTotal: number;
  lastRequest: number;
  savings: number; // Bytes saved via minification
}

export const TokenCounter: React.FC = () => {
  const [stats, setStats] = useState<TokenStats>({ sessionTotal: 0, lastRequest: 0, savings: 0 });

  useEffect(() => {
    const unsub = appEventBus.on('telemetry', (payload) => {
      if (payload.type === 'interaction_event' && payload.data.tokenUsage) {
        const usage = payload.data.tokenUsage;
        setStats(prev => ({
          sessionTotal: prev.sessionTotal + usage.total_tokens,
          lastRequest: usage.total_tokens,
          savings: prev.savings + (payload.data.contextDetails?.sanitizedBytes || 0)
        }));
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="flex items-center gap-4 bg-black/40 border border-gray-800 rounded-full px-4 py-1.5 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <BoltIcon className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">Session:</span>
        <span className="text-[10px] font-bold text-white font-mono">{(stats.sessionTotal / 1000).toFixed(1)}k</span>
      </div>
      
      <div className="w-px h-3 bg-gray-700" />
      
      <div className="flex items-center gap-2">
        <SparklesIcon className="w-3.5 h-3.5 text-fuchsia-400" />
        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">Efficiency:</span>
        <span className="text-[10px] font-bold text-green-400 font-mono">+{Math.round(stats.savings / 1024)}kb</span>
      </div>

      <div className="w-px h-3 bg-gray-700" />

      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${stats.lastRequest > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
        <span className="text-[10px] font-mono text-gray-500 uppercase">Uplink Active</span>
      </div>
    </div>
  );
};
