
// components/agent_builder/NodeConfigPanel.tsx
import React, { useState, useEffect } from 'react';
import { WorkflowNode } from '../../types/workflow';
import { XMarkIcon, PlusIcon, TrashIcon, UserIcon, BranchingIcon } from '../icons';
import { agentManagementService } from '../../services/agentManagement.service';
import { AgentManifest } from '../../types/agentSystem';

interface NodeConfigPanelProps {
  node: WorkflowNode;
  onClose: () => void;
  onUpdate: (nodeId: string, newData: any) => void;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, onClose, onUpdate }) => {
  const [agents, setAgents] = useState<AgentManifest[]>([]);

  useEffect(() => {
    const state = agentManagementService.getState();
    setAgents(state.agents);
  }, []);

  const handleChange = (field: string, value: any) => {
    onUpdate(node.id, {
      ...node.data,
      config: { ...node.data.config, [field]: value }
    });
  };

  const handleLabelChange = (value: string) => {
    onUpdate(node.id, { ...node.data, label: value });
  };

  const renderConfigFields = () => {
    switch (node.data.type) {
      case 'agent_exec':
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 uppercase font-bold">Select Agent</label>
              <select 
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white font-mono"
                value={node.data.config.agentId || ''}
                onChange={e => {
                    const agent = agents.find(a => a.id === e.target.value);
                    handleChange('agentId', e.target.value);
                    handleChange('agentName', agent?.name || '');
                }}
              >
                <option value="">Choose Registry Agent...</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name} (v{a.version})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Input Context (Variable)</label>
              <input 
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200 font-mono"
                placeholder="e.g. scrapedData"
                value={node.data.config.inputVariable || ''} 
                onChange={e => handleChange('inputVariable', e.target.value)} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Result Variable (Destination)</label>
              <input 
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200 font-mono"
                placeholder="agentResponse"
                value={node.data.config.resultVariable || ''} 
                onChange={e => handleChange('resultVariable', e.target.value)} 
              />
            </div>
          </div>
        );

      case 'conditional':
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Check Variable</label>
              <input 
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200 font-mono"
                placeholder="e.g. status"
                value={node.data.config.conditionVariable || ''} 
                onChange={e => handleChange('conditionVariable', e.target.value)} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Operator</label>
              <select
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
                value={node.data.config.conditionOperator || 'equals'}
                onChange={e => handleChange('conditionOperator', e.target.value)}
              >
                <option value="equals">Equals</option>
                <option value="contains">Contains</option>
                <option value="not_empty">Is Not Empty</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Comparison Value</label>
              <input 
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200 font-mono"
                placeholder="e.g. success"
                value={node.data.config.conditionValue || ''} 
                onChange={e => handleChange('conditionValue', e.target.value)} 
              />
            </div>
          </div>
        );

      case 'llm_instruction':
        return (
          <>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Instructions</label>
              <textarea 
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200 h-32 font-mono"
                placeholder="Analyze the following content..."
                value={node.data.config.instruction || ''} 
                onChange={e => handleChange('instruction', e.target.value)} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Input Content (Variable)</label>
              <input 
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200 font-mono"
                placeholder="${pageContent}"
                value={node.data.config.inputContent || ''} 
                onChange={e => handleChange('inputContent', e.target.value)} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Result Variable (Optional)</label>
              <input 
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
                value={node.data.config.resultVariable || ''} 
                onChange={e => handleChange('resultVariable', e.target.value)} 
              />
            </div>
          </>
        );

      case 'flow_start':
        return (
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Flow Variables</label>
            <p className="text-[10px] text-gray-500">Define variables to be used in the flow (e.g. topic).</p>
            {(node.data.config.variables || []).map((v: any, idx: number) => (
                <div key={idx} className="flex gap-2">
                    <input 
                        className="w-1/2 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200"
                        placeholder="Name"
                        value={v.name}
                        onChange={e => {
                            const newVars = [...(node.data.config.variables || [])];
                            newVars[idx].name = e.target.value;
                            handleChange('variables', newVars);
                        }}
                    />
                    <input 
                        className="w-1/2 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200"
                        placeholder="Default Value"
                        value={v.defaultValue}
                        onChange={e => {
                            const newVars = [...(node.data.config.variables || [])];
                            newVars[idx].defaultValue = e.target.value;
                            handleChange('variables', newVars);
                        }}
                    />
                </div>
            ))}
            <button 
                onClick={() => handleChange('variables', [...(node.data.config.variables || []), {name: '', defaultValue: ''}])}
                className="text-xs text-blue-400 hover:text-blue-300"
            >
                + Add Variable
            </button>
          </div>
        );

      case 'read_file':
        return (
          <>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">File Path</label>
              <input 
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200 font-mono"
                placeholder="/path/to/file.txt"
                value={node.data.config.filePath || ''} 
                onChange={e => handleChange('filePath', e.target.value)} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Result Variable</label>
              <input 
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
                placeholder="fileContent"
                value={node.data.config.resultVariable || ''} 
                onChange={e => handleChange('resultVariable', e.target.value)} 
              />
            </div>
          </>
        );

      case 'write_file':
        return (
          <>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">File Path</label>
              <input 
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200 font-mono"
                placeholder="/path/to/write.txt"
                value={node.data.config.filePath || ''} 
                onChange={e => handleChange('filePath', e.target.value)} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Content</label>
              <textarea 
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 font-mono h-32"
                placeholder="${contentToSave}"
                value={node.data.config.content || ''} 
                onChange={e => handleChange('content', e.target.value)} 
              />
            </div>
          </>
        );

      case 'web_scraping':
        return (
          <>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">URL to Scrape</label>
              <input 
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200 font-mono"
                placeholder="https://example.com/${path}"
                value={node.data.config.url || ''} 
                onChange={e => handleChange('url', e.target.value)} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Result Variable</label>
              <input 
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
                placeholder="pageContent"
                value={node.data.config.resultVariable || ''} 
                onChange={e => handleChange('resultVariable', e.target.value)} 
              />
            </div>
          </>
        );

      default:
        return <p className="text-sm text-gray-500 italic">No configuration available for this node type.</p>;
    }
  };

  return (
    <div className="w-80 h-full bg-gray-900 border-l border-gray-800 p-4 flex flex-col shadow-xl absolute top-0 right-0 z-20">
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-2">
        <h3 className="font-bold text-gray-200">Configure Block</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6 flex-grow overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">Label</label>
          <input 
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
            value={node.data.label} 
            onChange={e => handleLabelChange(e.target.value)} 
          />
        </div>

        <div className="space-y-4 border-t border-gray-800 pt-4">
            {renderConfigFields()}
        </div>
      </div>
    </div>
  );
};

export default NodeConfigPanel;
