
// components/chat/CodeBlock.tsx
import React, { useState } from 'react';
import { CopyIcon, CheckIcon, BoltIcon, TerminalIcon, XMarkIcon } from '../icons';
import { executeCode } from '../../services/codeExecutor';
import Loader from '../Loader';

interface CodeBlockProps {
    language: string;
    code: string;
    onExecute?: (language: string, code: string) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code, onExecute }) => {
    const [copied, setCopied] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<string | null>(null);
    
    // Check if the language is supported for execution
    const isExecutable = (language === 'javascript' || language === 'python' || language === 'js' || language === 'py');

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRun = async () => {
        if (onExecute) {
            // Defer to parent handler (e.g. Chat)
            onExecute(language, code);
        } else {
            // Inline Execution (e.g. Shunt/Weaver)
            setIsExecuting(true);
            setExecutionResult(null);
            try {
                const result = await executeCode(language, code);
                setExecutionResult(result);
            } catch (e: any) {
                setExecutionResult(`System Error: ${e.message}`);
            } finally {
                setIsExecuting(false);
            }
        }
    };

    const clearResult = () => setExecutionResult(null);

    return (
        <div className="bg-[#09090b] border border-gray-800 rounded-lg my-3 not-prose relative group shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-3 py-2 bg-gray-900/50 border-b border-gray-800">
                <span className="text-[10px] font-mono uppercase text-gray-500 font-bold tracking-wider">
                    {language || 'text'}
                </span>
                <div className="flex items-center gap-2">
                    {isExecutable && (
                        <button 
                            onClick={handleRun} 
                            disabled={isExecuting}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                                isExecuting 
                                    ? 'bg-yellow-900/20 text-yellow-500 cursor-wait' 
                                    : 'bg-green-900/20 text-green-400 hover:bg-green-900/40 border border-green-900/50'
                            }`}
                        >
                            {isExecuting ? <Loader className="w-3 h-3" /> : <BoltIcon className="w-3 h-3" />}
                            {isExecuting ? 'Running...' : 'Run'}
                        </button>
                    )}
                    <button 
                        onClick={handleCopy} 
                        className="p-1 rounded text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
                        title="Copy Code"
                    >
                        {copied ? <CheckIcon className="w-3.5 h-3.5 text-green-400" /> : <CopyIcon className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* Code Content */}
            <div className="relative">
                <pre className="p-4 text-xs md:text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed bg-[#050505]">
                    <code>{code}</code>
                </pre>
            </div>

            {/* Execution Result Panel (Inline) */}
            {executionResult && (
                <div className="border-t border-gray-800 bg-gray-900/30">
                    <div className="flex justify-between items-center px-3 py-1.5 bg-black/20 border-b border-gray-800/50">
                        <span className="text-[10px] font-bold text-gray-500 flex items-center gap-2">
                            <TerminalIcon className="w-3 h-3" /> CONSOLE OUTPUT
                        </span>
                        <button onClick={clearResult} className="text-gray-600 hover:text-red-400">
                            <XMarkIcon className="w-3 h-3" />
                        </button>
                    </div>
                    <pre className={`p-3 text-xs font-mono overflow-x-auto max-h-48 whitespace-pre-wrap ${executionResult.startsWith('Error:') ? 'text-red-300' : 'text-green-300'}`}>
                        {executionResult}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default CodeBlock;
