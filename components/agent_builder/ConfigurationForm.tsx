
import React from 'react';
import { AgentConfig, LLMModel, AgentRole } from '../../types';
import { UserIcon, CpuChipIcon, FireIcon, DocumentIcon } from '../icons';

interface ConfigurationFormProps {
  config: AgentConfig;
  onChange: <K extends keyof AgentConfig>(field: K, value: AgentConfig[K]) => void;
}

export function ConfigurationForm({ config, onChange }: ConfigurationFormProps) {
  return (
    <div className="space-y-6">
      {/* Identity Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-blue-400" />
          Agent Identity
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Name</label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => onChange('name', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g. Nexus Architect"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Role</label>
            <select
              value={config.role}
              onChange={(e) => onChange('role', e.target.value as AgentRole)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="assistant">General Assistant</option>
              <option value="coder">Software Engineer</option>
              <option value="researcher">Researcher</option>
              <option value="architect">System Architect</option>
            </select>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-800" />

      {/* Model Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
          <CpuChipIcon className="w-5 h-5 text-purple-400" />
          Model Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Base Model</label>
            <select
              value={config.model}
              onChange={(e) => onChange('model', e.target.value as LLMModel)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
              <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-slate-400 flex items-center gap-1">
                <FireIcon className="w-3 h-3" /> Temperature
              </label>
              <span className="text-xs text-slate-500">{config.temperature.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) => onChange('temperature', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-800" />

      {/* Instructions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
          <DocumentIcon className="w-5 h-5 text-emerald-400" />
          System Instructions
        </h3>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400">Prompt Strategy</label>
          <textarea
            value={config.systemPrompt}
            onChange={(e) => onChange('systemPrompt', e.target.value)}
            rows={6}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm resize-none"
            placeholder="Define how the agent should behave..."
          />
        </div>
      </div>
    </div>
  );
}
