
import React, { useState, useMemo, useEffect } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { 
    BoltIcon, 
    CodeIcon, 
    PuzzlePieceIcon, 
    CheckCircleIcon,
    PlusIcon,
    TrashIcon,
    JsonIcon,
    ServerStackIcon,
    Cog6ToothIcon,
    InformationCircleIcon
} from '../icons';
import OptimizedTextarea from '../common/OptimizedTextarea';
import { audioService } from '../../services/audioService';

interface SkillParam {
    name: string;
    type: 'string' | 'number' | 'boolean';
    description: string;
}

interface SetupArg {
    key: string;
    type: 'string' | 'number' | 'boolean';
    required: boolean;
    inputType: 'text' | 'password';
    defaultValue: string;
    placeholder: string;
    hint: string;
}

interface SkillExample {
    prompt: string;
    call: string;
}

const SkillStudio: React.FC = () => {
    // --- State ---
    const [activeTab, setActiveTab] = useState<'manifest' | 'code' | 'preview'>('manifest');
    
    // Identity
    const [meta, setMeta] = useState({
        name: 'My Custom Skill',
        hubId: 'my-custom-skill',
        description: 'A custom skill for AnythingLLM.',
        author: '',
        authorUrl: '',
        license: 'MIT',
        version: '1.0.0'
    });

    // Configuration (Setup Args - e.g. API Keys)
    const [setupArgs, setSetupArgs] = useState<SetupArg[]>([
        { 
            key: 'API_KEY', 
            type: 'string', 
            required: true, 
            inputType: 'password', 
            defaultValue: '', 
            placeholder: 'sk-...', 
            hint: 'API Key for the service' 
        }
    ]);

    // Runtime Inputs (Entrypoint Params - e.g. city_name)
    const [params, setParams] = useState<SkillParam[]>([
        { name: 'query', type: 'string', description: 'The search query string.' }
    ]);

    // Few-Shot Examples
    const [examples, setExamples] = useState<SkillExample[]>([
        { prompt: "Search for cats", call: '{"query": "cats"}' }
    ]);

    // Handler Code
    const [handlerCode, setHandlerCode] = useState<string>('');
    const [readme, setReadme] = useState('# My Custom Skill\n\nDescription of the skill.');

    // --- Derived State (plugin.json) ---
    const pluginJson = useMemo(() => {
        const entrypointParams: Record<string, any> = {};
        params.forEach(p => {
            entrypointParams[p.name] = {
                description: p.description,
                type: p.type
            };
        });

        const setupArgsObj: Record<string, any> = {};
        setupArgs.forEach(arg => {
            setupArgsObj[arg.key] = {
                type: arg.type,
                required: arg.required,
                input: {
                    type: arg.inputType,
                    default: arg.defaultValue,
                    placeholder: arg.placeholder,
                    hint: arg.hint
                },
                value: "" // Default empty value for export
            };
        });

        return JSON.stringify({
            active: true,
            hubId: meta.hubId,
            name: meta.name,
            schema: "skill-1.0.0",
            version: meta.version,
            description: meta.description,
            author: meta.author,
            author_url: meta.authorUrl,
            license: meta.license,
            setup_args: Object.keys(setupArgsObj).length > 0 ? setupArgsObj : undefined,
            examples: examples,
            entrypoint: {
                file: "handler.js",
                params: entrypointParams
            },
            imported: true
        }, null, 2);
    }, [meta, params, examples, setupArgs]);

    // Generate Boilerplate if empty
    useEffect(() => {
        if (!handlerCode) {
            regenerateBoilerplate();
        }
    }, []);

    // --- Handlers ---

    const handleAddParam = () => setParams([...params, { name: 'new_param', type: 'string', description: 'Description' }]);
    const handleRemoveParam = (index: number) => setParams(params.filter((_, i) => i !== index));
    const handleUpdateParam = (index: number, field: keyof SkillParam, value: any) => {
        const newParams = [...params];
        (newParams[index] as any)[field] = value;
        setParams(newParams);
    };

    const handleAddSetupArg = () => setSetupArgs([...setupArgs, { key: 'NEW_CONFIG', type: 'string', required: false, inputType: 'text', defaultValue: '', placeholder: '', hint: '' }]);
    const handleRemoveSetupArg = (index: number) => setSetupArgs(setupArgs.filter((_, i) => i !== index));
    const handleUpdateSetupArg = (index: number, field: keyof SetupArg, value: any) => {
        const newArgs = [...setupArgs];
        (newArgs[index] as any)[field] = value;
        setSetupArgs(newArgs);
    };

    const handleAddExample = () => setExamples([...examples, { prompt: '', call: '{}' }]);
    const handleRemoveExample = (index: number) => setExamples(examples.filter((_, i) => i !== index));
    const handleUpdateExample = (index: number, field: keyof SkillExample, value: string) => {
        const newEx = [...examples];
        newEx[index][field] = value;
        setExamples(newEx);
    };

    function regenerateBoilerplate() {
        const args = params.map(p => p.name).join(', ');
        
        const configAccess = setupArgs.length > 0 
            ? `    // Access Configuration (setup_args)
${setupArgs.map(a => `    const ${a.key} = this.runtimeArgs["${a.key}"];`).join('\n')}`
            : '';

        const code = `module.exports.runtime = {
  handler: async function ({ ${args} }) {
    const callerId = \`\${this.config.name}-v\${this.config.version}\`;
    
    try {
      this.introspect(\`\${callerId} invoked...\`);
      
${configAccess}

      // TODO: Implement logic for ${meta.name}
      // Inputs: ${args}
      
      this.logger(\`Processing request...\`);
      
      const result = "Execution Successful";
      
      return result; // Must return a string
      
    } catch (e) {
      this.introspect(\`\${callerId} failed: \${e.message}\`);
      this.logger(\`\${callerId} error\`, e.message);
      return \`Error: \${e.message}\`;
    }
  }
};`;
        setHandlerCode(code);
        audioService.playSound('click');
    }

    const handleExport = async () => {
        audioService.playSound('click');
        const zip = new JSZip();
        
        // Root folder must match hubId
        const folder = zip.folder(meta.hubId);
        
        if (folder) {
            folder.file("plugin.json", pluginJson);
            folder.file("handler.js", handlerCode);
            folder.file("README.md", readme);
            folder.file("package.json", JSON.stringify({
                name: meta.hubId,
                version: meta.version,
                description: meta.description,
                main: "handler.js",
                dependencies: {}
            }, null, 2));
            
            const blob = await zip.generateAsync({ type: "blob" });
            saveAs(blob, `${meta.hubId}-skill.zip`);
            audioService.playSound('success');
        }
    };

    return (
        <div className="flex h-full bg-[#050505] text-gray-200 overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-64 border-r border-gray-800 bg-[#0a0a0a] flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-gray-800 bg-gray-900/50">
                    <h3 className="text-sm font-bold text-fuchsia-400 uppercase tracking-widest flex items-center gap-2">
                        <PuzzlePieceIcon className="w-4 h-4" /> Skill Studio
                    </h3>
                </div>
                
                <div className="flex-grow p-4 space-y-2">
                    <button onClick={() => setActiveTab('manifest')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'manifest' ? 'bg-gray-800 text-white border border-gray-700' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}`}>
                        <ServerStackIcon className="w-4 h-4" /> Manifest & Config
                    </button>
                    <button onClick={() => setActiveTab('code')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'code' ? 'bg-gray-800 text-white border border-gray-700' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}`}>
                        <CodeIcon className="w-4 h-4" /> Logic Handler
                    </button>
                    <button onClick={() => setActiveTab('preview')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'preview' ? 'bg-gray-800 text-white border border-gray-700' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}`}>
                        <JsonIcon className="w-4 h-4" /> JSON Preview
                    </button>
                </div>

                <div className="p-4 border-t border-gray-800">
                    <button onClick={handleExport} className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs uppercase tracking-wider rounded shadow-lg shadow-fuchsia-900/20 flex items-center justify-center gap-2 transition-all">
                        <BoltIcon className="w-4 h-4" /> Export Package
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow flex flex-col bg-[#050505] overflow-hidden">
                
                {/* View: Manifest & Params */}
                {activeTab === 'manifest' && (
                    <div className="flex-grow overflow-y-auto p-8 max-w-5xl mx-auto w-full space-y-8">
                        
                        {/* 1. Identity */}
                        <div className="bg-gray-900/30 p-6 rounded-lg border border-gray-800">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <InformationCircleIcon className="w-4 h-4 text-cyan-400" /> Identity
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Display Name</label>
                                    <input className="w-full bg-black/50 border border-gray-700 rounded p-2 text-sm focus:border-fuchsia-500 outline-none" value={meta.name} onChange={e => setMeta({...meta, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Hub ID (Folder Name)</label>
                                    <input className="w-full bg-black/50 border border-gray-700 rounded p-2 text-sm font-mono text-cyan-400 focus:border-cyan-500 outline-none" value={meta.hubId} onChange={e => setMeta({...meta, hubId: e.target.value.replace(/[^a-z0-9-_]/gi, '')})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs text-gray-400 mb-1">Description</label>
                                    <textarea className="w-full bg-black/50 border border-gray-700 rounded p-2 text-sm h-20 resize-none focus:border-fuchsia-500 outline-none" value={meta.description} onChange={e => setMeta({...meta, description: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        {/* 2. Configuration (setup_args) */}
                        <div className="bg-gray-900/30 p-6 rounded-lg border border-gray-800">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <Cog6ToothIcon className="w-4 h-4 text-orange-400" /> Setup Arguments (Configuration)
                                </h3>
                                <button onClick={handleAddSetupArg} className="text-xs flex items-center gap-1 text-orange-400 hover:text-orange-300"><PlusIcon className="w-3 h-3" /> Add Config</button>
                            </div>
                            <div className="space-y-3">
                                {setupArgs.map((arg, idx) => (
                                    <div key={idx} className="flex gap-3 items-start bg-black/40 p-3 rounded border border-gray-700/50">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex gap-2">
                                                <input className="flex-1 bg-transparent border-b border-gray-600 text-sm font-mono text-orange-300 focus:border-orange-500 outline-none pb-1" placeholder="KEY_NAME" value={arg.key} onChange={e => handleUpdateSetupArg(idx, 'key', e.target.value)} />
                                                <select className="bg-gray-800 border border-gray-600 rounded text-xs p-1 text-gray-300" value={arg.type} onChange={e => handleUpdateSetupArg(idx, 'type', e.target.value)}>
                                                    <option value="string">String</option>
                                                    <option value="number">Number</option>
                                                    <option value="boolean">Boolean</option>
                                                </select>
                                                <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
                                                    <input type="checkbox" checked={arg.required} onChange={e => handleUpdateSetupArg(idx, 'required', e.target.checked)} /> Req
                                                </label>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <input className="bg-gray-800/50 border border-gray-700 rounded p-1.5 text-xs text-gray-300" placeholder="Default Value" value={arg.defaultValue} onChange={e => handleUpdateSetupArg(idx, 'defaultValue', e.target.value)} />
                                                <input className="bg-gray-800/50 border border-gray-700 rounded p-1.5 text-xs text-gray-300" placeholder="Placeholder" value={arg.placeholder} onChange={e => handleUpdateSetupArg(idx, 'placeholder', e.target.value)} />
                                                <input className="bg-gray-800/50 border border-gray-700 rounded p-1.5 text-xs text-gray-300" placeholder="Hint Text" value={arg.hint} onChange={e => handleUpdateSetupArg(idx, 'hint', e.target.value)} />
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveSetupArg(idx)} className="text-gray-600 hover:text-red-400 p-1"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                {setupArgs.length === 0 && <p className="text-xs text-gray-600 italic">No configuration variables defined.</p>}
                            </div>
                        </div>

                        {/* 3. Runtime Inputs (entrypoint.params) */}
                        <div className="bg-gray-900/30 p-6 rounded-lg border border-gray-800">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <BoltIcon className="w-4 h-4 text-cyan-400" /> Runtime Inputs (Parameters)
                                </h3>
                                <button onClick={handleAddParam} className="text-xs flex items-center gap-1 text-cyan-400 hover:text-cyan-300"><PlusIcon className="w-3 h-3" /> Add Input</button>
                            </div>
                            <div className="space-y-2">
                                {params.map((param, idx) => (
                                    <div key={idx} className="flex gap-2 items-start bg-black/40 p-2 rounded border border-gray-700/50">
                                        <div className="flex-1">
                                            <input className="w-full bg-transparent border-b border-gray-600 text-sm font-mono text-cyan-300 focus:border-cyan-500 outline-none pb-1" placeholder="param_name" value={param.name} onChange={e => handleUpdateParam(idx, 'name', e.target.value)} />
                                        </div>
                                        <div className="w-24">
                                            <select className="w-full bg-gray-800 border border-gray-600 rounded text-xs p-1 text-gray-300" value={param.type} onChange={e => handleUpdateParam(idx, 'type', e.target.value)}>
                                                <option value="string">String</option>
                                                <option value="number">Number</option>
                                                <option value="boolean">Boolean</option>
                                            </select>
                                        </div>
                                        <div className="flex-[2]">
                                            <input className="w-full bg-transparent border-b border-gray-600 text-sm text-gray-400 focus:border-gray-500 outline-none pb-1" placeholder="Description for LLM..." value={param.description} onChange={e => handleUpdateParam(idx, 'description', e.target.value)} />
                                        </div>
                                        <button onClick={() => handleRemoveParam(idx)} className="text-gray-600 hover:text-red-400 p-1"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. Examples */}
                        <div className="bg-gray-900/30 p-6 rounded-lg border border-gray-800">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <CheckCircleIcon className="w-4 h-4 text-green-400" /> Few-Shot Examples
                                </h3>
                                <button onClick={handleAddExample} className="text-xs flex items-center gap-1 text-green-400 hover:text-green-300"><PlusIcon className="w-3 h-3" /> Add Example</button>
                            </div>
                            <div className="space-y-4">
                                {examples.map((ex, idx) => (
                                    <div key={idx} className="bg-black/40 p-3 rounded border border-gray-700/50 relative group">
                                        <button onClick={() => handleRemoveExample(idx)} className="absolute top-2 right-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4" /></button>
                                        <div className="mb-2">
                                            <label className="text-[10px] text-gray-500 uppercase">User Prompt</label>
                                            <input className="w-full bg-gray-900/50 border border-gray-700 rounded p-1.5 text-sm text-gray-300" value={ex.prompt} onChange={e => handleUpdateExample(idx, 'prompt', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase">Tool Call JSON</label>
                                            <input className="w-full bg-gray-900/50 border border-gray-700 rounded p-1.5 text-sm font-mono text-green-300/80" value={ex.call} onChange={e => handleUpdateExample(idx, 'call', e.target.value)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* View: Code Editor */}
                {activeTab === 'code' && (
                    <div className="flex-grow flex flex-col relative h-full">
                        <div className="bg-[#0a0a0a] border-b border-gray-800 p-2 flex justify-between items-center">
                            <span className="text-xs text-gray-500 font-mono ml-2">handler.js</span>
                            <button onClick={regenerateBoilerplate} className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-cyan-400 transition-colors">Reset Boilerplate</button>
                        </div>
                        <div className="flex-grow relative">
                            <OptimizedTextarea value={handlerCode} onChange={(e) => setHandlerCode(e.target.value)} className="w-full h-full bg-[#050505] text-yellow-100/90 font-mono text-sm p-6 resize-none outline-none leading-relaxed" spellCheck={false} />
                        </div>
                    </div>
                )}

                {/* View: Preview */}
                {activeTab === 'preview' && (
                    <div className="flex-grow flex flex-col h-full">
                        <div className="bg-[#0a0a0a] border-b border-gray-800 p-2">
                            <span className="text-xs text-gray-500 font-mono ml-2">plugin.json (Read Only)</span>
                        </div>
                        <div className="flex-grow overflow-auto p-0">
                            <OptimizedTextarea value={pluginJson} onChange={() => {}} readOnly className="w-full h-full bg-[#050505] text-green-400 font-mono text-sm p-6 resize-none outline-none" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkillStudio;
