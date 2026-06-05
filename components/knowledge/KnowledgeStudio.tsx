
// components/knowledge/KnowledgeStudio.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { dbService } from '../../services/db';
import { VirtualFile } from '../../types';
import { VectorRecord } from '../../services/etlService';
// Fixed: Removed non-existent SearchIcon from imports
import { 
    DatabaseIcon, SparklesIcon, TrashIcon, 
    ChevronRightIcon, BookIcon, GlobeAltIcon, TerminalIcon,
    ArrowPathIcon, PlusIcon
} from '../icons';
import Loader from '../Loader';
import { requestIntelligence } from '../../services/IntelligenceRouter';
import { generateMockEmbedding } from '../../services/etlService';
import MarkdownRenderer from '../common/MarkdownRenderer';
import { audioService } from '../../services/audioService';
import TabFooter from '../common/TabFooter';
// Fixed: Added missing appEventBus import
import { appEventBus } from '../../lib/eventBus';

const KnowledgeStudio: React.FC = () => {
    const [vectors, setVectors] = useState<VectorRecord[]>([]);
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedChunk, setSelectedChunk] = useState<VectorRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const all = await dbService.getAll<VectorRecord>(dbService.STORES.VECTORS);
            setVectors(all);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        audioService.playSound('send');
        
        try {
            const queryVector = generateMockEmbedding(query);
            const results = await dbService.queryVectors(queryVector, 5);
            setSearchResults(results);
            audioService.playSound('receive');
        } catch (e) {
            console.error(e);
            audioService.playSound('error');
        } finally {
            setIsSearching(false);
        }
    };

    const clearStore = async () => {
        if (confirm("Purge global vector store? This cannot be undone.")) {
            await dbService.clear(dbService.STORES.VECTORS);
            loadData();
            setSearchResults([]);
            audioService.playSound('tab_switch');
        }
    };

    const uniqueFiles = Array.from(new Set(vectors.map(v => v.metadata.path)));

    return (
        <div className="flex flex-col h-full bg-[#050505] text-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900/30 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-3">
                    <DatabaseIcon className="w-6 h-6 text-emerald-400" />
                    <div>
                        <h2 className="text-lg font-black tracking-tighter uppercase">Knowledge Studio</h2>
                        <p className="text-[10px] text-gray-500 font-mono">VECTOR_STORE: LANCE_SIM // DIM: 384</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadData} className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:text-white transition-colors">
                        <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={clearStore} className="p-2 bg-red-900/20 border border-red-900/30 rounded-lg text-red-400 hover:bg-red-900/40 transition-all">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-grow flex flex-col lg:flex-row h-full overflow-hidden">
                {/* Collection Browser */}
                <div className="w-full lg:w-80 border-r border-gray-800 bg-[#0a0a0a] flex flex-col">
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Inventory</span>
                        <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-emerald-400 font-mono">{vectors.length} Chunks</span>
                    </div>
                    <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {uniqueFiles.map(path => (
                            <button 
                                key={path}
                                onClick={() => setQuery(`In file ${path}: `)}
                                className="w-full text-left p-2.5 rounded-lg hover:bg-white/5 transition-all group flex items-center gap-3 border border-transparent hover:border-gray-800"
                            >
                                <BookIcon className="w-4 h-4 text-gray-500 group-hover:text-cyan-400" />
                                <div className="flex-grow min-w-0">
                                    <div className="text-[11px] font-bold text-gray-300 truncate">{path.split('/').pop()}</div>
                                    <div className="text-[9px] text-gray-600 truncate">{path}</div>
                                </div>
                                <ChevronRightIcon className="w-3 h-3 text-gray-800 group-hover:text-gray-400" />
                            </button>
                        ))}
                        {uniqueFiles.length === 0 && !isLoading && (
                            <div className="p-8 text-center text-gray-600 italic text-xs">
                                <PlusIcon className="w-10 h-10 mx-auto mb-2 opacity-10" />
                                <p>No files ingested.<br/>Use Docs module to populate.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search & Discovery Area */}
                <div className="flex-grow flex flex-col bg-[#0c0c0e]">
                    <div className="p-6 border-b border-gray-800 bg-black/20">
                        <form onSubmit={handleSearch} className="relative group max-w-2xl mx-auto">
                            <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="relative flex items-center bg-[#121214] border border-gray-800 rounded-2xl p-1.5 shadow-2xl focus-within:border-emerald-500/50 transition-all">
                                <div className="p-3 text-emerald-400">
                                    <SparklesIcon className="w-6 h-6" />
                                </div>
                                <input 
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Semantic search through project knowledge..."
                                    className="flex-grow bg-transparent border-none outline-none text-white text-lg px-2"
                                />
                                <button 
                                    type="submit"
                                    disabled={isSearching || !query.trim()}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-30"
                                >
                                    {isSearching ? <Loader className="w-5 h-5" /> : 'Search'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
                        <div className="max-w-4xl mx-auto space-y-6">
                            {searchResults.length > 0 ? (
                                searchResults.map((res, i) => (
                                    <div 
                                        key={res.id} 
                                        onClick={() => setSelectedChunk(res)}
                                        className={`p-5 rounded-2xl border transition-all cursor-pointer animate-fade-in ${selectedChunk?.id === res.id ? 'bg-emerald-900/10 border-emerald-500/50 ring-1 ring-emerald-500/20' : 'bg-gray-900/40 border-gray-800 hover:border-gray-600'}`}
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-black flex items-center justify-center text-[10px] font-bold text-emerald-400 border border-emerald-900/50">{i + 1}</div>
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{res.metadata.path}</span>
                                            </div>
                                            <span className="text-[10px] font-mono text-emerald-500">SIM: {(res.score * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="text-sm text-gray-300 leading-relaxed font-sans line-clamp-3">
                                            {res.metadata.text}
                                        </div>
                                    </div>
                                ))
                            ) : !isSearching && query.trim() === '' && (
                                <div className="h-full flex flex-col items-center justify-center py-20 opacity-20">
                                    <GlobeAltIcon className="w-32 h-32 mb-6" />
                                    <p className="text-xl font-black uppercase tracking-[0.3em]">Knowledge Aether</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Inspector Panel */}
                {selectedChunk && (
                    <div className="w-full lg:w-96 border-l border-gray-800 bg-[#0a0a0a] flex flex-col animate-fade-in">
                        <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Chunk Inspector</h3>
                            <button onClick={() => setSelectedChunk(null)} className="text-gray-500 hover:text-white transition-colors">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Source Path</label>
                                    <div className="text-xs font-mono text-cyan-400 break-all bg-black/40 p-2 rounded border border-gray-800">{selectedChunk.metadata.path}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Vector Snippet</label>
                                    <div className="text-xs text-gray-400 leading-relaxed bg-black/40 p-4 rounded border border-gray-800">
                                        <MarkdownRenderer content={selectedChunk.metadata.text} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Embedding Sample</label>
                                    <div className="grid grid-cols-8 gap-1">
                                        {selectedChunk.vector.slice(0, 16).map((v, i) => (
                                            <div key={i} className="h-1 bg-emerald-500/50 rounded" style={{ opacity: Math.abs(v) }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => {
                                    audioService.playSound('send');
                                    // Fixed: Using imported appEventBus to emit event
                                    appEventBus.emit('inject_chat_message', `Analyze this knowledge chunk from ${selectedChunk.metadata.path}:\n\n${selectedChunk.metadata.text}`);
                                    alert("Piped to Neural Interface.");
                                }}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
                            >
                                <TerminalIcon className="w-4 h-4 inline mr-2" /> Pipe to Chat
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <TabFooter />
        </div>
    );
};

export default KnowledgeStudio;
