
// components/computer/ComputerShunt.tsx
import React, { useRef, useEffect, useState } from 'react';
import { useComputer, ComputerMode, OperationLog } from '../../hooks/useComputer';
import { 
    TerminalIcon, CpuChipIcon, BoltIcon, 
    ServerStackIcon, DocumentChartBarIcon, SignalIcon,
    TrashIcon, CodeIcon, ChevronRightIcon, PlayIcon, SparklesIcon,
    FolderIcon
} from '../icons';
import Loader from '../Loader';
import ContentActions from '../common/ContentActions';
import MarkdownRenderer from '../common/MarkdownRenderer';
import SafeCommandDisplay from './SafeCommandDisplay'; 
import { MCPConnectionStatus } from '../../types/mcp';
import TabFooter from '../common/TabFooter';
import { audioService } from '../../services/audioService';
import { useSystem } from '../../context/SystemContext';
import { FileExplorer } from './FileExplorer';
import { ProcessMonitor } from './ProcessMonitor';

const QUICK_OPS = [
    { label: 'Disk Clean', prompt: 'Find and delete node_modules folders not accessed in 3 months.', icon: <ServerStackIcon className="w-4 h-4"/> },
    { label: 'Port Scan', prompt: 'Check for open ports on localhost and list associated PIDs.', icon: <SignalIcon className="w-4 h-4"/> },
    { label: 'System Info', prompt: 'Display detailed OS version, Kernel, Uptime, and Hardware specs.', icon: <CpuChipIcon className="w-4 h-4"/> },
    { label: 'Log Analysis', prompt: 'Parse /var/log/syslog for critical errors in the last hour.', icon: <DocumentChartBarIcon className="w-4 h-4"/> },
    { label: 'Docker Prune', prompt: 'Remove stopped containers and unused images to free space.', icon: <BoltIcon className="w-4 h-4"/> },
    { label: 'Git Sync', prompt: 'Pull latest changes for all repositories in ~/Projects.', icon: <CodeIcon className="w-4 h-4"/> },
];

const ComputerShunt: React.FC = () => {
    const { state, actions } = useComputer();
    const { dispatch } = useSystem();
    const { input, activeOutput, mode, osInfo, history, isPending, mcpStatus, isExecuting, lastExecResult } = state;
    const { setInput, setMode, executeOperation, clearHistory, deleteHistoryItem, setActiveOutput, runCommandOnHost } = actions;
    
    const [sidebarTab, setSidebarTab] = useState<'ops' | 'explorer'>('ops');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if ((activeOutput || lastExecResult) && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activeOutput, lastExecResult]);

    const getFilename = () => {
        const timestamp = Date.now();
        if (mode === 'script') return `script_${timestamp}.sh`;
        if (mode === 'log') return `analysis_${timestamp}.md`;
        return `commands_${timestamp}.txt`;
    };

    const handleLoadHistory = (item: OperationLog) => {
        setActiveOutput(item.output);
        setMode(item.mode);
        setInput(item.input);
        audioService.playSound('click');
    };

    const handleNeuralPipe = (target: string) => {
        if (!activeOutput) return;
        audioService.playSound('send');
        dispatch({ 
            type: 'PIPELINE_BROADCAST', 
            payload: { source: 'Computer_Module', data: activeOutput, target } 
        });
        alert(`Pipe Established: Output streamed to ${target.toUpperCase()} input.`);
    };

    return (
        <div className="flex flex-col h-full bg-[#050505] text-gray-200 font-mono overflow-hidden">
            <div className="flex-grow flex flex-col md:flex-row h-full overflow-hidden">
                
                {/* Left Panel: Operations & File System */}
                <div className="w-full md:w-1/4 border-r border-gray-800 bg-[#0a0a0a] flex flex-col min-w-[300px]">
                    <div className="p-4 border-b border-gray-800 bg-gray-900/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-900/20 p-1.5 rounded-md border border-green-500/30">
                                <TerminalIcon className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-200 tracking-wider uppercase">System Core</h2>
                                <p className="text-[10px] text-gray-500">Host: {osInfo}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex border-b border-gray-800 bg-black/20">
                        <button 
                            onClick={() => setSidebarTab('ops')}
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${sidebarTab === 'ops' ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-600 hover:text-gray-400'}`}
                        >
                            Directives
                        </button>
                        <button 
                            onClick={() => setSidebarTab('explorer')}
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${sidebarTab === 'explorer' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-gray-600 hover:text-gray-400'}`}
                        >
                            FileSystem
                        </button>
                    </div>

                    <div className="flex-grow overflow-hidden relative">
                        {sidebarTab === 'ops' ? (
                            <div className="h-full overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar">
                                <div className="grid grid-cols-3 gap-2">
                                    {['shell', 'script', 'log'].map((m) => (
                                        <button 
                                            key={m}
                                            onClick={() => setMode(m as ComputerMode)}
                                            className={`py-2 text-[9px] font-bold border rounded uppercase transition-all ${mode === m ? 'bg-green-900/30 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-700'}`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder={mode === 'log' ? "Paste error logs here..." : "Describe the system task..."}
                                        className="w-full h-32 bg-black/60 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 focus:border-green-500 outline-none resize-none font-mono transition-colors"
                                    />
                                    <button
                                        onClick={executeOperation}
                                        disabled={isPending || !input.trim()}
                                        className="w-full py-3 bg-green-700 hover:bg-green-600 text-white font-bold uppercase text-[10px] tracking-widest rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
                                    >
                                        {isPending ? <Loader className="w-4 h-4 text-white" /> : <BoltIcon className="w-4 h-4" />}
                                        {isPending ? 'PROCESSING...' : 'EXECUTE_SHUNT'}
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-1">Tactical Assets</h3>
                                    {QUICK_OPS.map(op => (
                                        <button
                                            key={op.label}
                                            onClick={() => { setInput(op.prompt); audioService.playSound('click'); }}
                                            className="w-full flex items-center gap-3 p-2.5 bg-gray-900/40 border border-gray-800 rounded-lg hover:border-green-500/30 transition-all text-left group"
                                        >
                                            <div className="text-gray-500 group-hover:text-green-400 transition-colors">{op.icon}</div>
                                            <div className="text-[10px] font-bold text-gray-400 group-hover:text-white uppercase tracking-tight">{op.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full p-4 overflow-hidden flex flex-col">
                                <FileExplorer onFileSelect={(content, path) => {
                                    setInput(prev => `Processing file: ${path}\n\nContent:\n${content.substring(0, 1000)}\n\nDirective: [Describe what to do with this file]`);
                                }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Middle Panel: Output Terminal */}
                <div className="flex-grow bg-[#0c0c0c] flex flex-col relative overflow-hidden">
                    <div className="p-2 border-b border-gray-800 bg-black flex justify-between items-center h-[53px] flex-shrink-0">
                        <div className="flex items-center gap-2 px-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                        </div>
                        <div className="flex items-center gap-4">
                            {activeOutput && (
                                <div className="flex items-center gap-2 animate-fade-in">
                                    <div className="flex gap-1 border-r border-gray-800 pr-3 mr-1">
                                        <button 
                                            onClick={() => handleNeuralPipe('shunt')}
                                            className="p-1 rounded bg-fuchsia-900/20 text-fuchsia-400 hover:bg-fuchsia-900/40 border border-fuchsia-800/30 transition-all group relative"
                                        >
                                            <SparklesIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={() => handleNeuralPipe('chat')}
                                            className="p-1 rounded bg-indigo-900/20 text-indigo-400 hover:bg-indigo-900/40 border border-indigo-800/30 transition-all group relative"
                                        >
                                            <CpuChipIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <ContentActions content={activeOutput} filename={getFilename()} />
                                </div>
                            )}
                            <div className="flex items-center gap-2 px-2 py-1 bg-gray-900/50 rounded border border-gray-800">
                                <span className={`w-1.5 h-1.5 rounded-full ${mcpStatus === MCPConnectionStatus.Connected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wide">
                                    {mcpStatus === MCPConnectionStatus.Connected ? 'LINKED' : 'OFFLINE'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div 
                        ref={scrollRef}
                        className="flex-grow p-6 overflow-y-auto custom-scrollbar relative bg-black/40"
                    >
                        {!activeOutput && !isPending && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-800 select-none opacity-20">
                                <TerminalIcon className="w-24 h-24 mb-6" />
                                <p className="font-mono text-sm tracking-widest uppercase">Kernel Idle</p>
                            </div>
                        )}
                        
                        {isPending && (
                            <div className="space-y-2 font-mono text-[10px] text-green-400/60">
                                <div className="flex items-center gap-2"><span>$</span><span>analyzing_environmental_context...</span></div>
                                <div className="flex items-center gap-2"><span>$</span><span className="animate-pulse">performing_security_audit_v2.0...</span></div>
                            </div>
                        )}

                        {activeOutput && (
                            <div className="animate-fade-in space-y-6">
                                {mode !== 'log' ? (
                                    <SafeCommandDisplay 
                                        command={activeOutput} 
                                        onExecute={runCommandOnHost}
                                        isExecuting={isExecuting}
                                    />
                                ) : (
                                    <div className="text-xs text-gray-300 leading-relaxed prose prose-invert max-w-none">
                                        <MarkdownRenderer content={activeOutput} />
                                    </div>
                                )}
                            </div>
                        )}

                        {lastExecResult && (
                            <div className="mt-8 animate-fade-in">
                                <div className="flex items-center gap-2 mb-2 text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                                    <TerminalIcon className="w-3.5 h-3.5" /> Host Response
                                </div>
                                <div className="bg-[#050505] border border-indigo-900/50 p-4 rounded font-mono text-[11px] text-indigo-300/90 whitespace-pre-wrap shadow-inner leading-relaxed">
                                    {lastExecResult}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Vitals Monitor */}
                <div className="hidden lg:flex w-64 border-l border-gray-800 bg-[#0a0a0a] flex-col p-4 flex-shrink-0">
                    <ProcessMonitor />
                    
                    <div className="mt-4 p-3 bg-gray-900/30 border border-gray-800 rounded-lg">
                        <h3 className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-3">Recent Cycles</h3>
                        <div className="space-y-2 overflow-y-auto max-h-48 custom-scrollbar">
                            {history.slice(0, 5).map(h => (
                                <div key={h.id} className="p-1.5 border-l border-gray-700 hover:border-green-500 transition-colors cursor-pointer" onClick={() => handleLoadHistory(h)}>
                                    <div className="text-[10px] text-gray-400 truncate">{h.input}</div>
                                    <div className="text-[8px] text-gray-600 uppercase">{h.mode} // {new Date(h.timestamp).toLocaleTimeString()}</div>
                                </div>
                            ))}
                            {history.length === 0 && <div className="text-[9px] text-gray-700 italic">No history.</div>}
                        </div>
                    </div>
                </div>
            </div>
            <TabFooter />
        </div>
    );
};

export default ComputerShunt;
