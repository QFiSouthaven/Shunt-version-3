
// components/foundry/MergeView.tsx
import React, { useState, useCallback } from 'react';
import ProjectContextPanel from './ProjectContextPanel';
import { BranchingIcon, SparklesIcon, ServerStackIcon, DocumentArrowDownIcon, DeviceFloppyIcon, CheckIcon, BoltIcon, TrimIcon } from '../icons';
import Loader from '../Loader';
import { generateRawText, generateSeamlessMerge } from '../../services/geminiService';
import { foundryService } from '../../services/foundry.service';
import { parseMultiFileResponse } from '../../services/skillParser';
import { parseApiError } from '../../utils/errorLogger';
import MarkdownRenderer from '../common/MarkdownRenderer';
import { audioService } from '../../services/audioService';
import { useMailbox } from '../../context/MailboxContext';
import { useMCPContext } from '../../context/MCPContext';
import { MCPConnectionStatus } from '../../types/mcp';
import { VirtualFile } from '../../types';
import JSZip from 'jszip';

interface MergedFile {
    path: string;
    content: string;
    reasoning?: string;
}

type MergeStrategy = 'Smart Integration' | 'Prefer Target (A)' | 'Prefer Source (B)' | 'Additive Only';

const MergeView: React.FC = () => {
    const [targetFiles, setTargetFiles] = useState<VirtualFile[]>([]);
    const [sourceFiles, setSourceFiles] = useState<VirtualFile[]>([]);
    const [mergeGoal, setMergeGoal] = useState('');
    const [strategy, setStrategy] = useState<MergeStrategy>('Smart Integration');
    const [isLoading, setIsLoading] = useState(false);
    const [isAutoFixing, setIsAutoFixing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [mergedFiles, setMergedFiles] = useState<MergedFile[]>([]);
    const [viewMode, setViewMode] = useState<'analysis' | 'files'>('analysis');
    const [error, setError] = useState<string | null>(null);
    const [mergeStats, setMergeStats] = useState<{ added: number; modified: number } | null>(null);
    
    const { deliverFiles } = useMailbox();
    const { status: mcpStatus, extensionApi } = useMCPContext();

    const handleAnalyzeMerge = useCallback(async () => {
        if (targetFiles.length === 0 || sourceFiles.length === 0 || isLoading) {
            setError("Please provide files for both projects.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setViewMode('analysis');
        audioService.playSound('send');

        try {
            const targetContext = targetFiles.map(f => `FILE: ${f.path}\n${f.content}`).join('\n\n');
            const sourceContext = sourceFiles.map(f => `FILE: ${f.path}\n${f.content}`).join('\n\n');

            const prompt = `
You are a Senior DevOps Engineer and Code Integration Specialist. 
Perform a comprehensive E2E analysis to merge "Project B (Source)" into "Project A (Target)".

**Strategy:** ${strategy}
**Goal:** "${mergeGoal}"

--- PROJECT A ---
${targetContext}

--- PROJECT B ---
${sourceContext}

Analyze conflicts and feasibility.
            `;

            const { resultText } = await generateRawText(prompt, 'gemini-3-pro-preview');
            setAnalysisResult(resultText);
            audioService.playSound('success');
            
            await deliverFiles([{ path: `merge-analysis-${Date.now()}.md`, content: resultText }]);

        } catch (e) {
            setError(parseApiError(e));
            audioService.playSound('error');
        } finally {
            setIsLoading(false);
        }
    }, [targetFiles, sourceFiles, mergeGoal, strategy, isLoading, deliverFiles]);

    const handleAutoFix = async () => {
        if (!analysisResult) return;
        setIsAutoFixing(true);
        audioService.playSound('send');
        try {
            const { parsedJson } = await foundryService.runAutoFix(analysisResult, strategy);
            if (parsedJson?.resolutions) {
                const newMerged = parsedJson.resolutions.map((r: any) => ({
                    path: r.filePath,
                    content: r.resolvedContent,
                    reasoning: r.reasoning
                }));
                setMergedFiles(newMerged);
                setViewMode('files');
                audioService.playSound('success');
            }
        } catch (e) {
            setError("Auto-Fix Protocol Failed");
        } finally {
            setIsAutoFixing(false);
        }
    };

    const handleExecuteMerge = useCallback(async () => {
        if (targetFiles.length === 0 || sourceFiles.length === 0 || isLoading) return;

        setIsLoading(true);
        setError(null);
        setMergedFiles([]);
        setViewMode('files');
        audioService.playSound('send');

        try {
            const targetContext = targetFiles.map(f => `FILE: ${f.path}\n${f.content}`).join('\n\n');
            const sourceContext = sourceFiles.map(f => `FILE: ${f.path}\n${f.content}`).join('\n\n');

            const { resultText } = await generateSeamlessMerge(targetContext, sourceContext, `${strategy}. Goal: ${mergeGoal}`);
            const parsedFiles = parseMultiFileResponse(resultText);
            
            setMergedFiles(parsedFiles);
            audioService.playSound('success');
            await deliverFiles(parsedFiles);
        } catch (e) {
            setError(parseApiError(e));
            audioService.playSound('error');
        } finally {
            setIsLoading(false);
        }
    }, [targetFiles, sourceFiles, mergeGoal, strategy, isLoading, deliverFiles]);

    return (
        <div className="flex flex-col h-full gap-6 overflow-hidden">
            <div className="flex-shrink-0 grid grid-cols-1 lg:grid-cols-2 gap-6 h-1/2 min-h-[300px]">
                <ProjectContextPanel files={targetFiles} onUpdateFiles={setTargetFiles} isLoading={isLoading} title="Project A (Target)" />
                <ProjectContextPanel files={sourceFiles} onUpdateFiles={setSourceFiles} isLoading={isLoading} title="Project B (Source)" />
            </div>

            <div className="flex-grow flex flex-col bg-gray-800/50 border border-gray-700/50 rounded-lg shadow-lg overflow-hidden">
                <header className="p-4 border-b border-gray-700/50 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between bg-gray-900/30">
                    <div className="flex-grow w-full xl:w-auto flex flex-col md:flex-row gap-4">
                        <input value={mergeGoal} onChange={e => setMergeGoal(e.target.value)} placeholder="Merge Goal..." className="w-full bg-gray-900/50 rounded-md border border-gray-700 p-2 text-gray-300 text-sm" />
                        <select value={strategy} onChange={e => setStrategy(e.target.value as MergeStrategy)} className="w-full md:w-48 bg-gray-900/50 rounded-md border border-gray-700 p-2 text-gray-300 text-sm">
                            <option value="Smart Integration">Smart Integration</option>
                            <option value="Prefer Target (A)">Prefer Target (A)</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleAnalyzeMerge} disabled={isLoading} className="px-4 py-2 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-colors flex items-center gap-2">
                             {isLoading && viewMode === 'analysis' ? <Loader /> : <SparklesIcon className="w-4 h-4"/>} Analyze
                        </button>
                        {analysisResult && (
                             <button onClick={handleAutoFix} disabled={isAutoFixing} className="px-4 py-2 bg-indigo-600/80 text-white rounded text-sm hover:bg-indigo-600 transition-colors flex items-center gap-2 border border-indigo-400/30">
                                {isAutoFixing ? <Loader /> : <BoltIcon className="w-4 h-4"/>} Auto-Fix
                             </button>
                        )}
                        <button onClick={handleExecuteMerge} disabled={isLoading} className="px-4 py-2 bg-fuchsia-600/80 text-white rounded text-sm hover:bg-fuchsia-500 transition-colors flex items-center gap-2">
                            {isLoading && viewMode === 'files' ? <Loader /> : <BranchingIcon className="w-4 h-4"/>} Full Merge
                        </button>
                    </div>
                </header>
                <div className="p-6 flex-grow overflow-y-auto">
                    {error && <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300 mb-4">{error}</div>}
                    
                    {viewMode === 'analysis' && analysisResult && (
                        <div className="animate-fade-in"><MarkdownRenderer content={analysisResult} /></div>
                    )}

                    {viewMode === 'files' && mergedFiles.length > 0 && (
                        <div className="space-y-3">
                            {mergedFiles.map((file, idx) => (
                                <div key={idx} className="bg-gray-900/50 rounded-lg border border-gray-700/50 overflow-hidden">
                                    <div className="p-2 bg-gray-800/50 border-b border-gray-700 flex justify-between">
                                        <span className="font-mono text-xs text-fuchsia-300">{file.path}</span>
                                        {file.reasoning && <span className="text-[9px] text-gray-500 italic max-w-[200px] truncate">{file.reasoning}</span>}
                                    </div>
                                    <pre className="p-3 text-xs text-gray-300 font-mono overflow-x-auto max-h-48">{file.content}</pre>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MergeView;
