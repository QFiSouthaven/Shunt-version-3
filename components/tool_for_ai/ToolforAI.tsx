
// components/tool_for_ai/ToolforAI.tsx
import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import TabFooter from '../common/TabFooter';
import { Job, VirtualFile } from '../../types';
import { useJobManager } from '../../hooks/useJobManager';
import JobList from './JobList';
import JobDetails from './JobDetails';
import { DeveloperIcon, BoltIcon, ServerStackIcon } from '../icons';
import Loader from '../Loader';
import { useMailbox } from '../../context/MailboxContext';
import ProjectContextPanel from '../foundry/ProjectContextPanel';
import { fileSystemService } from '../../services/fileSystem';

const ToolforAI: React.FC = () => {
    const { updateTelemetryContext } = useTelemetry();
    const [prompt, setPrompt] = useState('');
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [projectFiles, setProjectFiles] = useState<VirtualFile[]>([]);
    const { deliverFiles } = useMailbox();
    const [mountName, setMountName] = useState<string | null>(null);
    
    const { jobs, submitJob, cancelJob, isRunning } = useJobManager();

    useEffect(() => {
        updateTelemetryContext({ tab: 'tool_for_ai' });
        // Check if already mounted
        if (fileSystemService.isMounted()) {
            setMountName(fileSystemService.getMountName());
        }
    }, [updateTelemetryContext]);
    
    useEffect(() => {
        if (selectedJob) {
            const updatedJob = jobs.find(j => j.id === selectedJob.id);
            if (updatedJob) {
                setSelectedJob(updatedJob);
            } else {
                setSelectedJob(null);
            }
        }
    }, [jobs, selectedJob]);

    const handleMount = async () => {
        try {
            await fileSystemService.mountDirectory();
            setMountName(fileSystemService.getMountName());
        } catch (e: any) {
            // Only alert if it's an error, ignore cancel
            if (!e.message?.includes('cancelled')) {
                alert("Could not mount directory: " + e.message);
            }
        }
    };

    const handleRun = async () => {
        if (prompt.trim()) {
            // We pass empty files if mounted, as the tools will read directly from disk
            const filesForJob = mountName ? [] : projectFiles.map(f => ({ filename: f.path, content: f.content }));
            
            const result = await submitJob(prompt.trim(), filesForJob);
            
            if (result) {
                await deliverFiles([{
                    path: `ai-job-result-${Date.now()}.md`,
                    content: result
                }]);
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900/20">
            <div className="flex-grow p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                {/* Left Column: Controls and Job List */}
                <div className="flex flex-col gap-6 overflow-hidden">
                    <div className="flex flex-col gap-6 flex-shrink-0">
                        
                        {/* Real World Bridge */}
                        <div className="bg-gray-800/80 border border-indigo-500/30 rounded-lg p-4 flex items-center justify-between shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${mountName ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                                    <ServerStackIcon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-200">Local Environment</h3>
                                    <p className="text-xs text-gray-400">
                                        {mountName ? `Mounted: ${mountName}` : "Not connected to file system"}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={handleMount}
                                className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${mountName ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                            >
                                {mountName ? 'Change Folder' : 'Mount Drive'}
                            </button>
                        </div>

                        {/* Prompt Area */}
                        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 shadow-lg">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-3 mb-4">
                                <DeveloperIcon className="w-7 h-7 text-fuchsia-400" />
                                AI Job Runner
                            </h2>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Enter a task (e.g., 'Scan the mounted folder for TODOs' or 'Refactor src/utils.ts')..."
                                className="w-full bg-gray-900/50 rounded-md border border-gray-700 p-3 text-gray-300 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                                rows={3}
                                disabled={isRunning}
                            />
                            <button
                                onClick={handleRun}
                                disabled={isRunning || !prompt.trim()}
                                className="w-full mt-4 px-6 py-3 bg-fuchsia-600 text-white font-semibold rounded-md hover:bg-fuchsia-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {isRunning ? <Loader /> : <BoltIcon className="w-5 h-5" />}
                                {isRunning ? 'Agent Working...' : 'Submit Job'}
                            </button>
                        </div>

                        {/* Fallback File Upload (only if not mounted) */}
                        {!mountName && (
                            <div className="flex-shrink-0 max-h-[300px] flex flex-col opacity-75">
                                <ProjectContextPanel 
                                    files={projectFiles}
                                    onUpdateFiles={setProjectFiles}
                                    isLoading={isRunning}
                                    title="Context (Mount Drive preferred)"
                                />
                            </div>
                        )}
                    </div>

                    {/* Job History List */}
                    <div className="flex-grow overflow-hidden min-h-[200px]">
                        <JobList 
                            jobs={jobs}
                            onSelect={setSelectedJob}
                            onCancel={cancelJob}
                            selectedJobId={selectedJob?.id || null}
                        />
                    </div>
                </div>

                {/* Right Column: Job Details */}
                <div className="overflow-hidden">
                     <JobDetails job={selectedJob} />
                </div>
            </div>
            <TabFooter />
        </div>
    );
};

export default ToolforAI;
