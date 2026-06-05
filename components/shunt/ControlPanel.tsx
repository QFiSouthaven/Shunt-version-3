
// components/shunt/ControlPanel.tsx
import React, { useState, useMemo } from 'react';
import { ShuntAction, PromptModuleKey, TransformerState, TransformerAction } from '../../types';
import ShuntButton from './ShuntButton';
import { 
    BookIcon, CodeIcon, EditIcon, JsonIcon, KeywordsIcon, SmileIcon, TieIcon, 
    SparklesIcon, AmplifyIcon, AmplifyX2Icon, BrainIcon, FeatherIcon, 
    JsonToTextIcon, ActionableIcon, PuzzlePieceIcon, PhotoIcon, EntityIcon, 
    DocumentChartBarIcon, BranchingIcon, GlobeAltIcon, BoltIcon, MinusIcon, 
    DeveloperIcon, RedoIcon, ServerStackIcon, StarIcon, CheckCircleIcon, EyeIcon,
    ShieldCheckIcon, TerminalIcon, CpuChipIcon, DeviceFloppyIcon, LockIcon
} from '../icons';
import { shuntActionDescriptions, promptModules } from '../../services/prompts';
import ToggleSwitch from '../common/ToggleSwitch';
import { SubscriptionUsage, TierDetails } from '../../context/SubscriptionContext';
import { useSettings } from '../../context/SettingsContext';
import { usePersistedState } from '../../hooks/usePersistedState';
import Loader from '../Loader';

interface ControlPanelProps {
  onShunt: (action: ShuntAction | string, customInstruction?: string) => void;
  onSmartShunt: () => void;
  onModularShunt: (modules: Set<PromptModuleKey>) => void;
  onCombinedShunt: (draggedAction: ShuntAction, targetAction: ShuntAction) => void;
  isLoading: boolean;
  activeShunt: string | null;
  selectedModel: string;
  onModelChange: (model: string) => void;
  showAmplifyX2: boolean;
  onAmplifyX2: () => void;
  usage: SubscriptionUsage;
  tierDetails: TierDetails;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  rateLimitState?: { count: number; max: number };
  error?: string | null;
  onRetry?: () => void;
  isTransformerMode?: boolean;
  transformerState?: TransformerState;
  onTransformerAction?: (action: TransformerAction) => void;
  onExport?: () => void;
}

const shuntActionsConfig = [
  { action: ShuntAction.SUMMARIZE, icon: <BookIcon className="w-4 h-4" />, group: 'Content' },
  { action: ShuntAction.AMPLIFY, icon: <AmplifyIcon className="w-4 h-4" />, group: 'Content' },
  { action: ShuntAction.MAKE_ACTIONABLE, icon: <ActionableIcon className="w-4 h-4" />, group: 'Content' },
  { action: ShuntAction.BUILD_A_SKILL, icon: <PuzzlePieceIcon className="w-4 h-4" />, group: 'Content' },
  { action: ShuntAction.GENERATE_APPLICATION, icon: <DeveloperIcon className="w-4 h-4" />, group: 'Content' },
  { action: ShuntAction.MY_COMMAND, icon: <BranchingIcon className="w-4 h-4" />, group: 'Content' },
  { action: ShuntAction.GENERATE_ORACLE_QUERY, icon: <GlobeAltIcon className="w-4 h-4" />, group: 'Content' },
  { action: ShuntAction.EXPLAIN_LIKE_IM_FIVE, icon: <CodeIcon className="w-4 h-4" />, group: 'Explanation' },
  { action: ShuntAction.EXPLAIN_LIKE_A_SENIOR, icon: <BrainIcon className="w-4 h-4" />, group: 'Explanation' },
  { action: ShuntAction.EXTRACT_KEYWORDS, icon: <KeywordsIcon className="w-4 h-4" />, group: 'Keywords' },
  { action: ShuntAction.EXTRACT_ENTITIES, icon: <EntityIcon className="w-4 h-4" />, group: 'Keywords' },
  { action: ShuntAction.ENHANCE_WITH_KEYWORDS, icon: <FeatherIcon className="w-4 h-4" />, group: 'Keywords' },
  { action: ShuntAction.CHANGE_TONE_FORMAL, icon: <TieIcon className="w-4 h-4" />, group: 'Tone' },
  { action: ShuntAction.CHANGE_TONE_CASUAL, icon: <SmileIcon className="w-4 h-4" />, group: 'Tone' },
  { action: ShuntAction.PROOFREAD, icon: <EditIcon className="w-4 h-4" />, group: 'Quality' },
  { action: ShuntAction.REFINE_PROMPT, icon: <SparklesIcon className="w-4 h-4" />, group: 'Quality' },
  { action: ShuntAction.TRANSLATE_SPANISH, icon: <GlobeAltIcon className="w-4 h-4" />, group: 'Quality' },
  { action: ShuntAction.FORMAT_JSON, icon: <JsonIcon className="w-4 h-4" />, group: 'Data' },
  { action: ShuntAction.GENERATE_VAM_PRESET, icon: <DocumentChartBarIcon className="w-4 h-4" />, group: 'Data' },
  { action: ShuntAction.PARSE_JSON, icon: <JsonToTextIcon className="w-4 h-4" />, group: 'Data' },
  { action: ShuntAction.INTERPRET_SVG, icon: <PhotoIcon className="w-4 h-4" />, group: 'Data' },
  { action: ShuntAction.MODERNIZE_CODE, icon: <SparklesIcon className="w-4 h-4" />, group: 'Data' },
  { action: ShuntAction.DEEP_CRAWL, icon: <GlobeAltIcon className="w-4 h-4" />, group: 'Data' },
  { action: ShuntAction.GENERATE_UTILITY_SCRIPT, icon: <TerminalIcon className="w-4 h-4" />, group: 'Content' },
  { action: ShuntAction.GENERATE_SHELL_COMMAND, icon: <TerminalIcon className="w-4 h-4 text-green-400" />, group: 'Content' },
];

const TreeNode: React.FC<{ 
    label: string; 
    icon?: React.ReactNode;
    isOpen?: boolean;
    children?: React.ReactNode;
    onClick?: () => void;
    isRoot?: boolean;
    isLeaf?: boolean;
    isHighlighted?: boolean;
}> = ({ label, icon, isOpen = false, children, onClick, isRoot, isLeaf, isHighlighted }) => {
    return (
        <div className={`relative ${isHighlighted ? 'animate-pulse' : ''}`}>
            <div className={`flex items-center ${isLeaf ? 'mb-1' : 'mb-2'}`}>
                {!isRoot && (
                    <div className={`absolute -left-4 top-3 w-4 h-px ${isHighlighted ? 'bg-green-500' : 'bg-gray-700/50'}`}></div>
                )}
                
                {isLeaf ? (
                    <div className="w-full">{children}</div>
                ) : (
                    <button 
                        onClick={onClick}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-200 w-full hover:bg-gray-800/50 border border-transparent 
                        ${isHighlighted ? 'text-green-400 border-green-500/50 bg-green-900/20' : isOpen ? 'text-cyan-400 border-gray-700/50 bg-gray-900/30' : 'text-gray-500'}`}
                    >
                        <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''} text-[10px]`}>▶</span>
                        {icon}
                        {label}
                    </button>
                )}
            </div>
            {isOpen && !isLeaf && (
                <div className={`relative ml-2 pl-4 border-l flex flex-col gap-1 transition-all duration-300 ${isHighlighted ? 'border-green-500/30' : 'border-gray-700/30'}`}>
                    {children}
                </div>
            )}
        </div>
    );
};

const PipelineStep: React.FC<{
    label: string;
    description: string;
    icon: React.ReactNode;
    isActive: boolean;
    isCompleted: boolean;
    onAction: () => void;
}> = ({ label, description, icon, isActive, isCompleted, onAction }) => (
    <div className={`relative flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 ${
        isActive ? 'bg-green-900/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 
        isCompleted ? 'bg-gray-900/50 border-green-900/30' : 
        'bg-gray-900/20 border-gray-800 opacity-60'
    }`}>
        <div className={`p-2 rounded-full border ${
            isActive ? 'bg-green-500 border-green-400 text-black animate-pulse' : 
            isCompleted ? 'bg-green-900/50 border-green-800 text-green-500' : 
            'bg-gray-800 border-gray-700 text-gray-500'
        }`}>
            {isCompleted ? <CheckCircleIcon className="w-4 h-4" /> : icon}
        </div>
        
        <div className="flex-grow">
            <h4 className={`text-sm font-bold ${isActive ? 'text-green-300' : isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>{label}</h4>
            <p className="text-[10px] text-gray-500 mt-0.5">{description}</p>
        </div>

        {isActive && !isCompleted && (
            <button 
                onClick={onAction}
                className="self-center px-3 py-1.5 bg-green-600 hover:bg-green-500 text-black font-bold text-xs rounded shadow-lg animate-fade-in"
            >
                RUN
            </button>
        )}
        <div className={`absolute left-[23px] top-12 bottom-[-14px] w-0.5 ${isCompleted ? 'bg-green-900/50' : 'bg-gray-800'} z-0 last:hidden`}></div>
    </div>
);

const ControlPanel: React.FC<ControlPanelProps> = ({ 
    onShunt, onSmartShunt, onModularShunt, onCombinedShunt, isLoading, 
    activeShunt, selectedModel, onModelChange, showAmplifyX2, onAmplifyX2, 
    usage, tierDetails, isMinimized, onToggleMinimize, rateLimitState, error, onRetry, 
    isTransformerMode, transformerState, onTransformerAction, onExport
}) => {
  const [selectedModuleKeys, setSelectedModuleKeys] = usePersistedState<string[]>('shunt_control_selected_modules', []);
  const [activeTab, setActiveTab] = usePersistedState<'tree' | 'advanced'>('shunt_control_active_tab', 'tree');
  const [expandedGroups, setExpandedGroups] = usePersistedState<Record<string, boolean>>('shunt_control_expanded_groups', { 'Content': true });
  
  const selectedModules = useMemo(() => new Set(selectedModuleKeys as PromptModuleKey[]), [selectedModuleKeys]);
  const [pinnedActions, setPinnedActions] = usePersistedState<string[]>('shunt_pinned_actions', []);
  
  const { settings } = useSettings();
  
  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, action: ShuntAction) => {
    e.dataTransfer.setData('text/plain', action);
    e.dataTransfer.effectAllowed = "move";
  };
  
  const handleDrop = (e: React.DragEvent<HTMLButtonElement>, targetAction: ShuntAction) => {
    const draggedAction = e.dataTransfer.getData('text/plain') as ShuntAction;
    if (draggedAction && draggedAction !== targetAction) {
      onCombinedShunt(draggedAction, targetAction);
    }
  };

  const handleModuleToggle = (moduleKey: PromptModuleKey, checked: boolean) => {
    if (checked) {
        setSelectedModuleKeys(prev => [...prev, moduleKey]);
    } else {
        setSelectedModuleKeys(prev => prev.filter(k => k !== moduleKey));
    }
  };

  const toggleGroup = (group: string) => {
      setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const togglePin = (actionName: string) => {
      setPinnedActions(prev => {
          if (prev.includes(actionName)) return prev.filter(p => p !== actionName);
          return [...prev, actionName];
      });
  };

  const isLocalModel = selectedModel === 'local-model' || selectedModel === 'llama3' || selectedModel.startsWith('local');
  const isCloudflare = selectedModel === 'cloudflare' || (settings.masterProvider === 'cloudflare' && !selectedModel.includes('gemini'));

  const groupedActions = useMemo(() => {
      const groups: Record<string, typeof shuntActionsConfig> = {};
      
      if (settings.customPrompts && settings.customPrompts.length > 0) {
          groups['Custom'] = settings.customPrompts.map(p => ({
              action: p.name as any,
              icon: <BoltIcon className="w-4 h-4 text-cyan-400" />,
              group: 'Custom',
              instruction: p.instruction
          }));
      }

      shuntActionsConfig.forEach(item => {
          if (!groups[item.group]) groups[item.group] = [];
          groups[item.group].push(item);
      });

      return groups;
  }, [settings.customPrompts]);

  const renderShuntButton = (item: any) => {
      const isTransforming = transformerState === 'transforming';
      return (
      <ShuntButton
          key={item.action}
          action={item.action}
          onClick={() => item.instruction ? onShunt(item.action, item.instruction) : onShunt(item.action)}
          disabled={isLoading || isTransforming}
          isActive={isLoading && (activeShunt?.includes(item.action) ?? false)}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          tooltip={item.instruction || shuntActionDescriptions[item.action as ShuntAction]}
          isPinned={pinnedActions.includes(item.action)}
          onTogglePin={() => togglePin(item.action)}
      >
          {item.icon}
          {item.action}
      </ShuntButton>
  )};

  return (
    <div className={`aether-panel h-full flex flex-col overflow-hidden relative ${isTransformerMode ? 'border-amber-500/30' : ''}`}>
        
        {isTransformerMode && (
            <div className={`absolute top-0 left-0 right-0 border-b p-1 flex justify-center z-20 pointer-events-none transition-colors duration-500
                ${transformerState === 'active' ? 'bg-green-900/40 border-green-500/50' : 
                  'bg-amber-900/20 border-amber-500/30'}`}
            >
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2
                    ${transformerState === 'active' ? 'text-green-400' : 'text-amber-400'}`}
                >
                    {transformerState === 'analyzing' ? <Loader className="w-3 h-3" /> : <BoltIcon className="w-3 h-3" />}
                    {transformerState === 'active' ? 'Extraction Complete' : 'Data Extraction Pipeline'}
                </span>
            </div>
        )}

        <div className={`p-3 border-b border-gray-700 bg-gray-800 flex items-center justify-between flex-shrink-0 ${isTransformerMode ? 'pt-7' : ''}`}>
            <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-200">Tools</span>
                <select
                    value={selectedModel}
                    onChange={(e) => onModelChange(e.target.value)}
                    disabled={isLoading}
                    className="bg-black border border-gray-600 text-[10px] text-gray-400 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500"
                >
                    <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
                    <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                    <option value="local-model">Local LLM (LM Studio)</option>
                    <option value="cloudflare">Cloudflare Workers AI</option>
                </select>
                
                {/* Security Badge: Reassure user that local/cf keys are encrypted */}
                {(isLocalModel || isCloudflare) && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-900/30 border border-blue-500/30 text-[9px] text-blue-400 font-bold uppercase tracking-wide group relative cursor-help">
                        <LockIcon className="w-3 h-3" />
                        Vault Secure
                        <div className="absolute bottom-full mb-2 left-0 w-48 p-2 bg-gray-900 border border-gray-700 text-[8px] text-gray-400 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            Sensitive API keys are XOR-encrypted before storage in the browser vault.
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-2">
                {onExport && (
                    <button onClick={onExport} title="Export Portable Shunt App" className="text-gray-500 hover:text-cyan-400 transition-colors">
                        <DeviceFloppyIcon className="w-4 h-4" />
                    </button>
                )}
                {onToggleMinimize && (
                  <button onClick={onToggleMinimize} className="text-gray-500 hover:text-white">
                    {isMinimized ? <AmplifyIcon className="w-4 h-4"/> : <MinusIcon className="w-4 h-4"/>}
                  </button>
                )}
            </div>
        </div>

        {!isMinimized && (
            <div className="flex-grow flex flex-col overflow-hidden relative">
                {error && onRetry && (
                    <div className="p-2 bg-red-900/30 border border-red-800 flex items-center justify-between animate-fade-in">
                        <span className="text-[10px] text-red-300 font-medium">Last Action Failed</span>
                        <button 
                            onClick={onRetry}
                            className="flex items-center gap-1 px-2 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-[10px] transition-colors font-bold"
                        >
                            <RedoIcon className="w-3 h-3" />
                            Retry
                        </button>
                    </div>
                )}

                {isTransformerMode ? (
                    <div className="flex-grow overflow-y-auto p-4 custom-scrollbar space-y-4">
                        <PipelineStep 
                            label="1. Structural Audit"
                            description="Analyze DOM hierarchy and identify data nodes."
                            icon={<EyeIcon className="w-4 h-4" />}
                            isActive={transformerState === 'idle' || transformerState === 'analyzing'}
                            isCompleted={transformerState !== 'idle' && transformerState !== 'analyzing'}
                            onAction={() => onTransformerAction?.(TransformerAction.AUDIT_STRUCTURE)}
                        />
                        <PipelineStep 
                            label="2. Schema Definition"
                            description="Infer JSON schema from sample data."
                            icon={<JsonIcon className="w-4 h-4" />}
                            isActive={transformerState === 'analyzed' || transformerState === 'generating_schema'}
                            isCompleted={transformerState !== 'idle' && transformerState !== 'analyzing' && transformerState !== 'analyzed' && transformerState !== 'generating_schema'}
                            onAction={() => onTransformerAction?.(TransformerAction.GENERATE_SCHEMA)}
                        />
                        <PipelineStep 
                            label="3. Extraction Run"
                            description="Perform zero-shot extraction of target data."
                            icon={<BoltIcon className="w-4 h-4" />}
                            isActive={transformerState === 'extracting'}
                            isCompleted={transformerState === 'validating' || transformerState === 'active'}
                            onAction={() => onTransformerAction?.(TransformerAction.EXTRACT_DATA)}
                        />
                        <PipelineStep 
                            label="4. Validation"
                            description="Verify payload integrity against schema."
                            icon={<ShieldCheckIcon className="w-4 h-4" />}
                            isActive={transformerState === 'validating'}
                            isCompleted={transformerState === 'active'}
                            onAction={() => onTransformerAction?.(TransformerAction.VALIDATE_PAYLOAD)}
                        />
                        
                        <div className="mt-6 border-t border-gray-700 pt-4">
                            <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <TerminalIcon className="w-3 h-3" /> Pipeline Log
                            </h5>
                            <div className="bg-black/50 rounded p-2 text-[10px] font-mono text-green-400 h-24 overflow-hidden flex flex-col justify-end">
                                <p className="opacity-50">System initialized.</p>
                                {transformerState && transformerState !== 'idle' && <p>Processing step: {transformerState.toUpperCase()}...</p>}
                                {isLoading && <p className="animate-pulse">_</p>}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex border-b border-gray-700 flex-shrink-0">
                            <button 
                                onClick={() => setActiveTab('tree')}
                                className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${activeTab === 'tree' ? 'bg-[#09090b] text-cyan-400 border-b-2 border-cyan-500' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
                            >
                                Action Tree
                            </button>
                            <button 
                                onClick={() => setActiveTab('advanced')}
                                className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${activeTab === 'advanced' ? 'bg-[#09090b] text-fuchsia-400 border-b-2 border-fuchsia-500' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
                            >
                                Stack Modular
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-3 custom-scrollbar relative">
                            {activeTab === 'tree' && (
                                <div className="space-y-4">
                                    {pinnedActions.length > 0 && (
                                        <div className="mb-4 bg-gray-900/50 rounded-lg p-2 border border-gray-700/50">
                                            <div className="flex items-center gap-2 mb-2 px-1">
                                                <StarIcon className="w-3 h-3 text-yellow-400 fill-current" />
                                                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Quick Access</span>
                                            </div>
                                            <div className="grid grid-cols-1 gap-1">
                                                {pinnedActions.map(actionId => {
                                                    const config = shuntActionsConfig.find(c => c.action === actionId) || 
                                                                settings.customPrompts?.find(p => p.name === actionId)?.name && { 
                                                                    action: actionId, 
                                                                    icon: <BoltIcon className="w-4 h-4 text-cyan-400"/>, 
                                                                    instruction: settings.customPrompts.find(p => p.name === actionId)?.instruction 
                                                                };
                                                    if (!config) return null;
                                                    return renderShuntButton(config);
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-6 relative">
                                        <div className="absolute left-[11px] top-8 bottom-0 w-px bg-fuchsia-900/50"></div>
                                        <button
                                            onClick={onSmartShunt}
                                            disabled={isLoading}
                                            className={`relative z-10 w-full p-3 rounded-lg border flex items-center justify-between transition-all duration-300 group
                                                ${isLoading && activeShunt === 'Smart Shunt' 
                                                    ? 'bg-fuchsia-900/40 border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.3)]' 
                                                    : 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700 hover:border-fuchsia-500/50 hover:shadow-lg'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-full ${isLoading && activeShunt === 'Smart Shunt' ? 'bg-fuchsia-500 animate-pulse' : 'bg-gray-700 group-hover:bg-fuchsia-600 transition-colors'}`}>
                                                    <SparklesIcon className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="text-left">
                                                    <div className={`text-sm font-bold ${isLoading && activeShunt === 'Smart Shunt' ? 'text-fuchsia-300' : 'text-gray-200 group-hover:text-white'}`}>Smart Shunt</div>
                                                    <div className="text-[10px] text-gray-500 group-hover:text-gray-400">Auto-detect intent & route</div>
                                                </div>
                                            </div>
                                        </button>
                                    </div>

                                    <div className="pl-1">
                                        {Object.keys(groupedActions).map((group, index) => (
                                            <TreeNode 
                                                key={group} 
                                                label={group} 
                                                isRoot={false}
                                                isOpen={expandedGroups[group]} 
                                                onClick={() => toggleGroup(group)}
                                            >
                                                {groupedActions[group].map((item: any) => (
                                                    <TreeNode key={item.action} label={item.action} isLeaf>
                                                        {renderShuntButton(item)}
                                                    </TreeNode>
                                                ))}
                                                {group === 'Content' && showAmplifyX2 && (
                                                    <TreeNode key="AmplifyX2" label="Amplify X2" isLeaf>
                                                        <ShuntButton
                                                            action={ShuntAction.AMPLIFY_X2}
                                                            onClick={onAmplifyX2}
                                                            disabled={isLoading}
                                                            isActive={isLoading && activeShunt === ShuntAction.AMPLIFY_X2}
                                                            onDragStart={() => {}}
                                                            onDrop={() => {}}
                                                            tooltip="Apply Machiavellian strategy"
                                                            isPinned={pinnedActions.includes(ShuntAction.AMPLIFY_X2)}
                                                            onTogglePin={() => togglePin(ShuntAction.AMPLIFY_X2)}
                                                            className="!bg-red-900/30 !border-red-800 !text-red-200"
                                                        >
                                                            <AmplifyX2Icon className="w-4 h-4" />
                                                            Amplify x2
                                                        </ShuntButton>
                                                    </TreeNode>
                                                )}
                                            </TreeNode>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'advanced' && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-800/50 rounded border border-gray-700">
                                        <div className="flex items-start gap-3 mb-4">
                                            <ServerStackIcon className="w-6 h-6 text-fuchsia-400" />
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-200">Modular Engine</h3>
                                                <p className="text-xs text-gray-400 mt-1">Compose a custom prompt by stacking distinct logic modules.</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {Object.entries(promptModules).map(([key, module]) => {
                                                if (key === PromptModuleKey.CORE) return null;
                                                return (
                                                    <ToggleSwitch
                                                        key={key}
                                                        id={`module-toggle-${key}`}
                                                        label={module.name}
                                                        checked={selectedModules.has(key as PromptModuleKey)}
                                                        onChange={(checked) => handleModuleToggle(key as PromptModuleKey, checked)}
                                                        disabled={isLoading}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onModularShunt(selectedModules)}
                                        disabled={isLoading || selectedModules.size === 0}
                                        className="aether-btn-primary w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        <BoltIcon className="w-4 h-4" />
                                        Run Stack
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {isTransformerMode && transformerState === 'active' ? (
                    <div className="p-2 border-t border-green-500/30 bg-green-900/10 text-[10px] text-green-400 flex justify-between items-center flex-shrink-0 animate-fade-in">
                        <span className="font-mono flex items-center gap-2"><EyeIcon className="w-3 h-3"/> DATA STREAM VALIDATED</span>
                        <div className="flex gap-1">
                            <span className="w-1.5 h-3 bg-green-500/50"></span>
                            <span className="w-1.5 h-3 bg-green-500/70"></span>
                            <span className="w-1.5 h-3 bg-green-500"></span>
                        </div>
                    </div>
                ) : (
                    <div className="p-2 border-t border-gray-700 bg-gray-800 text-[10px] text-gray-500 flex justify-between items-center flex-shrink-0">
                        <span>Usage: {usage.shuntRuns} / {tierDetails.shuntRuns === 'unlimited' ? '∞' : tierDetails.shuntRuns}</span>
                        <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                                className="bg-blue-500 h-full" 
                                style={{ width: tierDetails.shuntRuns === 'unlimited' ? '100%' : `${Math.min((usage.shuntRuns / (typeof tierDetails.shuntRuns === 'number' ? tierDetails.shuntRuns : 100)) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default ControlPanel;
