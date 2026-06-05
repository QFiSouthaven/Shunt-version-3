
// components/app_forge/AppForge.tsx
import React, { useState, useMemo, useActionState, useEffect, useRef } from 'react';
import { useAsyncState } from '../../hooks/useAsyncState';
import { dbService } from '../../services/db';
import { ShuntApp } from '../../types';
import { executeAIRequest } from '../../services/geminiService';
import { generateStandaloneHtml } from '../../services/appExportService';
import { Type } from "@google/genai";
import { 
    CpuChipIcon, BoltIcon, SparklesIcon, TrashIcon, 
    EyeIcon, PlusIcon, ChevronRightIcon,
    DeviceFloppyIcon, TerminalIcon, GlobeAltIcon
} from '../icons';
import Loader from '../Loader';
import { audioService } from '../../services/audioService';
import MarkdownRenderer from '../common/MarkdownRenderer';
import { SafePreview } from './SafePreview'; 
import saveAs from 'file-saver';
import TabFooter from '../common/TabFooter';
import { usePayloadPredictor } from '../../hooks/usePayloadPredictor';

const APP_TEMPLATES = [
    { label: 'Content Creator', description: 'Optimized for summary, amplification, and tone shifting.', icon: '✍️', color: 'fuchsia', instruction: 'You are a professional editor. Focus on condensing or expanding text with high creative fidelity.' },
    { label: 'Logic Architect', description: 'Built for code analysis, refactoring, and technical audits.', icon: '🏗️', color: 'indigo', instruction: 'You are a Senior Full Stack Engineer. Analyze code for React 19 / TS best practices and architectural integrity.' },
    { label: 'Data Miner', description: 'JSON formatting, parsing, and semantic extraction.', icon: '📊', color: 'emerald', instruction: 'You are a data extraction specialist. Strictly output JSON payloads from unstructured text input.' },
    { label: 'Edge Explorer', description: 'WebSocket client for testing Cloudflare Workers.', icon: '🌩️', color: 'cyan', instruction: 'You are an Edge Computing Specialist. Help the user interact with WebSocket-based Cloudflare Workers. Provide template payloads and interpret responses.' },
    { label: 'System Operator', description: 'Generates shell scripts, analyzes logs, and provides DevOps support.', icon: '💻', color: 'slate', instruction: 'You are an expert System Administrator and DevOps Engineer. Provide safe shell scripts and system log analysis.' }
];

const AppForge: React.FC = () => {
    const [installedApps, setInstalledApps] = useAsyncState<ShuntApp[]>('forge_installed_apps', [], dbService.STORES.KEY_VALUE);
    const [view, setView] = useState<'grid' | 'builder' | 'runner' | 'marketplace'>('grid');
    const [selectedApp, setSelectedApp] = useState<ShuntApp | null>(null);
    const [isLivePreviewOpen, setIsLivePreviewOpen] = useState(false);
    
    const [description, setDescription] = useState('');
    const [customIcon, setCustomIcon] = useState('✨');
    const [customColor, setCustomColor] = useState('cyan');

    const [runnerInput, setRunnerInput] = useState('');
    const [runnerOutput, setRunnerOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    const { suggestion, isPredicting, acceptSuggestion } = usePayloadPredictor(selectedApp?.instruction || '', runnerInput);

    const [forgeState, submitForgeAction, isForging] = useActionState(async (prevState: any, formData: FormData) => {
        const desc = formData.get('description') as string;
        const icon = formData.get('icon') as string;
        const color = formData.get('color') as string;

        if (!desc.trim()) return { error: "Description is required." };

        audioService.playSound('send');
        
        try {
            const prompt = `Analyze: "${desc}". Generate a Shunt App manifest (name, description, instruction, category). Icon and Color are provided.
            Icon: ${icon}
            Color: ${color}
            Return JSON strictly.`;
            
            const { resultText } = await executeAIRequest({
                model: 'gemini-3-flash-preview',
                prompt,
                jsonSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        instruction: { type: Type.STRING },
                        category: { type: Type.STRING }
                    },
                    required: ["name", "description", "instruction", "category"]
                }
            });

            const manifest = JSON.parse(resultText);
            const newApp: ShuntApp = { 
                id: crypto.randomUUID(), 
                ...manifest, 
                icon: icon,
                color: color,
                createdAt: new Date().toISOString() 
            };
            
            return { success: true, newApp };
        } catch (e: any) {
            audioService.playSound('error');
            return { error: e.message };
        }
    }, null);

    useEffect(() => {
        if (forgeState?.success && forgeState.newApp) {
            setInstalledApps(prev => [forgeState.newApp, ...prev]);
            audioService.playSound('success');
            setDescription('');
            setCustomIcon('✨');
            setCustomColor('cyan');
            setView('grid');
        }
    }, [forgeState, setInstalledApps]);

    const handleApplyTemplate = (tpl: any) => {
        setDescription(tpl.description);
        setCustomIcon(tpl.icon);
        setCustomColor(tpl.color);
        audioService.playSound('click');
    };

    const handleDeleteApp = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Delete this application?")) {
            setInstalledApps(prev => prev.filter(a => a.id !== id));
            audioService.playSound('click');
        }
    };

    const handleRunApp = async () => {
        if (!selectedApp || !runnerInput.trim() || isRunning) return;
        setIsRunning(true);
        setRunnerOutput('');
        audioService.playSound('send');
        try {
            const { resultText } = await executeAIRequest({
                model: 'gemini-3-pro-preview',
                prompt: runnerInput,
                systemInstruction: selectedApp.instruction,
                config: { temperature: 0.7 }
            });
            setRunnerOutput(resultText);
            audioService.playSound('receive');
        } catch (e) { setRunnerOutput("## EXECUTION_ERROR"); } finally { setIsRunning(false); }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab' && suggestion) {
            e.preventDefault();
            setRunnerInput(acceptSuggestion());
            audioService.playSound('click');
        }
    };

    const installFromMarket = (tpl: typeof APP_TEMPLATES[0]) => {
        const newApp: ShuntApp = {
            id: crypto.randomUUID(),
            name: tpl.label,
            description: tpl.description,
            instruction: tpl.instruction,
            category: 'Utility',
            icon: tpl.icon,
            color: tpl.color,
            createdAt: new Date().toISOString()
        };
        setInstalledApps(prev => [newApp, ...prev]);
        audioService.playSound('success');
        setView('grid');
    };

    return (
        <div className="h-full flex flex-col bg-[#050505] text-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900/30 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <CpuChipIcon className="w-6 h-6 text-indigo-400" />
                        <h2 className="text-lg font-black tracking-tighter uppercase">App Forge</h2>
                    </div>
                    <nav className="flex bg-black/40 rounded-lg p-1 border border-gray-800">
                        <button onClick={() => setView('grid')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${view === 'grid' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}>My Apps</button>
                        <button onClick={() => setView('marketplace')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${view === 'marketplace' ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-500/30' : 'text-gray-500 hover:text-gray-300'}`}>Marketplace</button>
                    </nav>
                </div>
                <div className="flex gap-2">
                    {view === 'runner' && (
                        <button onClick={() => setIsLivePreviewOpen(!isLivePreviewOpen)} className={`px-4 py-1.5 rounded-md border text-xs font-bold transition-all flex items-center gap-2 ${isLivePreviewOpen ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}>
                            <EyeIcon className="w-4 h-4" /> {isLivePreviewOpen ? 'Logic Interface' : 'Live Preview'}
                        </button>
                    )}
                    {view !== 'grid' && view !== 'marketplace' && <button onClick={() => { setView('grid'); setIsLivePreviewOpen(false); }} className="px-4 py-1.5 rounded-md bg-gray-800 text-xs font-bold border border-gray-700">Back</button>}
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-6 relative custom-scrollbar">
                {view === 'grid' && (
                    <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                        <button onClick={() => setView('builder')} className="bg-gray-900/30 border-2 border-dashed border-gray-800 p-5 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:border-indigo-500/50 hover:text-indigo-400 transition-all h-44 gap-2 group">
                            <PlusIcon className="w-10 h-10 transition-transform group-hover:scale-110" />
                            <span className="font-bold uppercase tracking-widest text-[10px]">Manifest New App</span>
                        </button>
                        {installedApps.map(app => (
                            <div key={app.id} onClick={() => { setSelectedApp(app); setView('runner'); }} className={`group relative bg-[#121214] border border-[#ffffff0d] p-5 rounded-2xl hover:bg-[#1a1a1d] hover:border-${app.color || 'white'}-500/30 transition-all cursor-pointer flex flex-col h-44 shadow-xl`}>
                                <button onClick={(e) => handleDeleteApp(app.id, e)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all z-20"><TrashIcon className="w-3 h-3" /></button>
                                <div className="text-3xl mb-4">{app.icon}</div>
                                <div className="flex-grow"><h4 className="font-bold text-gray-100">{app.name}</h4><p className="text-[10px] text-gray-500 line-clamp-2 mt-1">{app.description}</p></div>
                                <div className="flex justify-between items-center mt-2"><span className={`text-[9px] font-mono px-2 py-0.5 rounded bg-${app.color || 'gray'}-900/30 text-${app.color || 'gray'}-400`}>{app.category}</span><ChevronRightIcon className="w-4 h-4 text-gray-700" /></div>
                            </div>
                        ))}
                    </div>
                )}

                {view === 'marketplace' && (
                    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
                        <div className="text-center">
                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Unified Module Market</h3>
                            <p className="text-gray-500 font-mono text-sm mt-2 uppercase tracking-[0.4em]">Curated // Verified // Cognitive</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {APP_TEMPLATES.map((tpl, i) => (
                                <div key={i} className="bg-[#121214] border border-gray-800 p-6 rounded-2xl flex flex-col gap-4 group hover:border-indigo-500/50 transition-all">
                                    <div className="flex justify-between items-start">
                                        <span className="text-4xl">{tpl.icon}</span>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded bg-${tpl.color}-900/30 text-${tpl.color}-400 uppercase`}>Certified</span>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white">{tpl.label}</h4>
                                        <p className="text-xs text-gray-400 mt-2 leading-relaxed">{tpl.description}</p>
                                    </div>
                                    <button 
                                        onClick={() => installFromMarket(tpl)}
                                        className="mt-auto w-full py-2 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                                    >
                                        Install Bundle
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'builder' && (
                    <div className="max-w-4xl mx-auto h-full grid grid-cols-1 md:grid-cols-12 gap-8 animate-fade-in">
                        <div className="md:col-span-4 flex flex-col gap-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Templates</h3>
                            {APP_TEMPLATES.map((tpl, i) => (
                                <button key={i} onClick={() => handleApplyTemplate(tpl)} className="bg-gray-900/40 border border-gray-800 p-4 rounded-xl text-left hover:border-gray-600 transition-all">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-xl">{tpl.icon}</span>
                                        <span className="font-bold text-sm text-gray-200">{tpl.label}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500">{tpl.description}</p>
                                </button>
                            ))}
                        </div>

                        <div className="md:col-span-8 space-y-6">
                            <form action={submitForgeAction} className="aether-panel p-8 space-y-6">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Forging Manifest</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Visual Icon</label>
                                        <input name="icon" value={customIcon} onChange={e => setCustomIcon(e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-white" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Theme Color</label>
                                        <select name="color" value={customColor} onChange={e => setCustomColor(e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-white capitalize">
                                            {['cyan', 'indigo', 'fuchsia', 'emerald', 'amber', 'rose', 'slate'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">App Identity & Logic</label>
                                    <textarea name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the application logic..." className="w-full h-40 bg-black/50 border border-gray-700 rounded-xl p-4 text-gray-200 focus:border-indigo-500 outline-none resize-none" required />
                                </div>
                                {forgeState?.error && <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-sm text-red-300">Error: {forgeState.error}</div>}
                                <button type="submit" disabled={isForging || !description.trim()} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">{isForging ? <span className="flex items-center justify-center gap-2"><Loader className="w-4 h-4"/> Forging...</span> : 'Manifest Standalone Unit'}</button>
                            </form>
                        </div>
                    </div>
                )}

                {view === 'runner' && selectedApp && (
                    <div className="h-full flex flex-col animate-fade-in">
                        {isLivePreviewOpen ? (
                            <div className="h-full w-full">
                                <SafePreview 
                                    title={selectedApp.name}
                                    htmlCode={`<h1>${selectedApp.name}</h1><p>${selectedApp.description}</p>`}
                                    cssCode={`h1 { color: #4f46e5; }`}
                                    jsCode={`console.log("Isolated App Launched: ${selectedApp.name}");`}
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                                <div className={`bg-gray-800/40 border border-${selectedApp.color || 'gray'}-500/20 rounded-xl p-6 flex flex-col h-full shadow-2xl relative`}>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-black uppercase tracking-tighter">{selectedApp.icon} {selectedApp.name}</h3>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest text-${selectedApp.color || 'gray'}-400`}>Logic Interface</span>
                                    </div>
                                    <div className="flex-grow w-full relative group">
                                        <div className="absolute inset-0 p-4 font-mono text-sm pointer-events-none whitespace-pre-wrap overflow-hidden text-transparent z-10" aria-hidden="true">
                                            {runnerInput}<span className="text-gray-500 opacity-50">{suggestion}</span>
                                        </div>
                                        <textarea value={runnerInput} onChange={(e) => setRunnerInput(e.target.value)} onKeyDown={handleInputKeyDown} placeholder="Enter payload..." className="w-full h-full bg-black/30 border border-gray-800 rounded-xl p-4 text-gray-300 font-mono text-sm focus:border-indigo-500 outline-none transition-all resize-none relative z-20 bg-transparent" />
                                        {suggestion && <div className="absolute bottom-4 right-4 text-[10px] text-indigo-400 font-bold bg-indigo-900/30 px-2 py-1 rounded border border-indigo-500/30 animate-pulse z-30 pointer-events-none">TAB to complete</div>}
                                        {isPredicting && <div className="absolute bottom-4 right-4 z-30"><Loader className="w-3 h-3 text-indigo-500" /></div>}
                                    </div>
                                    <div className="flex gap-4 mt-6">
                                        <button onClick={handleRunApp} disabled={isRunning} className="flex-grow py-4 bg-indigo-600 text-white font-bold rounded-xl transition-all active:scale-95 hover:bg-indigo-500 disabled:opacity-50">{isRunning ? 'STREAMS ACTIVE...' : 'EXECUTE'}</button>
                                        <button onClick={() => { 
                                            const html = generateStandaloneHtml(selectedApp);
                                            const blob = new Blob([html], { type: 'text/html' }); 
                                            saveAs(blob, `${selectedApp.name}.html`); 
                                            audioService.playSound('success'); 
                                        }} title="Export Standalone Bundle" className="p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors border border-gray-700 shadow-lg"><DeviceFloppyIcon className="w-6 h-6 text-gray-300" /></button>
                                    </div>
                                </div>
                                <div className="bg-black/60 border border-gray-800 rounded-xl p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
                                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
                                        <div className="flex items-center gap-2">
                                          <TerminalIcon className="w-4 h-4 text-gray-500" />
                                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Neural Stream Output</span>
                                        </div>
                                        {isRunning && <Loader className="w-3 h-3" />}
                                    </div>
                                    <MarkdownRenderer content={runnerOutput || 'Awaiting signal propagation...'} />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <TabFooter />
        </div>
    );
};

export default AppForge;
