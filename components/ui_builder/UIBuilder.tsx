
// components/ui_builder/UIBuilder.tsx
import React from 'react';
import { SparklesIcon, CodeIcon, EyeIcon } from '../icons';
import TabFooter from '../common/TabFooter';
import Loader from '../Loader';
import { useComponentGenerator } from '../../hooks/useComponentGenerator';
import ContentActions from '../common/ContentActions';

const UIBuilder: React.FC = () => {
    const { prompt, setPrompt, generatedCode, isGenerating, error, handleGenerate } = useComponentGenerator();

    return (
        <div className="flex flex-col h-full bg-[#050505] text-white font-sans">
            <div className="flex-grow flex flex-col lg:flex-row h-full overflow-hidden">
                
                {/* Left Panel: Prompt */}
                <div className="w-full lg:w-1/3 bg-gray-900/50 border-r border-gray-800 p-6 flex flex-col gap-6">
                    <div>
                        <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2 mb-2">
                            <SparklesIcon className="w-5 h-5" />
                            Interface Forge
                        </h2>
                        <p className="text-sm text-gray-400">Describe a React component to generate it instantly.</p>
                    </div>

                    <div className="flex-grow flex flex-col gap-4">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. A futuristic dashboard card with a neon chart..."
                            className="w-full h-64 bg-black/50 border border-gray-700 rounded-lg p-4 text-sm text-gray-200 focus:border-indigo-500 outline-none resize-none font-mono"
                            disabled={isGenerating}
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim()}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? <Loader className="w-4 h-4" /> : <CodeIcon className="w-4 h-4" />}
                            {isGenerating ? 'Forging...' : 'Generate Component'}
                        </button>
                        
                        {error && (
                            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-xs text-red-300">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Code Output / Preview */}
                <div className="flex-grow bg-[#0c0c0e] flex flex-col relative overflow-hidden">
                    {generatedCode ? (
                        <div className="flex flex-col h-full">
                            <div className="p-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                                <span className="text-xs font-mono text-gray-400 uppercase">Generated Code</span>
                                <ContentActions content={generatedCode} filename="Component.tsx" />
                            </div>
                            <div className="flex-grow overflow-auto p-6">
                                <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap">
                                    {generatedCode}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-600 pointer-events-none">
                            <div className="text-center">
                                <EyeIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p className="text-sm font-mono uppercase tracking-widest opacity-50">Preview Canvas Active</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <TabFooter />
        </div>
    );
};

export default UIBuilder;
