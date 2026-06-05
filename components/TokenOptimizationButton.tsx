
import React, { useState, useRef, useEffect } from 'react';
import { generateRawText } from '../services/geminiService';
import { SparklesIcon, XMarkIcon, CopyIcon, CheckIcon, BoltIcon } from './icons';
import MarkdownRenderer from './common/MarkdownRenderer';
import Loader from './Loader';
import { audioService } from '../services/audioService';
import { parseApiError } from '../utils/errorLogger';

export interface TokenOptimizationButtonProps {
    className?: string;
}

type OptimizationStatus = 'idle' | 'loading' | 'success' | 'error';

const OPTIMIZATION_PROMPT = "Generate a strict, step-by-step development guide for optimizing this project's code to be 'Token Efficient'. Focus on reducing context window usage, compressing JSON structures, and pruning redundant logic. Output must be in Markdown.";

export const TokenOptimizationButton: React.FC<TokenOptimizationButtonProps> = ({ className = '' }) => {
    const [status, setStatus] = useState<OptimizationStatus>('idle');
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    
    // Abort controller to handle component unmounting during fetch
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handleGenerate = async () => {
        if (status === 'loading') return;

        setStatus('loading');
        setError(null);
        setResult(null);
        audioService.playSound('click');

        abortControllerRef.current = new AbortController();

        try {
            // Using Gemini 3 Pro for complex reasoning tasks
            const { resultText } = await generateRawText(
                OPTIMIZATION_PROMPT, 
                'gemini-3-pro-preview'
            );

            setResult(resultText);
            setStatus('success');
            setIsModalOpen(true);
            audioService.playSound('success');
        } catch (e: any) {
            const friendlyMsg = parseApiError(e);
            console.error("Token Optimization Failed:", e);
            setError(friendlyMsg);
            setStatus('error');
            audioService.playSound('error');
        } finally {
            abortControllerRef.current = null;
        }
    };

    const handleCopy = () => {
        if (!result) return;
        navigator.clipboard.writeText(result);
        setIsCopied(true);
        audioService.playSound('click');
        setTimeout(() => setIsCopied(false), 2000);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        // Reset status after closing so user can run again if desired
        setTimeout(() => {
            setStatus('idle');
            setResult(null);
        }, 300);
    };

    return (
        <>
            <button
                onClick={handleGenerate}
                disabled={status === 'loading'}
                className={`group w-full p-3 rounded-lg border flex flex-col gap-2 transition-all duration-300 relative overflow-hidden text-left ${className}
                    ${status === 'loading'
                        ? 'bg-emerald-900/10 border-emerald-500/30 cursor-not-allowed'
                        : 'bg-emerald-900/10 border-emerald-500/30 hover:bg-emerald-900/20 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    }`}
                aria-busy={status === 'loading'}
                aria-label="Generate Token-Efficient Guidelines"
            >
                <div className="flex items-center gap-2">
                    {status === 'loading' ? (
                        <Loader className="w-4 h-4 text-emerald-400" />
                    ) : (
                        <BoltIcon className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
                    )}
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        status === 'loading' ? 'text-emerald-500 animate-pulse' : 'text-emerald-400 group-hover:text-emerald-300'
                    }`}>
                        {status === 'loading' ? 'Analyzing Usage...' : 'Token Efficiency Guide'}
                    </span>
                </div>
                <p className="text-[9px] text-gray-500 leading-tight">
                    Generate an AI-driven strategy to reduce context window usage and optimize JSON structures.
                </p>
                {status === 'error' && (
                    <div className="mt-1 font-mono text-[8px] text-red-400 animate-fade-in">
                        ! {error}
                    </div>
                )}
            </button>

            {/* Results Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div 
                        className="bg-[#0a0a0a] border border-gray-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="optimization-modal-title"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
                            <div className="flex items-center gap-3">
                                <SparklesIcon className="w-5 h-5 text-emerald-400" />
                                <h2 id="optimization-modal-title" className="text-lg font-bold text-gray-200">
                                    Token Optimization Strategy
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                                    title="Copy to Clipboard"
                                >
                                    {isCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                                    title="Close"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar bg-[#050505]">
                            {result ? (
                                <MarkdownRenderer content={result} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    No data available.
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-800 bg-gray-900/30 text-right">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TokenOptimizationButton;
