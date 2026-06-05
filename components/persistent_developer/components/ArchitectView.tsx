
import React, { useState } from 'react';
import { ProjectState, RoadmapPhase } from '../types';
import { PaperAirplaneIcon, BookIcon, ServerStackIcon } from '../../icons';

interface ArchitectViewProps {
  projectState: ProjectState;
  setProjectState: React.Dispatch<React.SetStateAction<ProjectState>>;
}

export const ArchitectView: React.FC<ArchitectViewProps> = ({ projectState, setProjectState }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleQuery = () => {
    if (!input.trim()) return;
    setIsTyping(true);
    
    // Simulate AI Latency and Roadmap Generation
    setTimeout(() => {
      const newRoadmap: RoadmapPhase[] = [
        { id: '1', phaseName: 'Phase 1: Requirements & Tech Stack', items: ['Select Rust for Core Engine', 'Define gRPC Interfaces'], status: 'complete' },
        { id: '2', phaseName: 'Phase 2: Architecture & Data Flow', items: ['Design Microservices Schema', 'Setup Kafka Topics'], status: 'in-progress' },
        { id: '3', phaseName: 'Phase 3: Development Milestones', items: ['Environment Setup', 'MVP API Implementation'], status: 'pending' },
        { id: '4', phaseName: 'Phase 4: Deployment & DevOps', items: ['Dockerize Services', 'Configure K8s Cluster'], status: 'pending' },
      ];

      setProjectState(prev => ({
        ...prev,
        status: 'development',
        roadmap: newRoadmap
      }));
      setIsTyping(false);
      setInput('');
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
          <BookIcon className="w-5 h-5" /> Architectural Blueprint
        </h2>
        <p className="text-sm text-slate-400">Ask: "How would you build [Project X]?"</p>
      </div>

      {/* Roadmap Visualization */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 border border-slate-700 rounded-lg p-4 bg-slate-950">
        {projectState.roadmap.length === 0 ? (
          <div className="text-center text-slate-500 mt-10">
            <ServerStackIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No architectural blueprint active. Initialize a project below.</p>
          </div>
        ) : (
          projectState.roadmap.map((phase) => (
            <div key={phase.id} className="border-l-2 border-indigo-500 pl-4 py-2">
              <h3 className="font-semibold text-indigo-300">{phase.phaseName}</h3>
              <ul className="list-disc list-inside text-sm text-slate-300 mt-1">
                {phase.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          ))
        )}
        {isTyping && <div className="text-indigo-400 animate-pulse">Generative Agent is constructing blueprint...</div>}
      </div>

      {/* Input Area */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., How would you build a secure telemedicine platform?"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 pr-12 text-white focus:outline-none focus:border-indigo-500"
          onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
        />
        <button 
          onClick={handleQuery}
          className="absolute right-2 top-2 p-1 text-slate-400 hover:text-white"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
