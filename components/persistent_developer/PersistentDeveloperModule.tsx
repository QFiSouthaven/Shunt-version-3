
import React, { useState } from 'react';
import { DeveloperPersona, ProjectState, INITIAL_PROJECT_STATE } from './types';
import { ArchitectView } from './components/OmniscientArchitectView'; // Updated import
import { SpeedsterView } from './components/SpeedsterView';
import { VanguardView } from './components/VanguardView';
import { UserIcon, BoltIcon, HistoryIcon } from '../icons';

export const PersistentDeveloperModule: React.FC = () => {
  const [activePersona, setActivePersona] = useState<DeveloperPersona>('ARCHITECT');
  const [projectState, setProjectState] = useState<ProjectState>(INITIAL_PROJECT_STATE);

  const renderActivePersona = () => {
    switch (activePersona) {
      case 'ARCHITECT':
        return <ArchitectView projectState={projectState} setProjectState={setProjectState} />;
      case 'SPEEDSTER':
        return <SpeedsterView />;
      case 'UPDATER':
        return <VanguardView projectState={projectState} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full bg-slate-950 border-r border-slate-800 w-full mx-auto shadow-2xl overflow-hidden">
      {/* Sub-Tab Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-2 flex items-center justify-between shrink-0">
        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActivePersona('ARCHITECT')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activePersona === 'ARCHITECT' 
                ? 'bg-indigo-600 text-white shadow' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-4 h-4" /> Omniscient Architect
          </button>
          
          <button
            onClick={() => setActivePersona('SPEEDSTER')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activePersona === 'SPEEDSTER' 
                ? 'bg-orange-600 text-white shadow' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BoltIcon className="w-4 h-4" /> Speedster
          </button>

          <button
            onClick={() => setActivePersona('UPDATER')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activePersona === 'UPDATER' 
                ? 'bg-cyan-600 text-white shadow' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HistoryIcon className="w-4 h-4" /> Vanguard
          </button>
        </div>
        
        <div className="text-xs text-slate-500 px-2 font-mono hidden md:block">
          Persistent Context: {projectState.name}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {renderActivePersona()}
      </div>
    </div>
  );
};
