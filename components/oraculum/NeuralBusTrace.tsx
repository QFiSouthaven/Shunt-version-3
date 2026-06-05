
// components/oraculum/NeuralBusTrace.tsx
import React, { useMemo } from 'react';
import { useSystem } from '../../context/SystemContext';
import { BoltIcon, SignalIcon, SparklesIcon, ServerStackIcon } from '../icons';

export const NeuralBusTrace: React.FC = () => {
    const { state } = useSystem();
    const { history } = state.neuralBus;

    const getIcon = (source: string) => {
        if (source.includes('Cortex')) return <SignalIcon className="w-3.5 h-3.5 text-fuchsia-500" />;
        if (source.includes('Agent')) return <SparklesIcon className="w-3.5 h-3.5 text-indigo-400" />;
        if (source.includes('Computer')) return <BoltIcon className="w-3.5 h-3.5 text-green-400" />;
        return <ServerStackIcon className="w-3.5 h-3.5 text-gray-500" />;
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] border border-gray-800 rounded-lg overflow-hidden">
            <header className="p-3 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <BoltIcon className="w-4 h-4 text-fuchsia-500 animate-pulse" />
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Neural Bus Trace</h3>
                </div>
                <span className="text-[10px] font-mono text-gray-600">LIVE // SYS_PIPE_INTERCEPT</span>
            </header>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 select-none grayscale">
                        <BoltIcon className="w-12 h-12 mb-4" />
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em]">Awaiting signal propagation...</p>
                    </div>
                ) : (
                    history.map((broadcast, i) => (
                        <div key={i} className="group relative flex flex-col gap-2 p-3 bg-gray-900/40 border border-gray-800 rounded-lg hover:border-fuchsia-500/30 transition-all animate-fade-in">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    {getIcon(broadcast.source)}
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                        Source: <span className="text-fuchsia-400">{broadcast.source}</span>
                                    </span>
                                </div>
                                <span className="text-[9px] text-gray-600 font-mono">
                                    {new Date(broadcast.timestamp).toLocaleTimeString()}
                                </span>
                            </div>

                            <div className="pl-5 border-l border-gray-800">
                                <div className="text-[11px] text-gray-300 font-mono break-all line-clamp-3 group-hover:line-clamp-none transition-all">
                                    {typeof broadcast.data === 'object' ? JSON.stringify(broadcast.data) : String(broadcast.data)}
                                </div>
                                {broadcast.target && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="h-px w-3 bg-gray-700" />
                                        <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">
                                            &rarr; Target: {broadcast.target}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <footer className="p-2 border-t border-gray-800 bg-black/40 text-[9px] text-gray-600 flex justify-between items-center font-mono">
                <span>BUFFER_DEPTH: 50</span>
                <span className="text-emerald-500/50">ENCRYPTION: AES-GCM_256</span>
            </footer>
        </div>
    );
};
