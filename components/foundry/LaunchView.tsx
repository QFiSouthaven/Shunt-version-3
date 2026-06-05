
// components/foundry/LaunchView.tsx
import React, { useState, useCallback, useEffect } from 'react';
import ProjectContextPanel from './ProjectContextPanel';
import { RocketLaunchIcon, SparklesIcon, CheckCircleIcon, XMarkIcon, ServerStackIcon, ShieldCheckIcon, CodeIcon } from '../icons';
import Loader from '../Loader';
import { generateRawText } from '../../services/geminiService';
import { parseApiError } from '../../utils/errorLogger';
import MarkdownRenderer from '../common/MarkdownRenderer';
import { audioService } from '../../services/audioService';
import { useMailbox } from '../../context/MailboxContext';
import { VirtualFile } from '../../types';

interface HealthCheck {
    id: string;
    label: string;
    status: 'ok' | 'warning' | 'critical';
    message: string;
}

const LaunchView: React.FC = () => {
    // Use VirtualFile instead of local interface
    const [projectFiles, setProjectFiles] = useState<VirtualFile[]>([]);
    const [targetPlatform, setTargetPlatform] = useState('Vercel / Edge Network');
    const [isLoading, setIsLoading] = useState(false);
    const [launchKit, setLaunchKit] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { deliverFiles } = useMailbox();

    // Simulated Audit State
    const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([
        { id: 'config', label: 'Build Config', status: 'critical', message: 'Missing package.json & vite.config.ts' },
        { id: 'env', label: 'Environment', status: 'warning', message: 'API_KEY exposed in client-side bundle' },
        { id: 'assets', label: 'Assets', status: 'ok', message: 'Icons and global styles loaded' },
        { id: 'security', label: 'Security', status: 'ok', message: 'Input sanitization active' },
    ]);

    // Calculate Score
    const score = Math.round(
        (healthChecks.filter(c => c.status === 'ok').length * 100 + 
         healthChecks.filter(c => c.status === 'warning').length * 50) / healthChecks.length
    );

    const getStatusColor = (status: HealthCheck['status']) => {
        switch(status) {
            case 'ok': return 'text-emerald-400 bg-emerald-900/20 border-emerald-500/50';
            case 'warning': return 'text-amber-400 bg-amber-900/20 border-amber-500/50';
            case 'critical': return 'text-red-400 bg-red-900/20 border-red-500/50';
        }
    };

    const handleAnalyzeLaunch = useCallback(async () => {
        if (projectFiles.length === 0 || isLoading) {
            setError("Please upload project files to initiate the launch sequence.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setLaunchKit(null);
        audioService.playSound('send');

        try {
            const context = projectFiles.map(f => `FILE: ${f.path}\n${f.content}`).join('\n\n');

            const prompt = `
You are a Senior Release Engineer and Full-Stack Architect.
**Objective:** Analyze the codebase and generate a production-ready "Launch Readiness Kit".

**Target Platform:** ${targetPlatform}

**Project Context:**
${context}

**Mandatory Output:**
1.  **Readiness Scorecard:** A critical assessment of deployability.
2.  **Missing Configuration:** Generate full content for missing files (e.g., \`package.json\`, \`vite.config.ts\`, \`tailwind.config.js\`).
3.  **Security Hardening:** Specific instructions to secure API keys.
4.  **Launch Sequence:** Exact terminal commands to deploy.

Format as polished Markdown.
`;

            const { resultText } = await generateRawText(prompt, 'gemini-3-pro-preview');
            setLaunchKit(resultText);
            audioService.playSound('success');
            
            await deliverFiles([{
                path: `launch-kit-${Date.now()}.md`,
                content: resultText
            }]);

        } catch (e) {
            const msg = parseApiError(e);
            setError(msg);
            audioService.playSound('error');
        } finally {
            setIsLoading(false);
        }
    }, [projectFiles, targetPlatform, isLoading, deliverFiles]);

    return (
        <div className="flex flex-col h-full gap-6 overflow-hidden">
            {/* Mission Control Header */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[45%] min-h-[350px]">
                
                {/* Left: Files & Config */}
                <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
                    <ProjectContextPanel 
                        files={projectFiles} 
                        onUpdateFiles={setProjectFiles} 
                        isLoading={isLoading} 
                        title="Payload Manifest"
                    />
                </div>

                {/* Center: System Status & Gauges */}
                <div className="lg:col-span-8 bg-gray-900/50 border border-gray-700/50 rounded-lg shadow-lg p-6 flex flex-col relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <RocketLaunchIcon className="w-64 h-64 text-fuchsia-500" />
                    </div>

                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <ServerStackIcon className="w-6 h-6 text-cyan-400" />
                                Pre-Flight Diagnostics
                            </h3>
                            <p className="text-gray-400 text-sm mt-1">System Readiness Assessment</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Readiness Score</span>
                            <span className={`text-4xl font-black ${score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                {score}%
                            </span>
                        </div>
                    </div>

                    {/* Health Check Grid */}
                    <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
                        {healthChecks.map(check => (
                            <div key={check.id} className={`p-3 rounded border ${getStatusColor(check.status)} flex items-start gap-3`}>
                                <div className="mt-0.5">
                                    {check.status === 'ok' ? <CheckCircleIcon className="w-5 h-5" /> : 
                                     check.status === 'warning' ? <SparklesIcon className="w-5 h-5" /> : 
                                     <XMarkIcon className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">{check.label}</h4>
                                    <p className="text-xs opacity-90">{check.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Launch Controls */}
                    <div className="mt-auto pt-6 flex gap-4 items-end relative z-10">
                        <div className="flex-grow">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Trajectory</label>
                            <input
                                type="text"
                                value={targetPlatform}
                                onChange={(e) => setTargetPlatform(e.target.value)}
                                className="w-full bg-black/40 border border-gray-600 rounded px-3 py-2 text-sm text-gray-200 focus:border-cyan-500 outline-none"
                            />
                        </div>
                        <button
                            onClick={handleAnalyzeLaunch}
                            disabled={isLoading || projectFiles.length === 0}
                            className={`px-8 py-3 rounded font-bold text-sm uppercase tracking-wide transition-all shadow-lg flex items-center gap-2
                                ${isLoading 
                                    ? 'bg-gray-700 text-gray-400 cursor-wait' 
                                    : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white hover:brightness-110 hover:shadow-fuchsia-500/25'
                                }`}
                        >
                            {isLoading ? <Loader /> : <RocketLaunchIcon className="w-5 h-5" />}
                            {isLoading ? 'Initiating...' : 'Initiate Launch Sequence'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Output Console */}
            <div className="flex-grow bg-black/80 border border-gray-800 rounded-lg shadow-inner overflow-hidden flex flex-col font-mono">
                <header className="p-3 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
                    <span className="text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <CodeIcon className="w-4 h-4" /> Mission Log
                    </span>
                    {launchKit && <span className="text-xs text-green-500">ANALYSIS COMPLETE</span>}
                </header>
                <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded text-red-300 mb-4">
                            <strong>Launch Aborted:</strong> {error}
                        </div>
                    )}
                    
                    {!launchKit && !isLoading && !error && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                            <ServerStackIcon className="w-16 h-16 mb-4" />
                            <p>Awaiting upload of manifest...</p>
                        </div>
                    )}

                    {isLoading && !launchKit && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-cyan-400">
                                <Loader /> <span className="animate-pulse">Running heuristic analysis on source code...</span>
                            </div>
                            <div className="pl-8 text-xs text-gray-500 space-y-1">
                                <p>&gt; Parsing dependency graph...</p>
                                <p>&gt; Validating environment variables...</p>
                                <p>&gt; Checking containerization compatibility...</p>
                            </div>
                        </div>
                    )}

                    {launchKit && (
                        <div className="animate-fade-in text-sm text-gray-300">
                            <MarkdownRenderer content={launchKit} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LaunchView;
