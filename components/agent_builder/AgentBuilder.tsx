
// components/agent_builder/AgentBuilder.tsx
import React, { useState, useEffect } from 'react';
import PromptArchitect from './PromptArchitect';
import AgentFactoryView from './AgentFactoryView';
import CriticStudio from './CriticStudio';
import SkillStudio from './SkillStudio';
import { 
    CpuChipIcon, BoltIcon, ShieldCheckIcon, UserIcon, 
    PuzzlePieceIcon, PlusIcon, TrashIcon 
} from '../icons';
import { agentManagementService } from '../../services/agentManagement.service';
import { appEventBus } from '../../lib/eventBus';
import { AgentManifest } from '../../types/agentSystem';

type BuilderTab = 'architect' | 'factory' | 'skills' | 'critic';

const AgentBuilder: React.FC = () => {
    const [activeTab, setActiveTab] = useState<BuilderTab>('architect');
    const [agents, setAgents] = useState<AgentManifest[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

    useEffect(() => {
        const state = agentManagementService.getState();
        setAgents(state.agents);

        const unsubscribe = appEventBus.on('telemetry', (payload) => {
            if (payload.type === 'agent_registry_update') {
                setAgents(payload.data.agents);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleCreateNew = () => {
        setSelectedAgentId(null);
        setActiveTab('architect');
    };

    return (
        <div className="flex h-full bg-[#050505] overflow-hidden">
            {/* Sidebar: Agent Registry */}
            <div className="w-64 border-r border-gray-800 bg-[#0a0a0a] flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Registry</h3>
                    <button 
                        onClick={handleCreateNew}
                        className="p-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                        title="New Agent Project"
                    >
                        <PlusIcon className="w-3 h-3" />
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-2 space-y-1">
                    {agents.map(agent => (
                        <button
                            key={agent.id}
                            onClick={() => setSelectedAgentId(agent.id || null)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all group relative ${
                                selectedAgentId === agent.id 
                                ? 'bg-indigo-900/20 text-indigo-300 border border-indigo-500/30' 
                                : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300 border border-transparent'
                            }`}
                        >
                            <div className="font-bold truncate">{agent.name}</div>
                            <div className="text-[10px] opacity-60 font-mono">v{agent.version} // {agent.role}</div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); agentManagementService.deleteAgent(agent.id!); }}
                                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                            >
                                <TrashIcon className="w-3 h-3" />
                            </button>
                        </button>
                    ))}
                    {agents.length === 0 && (
                        <div className="text-center py-10 text-gray-600 text-xs italic">No agents found.</div>
                    )}
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-grow flex flex-col overflow-hidden">
                {/* Navigation Header */}
                <div className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-6 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <CpuChipIcon className="w-6 h-6 text-emerald-400" />
                        <h1 className="text-lg font-bold text-gray-200 tracking-wide">
                            Agent Studio
                            {selectedAgentId && (
                                <span className="text-indigo-400 ml-2 font-mono text-sm border-l border-gray-700 pl-3">
                                    {agents.find(a => a.id === selectedAgentId)?.name}
                                </span>
                            )}
                        </h1>
                    </div>
                    
                    <div className="flex bg-black/40 rounded-lg p-1 border border-gray-800">
                        <TabButton 
                            active={activeTab === 'architect'} 
                            onClick={() => setActiveTab('architect')}
                            icon={<UserIcon className="w-4 h-4" />}
                            label="Architect"
                            color="fuchsia"
                        />
                        <TabButton 
                            active={activeTab === 'skills'} 
                            onClick={() => setActiveTab('skills')}
                            icon={<PuzzlePieceIcon className="w-4 h-4" />}
                            label="Skills"
                            color="orange"
                        />
                        <TabButton 
                            active={activeTab === 'factory'} 
                            onClick={() => setActiveTab('factory')}
                            icon={<BoltIcon className="w-4 h-4" />}
                            label="Factory"
                            color="cyan"
                        />
                        <TabButton 
                            active={activeTab === 'critic'} 
                            onClick={() => setActiveTab('critic')}
                            icon={<ShieldCheckIcon className="w-4 h-4" />}
                            label="Critic"
                            color="emerald"
                        />
                    </div>
                </div>

                {/* Module Content */}
                <div className="flex-grow overflow-hidden relative">
                    {activeTab === 'architect' && <PromptArchitect selectedId={selectedAgentId} />}
                    {activeTab === 'skills' && <SkillStudio />}
                    {activeTab === 'factory' && <AgentFactoryView selectedId={selectedAgentId} />}
                    {activeTab === 'critic' && <CriticStudio selectedId={selectedAgentId} />}
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label, color }: any) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
            active 
            ? `bg-${color}-900/40 text-${color}-300 shadow-[0_0_10px_rgba(217,70,239,0.2)] border border-${color}-500/30` 
            : 'text-gray-500 hover:text-gray-300'
        }`}
    >
        {icon} {label}
    </button>
);

export default AgentBuilder;
