
import React, { useState, useRef, useEffect } from 'react';
import { BuilderMessage } from '../types';
import { PaperAirplaneIcon, SparklesIcon } from '../../icons';
import Loader from '../../Loader';

interface AgentChatProps {
    messages: BuilderMessage[];
    onSendMessage: (text: string) => void;
    isLoading: boolean;
}

export const AgentChat: React.FC<AgentChatProps> = ({ messages, onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input);
            setInput('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
            <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-fuchsia-400" />
                    Builder Agent
                </h3>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`
                            max-w-[85%] p-3 rounded-lg text-sm
                            ${msg.role === 'user' ? 'bg-fuchsia-900/40 text-fuchsia-100 rounded-br-none border border-fuchsia-700/30' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'}
                        `}>
                            {msg.content}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 p-3 rounded-lg rounded-bl-none flex items-center gap-2">
                            <Loader className="w-3 h-3" />
                            <span className="text-xs text-slate-400">Architecting solution...</span>
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-950">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="What should we build?"
                        disabled={isLoading}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-4 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-2 p-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-md disabled:opacity-50 disabled:bg-slate-700 transition-colors"
                    >
                        <PaperAirplaneIcon className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
};
