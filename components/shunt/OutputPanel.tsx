
import React, { useState, useEffect } from 'react';
import Loader from '../Loader';
import { ErrorIcon, RedoIcon, MinusIcon, AmplifyIcon, BrainIcon, ClipboardDocumentListIcon } from '../icons';
import { ShuntAction } from '../../types';
import MarkdownRenderer from '../common/MarkdownRenderer';
import VirtualizedTextViewer from '../common/VirtualizedTextViewer';
import ContentActions from '../common/ContentActions';

interface OutputPanelProps {
  text: string;
  isLoading: boolean;
  error: string | null;
  activeShunt: string | null;
  modulesUsed?: string[] | null;
  onEvolve: () => void;
  onAttach?: () => void;
  isEvolving: boolean;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onDiagnoseError?: () => void;
}

const OutputPanel: React.FC<OutputPanelProps> = ({ text, isLoading, error, activeShunt, modulesUsed, onEvolve, onAttach, isEvolving, isMinimized, onToggleMinimize, onDiagnoseError }) => {
  const [viewMode, setViewMode] = useState<'markdown' | 'raw'>('markdown');

  // Auto-switch to raw view if text is massive (> 50kb) to prevent DOM freeze
  useEffect(() => {
    if (text && text.length > 50000) {
        setViewMode('raw');
    }
  }, [text]);

  // Extract error title if possible (based on colon separator from parser)
  let errorTitle = 'System Error';
  let errorMessage = error;
  if (error && error.includes(':')) {
      const parts = error.split(':');
      errorTitle = parts[0];
      errorMessage = parts.slice(1).join(':').trim();
  }

  const isJsonAction = activeShunt?.includes(ShuntAction.FORMAT_JSON);
  const filename = isJsonAction ? `shunt-output-${Date.now()}.json` : `shunt-output-${Date.now()}.md`;

  return (
    <div className="aether-panel h-full flex flex-col relative overflow-hidden">
      <div className="p-2 border-b border-gray-700 bg-gray-800 flex justify-between items-center rounded-t-lg">
        <div className="flex items-center gap-2">
            {onToggleMinimize && (
              <button onClick={onToggleMinimize} title={isMinimized ? 'Expand' : 'Minimize'} className="p-1 rounded text-gray-500 hover:text-white hover:bg-gray-700">
                {isMinimized ? <AmplifyIcon className="w-4 h-4"/> : <MinusIcon className="w-4 h-4"/>}
              </button>
            )}
            <span className="font-semibold text-xs text-gray-300 uppercase tracking-wide px-2">Output</span>
            
            {!isLoading && text && (
                <div className="flex bg-black/30 rounded p-0.5">
                    <button 
                        onClick={() => setViewMode('markdown')}
                        className={`px-2 py-0.5 text-[10px] rounded transition-colors ${viewMode === 'markdown' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        title="Render Markdown"
                    >
                        MD
                    </button>
                    <button 
                        onClick={() => setViewMode('raw')}
                        className={`px-2 py-0.5 text-[10px] rounded transition-colors ${viewMode === 'raw' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        title="Raw Text / Virtualized"
                    >
                        RAW
                    </button>
                </div>
            )}
        </div>
        
        {!isLoading && text && (
            <div className="flex items-center gap-1">
              <ContentActions content={text} filename={filename} />
              
              <div className="w-px h-3 bg-gray-600 mx-1"></div>
              
              {onAttach && (
                  <button
                    onClick={onAttach}
                    className="px-2 py-1 rounded text-[10px] flex items-center gap-1 text-cyan-400 hover:text-white hover:bg-cyan-900/50 transition-colors"
                    title="Attach output to Bulletin Board as Context"
                  >
                      <ClipboardDocumentListIcon className="w-3 h-3" />
                      <span className="hidden sm:inline">Attach</span>
                  </button>
              )}

              <button
                onClick={onEvolve}
                disabled={isEvolving || isLoading}
                className="px-2 py-1 rounded text-[10px] flex items-center gap-1 text-blue-300 hover:text-white hover:bg-blue-900/50 transition-colors disabled:opacity-50"
              >
                  {isEvolving ? <Loader className="w-3 h-3"/> : <RedoIcon className="w-3 h-3" />}
                  <span className="hidden sm:inline">Evolve</span>
              </button>
            </div>
        )}
      </div>

      {!isMinimized && (
      <div className="flex-grow relative overflow-auto custom-scrollbar bg-[#09090b]">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col justify-center items-center z-10">
            <Loader />
            <p className="mt-4 text-gray-500 font-mono text-xs">{activeShunt ? `RUNNING: ${activeShunt}` : 'PROCESSING...'}</p>
          </div>
        )}
        
        {error && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-lg max-w-md w-full flex flex-col items-center shadow-lg">
                <ErrorIcon className="w-10 h-10 text-red-500 mb-3" />
                <h3 className="text-red-400 font-bold text-base mb-1">{errorTitle}</h3>
                <div className="h-px w-full bg-red-900/50 my-3"></div>
                <p className="text-gray-300 text-sm leading-relaxed">{errorMessage}</p>
                
                {onDiagnoseError && (
                    <button
                        onClick={onDiagnoseError}
                        className="mt-6 px-4 py-2 bg-red-950 hover:bg-red-900 border border-red-800 rounded text-xs text-red-200 flex items-center gap-2 transition-colors"
                    >
                        <BrainIcon className="w-3 h-3" />
                        Diagnose with Mia
                    </button>
                )}
            </div>
          </div>
        )}

        {!isLoading && !error && !text && (
           <div className="flex flex-col items-center justify-center h-full opacity-30 select-none">
            <div className="w-8 h-8 border-2 border-gray-700 rounded-full mb-2"></div>
            <p className="text-gray-600 font-mono text-xs uppercase tracking-widest">Idle</p>
          </div>
        )}
        
        {modulesUsed && modulesUsed.length > 0 && (
            <div className="p-2 border-b border-gray-800 bg-gray-900/30">
                <p className="text-[10px] text-gray-500">
                    Active Modules: <span className="text-blue-400">{modulesUsed.join(', ')}</span>
                </p>
            </div>
        )}

        {text && (
            viewMode === 'raw' ? (
                <VirtualizedTextViewer content={text} className="bg-[#09090b] text-gray-300" />
            ) : (
                <div className="p-4">
                    <MarkdownRenderer content={text} />
                </div>
            )
        )}
      </div>
      )}
    </div>
  );
};

export default OutputPanel;
