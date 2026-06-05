
// components/documentation/Documentation.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import TabFooter from '../common/TabFooter';
import MarkdownRenderer from '../common/MarkdownRenderer';
import FileUpload from '../common/FileUpload';
import Loader from '../Loader';
import { generateRawText, generateProjectTome } from '../../services/geminiService';
import { generateFileTree, generateComponentDiagram } from '../../services/diagramService';
import { runETLPipeline, VectorRecord, ETLStep } from '../../services/etlService';
import { BookIcon, XMarkIcon, SparklesIcon, GlobeAltIcon, ServerStackIcon } from '../icons';
import { audioService } from '../../services/audioService';
import { parseApiError } from '../../utils/errorLogger';
import { useMailbox } from '../../context/MailboxContext';
import ContentActions from '../common/ContentActions';
import { VirtualFile } from '../../types';
import { useAsyncState } from '../../hooks/useAsyncState';
import { dbService } from '../../services/db';

interface IngestionStats {
    filesProcessed: number;
    chunksCreated: number;
    totalTokens: number;
}

const Documentation: React.FC = () => {
    // Critical Fix: Use useAsyncState with FILES store for project files to avoid localStorage quota limits
    const [projectFiles, setProjectFiles, isFilesLoading] = useAsyncState<VirtualFile[]>('documentation_projectFiles', [], dbService.STORES.FILES);
    const [generatedDoc, setGeneratedDoc, isDocLoading] = useAsyncState<string | null>('documentation_generatedDoc', null, dbService.STORES.KEY_VALUE);
    const [docTitle, setDocTitle] = useAsyncState<string>('documentation_docTitle', 'Generated Documentation', dbService.STORES.KEY_VALUE);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // ETL / Data Ingestion State
    const [isIngesting, setIsIngesting] = useState(false);
    const [ingestionProgress, setIngestionProgress] = useState(0);
    const [ingestionLogs, setIngestionLogs] = useState<string[]>([]);
    const [vectorStore, setVectorStore] = useState<VectorRecord[]>([]);
    const [ingestionStats, setIngestionStats] = useState<IngestionStats | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const { deliverFiles } = useMailbox();

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [ingestionLogs]);

    const handleFilesUploaded = useCallback((files: Array<{ filename: string; content: string; file: File }>) => {
        const newFiles: VirtualFile[] = files.map(f => ({ 
            path: f.filename, 
            content: f.content,
            lastModified: f.file.lastModified
        }));
        setProjectFiles(prev => [...prev, ...newFiles]);
        audioService.playSound('success');
    }, [setProjectFiles]);

    const removeFile = (path: string) => {
        setProjectFiles(prev => prev.filter(f => f.path !== path));
    };
    
    const handleConvertToData = useCallback(async () => {
        if (projectFiles.length === 0 || isIngesting || isLoading) return;

        setIsIngesting(true);
        setIngestionProgress(0);
        setIngestionLogs(['Initializing ETL Pipeline...']);
        setVectorStore([]);
        setIngestionStats(null);
        setError(null);
        audioService.playSound('send');

        try {
            const { vectors, stats } = await runETLPipeline(projectFiles, (step: ETLStep, progress: number, message: string) => {
                setIngestionProgress(progress);
                setIngestionLogs(prev => [...prev, `[${step.toUpperCase()}] ${message}`]);
            });

            setVectorStore(vectors);
            setIngestionStats(stats);
            setIngestionLogs(prev => [...prev, '--- DATABASE SYNCED ---']);
            audioService.playSound('success');

        } catch (e) {
            console.error(e);
            setIngestionLogs(prev => [...prev, `[ERROR] Ingestion Failed: ${e}`]);
            audioService.playSound('error');
        } finally {
            setIsIngesting(false);
        }
    }, [projectFiles, isIngesting, isLoading]);

    const handleGenerateDocumentation = useCallback(async () => {
        if (projectFiles.length === 0 || isLoading) return;

        setIsLoading(true);
        setError(null);
        setGeneratedDoc(null);
        setDocTitle('README.md');
        audioService.playSound('send');

        try {
            const projectContext = projectFiles
                .map(file => `--- FILE: ${file.path} ---\n\n${file.content}`)
                .join('\n\n---\n\n');
            
            const prompt = `
You are a senior software engineer tasked with creating a high-quality README.md documentation file for an existing project.
Analyze the following source code from multiple files and generate a comprehensive README.md in Markdown format.

The README should include the following sections:
1.  **Project Title**: A clear and concise title.
2.  **Overview**: A brief summary of what the project does and its purpose.
3.  **Features**: A bulleted list of key features and capabilities.
4.  **Tech Stack**: The main technologies, frameworks, and libraries used.
5.  **Project Structure**: An explanation of the key directories and files and their roles.
6.  **Getting Started**: Simple instructions on how to set up and run the project locally (if discernible from the context).
7.  **Key Components**: A detailed look at 2-3 of the most important components and their responsibilities.

Here is the entire project source code, with each file clearly demarcated:
---
${projectContext}
---
`;

            const { resultText } = await generateRawText(prompt, 'gemini-3-pro-preview');
            setGeneratedDoc(resultText);
            audioService.playSound('receive');
            
            // Deliver output to mailbox
            await deliverFiles([{
                path: `README-${Date.now()}.md`,
                content: resultText
            }]);

        } catch (e) {
            const userFriendlyMessage = parseApiError(e);
            setError(userFriendlyMessage);
            audioService.playSound('error');
        } finally {
            setIsLoading(false);
        }
    }, [projectFiles, isLoading, deliverFiles, setGeneratedDoc, setDocTitle]);

    const handleGenerateProjectTome = useCallback(async () => {
        if (projectFiles.length === 0 || isLoading) return;
        setIsLoading(true); setError(null); setGeneratedDoc(null); setDocTitle('Project Tome'); audioService.playSound('send');
        try {
            const fileTree = generateFileTree(projectFiles);
            const componentDiagram = generateComponentDiagram(projectFiles);
            const projectContext = projectFiles.map(file => `--- FILE: ${file.path} ---\n\n${file.content}`).join('\n\n---\n\n');
            const { resultText } = await generateProjectTome(projectContext);
            let finalDoc = resultText;
            finalDoc = finalDoc.replace('[INSERT_FILE_STRUCTURE_DIAGRAM]', fileTree);
            finalDoc = finalDoc.replace('[INSERT_COMPONENT_HIERARCHY_DIAGRAM]', `\`\`\`mermaid\n${componentDiagram}\n\`\`\``);
            setGeneratedDoc(finalDoc); audioService.playSound('receive');
            await deliverFiles([{ path: `project-tome-${Date.now()}.md`, content: finalDoc }]);
        } catch (e) { setError(parseApiError(e)); audioService.playSound('error'); } finally { setIsLoading(false); }
    }, [projectFiles, isLoading, deliverFiles, setGeneratedDoc, setDocTitle]);
    
    const handleClear = () => {
        setProjectFiles([]);
        setGeneratedDoc(null);
        setError(null);
        setVectorStore([]);
        setIngestionStats(null);
        setIngestionLogs([]);
    };

    if (isFilesLoading || isDocLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-[#09090b]">
                <Loader />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <title>Documentation - Aether Shunt</title>
            <meta name="description" content="Generate comprehensive documentation from your source code using AI." />
            
            <div className="flex-grow p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                {/* Left Panel: Upload & Control */}
                <div className="flex flex-col gap-6 overflow-y-auto">
                    {/* File Upload Panel */}
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 flex-shrink-0">
                        <h3 className="text-lg font-semibold text-white mb-4">Upload Repository / Files</h3>
                        <FileUpload
                            onFilesUploaded={handleFilesUploaded}
                            acceptedFileTypes={['.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.md', '.txt', '.py', '.sh', 'dockerfile', '.yml', '.yaml', '.svg', '.gitignore', '.xml', '.xsd', '.zip', '.c', '.cpp', '.h', '.rs', '.go', '.java']}
                            maxFileSizeMB={20}
                            enableDirectoryUpload={true}
                        />
                    </div>
                    
                    {/* Staged Files and Controls */}
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 flex flex-col flex-grow min-h-[350px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-white">Staged for Processing ({projectFiles.length})</h3>
                            <button
                                onClick={handleClear}
                                disabled={isLoading || isIngesting}
                                className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                            >
                                Clear All
                            </button>
                        </div>
                        
                        {projectFiles.length > 0 ? (
                            <div className="flex-grow overflow-y-auto space-y-2 pr-2 mb-4 bg-gray-900/30 p-2 rounded-md">
                                {projectFiles.map(file => (
                                    <div key={file.path} className="flex items-center justify-between bg-gray-900/50 p-2 rounded text-sm group">
                                        <span className="text-gray-300 truncate font-mono text-xs" title={file.path}>{file.path}</span>
                                        <button onClick={() => removeFile(file.path)} disabled={isIngesting} className="p-1 text-gray-600 group-hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-grow flex items-center justify-center text-gray-500 bg-gray-900/10 rounded-md border-2 border-dashed border-gray-800">
                                <p className="text-sm">No files staged.</p>
                            </div>
                        )}

                        <div className="mt-auto flex-shrink-0 flex flex-col gap-4">
                             {/* Primary Action: Convert to Data (ETL) */}
                             <button
                                onClick={handleConvertToData}
                                disabled={isLoading || isIngesting || projectFiles.length === 0}
                                className={`w-full flex items-center justify-center gap-2 text-md font-semibold text-center p-3 rounded-md border transition-all duration-200 
                                    ${isIngesting 
                                        ? 'bg-amber-600/50 border-amber-500 text-amber-100 cursor-wait' 
                                        : 'bg-amber-600/80 border-amber-500 text-white shadow-lg hover:bg-amber-600 hover:border-amber-400 hover:shadow-amber-500/30'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isIngesting ? <Loader /> : <ServerStackIcon className="w-5 h-5" />}
                                {isIngesting ? 'Ingesting Data...' : 'Convert to Data (LanceDB)'}
                            </button>

                             <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleGenerateProjectTome}
                                    disabled={isLoading || isIngesting || projectFiles.length === 0}
                                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-center p-2 rounded-md border transition-all duration-200 bg-purple-600/80 border-purple-500 text-white shadow-lg hover:bg-purple-600 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <GlobeAltIcon className="w-4 h-4" />
                                    Project Tome
                                </button>
                                <button
                                    onClick={handleGenerateDocumentation}
                                    disabled={isLoading || isIngesting || projectFiles.length === 0}
                                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-center p-2 rounded-md border transition-all duration-200 bg-fuchsia-600/80 border-fuchsia-500 text-white shadow-lg hover:bg-fuchsia-600 hover:border-fuchsia-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <SparklesIcon className="w-4 h-4" />
                                    README
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Output & ETL Feedback */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg shadow-lg flex flex-col overflow-hidden relative">
                    {(isIngesting || vectorStore.length > 0) ? (
                        <div className="absolute inset-0 z-20 bg-gray-900 flex flex-col">
                            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                                <div className="flex items-center gap-2">
                                    <ServerStackIcon className="w-5 h-5 text-amber-400" />
                                    <h3 className="font-semibold text-white">Data Ingestion Pipeline</h3>
                                </div>
                                {ingestionStats && <span className="text-xs text-green-400 font-mono">STATUS: ONLINE</span>}
                            </div>
                            <div className="p-6 flex-grow flex flex-col gap-6 overflow-hidden">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-gray-400 font-mono">
                                        <span>Pipeline Progress</span>
                                        <span>{ingestionProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div 
                                            className="bg-amber-500 h-2 rounded-full transition-all duration-300 ease-out" 
                                            style={{ width: `${ingestionProgress}%` }}
                                        />
                                    </div>
                                </div>
                                 {/* Terminal Log */}
                                <div className="flex-grow bg-black rounded-lg border border-gray-700 p-4 overflow-hidden flex flex-col font-mono text-xs">
                                    <div className="flex-grow overflow-y-auto space-y-1">
                                        {ingestionLogs.map((log, i) => (
                                            <div key={i} className={`${log.includes('[ERROR]') ? 'text-red-400' : log.includes('---') ? 'text-green-400 font-bold' : 'text-gray-400'}`}>
                                                <span className="opacity-50 mr-2">{new Date().toLocaleTimeString()}</span>
                                                {log}
                                            </div>
                                        ))}
                                        <div ref={logsEndRef} />
                                    </div>
                                </div>
                                {vectorStore.length > 0 && !isIngesting && (
                                    <div className="flex justify-end animate-fade-in">
                                        <button 
                                            onClick={() => { setVectorStore([]); setIngestionStats(null); setIngestionLogs([]); }}
                                            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                                        >
                                            Reset Pipeline
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Standard Documentation View */
                        <>
                            <div className="p-4 border-b border-gray-700/50 flex justify-between items-center flex-shrink-0">
                                <h3 className="text-lg font-semibold text-white">{docTitle}</h3>
                                {generatedDoc && (
                                    <ContentActions content={generatedDoc} filename={`${docTitle.toLowerCase().replace(/\s/g, '-')}-${Date.now()}.md`} />
                                )}
                            </div>
                            <div className="p-4 flex-grow relative overflow-y-auto">
                                {isLoading && (
                                    <div className="absolute inset-0 flex flex-col justify-center items-center bg-gray-800/80 backdrop-blur-sm z-10 rounded-b-lg">
                                        <Loader />
                                        <p className="mt-4 text-gray-400">Parsing project and generating docs...</p>
                                    </div>
                                )}
                                {error && (
                                    <div className="text-center text-red-400 p-4">
                                        <p className="font-semibold">Generation Failed</p>
                                        <p className="text-sm mt-1">{error}</p>
                                    </div>
                                )}
                                {!isLoading && !error && !generatedDoc && (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                        <BookIcon className="w-12 h-12 mb-4" />
                                        <p className="font-semibold">Documentation Output</p>
                                        <p className="text-sm mt-1">Generated documents will appear here.</p>
                                    </div>
                                )}
                                {generatedDoc && (
                                    <MarkdownRenderer content={generatedDoc} />
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <TabFooter />
        </div>
    );
};

export default Documentation;