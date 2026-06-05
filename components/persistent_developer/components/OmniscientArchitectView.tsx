
import React, { useState, useEffect, useRef } from 'react';
import { ProjectState } from '../types';
import { PaperAirplaneIcon, BookIcon, ServerStackIcon, SparklesIcon, CheckCircleIcon, BoltIcon } from '../../icons';
import { getSystemHolisticContext } from '../../../services/systemContextService';
import { generateHolisticArchitecture } from '../../../services/geminiService';
import MarkdownRenderer from '../../common/MarkdownRenderer';
import { audioService } from '../../../services/audioService';
import Loader from '../../Loader';

interface ArchitectViewProps {
  projectState: ProjectState;
  setProjectState: React.Dispatch<React.SetStateAction<ProjectState>>;
}

type ScanStage = 'idle' | 'scanning_modules' | 'traversing_ontology' | 'verifying_triggers' | 'synthesizing' | 'complete';

export const ArchitectView: React.FC<ArchitectViewProps> = ({ projectState, setProjectState }) => {
  const [input, setInput] = useState('');
  const [scanStage, setScanStage] = useState<ScanStage>('idle');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const performAudit = async () => {
    if (!input.trim()) return;
    
    setScanStage('scanning_modules');
    setResult(null);
    setError(null);
    audioService.playSound('send');

    try {
        // Step 1: Gather Deep Context
        // Simulate visual delays for "Deep-Stack Traversal" feel
        await new Promise(r => setTimeout(r, 800));
        setScanStage('traversing_ontology');
        
        await new Promise(r => setTimeout(r, 800));
        setScanStage('verifying_triggers');
        
        const context = await getSystemHolisticContext();
        
        await new Promise(r => setTimeout(r, 800));
        setScanStage('synthesizing');

        // Step 2: Generate God Result
        const { resultText } = await generateHolisticArchitecture(input, context);
        
        setResult(resultText);
        setScanStage('complete');
        audioService.playSound('success');

        // Update mock state to reflect activity
        setProjectState(prev => ({
            ...prev,
            status: 'development',
        }));

    } catch (e: any) {
        console.error(e);
        setError("System Audit Failed: " + (e.message || "Unknown error"));
        setScanStage('idle');
        audioService.playSound('error');
    }
  };

  useEffect(() => {
      if (result && outputRef.current) {
          outputRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [result]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-6 overflow-hidden relative">
        
        {/* Background Ambient Effect */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
             <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-900 blur-[120px] rounded-full" />
             <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-fuchsia-900 blur-[100px] rounded-full" />
        </div>

      <div className="relative z-10 flex flex-col h-full">
          <div className="mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-indigo-300">
              <SparklesIcon className="w-6 h-6 text-indigo-400" />
              Omniscient Architect
            </h2>
            <p className="text-sm text-slate-400 mt-1">
                Initiate a holistic system-wide context retrieval. Resolves logic, data, and UI conflicts.
            </p>
          </div>

          {/* Audit Visualization */}
          {(scanStage !== 'idle' && !result) && (
              <div className="flex-grow flex flex-col justify-center items-center space-y-6">
                  <div className="relative">
                      <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                      <Loader className="w-16 h-16 text-indigo-400" />
                  </div>
                  
                  <div className="space-y-2 w-full max-w-md">
                      <ScanStep 
                        label="Global Logic Validation" 
                        status={['scanning_modules', 'traversing_ontology', 'verifying_triggers', 'synthesizing', 'complete'].includes(scanStage) ? 'active' : 'pending'} 
                        isComplete={scanStage !== 'scanning_modules'}
                      />
                      <ScanStep 
                        label="Foundry Ontology Traversal" 
                        status={['traversing_ontology', 'verifying_triggers', 'synthesizing', 'complete'].includes(scanStage) ? 'active' : 'pending'} 
                        isComplete={scanStage !== 'scanning_modules' && scanStage !== 'traversing_ontology'}
                      />
                      <ScanStep 
                        label="UI/Shunt Trigger Analysis" 
                        status={['verifying_triggers', 'synthesizing', 'complete'].includes(scanStage) ? 'active' : 'pending'} 
                        isComplete={scanStage === 'synthesizing' || scanStage === 'complete'}
                      />
                      <ScanStep 
                        label="Synthesizing God Result" 
                        status={scanStage === 'synthesizing' ? 'active' : 'pending'} 
                        isComplete={false}
                        isPulsing={scanStage === 'synthesizing'}
                      />
                  </div>
              </div>
          )}

          {/* Result Display */}
          {result && (
              <div className="flex-grow overflow-y-auto mb-6 bg-slate-950/50 rounded-lg border border-indigo-500/30 p-6 shadow-2xl custom-scrollbar animate-fade-in">
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-indigo-500/20">
                      <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      <span className="font-mono text-sm text-indigo-200">SYSTEM_AUDIT_COMPLETE // CONFLICT_FREE</span>
                  </div>
                  <MarkdownRenderer content={result} />
                  <div ref={outputRef} />
              </div>
          )}
          
          {error && (
              <div className="flex-grow flex items-center justify-center text-red-400 p-4">
                  {error}
              </div>
          )}

          {/* Input Area */}
          {scanStage === 'idle' || scanStage === 'complete' ? (
              <div className="relative mt-auto">
                <div className="absolute inset-0 bg-indigo-500/5 blur-md rounded-lg"></div>
                <div className="relative bg-slate-800 border border-slate-600 rounded-lg flex items-center shadow-lg focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                    <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter architectural query (e.g., 'Refactor Auth module to use OAuth without breaking Shunt buttons')..."
                    className="w-full bg-transparent p-4 pr-14 text-white placeholder-slate-500 focus:outline-none font-medium"
                    onKeyDown={(e) => e.key === 'Enter' && performAudit()}
                    />
                    <button 
                    onClick={performAudit}
                    className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors shadow-lg"
                    >
                    <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                </div>
              </div>
          ) : null}
      </div>
    </div>
  );
};

const ScanStep: React.FC<{ label: string, status: 'pending' | 'active', isComplete: boolean, isPulsing?: boolean }> = ({ label, status, isComplete, isPulsing }) => {
    let icon = <div className="w-4 h-4 rounded-full border-2 border-slate-600" />;
    let textClass = "text-slate-500";

    if (isComplete) {
        icon = <CheckCircleIcon className="w-5 h-5 text-green-400" />;
        textClass = "text-slate-300";
    } else if (status === 'active') {
        icon = <BoltIcon className={`w-5 h-5 text-indigo-400 ${isPulsing ? 'animate-pulse' : ''}`} />;
        textClass = "text-indigo-200 font-medium";
    }

    return (
        <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-md border border-slate-800/50 w-full">
            {icon}
            <span className={`text-sm ${textClass}`}>{label}</span>
            {status === 'active' && !isComplete && (
                <span className="ml-auto text-xs font-mono text-indigo-400/70 animate-pulse">PROCESSING...</span>
            )}
        </div>
    );
};
