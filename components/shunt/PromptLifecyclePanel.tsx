
// components/shunt/PromptLifecyclePanel.tsx
import React, { useState, useMemo } from 'react';
import { HistoryEntry } from '../../types';
import { HistoryIcon, MinusIcon, AmplifyIcon, SparklesIcon, FlagIcon, CodeIcon, XMarkIcon } from '../icons';
import { diffLines, Change } from 'diff';

interface PromptLifecyclePanelProps {
  history: HistoryEntry[];
  initialPrompt: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

const ScoreMeter: React.FC<{ score: number }> = ({ score }) => {
    const percentage = Math.min(100, Math.max(0, (score / 10) * 100));
    let colorClass = score >= 8 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : score >= 5 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="flex flex-col gap-1 w-24">
            <div className="flex justify-between items-end">
                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Quality</span>
                <span className="text-xs font-mono font-bold">{score}/10</span>
            </div>
            <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
};

const DiffLine: React.FC<{ change: Change }> = ({ change }) => {
    const colorClass = change.added ? 'text-green-400 bg-green-900/20' : change.removed ? 'text-red-400 bg-red-900/20' : 'text-gray-400';
    const prefix = change.added ? '+' : change.removed ? '-' : ' ';
    
    return (
        <div className={`${colorClass} whitespace-pre-wrap font-mono text-[11px] leading-relaxed px-2 border-l-2 ${change.added ? 'border-green-500' : change.removed ? 'border-red-500' : 'border-transparent'}`}>
            {change.value.split('\n').map((line, i) => line ? <div key={i}>{prefix} {line}</div> : null)}
        </div>
    );
};

const PromptLifecyclePanel: React.FC<PromptLifecyclePanelProps> = ({ history, initialPrompt, isMinimized, onToggleMinimize }) => {
  const [diffViewIndex, setDiffViewIndex] = useState<number | null>(null);

  const diffResult = useMemo(() => {
      if (diffViewIndex === null || diffViewIndex === 0) return null;
      const oldText = history[diffViewIndex - 1].output;
      const newText = history[diffViewIndex].output;
      return diffLines(oldText, newText);
  }, [diffViewIndex, history]);

  if (history.length === 0 && !initialPrompt) return null;

  return (
    <div className="aether-panel flex flex-col shadow-lg overflow-hidden relative">
      <div className="p-3 border-b border-gray-700 bg-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-fuchsia-400" />
            <h2 className="font-semibold text-xs text-gray-200 uppercase tracking-wide">Lifecycle Intelligence</h2>
            <span className="px-1.5 py-0.5 rounded-full bg-gray-700 text-[10px] text-gray-400">{history.length} Iterations</span>
        </div>
        {onToggleMinimize && (
          <button onClick={onToggleMinimize} className="text-gray-500 hover:text-white transition-colors">
            {isMinimized ? <AmplifyIcon className="w-4 h-4"/> : <MinusIcon className="w-4 h-4"/>}
          </button>
        )}
      </div>

      {!isMinimized && (
        <div className="p-4 bg-[#09090b] space-y-6 max-h-96 overflow-y-auto custom-scrollbar relative">
          
          <div className="relative pl-6 border-l-2 border-gray-700">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center">
                <FlagIcon className="w-2.5 h-2.5 text-gray-400" />
            </div>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Genesis Pattern</h3>
            <div className="p-3 bg-gray-800/30 rounded border border-gray-700/50 text-xs text-gray-400 font-mono line-clamp-2">
                {initialPrompt}
            </div>
          </div>

          {history.map((entry, index) => (
            <div key={entry.id} className="relative pl-6 border-l-2 border-gray-700 last:border-l-transparent">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-900 border-2 border-fuchsia-500/50 flex items-center justify-center shadow-[0_0_10px_rgba(217,70,239,0.3)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400"></span>
                </div>

                <div className="flex flex-col gap-3 pb-6">
                    <div className="flex items-center justify-between bg-gray-800/40 p-2 rounded border border-gray-700">
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="w-3.5 h-3.5 text-fuchsia-400" />
                            <span className="text-xs font-semibold text-gray-300">Iteration {index + 1}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {index > 0 && (
                                <button 
                                    onClick={() => setDiffViewIndex(index)}
                                    className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-900/10 px-2 py-1 rounded border border-cyan-800/50"
                                >
                                    <CodeIcon className="w-3 h-3" /> ANALYZE DIFF
                                </button>
                            )}
                            <ScoreMeter score={entry.score} />
                        </div>
                    </div>
                </div>
            </div>
          ))}

          {/* Git-like Diff Overlay */}
          {diffViewIndex !== null && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-xl animate-fade-in">
                  <div className="w-full max-w-5xl h-full flex flex-col bg-[#0a0a0a] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                      <header className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                          <div>
                            <h4 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
                                <CodeIcon className="w-4 h-4 text-cyan-400" /> Semantic Diff Engine
                            </h4>
                            <p className="text-[10px] text-gray-500 mt-1">Analyzing shifts between Iteration {diffViewIndex} &rarr; {diffViewIndex + 1}</p>
                          </div>
                          <button onClick={() => setDiffViewIndex(null)} className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white">
                              <XMarkIcon className="w-6 h-6" />
                          </button>
                      </header>
                      <main className="flex-grow bg-[#050505] p-6 overflow-y-auto flex flex-col custom-scrollbar">
                          <div className="flex gap-4 mb-4">
                              <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-green-500/30 border border-green-500"></div>
                                  <span className="text-[10px] text-gray-400 uppercase">Additions</span>
                              </div>
                              <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-red-500/30 border border-red-500"></div>
                                  <span className="text-[10px] text-gray-400 uppercase">Deletions</span>
                              </div>
                          </div>
                          <div className="space-y-0.5 border border-gray-800 rounded-lg p-4 bg-black/40">
                              {diffResult?.map((change, i) => (
                                  <DiffLine key={i} change={change} />
                              ))}
                          </div>
                      </main>
                  </div>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptLifecyclePanel;
