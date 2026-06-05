
import React from 'react';
import { AgentAction } from '../types';
import { CheckCircleIcon, XMarkIcon, CodeIcon, TerminalIcon, DocumentIcon } from '../../icons';

interface ActionQueueProps {
    actions: AgentAction[];
    onApply: (actionId: string) => void;
    onReject: (actionId: string) => void;
    onSelect: (action: AgentAction) => void;
    selectedActionId: string | null;
}

const getActionIcon = (type: string) => {
    switch (type) {
        case 'create_file': return <DocumentIcon className="w-4 h-4 text-green-400" />;
        case 'modify_file': return <CodeIcon className="w-4 h-4 text-yellow-400" />;
        case 'run_command': return <TerminalIcon className="w-4 h-4 text-fuchsia-400" />;
        default: return <CodeIcon className="w-4 h-4 text-gray-400" />;
    }
};

export const ActionQueue: React.FC<ActionQueueProps> = ({ actions, onApply, onReject, onSelect, selectedActionId }) => {
    return (
        <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-200">Execution Queue</h3>
                <span className="text-xs text-slate-500">{actions.filter(a => a.status === 'pending').length} Pending</span>
            </div>
            <div className="flex-grow overflow-y-auto p-2 space-y-2">
                {actions.length === 0 ? (
                    <div className="text-center text-slate-600 text-xs mt-10 italic">
                        No active tasks. Ask the agent to build something.
                    </div>
                ) : (
                    actions.map(action => (
                        <div 
                            key={action.id}
                            className={`
                                flex flex-col p-3 rounded-lg border transition-all cursor-pointer group
                                ${selectedActionId === action.id ? 'bg-slate-800 border-indigo-500/50' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}
                                ${action.status === 'applied' ? 'opacity-50 animate-task-complete' : ''}
                            `}
                            onClick={() => onSelect(action)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-black rounded border border-slate-700">
                                        {getActionIcon(action.type)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-xs font-bold ${action.status === 'applied' ? 'text-green-500' : 'text-slate-200'} truncate max-w-[150px]`}>
                                            {action.target}
                                        </span>
                                        <span className="text-[10px] text-slate-500 uppercase">{action.type.replace('_', ' ')}</span>
                                    </div>
                                </div>
                                {action.status === 'pending' && (
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onApply(action.id); }}
                                            className="p-1.5 rounded bg-green-900/20 text-green-400 hover:bg-green-600 hover:text-white transition-colors"
                                            title="Apply"
                                        >
                                            <CheckCircleIcon className="w-3 h-3" />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onReject(action.id); }}
                                            className="p-1.5 rounded bg-red-900/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                                            title="Reject"
                                        >
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                {action.status === 'applied' && <span className="text-[10px] text-green-500 font-mono">DONE</span>}
                                {action.status === 'rejected' && <span className="text-[10px] text-red-500 font-mono">SKIPPED</span>}
                            </div>
                            <p className="text-[10px] text-slate-400 line-clamp-2">{action.reasoning}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
