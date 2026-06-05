
// components/foundry/Foundry.tsx
import React, { useState, useEffect } from 'react';
import AgentCard from './AgentCard';
import { foundryService } from '../../services/foundry.service';
import { ExtractionAgent, KnowledgeSource, ScrapedPayload } from '../../types/refinery';
import { useTelemetry } from '../../context/TelemetryContext';
import { BoltIcon, SignalIcon, SparklesIcon, BranchingIcon, ChatBubbleLeftRightIcon } from '../icons';
import { appEventBus } from '../../lib/eventBus';
import ProjectContextPanel from './ProjectContextPanel';
import MergeView from './MergeView';
import LaunchView from './LaunchView';
import AgentCommsGraph from './AgentCommsGraph';

type FoundryMode = 'forge' | 'merge' | 'launch' | 'comms';

const Foundry: React.FC = () => {
  const initialState = foundryService.getState();
  
  const [agents, setAgents] = useState<ExtractionAgent[]>(initialState.agents);
  const [sources, setSources] = useState<KnowledgeSource[]>(initialState.sources);
  const [feed, setFeed] = useState<ScrapedPayload[]>(initialState.feed);
  const [comms, setComms] = useState<any[]>(initialState.comms || []);
  const [isRefineryActive, setIsRefineryActive] = useState(initialState.isRunning);
  
  const [activeMode, setActiveMode] = useState<FoundryMode>('forge');
  
  const { updateTelemetryContext } = useTelemetry();

  useEffect(() => {
      updateTelemetryContext({ tab: 'Foundry' });
  }, [updateTelemetryContext]);

  useEffect(() => {
      const handleUpdate = (payload: { type: string, data: any }) => {
          if (payload.type === 'foundry_update') {
              const state = payload.data;
              setAgents(state.agents);
              setSources(state.sources);
              setFeed(state.feed);
              setComms(state.comms || []);
              setIsRefineryActive(state.isRunning);
          }
      };

      const unsubscribe = appEventBus.on('telemetry', handleUpdate);
      return () => unsubscribe();
  }, []);

  const handleToggle = () => {
      foundryService.toggleSimulation();
      setIsRefineryActive(!isRefineryActive);
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] text-white p-6 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 flex items-center gap-2">
            <SignalIcon className="w-6 h-6 text-cyan-400" />
            Knowledge Refinery
          </h1>
          <p className="text-sm text-gray-500 font-mono mt-1">Status: <span className={isRefineryActive ? 'text-green-400' : 'text-yellow-500'}>{isRefineryActive ? 'ONLINE' : 'STANDBY'}</span></p>
        </div>
        
        <div className="flex bg-black/40 rounded-lg p-1 border border-gray-800">
            <button 
                onClick={() => setActiveMode('forge')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeMode === 'forge' ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <BoltIcon className="w-4 h-4" /> Forge
            </button>
            <button 
                onClick={() => setActiveMode('comms')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeMode === 'comms' ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-500/30' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <ChatBubbleLeftRightIcon className="w-4 h-4" /> Comms
            </button>
            <button 
                onClick={() => setActiveMode('merge')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeMode === 'merge' ? 'bg-fuchsia-900/40 text-fuchsia-300 border border-fuchsia-500/30' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <BranchingIcon className="w-4 h-4" /> Merge
            </button>
            <button 
                onClick={() => setActiveMode('launch')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeMode === 'launch' ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/30' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <SparklesIcon className="w-4 h-4" /> Launch
            </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeMode === 'forge' && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
                <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-300">Agent Swarm</h2>
                            <p className="text-xs text-gray-500">{agents.filter(a => a.status !== 'idle').length} Active Nodes</p>
                        </div>
                        <button
                            onClick={handleToggle}
                            className={`px-4 py-2 rounded font-bold text-xs transition-all shadow-lg ${
                                isRefineryActive 
                                ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20' 
                                : 'bg-green-500/10 text-green-400 border border-green-500/50 hover:bg-green-500/20'
                            }`}
                        >
                            {isRefineryActive ? 'HALT' : 'INITIATE'}
                        </button>
                    </div>
                    
                    {agents.map(agent => (
                        <AgentCard key={agent.id} agent={agent} />
                    ))}
                    
                    <div className="mt-auto p-4 bg-gray-900/30 rounded-lg border border-gray-800">
                        <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Vectors</h3>
                        <ul className="text-xs space-y-2">
                            {sources.map(s => (
                                <li key={s.id} className="flex justify-between items-center bg-black/20 p-2 rounded">
                                    <span className="text-cyan-300 font-mono">{s.category}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${s.status === 'active' ? 'text-green-900 bg-green-400' : 'text-gray-500 bg-gray-800'}`}>
                                        {s.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="lg:col-span-8 bg-gray-900/20 rounded-lg border border-gray-800 flex flex-col shadow-inner overflow-hidden">
                    <div className="p-3 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
                        <h2 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                            <BoltIcon className="w-4 h-4" />
                            Live Knowledge Stream
                        </h2>
                        <span className="text-xs text-gray-600 font-mono">{feed.length} Packets</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono custom-scrollbar">
                        {feed.length === 0 && (
                            <div className="text-center text-gray-600 mt-20 italic">
                                <p>Waiting for neural link...</p>
                                <p className="text-xs mt-2">Click 'INITIATE' to begin extraction.</p>
                            </div>
                        )}
                        {feed.map((item, idx) => (
                            <div key={`${item.sourceId}-${idx}`} className="bg-black/40 border-l-2 border-blue-500 p-4 rounded-r-lg animate-fade-in hover:bg-black/60 transition-colors">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-[10px] text-blue-400 font-bold">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">{item.sourceId}</span>
                                </div>
                                <h3 className="text-sm font-bold text-gray-200 mb-1">{item.title}</h3>
                                <p className="text-xs text-gray-400 leading-relaxed">{item.summary}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeMode === 'comms' && (
            <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
                    <div className="lg:col-span-8 h-full">
                        <AgentCommsGraph agents={agents} comms={comms} />
                    </div>
                    <div className="lg:col-span-4 bg-gray-900/50 border border-gray-800 rounded-lg flex flex-col overflow-hidden">
                        <div className="p-3 border-b border-gray-800 bg-gray-900 font-bold text-xs uppercase tracking-widest text-indigo-400">Swarm Comms Log</div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {comms.length === 0 && <div className="text-gray-600 italic text-center mt-20 text-xs">No signals intercepted.</div>}
                            {comms.map(msg => (
                                <div key={msg.id} className="text-[10px] font-mono border-l-2 border-indigo-500 pl-2 py-1 bg-black/20">
                                    <div className="flex justify-between text-gray-500 mb-1">
                                        <span>Node {msg.from} &rarr; {msg.to}</span>
                                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="text-gray-300">{msg.content}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeMode === 'merge' && <MergeView />}
        {activeMode === 'launch' && <LaunchView />}
      </div>
    </div>
  );
};

export default Foundry;
