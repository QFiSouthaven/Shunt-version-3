
import React, { useState, useEffect, useCallback } from 'react';
import { AgentManifest, ExecutionRecord, GeneratedTest } from '../../types/agentSystem';
import { getAgentHistory, saveExecutionRecord, generateIntegrationTest, optimizeAgent } from '../../services/evolutionaryService';
import { generateRawText } from '../../services/geminiService';
import { BoltIcon, PlayIcon, ShieldCheckIcon, HistoryIcon, SparklesIcon, CheckCircleIcon, XMarkIcon, RocketLaunchIcon } from '../icons';
import Loader from '../Loader';
import { v4 as uuidv4 } from 'uuid';
import { audioService } from '../../services/audioService';
import { agentManagementService } from '../../services/agentManagement.service';
import { appEventBus } from '../../lib/eventBus';

interface CriticStudioProps {
    selectedId?: string | null;
}

const CriticStudio: React.FC<CriticStudioProps> = ({ selectedId }) => {
    // State
    const [agents, setAgents] = useState<AgentManifest[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(selectedId || null);
    const [history, setHistory] = useState<ExecutionRecord[]>([]);
    const [activeTest, setActiveTest] = useState<GeneratedTest | null>(null);
    const [testInput, setTestInput] = useState('');
    const [testOutput, setTestOutput] = useState('');
    const [testScore, setTestScore] = useState<number>(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizationResult, setOptimizationResult] = useState<any | null>(null);
    
    // Sync with props
    useEffect(() => {
        if (selectedId !== undefined) {
            setSelectedAgentId(selectedId);
        }
    }, [selectedId]);

    // Load agents from service
    useEffect(() => {
        const state = agentManagementService.getState();
        setAgents(state.agents);

        // Listen for updates (e.g. if created elsewhere)
        const unsubscribe = appEventBus.on('telemetry', (payload) => {
            if (payload.type === 'agent_registry_update') {
                setAgents(payload.data.agents);
            }
        });
        return () => unsubscribe();
    }, []);

    const selectedAgent = agents.find(a => a.id === selectedAgentId);

    // Load History
    useEffect(() => {
        if (selectedAgentId) {
            getAgentHistory(selectedAgentId).then(setHistory);
        }
    }, [selectedAgentId]);

    const handleGenerateTest = async () => {
        if (!selectedAgent) return;
        setIsRunning(true);
        try {
            const test = await generateIntegrationTest(selectedAgent);
            setActiveTest(test);
            setTestInput(test.input);
            setTestOutput('');
            audioService.playSound('success');
        } finally {
            setIsRunning(false);
        }
    };

    const handleRunTest = async () => {
        if (!selectedAgent || !testInput) return;
        setIsRunning(true);
        audioService.playSound('send');
        
        try {
            const start = Date.now();
            // Using raw text generation for the agent execution simulation
            const systemPrompt = selectedAgent.systemInstruction;
            const { resultText } = await generateRawText(`${systemPrompt}\n\nUser: ${testInput}`, selectedAgent.modelConfig?.model || 'gemini-3-flash-preview');
            const duration = Date.now() - start;
            
            setTestOutput(resultText);
            audioService.playSound('receive');

            // Auto-save this run (unscored initially)
            const record: ExecutionRecord = {
                id: uuidv4(),
                agentId: selectedAgent.id!,
                agentVersion: selectedAgent.version,
                timestamp: new Date().toISOString(),
                input: testInput,
                output: resultText,
                durationMs: duration
            };
            await saveExecutionRecord(record);
            setHistory(prev => [record, ...prev]);

        } catch (e) {
            console.error(e);
            audioService.playSound('error');
        } finally {
            setIsRunning(false);
        }
    };

    const handleScore = async (score: number) => {
        setTestScore(score);
        if (history.length > 0) {
            const latest = history[0];
            latest.score = score;
            await saveExecutionRecord(latest); // Update DB
            setHistory([...history]); // Update UI
            audioService.playSound('click');
        }
    };

    const handleOptimize = async () => {
        if (!selectedAgent) return;
        setIsOptimizing(true);
        audioService.playSound('send');
        
        try {
            const report = await optimizeAgent(selectedAgent, history);
            setOptimizationResult(report);
            audioService.playSound('success');
        } catch (e) {
            console.error(e);
            audioService.playSound('error');
        } finally {
            setIsOptimizing(false);
        }
    };

    const applyOptimization = async () => {
        if (!optimizationResult || !selectedAgent) return;
        
        await agentManagementService.saveAgent(optimizationResult.improvedManifest);
        
        setOptimizationResult(null);
        setActiveTest(null);
        setTestOutput('');
        audioService.playSound('success');
    };

    return (
        <div className="flex h-full bg-[#050505] text-gray-200 overflow-hidden">
            {/* Left: Agent & History */}
            <div className="w-64 border-r border-gray-800 bg-[#0a0a0a] flex flex-col">
                <div className="p-4 border-b border-gray-800 bg-gray-900/50">
                    <h3 className="text-sm font-bold text-fuchsia-400 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4" /> The Critic
                    </h3>
                </div>
                <div className="p-4 border-b border-gray-800">
                    <label className="text-xs text-gray-500 uppercase font-bold">Subject</label>
                    <select 
                        className="w-full mt-2 bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white"
                        value={selectedAgentId || ''}
                        onChange={e => setSelectedAgentId(e.target.value)}
                    >
                        <option value="">Select Agent...</option>
                        {agents.map(a => <option key={a.id} value={a.id}>{a.name} (v{a.version})</option>)}
                    </select>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-3">
                    <h4 className="text-xs text-gray-500 uppercase font-bold flex items-center gap-2"><HistoryIcon className="w-3 h-3"/> Evolution Memory</h4>
                    {history.length === 0 && <p className="text-xs text-gray-600 italic">No runs recorded.</p>}
                    {history.map(run => (
                        <div key={run.id} className="p-2 bg-gray-900/50 rounded border border-gray-800 text-xs">
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-400">{new Date(run.timestamp).toLocaleTimeString()}</span>
                                <span className={`font-bold ${run.score && run.score > 7 ? 'text-green-400' : run.score && run.score < 5 ? 'text-red-400' : 'text-gray-500'}`}>
                                    {run.score !== undefined ? `Score: ${run.score}` : 'Unscored'}
                                </span>
                            </div>
                            <div className="truncate text-gray-500">{run.input}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Center: Test Arena */}
            <div className="flex-1 flex flex-col border-r border-gray-800">
                <div className="p-4 border-b border-gray-800 bg-gray-900/30 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white">Test Arena</h3>
                    <button 
                        onClick={handleGenerateTest}
                        disabled={!selectedAgent || isRunning}
                        className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-cyan-400 rounded border border-gray-700 flex items-center gap-2"
                    >
                        <SparklesIcon className="w-3 h-3" /> Auto-Gen Test
                    </button>
                </div>
                
                <div className="flex-grow p-6 overflow-y-auto space-y-6">
                    {/* Prompt Box */}
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Test Input</label>
                        <textarea 
                            value={testInput}
                            onChange={e => setTestInput(e.target.value)}
                            className="w-full bg-[#0f0f0f] border border-gray-700 rounded p-3 text-sm text-gray-200 font-mono h-32 resize-none focus:border-cyan-500 outline-none"
                            placeholder="Enter prompt to test..."
                        />
                        {activeTest && (
                            <div className="mt-2 text-xs text-gray-500 bg-gray-900/50 p-2 rounded">
                                <span className="font-bold text-cyan-500">Evaluation Criteria:</span>
                                <ul className="list-disc list-inside mt-1">
                                    {activeTest.expectedCriteria.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={handleRunTest}
                            disabled={!testInput || isRunning}
                            className="px-8 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-full shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isRunning ? <Loader className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                            Run Simulation
                        </button>
                    </div>

                    {/* Output Box */}
                    {testOutput && (
                        <div className="animate-fade-in">
                            <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Agent Output</label>
                            <div className="w-full bg-[#0f0f0f] border border-gray-700 rounded p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap">
                                {testOutput}
                            </div>
                            
                            {/* Scoring */}
                            <div className="mt-4 flex items-center gap-4 bg-gray-900/50 p-3 rounded border border-gray-800">
                                <span className="text-xs font-bold text-gray-400 uppercase">Grade Performance:</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => handleScore(n)}
                                            className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                                                testScore === n 
                                                    ? 'bg-fuchsia-600 text-white scale-110' 
                                                    : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-white'
                                            }`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Optimizer */}
            <div className="w-80 bg-[#0a0a0a] flex flex-col border-l border-gray-800">
                <div className="p-4 border-b border-gray-800 bg-gray-900/50">
                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <BoltIcon className="w-4 h-4" /> Optimizer
                    </h3>
                </div>
                
                <div className="flex-grow p-4 overflow-y-auto">
                    {!optimizationResult ? (
                        <div className="text-center mt-10">
                            <p className="text-xs text-gray-500 mb-4">
                                The Optimizer analyzes execution history and scores to refine the agent's instructions.
                            </p>
                            <button 
                                onClick={handleOptimize}
                                disabled={!selectedAgent || isOptimizing}
                                className="w-full py-3 bg-emerald-900/30 border border-emerald-600/50 text-emerald-400 rounded hover:bg-emerald-900/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isOptimizing ? <Loader className="w-4 h-4" /> : <RocketLaunchIcon className="w-4 h-4" />}
                                Optimize Agent
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-gray-900 border border-gray-800 p-3 rounded">
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Critique</h4>
                                <p className="text-xs text-gray-300 italic">"{optimizationResult.critique}"</p>
                            </div>
                            
                            <div>
                                <h4 className="text-xs font-bold text-emerald-500 uppercase mb-2">Changes</h4>
                                <ul className="space-y-1">
                                    {optimizationResult.changes.map((c: string, i: number) => (
                                        <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                                            <CheckCircleIcon className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                                            {c}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-4 border-t border-gray-800">
                                <button 
                                    onClick={applyOptimization}
                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded shadow-lg flex items-center justify-center gap-2"
                                >
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Apply & Evolve to v{optimizationResult.improvedManifest.version}
                                </button>
                                <button 
                                    onClick={() => setOptimizationResult(null)}
                                    className="w-full py-2 mt-2 text-gray-500 hover:text-white text-xs"
                                >
                                    Discard
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CriticStudio;
