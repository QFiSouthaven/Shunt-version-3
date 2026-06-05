
// components/tool_for_ai/JobDetails.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Job, JobLog } from '../../types';
import MarkdownRenderer from '../common/MarkdownRenderer';
import { DeveloperIcon, BrainIcon, BoltIcon, ShieldCheckIcon } from '../icons';
import ContentActions from '../common/ContentActions';

interface JobDetailsProps {
    job: Job | null;
}

const LogItem: React.FC<{ log: JobLog }> = ({ log }) => {
    let colorClass = 'text-gray-400';
    let icon = null;

    switch (log.type) {
        case 'tool_call':
            colorClass = 'text-cyan-400';
            icon = <BoltIcon className="w-3 h-3 inline mr-2" />;
            break;
        case 'tool_result':
            colorClass = 'text-gray-500';
            break;
        case 'thought':
            colorClass = 'text-fuchsia-300 italic';
            icon = <BrainIcon className="w-3 h-3 inline mr-2" />;
            break;
        case 'inverse_analysis':
            colorClass = 'text-orange-400';
            icon = <ShieldCheckIcon className="w-3 h-3 inline mr-2" />;
            break;
        default:
            colorClass = 'text-gray-300';
    }

    return (
        <div className={`flex gap-3 ${colorClass} text-xs font-mono py-1 border-b border-gray-800/30`}>
            <span className="text-gray-600 flex-shrink-0 w-20">{log.timestamp}</span>
            <span className="break-all whitespace-pre-wrap">{icon}{log.message}</span>
        </div>
    );
};

const JobDetails: React.FC<JobDetailsProps> = ({ job }) => {
    const logEndRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'logs' | 'brain'>('logs');

    useEffect(() => {
        if (activeTab === 'logs') {
            logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [job?.logs, activeTab]);

    if (!job) {
        return (
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg shadow-lg h-full flex items-center justify-center text-center text-gray-500">
                <div>
                    <DeveloperIcon className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-semibold">Select a job to view its details.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg shadow-lg h-full flex flex-col overflow-hidden">
            <header className="p-4 border-b border-gray-700/50 flex-shrink-0 flex justify-between items-center bg-gray-900/30">
                <div>
                    <h3 className="font-semibold text-gray-200">Job Details</h3>
                    <p className="font-mono text-xs text-gray-500 mt-1 truncate max-w-[200px]">{job.id}</p>
                </div>
                <div className="flex bg-gray-800 rounded p-1">
                    <button 
                        onClick={() => setActiveTab('logs')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${activeTab === 'logs' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        Logs
                    </button>
                    <button 
                        onClick={() => setActiveTab('brain')}
                        className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${activeTab === 'brain' ? 'bg-fuchsia-900/50 text-fuchsia-300' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <BrainIcon className="w-3 h-3" /> Agent Brain
                    </button>
                </div>
            </header>

            <main className="flex-grow overflow-hidden flex flex-col relative">
                {activeTab === 'logs' ? (
                    <div className="p-4 overflow-y-auto space-y-4 h-full">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-2">Prompt</h4>
                            <div className="p-3 bg-gray-900/50 rounded-md text-sm text-gray-300 border border-gray-700/50">
                                {job.prompt}
                            </div>
                        </div>
                        <div className="flex-grow flex flex-col min-h-0">
                            <h4 className="text-sm font-semibold text-gray-400 mb-2">Execution Log</h4>
                            <div className="p-3 bg-black/30 rounded-md overflow-y-auto flex-grow border border-gray-800">
                                {job.logs.map((log, i) => <LogItem key={i} log={log} />)}
                                <div ref={logEndRef} />
                            </div>
                        </div>
                        {job.result && (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-semibold text-gray-400">Result</h4>
                                    <ContentActions content={job.result} filename={`job-${job.id}.md`} />
                                </div>
                                <div className="p-3 bg-gray-900/50 rounded-md border border-gray-700/50 max-h-60 overflow-y-auto">
                                    <MarkdownRenderer content={job.result} />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-4 overflow-y-auto space-y-6 h-full bg-gray-900/20">
                        {/* Inverse Analysis Panel */}
                        <div className="bg-orange-900/10 border border-orange-500/30 rounded-lg p-4">
                            <h4 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
                                <ShieldCheckIcon className="w-4 h-4" /> Inverse Analysis (Risk Assessment)
                            </h4>
                            {job.agentState?.inverseAnalysis && job.agentState.inverseAnalysis.length > 0 ? (
                                <ul className="list-disc list-inside space-y-2 text-xs text-orange-200/80">
                                    {job.agentState.inverseAnalysis.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-gray-500 italic">No risks identified yet.</p>
                            )}
                        </div>

                        {/* Plan Panel */}
                        <div className="bg-cyan-900/10 border border-cyan-500/30 rounded-lg p-4">
                            <h4 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                                <BoltIcon className="w-4 h-4" /> Strategic Plan
                            </h4>
                            {job.agentState?.plan && job.agentState.plan.length > 0 ? (
                                <div className="space-y-1 text-xs font-mono text-cyan-100/90">
                                    {job.agentState.plan.map((step, i) => (
                                        <div key={i} className="p-1.5 bg-cyan-950/30 rounded border border-cyan-900/50">
                                            {step}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 italic">Formulating plan...</p>
                            )}
                        </div>

                        {/* Scratchpad Panel */}
                        <div className="bg-fuchsia-900/10 border border-fuchsia-500/30 rounded-lg p-4 flex-grow">
                            <h4 className="text-sm font-bold text-fuchsia-400 mb-3 flex items-center gap-2">
                                <BrainIcon className="w-4 h-4" /> Scratchpad (Memory)
                            </h4>
                            <pre className="text-xs text-fuchsia-200/80 font-mono whitespace-pre-wrap bg-black/20 p-3 rounded h-full min-h-[200px]">
                                {job.agentState?.scratchpad || 'Memory empty.'}
                            </pre>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default JobDetails;
