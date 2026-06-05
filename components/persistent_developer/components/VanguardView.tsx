
import React from 'react';
import { ProjectState } from '../types';
import { RedoIcon, BoltIcon, ErrorIcon, RocketLaunchIcon } from '../../icons';

interface VanguardViewProps {
  projectState: ProjectState;
}

export const VanguardView: React.FC<VanguardViewProps> = ({ projectState }) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-cyan-400">
            <BoltIcon className="w-5 h-5" /> Vanguard Updater
          </h2>
          <p className="text-sm text-slate-400">Directive: Prevent Software Entropy</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
          <RedoIcon className="w-4 h-4 animate-spin-slow" />
          Scanning NPM Registry...
        </div>
      </div>

      {/* First In Line / Priority Section */}
      <div className="bg-gradient-to-r from-red-900/40 to-slate-900 border border-red-500/50 rounded-lg p-4 mb-8">
        <h3 className="text-red-400 font-bold flex items-center gap-2 mb-2">
          <ErrorIcon className="w-5 h-5" /> FIRST IN LINE: Critical Action Required
        </h3>
        {projectState.dependencies.filter(d => d.status === 'critical').map((dep, idx) => (
          <div key={idx} className="bg-slate-950 p-4 rounded border border-red-900 flex justify-between items-center">
            <div>
              <p className="font-mono text-lg font-bold text-white">{dep.name}</p>
              <p className="text-sm text-red-300">Security Vulnerability Detected: {dep.cve}</p>
              <p className="text-xs text-slate-500 mt-1">Current: {dep.currentVersion} → Patched: {dep.latestVersion}</p>
            </div>
            <button className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm font-bold shadow-lg shadow-red-900/20">
              Apply Hotfix Now
            </button>
          </div>
        ))}
      </div>

      {/* Routine Updates */}
      <div className="flex-1">
        <h3 className="text-slate-300 font-bold mb-3">Modernization Queue</h3>
        <div className="space-y-3">
          {projectState.dependencies.filter(d => d.status !== 'critical').map((dep, idx) => (
            <div key={idx} className="bg-slate-800 p-3 rounded flex justify-between items-center border border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${dep.status === 'stable' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="font-mono text-sm">{dep.name}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 font-mono">v{dep.currentVersion}</span>
                {dep.status === 'outdated' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-cyan-400 font-mono">→ v{dep.latestVersion}</span>
                    <button className="p-1 hover:bg-slate-700 rounded text-cyan-400" title="Auto-Migrate">
                      <RocketLaunchIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
                {dep.status === 'stable' && <span className="text-xs text-green-500 font-mono">Up to date</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
