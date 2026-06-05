
import React, { useState, useEffect } from 'react';
import OptimizedTextarea from '../common/OptimizedTextarea';
import { AgentFactory } from '../../services/agentFactory';
import { AgentManifest } from '../../types/agentSystem';
import { BoltIcon, CheckCircleIcon, ErrorIcon, PlayIcon, CodeIcon } from '../icons';
import { audioService } from '../../services/audioService';
import Loader from '../Loader';
import { agentManagementService } from '../../services/agentManagement.service';

const DEFAULT_MANIFEST_JSON = JSON.stringify({
    name: "Code Reviewer Alpha",
    role: "Senior Software Engineer",
    description: "Analyzes code for bugs and security flaws.",
    capabilities: ["code_analysis"],
    modelConfig: {
        model: "gemini-3-pro-preview",
        temperature: 0.2
    },
    systemInstruction: "You are a strict code reviewer. Analyze the input code for logical errors, security vulnerabilities, and style violations. Be concise and actionable.",
    tools: ["read_file", "list_files"]
}, null, 2);

interface AgentFactoryViewProps {
    selectedId?: string | null;
}

const AgentFactoryView: React.FC<AgentFactoryViewProps> = ({ selectedId }) => {
    const [jsonInput, setJsonInput] = useState(DEFAULT_MANIFEST_JSON);
    const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
    const [errors, setErrors] = useState<string[]>([]);
    const [activeAgent, setActiveAgent] = useState<any>(null);
    const [testInput, setTestInput] = useState('');
    const [testOutput, setTestOutput] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);

    useEffect(() => {
        if (selectedId) {
            const state = agentManagementService.getState();
            const agent = state.agents.find(a => a.id === selectedId);
            if (agent) {
                setJsonInput(JSON.stringify(agent, null, 2));
                // Reset validation so user has to explicitly validate/build the loaded manifest
                setValidationStatus('idle');
                setActiveAgent(null);
                setErrors([]);
            }
        }
    }, [selectedId]);

    const handleValidate = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            const result = AgentFactory.validateManifest(parsed);
            
            if (result.valid && result.manifest) {
                setValidationStatus('valid');
                setErrors([]);
                const agent = AgentFactory.createAgent(result.manifest);
                setActiveAgent(agent);
                audioService.playSound('success');
            } else {
                setValidationStatus('invalid');
                setErrors(result.errors);
                setActiveAgent(null);
                audioService.playSound('error');
            }
        } catch (e: any) {
            setValidationStatus('invalid');
            setErrors([`JSON Syntax Error: ${e.message}`]);
            setActiveAgent(null);
            audioService.playSound('error');
        }
    };

    const handleExecute = async () => {
        if (!activeAgent || !testInput.trim()) return;
        setIsExecuting(true);
        setTestOutput('');
        audioService.playSound('send');
        
        try {
            const response = await activeAgent.execute(testInput);
            setTestOutput(response);
            audioService.playSound('receive');
        } catch (e: any) {
            setTestOutput(`Execution Error: ${e.message}`);
            audioService.playSound('error');
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="flex h-full bg-[#050505] text-gray-200 overflow-hidden">
            {/* Left: Definition */}
            <div className="w-1/2 border-r border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-fuchsia-400 uppercase tracking-widest flex items-center gap-2">
                        <CodeIcon className="w-4 h-4" /> Agent Manifest (JSON)
                    </h3>
                    <button 
                        onClick={handleValidate}
                        className="text-xs bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-3 py-1.5 rounded flex items-center gap-2 transition-colors font-bold"
                    >
                        <CheckCircleIcon className="w-3 h-3" /> Validate & Build
                    </button>
                </div>
                <div className="flex-grow relative">
                    <OptimizedTextarea 
                        value={jsonInput} 
                        onChange={e => setJsonInput(e.target.value)} 
                        className="w-full h-full bg-[#0a0a0a] p-4 font-mono text-xs text-gray-300 resize-none outline-none leading-relaxed"
                        spellCheck={false}
                    />
                </div>
                {validationStatus !== 'idle' && (
                    <div className={`p-4 border-t border-gray-800 ${validationStatus === 'valid' ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                        {validationStatus === 'valid' ? (
                            <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
                                <CheckCircleIcon className="w-4 h-4" />
                                Manifest Validated. Agent Ready.
                            </div>
                        ) : (
                            <div className="text-red-400 text-xs">
                                <div className="flex items-center gap-2 font-bold mb-1">
                                    <ErrorIcon className="w-4 h-4" />
                                    Validation Failed
                                </div>
                                <ul className="list-disc list-inside pl-1 space-y-1">
                                    {errors.map((err, i) => <li key={i}>{err}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right: Test Arena */}
            <div className="w-1/2 flex flex-col bg-[#0a0a0a]">
                <div className="p-4 border-b border-gray-800 bg-gray-900/50">
                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                        <BoltIcon className="w-4 h-4" /> Test Arena
                    </h3>
                </div>
                <div className="flex-grow p-6 flex flex-col gap-4 overflow-y-auto">
                    {!activeAgent ? (
                        <div className="flex-grow flex items-center justify-center text-gray-600 text-sm italic">
                            Validate a manifest to initialize the test arena.
                        </div>
                    ) : (
                        <>
                            <div className="bg-gray-800/50 border border-gray-700 rounded p-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Active Agent</h4>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                        {activeAgent.manifest.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{activeAgent.manifest.name}</p>
                                        <p className="text-xs text-gray-500">{activeAgent.manifest.role} • {activeAgent.manifest.modelConfig.model}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-grow flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Input</label>
                                <textarea 
                                    value={testInput}
                                    onChange={e => setTestInput(e.target.value)}
                                    placeholder="Enter a prompt for the agent..."
                                    className="w-full h-32 bg-black border border-gray-700 rounded p-3 text-sm text-gray-200 outline-none focus:border-cyan-500 transition-colors resize-none"
                                />
                                <button 
                                    onClick={handleExecute}
                                    disabled={isExecuting || !testInput}
                                    className="self-end px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isExecuting ? <Loader className="w-3 h-3" /> : <PlayIcon className="w-3 h-3" />}
                                    Execute
                                </button>
                            </div>

                            <div className="flex-grow flex flex-col gap-2 min-h-[200px]">
                                <label className="text-xs font-bold text-gray-500 uppercase">Output</label>
                                <div className="w-full flex-grow bg-black border border-gray-700 rounded p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap overflow-y-auto">
                                    {testOutput || <span className="text-gray-700 italic">Waiting for execution...</span>}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgentFactoryView;
