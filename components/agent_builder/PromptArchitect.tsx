
// components/agent_builder/PromptArchitect.tsx
import React, { useState, useEffect } from 'react';
import { generateRawText } from '../../services/geminiService';
import { BUILDER_AGENT_PROMPT, CLAUDE_CODE_CONSTRAINT } from '../../services/prompts';
import MarkdownRenderer from '../common/MarkdownRenderer';
import ContentActions from '../common/ContentActions';
import { SparklesIcon, BoltIcon, TerminalIcon } from '../icons';
import Loader from '../Loader';
import { audioService } from '../../services/audioService';
import { agentManagementService } from '../../services/agentManagement.service';
import ToggleSwitch from '../common/ToggleSwitch';

interface PromptArchitectProps {
    selectedId?: string | null;
}

const PromptArchitect: React.FC<PromptArchitectProps> = ({ selectedId }) => {
    const [goal, setGoal] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isClaudeMode, setIsClaudeMode] = useState(false);

    useEffect(() => {
        if (selectedId) {
            const state = agentManagementService.getState();
            const agent = state.agents.find(a => a.id === selectedId);
            if (agent) {
                setGoal(`Refine the following agent persona:\nName: ${agent.name}\nRole: ${agent.role}\nCurrent Instructions:\n${agent.systemInstruction}`);
            }
        }
    }, [selectedId]);

    const handleFabricate = async () => {
        if (!goal.trim() || isLoading) return;
        
        setIsLoading(true);
        audioService.playSound('send');
        setResult(null);

        try {
            // Logic Fork: If Claude Code mode is active, inject constraints
            const systemContext = isClaudeMode 
                ? `${BUILDER_AGENT_PROMPT}\n\n${CLAUDE_CODE_CONSTRAINT}`
                : BUILDER_AGENT_PROMPT;

            const fullPrompt = `${systemContext}\n\nUser Request: ${goal}`;
            
            const { resultText } = await generateRawText(fullPrompt, 'gemini-3-pro-preview');
            setResult(resultText);
            audioService.playSound('success');
        } catch (error) {
            console.error("Builder Agent failed:", error);
            audioService.playSound('error');
            setResult("## Error\n\nThe Builder Agent encountered a neural interrupt. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`flex flex-col h-full bg-[#050505] text-gray-200 transition-colors duration-500 ${isClaudeMode ? 'bg-[#1a1510]' : ''}`}>
            <div className={`p-4 border-b border-gray-800 flex justify-between items-center flex-shrink-0 ${isClaudeMode ? 'bg-orange-950/20' : 'bg-gray-900/50'}`}>
                <div>
                    <h2 className={`text-lg font-bold flex items-center gap-2 ${isClaudeMode ? 'text-orange-400' : 'text-fuchsia-400'}`}>
                        {isClaudeMode ? <TerminalIcon className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                        {isClaudeMode ? 'Claude Code Architect' : 'Prompt Architect'}
                    </h2>
                    <p className="text-xs text-gray-500 font-mono">
                        {isClaudeMode ? 'Target: Claude Code CLI Environment' : 'Powered by Builder Agent Protocol'}
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-gray-700">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isClaudeMode ? 'text-orange-400' : 'text-gray-500'}`}>
                            Claude Mode
                        </span>
                        <ToggleSwitch 
                            id="claude-mode-toggle"
                            label=""
                            checked={isClaudeMode}
                            onChange={setIsClaudeMode}
                        />
                    </div>
                    {result && <ContentActions content={result} filename={`system-instruction-${Date.now()}.md`} />}
                </div>
            </div>

            <div className="flex-grow flex flex-col md:flex-row h-full overflow-hidden">
                {/* Input Panel */}
                <div className="w-full md:w-1/3 p-4 flex flex-col gap-4 border-r border-gray-800 bg-[#0a0a0a]">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Agent Goal & Context</label>
                        <textarea
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder={isClaudeMode 
                                ? "Describe a sub-agent for the CLI. E.g., 'A specific agent that only greps for TODOs and lists them.'" 
                                : "Describe the agent you want to build. E.g., 'An expert Python tutor for 10-year-olds who uses Minecraft analogies.'"}
                            className={`w-full h-64 bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 focus:outline-none resize-none font-sans ${isClaudeMode ? 'focus:border-orange-500' : 'focus:border-fuchsia-500'}`}
                        />
                    </div>
                    
                    <button
                        onClick={handleFabricate}
                        disabled={isLoading || !goal.trim()}
                        className={`w-full py-4 font-bold uppercase tracking-wider rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${isClaudeMode ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:shadow-orange-500/25 text-white' : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:shadow-fuchsia-500/25 text-white'}`}
                    >
                        {isLoading ? <Loader className="w-5 h-5" /> : <BoltIcon className="w-5 h-5" />}
                        {isLoading ? 'Fabricating...' : 'Fabricate Persona'}
                    </button>

                    <div className="p-4 bg-gray-900/30 rounded border border-gray-800 text-xs text-gray-500">
                        <p className={`mb-2 font-semibold ${isClaudeMode ? 'text-orange-400' : 'text-gray-400'}`}>
                            {isClaudeMode ? 'Claude Code Constraints:' : 'Builder Agent Capabilities:'}
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                            {isClaudeMode ? (
                                <>
                                    <li>Limits tools to CLI / Bash standards</li>
                                    <li>Removes Aether-specific model configs</li>
                                    <li>Optimizes for diff-based editing</li>
                                    <li>Assumes direct file system access</li>
                                </>
                            ) : (
                                <>
                                    <li>Decomposes goals into components</li>
                                    <li>Crafts high-impact system instructions</li>
                                    <li>Generates few-shot examples</li>
                                    <li>Suggests model settings & safety</li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Output Panel */}
                <div className={`w-full md:w-2/3 p-6 overflow-y-auto ${isClaudeMode ? 'bg-[#120f0d]' : 'bg-[#050505]'}`}>
                    {result ? (
                        <div className="animate-fade-in max-w-3xl mx-auto">
                            <MarkdownRenderer content={result} />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600">
                            {isClaudeMode ? <TerminalIcon className="w-16 h-16 mb-4 opacity-20 text-orange-500" /> : <SparklesIcon className="w-16 h-16 mb-4 opacity-20" />}
                            <p className="text-sm font-mono uppercase tracking-widest">
                                {isClaudeMode ? 'Ready for CLI Instruction' : 'Awaiting Input Pattern'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromptArchitect;
