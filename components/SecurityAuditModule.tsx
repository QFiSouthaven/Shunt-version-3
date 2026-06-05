
import React, { useState, useRef, useEffect } from 'react';
import { executeAIRequest } from '../services/geminiService';
import { getSystemHolisticContext } from '../services/systemContextService';
import { ShieldCheckIcon, XMarkIcon, CopyIcon, CheckIcon, LockIcon, TerminalIcon } from './icons';
import MarkdownRenderer from './common/MarkdownRenderer';
import Loader from './Loader';
import { audioService } from '../services/audioService';

export interface SecurityAuditModuleProps {
    className?: string;
}

type AuditStatus = 'idle' | 'scanning' | 'analyzing' | 'complete' | 'error';

const RED_TEAM_INSTRUCTION = `ACT AS A RED TEAM SECURITY LEAD. Conduct a theoretical 'White Box' penetration test on the current project logic.

Identify potential OWASP Top 10 vulnerabilities (Injection, IDOR, Data Exposure).

Flag any logic that could lead to 'Prompt Injection' or 'Context Leakage'.

Provide a 'Hardened Code' snippet for the most critical vulnerability found.`;

export const SecurityAuditModule: React.FC<SecurityAuditModuleProps> = ({ className = '' }) => {
    const [status, setStatus] = useState<AuditStatus>('idle');
    const [report, setReport] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [hasSensitiveData, setHasSensitiveData] = useState(false);
    const [showSensitiveData, setShowSensitiveData] = useState(false);

    // Abort controller for cancellation
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, []);

    const maskSecrets = (text: string): string => {
        // Simple heuristic patterns to mask generic secrets in output before rendering
        const patterns = [
            /(api[-_]?key|secret|token)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{8,})['"]?/gi,
            /(AIza[a-zA-Z0-9_\-]{35})/g,
            /(sk-[a-zA-Z0-9]{32,})/g
        ];
        
        let masked = text;
        let found = false;
        
        patterns.forEach(regex => {
            if (regex.test(masked)) {
                found = true;
                masked = masked.replace(regex, '$1: [REDACTED]');
            }
        });

        if (found) setHasSensitiveData(true);
        return masked;
    };

    const handleRunAudit = async () => {
        if (status === 'scanning' || status === 'analyzing') return;

        setStatus('scanning');
        setReport(null);
        setHasSensitiveData(false);
        setShowSensitiveData(false);
        audioService.playSound('click');

        abortControllerRef.current = new AbortController();

        try {
            // 1. Reconnaissance: Gather System Context
            const context = await getSystemHolisticContext();
            const auditPayload = `TARGET SYSTEM MANIFEST:\n${JSON.stringify(context, null, 2)}\n\nINSTRUCTIONS: Analyze the above manifest for security flaws based on the system instruction.`;

            setStatus('analyzing');

            // 2. Attack Simulation: Call Gemini
            const { resultText } = await executeAIRequest({
                model: 'gemini-3-pro-preview', // Use Pro for deeper reasoning
                systemInstruction: RED_TEAM_INSTRUCTION,
                prompt: auditPayload,
                config: { temperature: 0.3 } // Lower temperature for more analytical/precise output
            });

            // 3. Reporting
            setReport(resultText);
            setStatus('complete');
            setIsModalOpen(true);
            audioService.playSound('success');

        } catch (e) {
            console.error("Security Audit Protocol Failed:", e); // Dev log
            setStatus('error');
            audioService.playSound('error');
        } finally {
            abortControllerRef.current = null;
        }
    };

    const handleCopy = () => {
        if (!report) return;
        navigator.clipboard.writeText(report);
        setIsCopied(true);
        audioService.playSound('click');
        setTimeout(() => setIsCopied(false), 2000);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => {
            setStatus('idle');
            setReport(null);
        }, 300);
    };

    const displayContent = (showSensitiveData ? report : (report ? maskSecrets(report) : '')) || '';

    return (
        <>
            <button
                onClick={handleRunAudit}
                disabled={status === 'scanning' || status === 'analyzing'}
                className={`group w-full p-3 rounded-lg border flex flex-col gap-2 transition-all duration-300 relative overflow-hidden text-left ${className}
                    ${status === 'scanning' || status === 'analyzing'
                        ? 'bg-red-950/30 border-red-500/30 cursor-not-allowed'
                        : 'bg-red-950/20 border-red-500/30 hover:bg-red-900/30 hover:border-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                    }`}
                aria-busy={status === 'scanning' || status === 'analyzing'}
                aria-label="Run Deep Security Audit"
            >
                <div className="flex items-center gap-2">
                    {status === 'scanning' || status === 'analyzing' ? (
                        <Loader className="w-4 h-4 text-red-400" />
                    ) : (
                        <ShieldCheckIcon className="w-4 h-4 text-red-500 group-hover:text-red-400" />
                    )}
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        status === 'scanning' || status === 'analyzing' ? 'text-red-400 animate-pulse' : 'text-red-500 group-hover:text-red-400'
                    }`}>
                        {status === 'scanning' ? 'Scanning Surface...' : status === 'analyzing' ? 'Penetration Testing...' : 'Run Deep Security Audit'}
                    </span>
                </div>
                <p className="text-[9px] text-red-300/60 leading-tight">
                    Trigger a white-box adversarial analysis to identify OWASP vulnerabilities and hardening opportunities.
                </p>
                {status === 'error' && (
                    <div className="mt-1 font-mono text-[8px] text-red-400 animate-fade-in">
                        ! Audit Sequence Failed
                    </div>
                )}
            </button>

            {/* Audit Report Modal (Terminal Style) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
                    <div 
                        className="bg-[#050505] border border-red-900/50 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="audit-modal-title"
                    >
                        {/* CRT Scanline Effect */}
                        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(255,0,0,0.02),rgba(255,0,0,0.06))] z-10" style={{ backgroundSize: '100% 2px, 3px 100%' }}></div>

                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-red-900/30 bg-red-950/10">
                            <div className="flex items-center gap-3">
                                <TerminalIcon className="w-5 h-5 text-red-500" />
                                <h2 id="audit-modal-title" className="text-lg font-bold text-red-100 tracking-wider font-mono">
                                    VULNERABILITY_REPORT_V3
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                {hasSensitiveData && (
                                    <button 
                                        onClick={() => setShowSensitiveData(!showSensitiveData)}
                                        className="p-2 rounded hover:bg-red-900/30 text-red-400 hover:text-red-200 transition-colors"
                                        title={showSensitiveData ? "Hide Secrets" : "Show Secrets"}
                                    >
                                        <LockIcon className={`w-4 h-4 ${showSensitiveData ? 'text-red-200' : 'text-red-500'}`} />
                                    </button>
                                )}
                                <button
                                    onClick={handleCopy}
                                    className="p-2 rounded hover:bg-red-900/30 text-red-400 hover:text-red-200 transition-colors"
                                    title="Copy Report"
                                >
                                    {isCopied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="p-2 rounded hover:bg-red-900/30 text-red-400 hover:text-red-200 transition-colors"
                                    title="Close Terminal"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Content (Terminal View) */}
                        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar bg-[#020202]">
                            {report ? (
                                <div className="prose prose-invert prose-sm max-w-none prose-p:text-gray-300 prose-headings:text-red-400 prose-code:text-red-300 prose-strong:text-red-200">
                                    <MarkdownRenderer content={displayContent} />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-red-900/50 font-mono animate-pulse">
                                    NO_DATA_STREAM
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-red-900/30 bg-red-950/10 text-right">
                            <span className="text-[10px] text-red-500/50 font-mono mr-4">
                                SECURITY LEVEL: CLEARANCE_RED
                            </span>
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-300 text-xs font-bold uppercase tracking-wider rounded transition-colors"
                            >
                                Acknowledge & Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SecurityAuditModule;
