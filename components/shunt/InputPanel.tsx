
// components/shunt/InputPanel.tsx
import React, { useState } from 'react';
import FileUpload from '../common/FileUpload';
import Loader from '../Loader';
import { ClipboardDocumentListIcon, MinusIcon, AmplifyIcon, ServerStackIcon, CodeIcon } from '../icons';
import OptimizedTextarea from '../common/OptimizedTextarea';
import { useMCPContext } from '../../context/MCPContext';
import { MCPConnectionStatus } from '../../types/mcp';
import { audioService } from '../../services/audioService';
import { SAMPLE_CODE_SNIPPETS } from '../../services/prompts';

interface InputPanelProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur: () => void;
  onPasteDemo: () => void;
  onFileLoad: (text: string) => void;
  onClearFile: () => void;
  error?: string | null;
  maxLength?: number;
  isLoading: boolean;
  onToggleScratchpad: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  priority: string;
  onPriorityChange: (priority: string) => void;
}

const SOLUTION_TEMPLATES = [
    { label: '⚡ Select Solution...', value: '' },
    { label: '🛠️ Modernize Component', value: 'Please refactor the following React component to use React 19 features, TypeScript, and functional patterns. Optimize for performance and readability.\n\n[PASTE CODE HERE]' },
    { label: '🐛 Debug & Fix', value: 'I am encountering the following error:\n\n[PASTE ERROR LOG]\n\nContext/Code:\n[PASTE RELEVANT CODE]\n\nPlease analyze the root cause and provide a fix.' },
    { label: '🧪 Generate Unit Tests', value: 'Generate comprehensive unit tests (using Vitest/Jest) for the provided code. Include test cases for success, failure, and edge scenarios.\n\n[PASTE CODE HERE]' },
    { label: '🔌 Create API Endpoint', value: 'Create a robust API endpoint (Next.js App Router) for the following requirement:\n\n[DESCRIBE FUNCTIONALITY]\n\nEnsure input validation (Zod) and error handling are included.' },
    { label: '📝 Explain Code (Senior)', value: 'Explain the following code snippet as if you were a Senior Engineer conducting a code review. Highlight potential pitfalls, performance implications, and architectural choices.\n\n[PASTE CODE HERE]' },
    { label: '🏗️ Scaffold Feature', value: 'Create a plan and scaffolding for a new feature: [FEATURE NAME].\nRequirements:\n- Frontend: React/Tailwind\n- Backend: Node/Express or Next.js\n- Data: [DATA STRUCTURE]\n\nOutput the file structure and key component interfaces.' },
];

const InputPanel: React.FC<InputPanelProps> = ({ 
    value, onChange, onBlur, onPasteDemo, onFileLoad, onClearFile, 
    error, maxLength, isLoading, onToggleScratchpad, isMinimized, 
    onToggleMinimize, priority, onPriorityChange 
}) => {
  const hasError = !!error;
  const { status, extensionApi } = useMCPContext();
  const [showSnippets, setShowSnippets] = useState(false);

  const handleFilesUploaded = (files: Array<{ filename: string; content: string; file: File; mimeType?: string; encoding?: 'utf-8' | 'base64' }>) => {
    // If it's a binary/image, we append a reference tag rather than raw base64 to avoid lag in the textarea
    // The actual processing (Shunt) should handle bulletinDocuments separately or parsing these tags.
    // For now, simple text appends.
    
    const combinedContent = files.map(f => {
        if (f.encoding === 'base64') {
            return `--- File: ${f.filename} (${f.mimeType}) ---\n[Binary Data Attached - See Bulletin/Context]`;
        }
        return `--- From: ${f.filename} ---\n\n${f.content}`;
    }).join('\n\n');
    
    onFileLoad(combinedContent);
  };

  const handleSystemLoad = async () => {
      if (status === MCPConnectionStatus.Connected && extensionApi?.fs) {
          const path = prompt("Enter local file path to load (e.g. ./src/App.tsx):");
          if (path) {
              try {
                  audioService.playSound('click');
                  const content = await extensionApi.fs.readFile(path);
                  onFileLoad(content);
                  audioService.playSound('success');
              } catch (e: any) {
                  alert("Failed to load file: " + e.message);
                  audioService.playSound('error');
              }
          }
      } else {
          alert("Please connect the MCP Extension in Settings to enable local file access.");
      }
  };

  const handleSnippetSelect = (code: string) => {
      onFileLoad(code);
      setShowSnippets(false);
      audioService.playSound('click');
  };

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedValue = e.target.value;
      if (selectedValue) {
          onFileLoad(selectedValue);
          audioService.playSound('click');
          e.target.value = ''; 
      }
  };

  return (
    <div className={`aether-panel h-full flex flex-col relative ${hasError ? 'border-red-900/50' : ''}`}>
      {isLoading && !isMinimized && (
        <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/50 backdrop-blur-[2px] z-20 rounded-lg">
          <Loader />
        </div>
      )}
      
      {/* Header Toolbar */}
      <div className="p-2 border-b border-gray-700 bg-gray-800 flex justify-between items-center rounded-t-lg gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 flex-shrink-0">
            {onToggleMinimize && (
              <button onClick={onToggleMinimize} title={isMinimized ? 'Expand' : 'Minimize'} className="p-1 rounded text-gray-500 hover:text-white hover:bg-gray-700">
                {isMinimized ? <AmplifyIcon className="w-4 h-4"/> : <MinusIcon className="w-4 h-4"/>}
              </button>
            )}
            <span className="font-semibold text-xs text-gray-300 uppercase tracking-wide px-1">Input</span>
            
            <select
              value={priority}
              onChange={(e) => onPriorityChange(e.target.value)}
              disabled={isLoading}
              className="bg-black border border-gray-600 text-[10px] text-gray-400 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Low">Low Priority</option>
              <option value="Medium">Med Priority</option>
              <option value="High">High Priority</option>
            </select>

            <select
              onChange={handleTemplateSelect}
              disabled={isLoading}
              className="bg-black border border-gray-600 text-[10px] text-cyan-400 font-medium rounded px-2 py-0.5 focus:outline-none focus:border-cyan-500 cursor-pointer w-32 sm:w-auto"
              defaultValue=""
            >
              {SOLUTION_TEMPLATES.map((tmpl, idx) => (
                  <option key={idx} value={tmpl.value} disabled={idx === 0}>{tmpl.label}</option>
              ))}
            </select>
        </div>

         <div className="flex items-center gap-1 flex-shrink-0">
            <button 
                onClick={handleSystemLoad} 
                title={status === MCPConnectionStatus.Connected ? "Load from Computer (MCP)" : "Connect MCP to Load from Computer"} 
                className={`p-1.5 rounded transition-colors ${status === MCPConnectionStatus.Connected ? 'text-cyan-400 hover:bg-cyan-900/30' : 'text-gray-600 hover:text-gray-400'}`}
            >
                <ServerStackIcon className="w-4 h-4"/>
            </button>
            <div className="w-px h-3 bg-gray-700 mx-1"></div>
            <button onClick={onToggleScratchpad} title="Scratchpad" className="p-1.5 rounded text-gray-400 hover:text-blue-400 hover:bg-gray-700">
                <ClipboardDocumentListIcon className="w-4 h-4"/>
            </button>
            
            <button onClick={onPasteDemo} className="px-2 py-1 rounded text-[10px] text-gray-400 hover:text-white hover:bg-gray-700 border border-transparent hover:border-gray-600">
                Demo
            </button>
            <button onClick={onClearFile} className="px-2 py-1 rounded text-[10px] text-gray-400 hover:text-red-300 hover:bg-gray-700 border border-transparent hover:border-gray-600">
                Clear
            </button>
         </div>
      </div>

      {!isMinimized && (
        <div className="flex-grow flex flex-col relative">
            <OptimizedTextarea
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Paste payload, type instructions, or drop files..."
                className="w-full h-full p-4 bg-[#09090b] text-gray-300 placeholder-gray-600 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                maxLength={maxLength}
            />
            
            {/* Overlay Elements */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-[#09090b] to-transparent flex justify-between items-end pointer-events-none">
                <div className="flex items-end gap-2 pointer-events-auto">
                    <div className="w-8 h-8 opacity-50 hover:opacity-100 transition-opacity">
                         <FileUpload 
                              onFilesUploaded={handleFilesUploaded}
                              acceptedFileTypes={['.txt', '.md', '.json', '.svg', '.js', '.py', '.pdf', '.zip', '.xml', '.xsd', '.html', '.sh', '.css', '.ts', '.jsx', '.tsx', '.yml', '.yaml', '.gitignore', 'dockerfile', '.jpg', '.jpeg', '.png']}
                              maxFileSizeMB={10}
                          />
                    </div>
                    
                    <div className="relative">
                        <button 
                            onClick={() => setShowSnippets(!showSnippets)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-800/80 hover:bg-gray-700 border border-gray-600 rounded text-gray-400 hover:text-cyan-400 transition-all shadow-lg backdrop-blur-sm"
                            title="Load Sample Snippet"
                        >
                            <CodeIcon className="w-4 h-4" />
                        </button>
                        
                        {showSnippets && (
                            <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden flex flex-col z-50">
                                <div className="p-2 bg-gray-900 border-b border-gray-700 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                    Load Template
                                </div>
                                {SAMPLE_CODE_SNIPPETS.map((snippet, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSnippetSelect(snippet.code)}
                                        className="text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border-b border-gray-700/30 last:border-0 flex justify-between items-center"
                                    >
                                        <span>{snippet.label}</span>
                                        <span className="text-[9px] text-gray-500 font-mono">{snippet.language}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {maxLength !== undefined && (
                    <div className="text-[10px] text-gray-600 font-mono">
                        {value.length} / {maxLength}
                    </div>
                )}
            </div>
          
            {error && (
                <div className="absolute bottom-12 left-4 right-4 px-3 py-2 bg-red-900/90 border border-red-700 rounded text-red-100 text-xs shadow-lg backdrop-blur-sm animate-fade-in">
                    {error}
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default InputPanel;
