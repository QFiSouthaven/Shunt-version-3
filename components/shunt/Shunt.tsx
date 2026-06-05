
// components/shunt/Shunt.tsx
import React, { useRef } from 'react';
import InputPanel from './InputPanel';
import ControlPanel from './ControlPanel';
import OutputPanel from './OutputPanel';
import TabFooter from '../common/TabFooter';
import Scratchpad from '../common/Scratchpad';
import BulletinBoardPanel from './BulletinBoardPanel';
import PromptLifecyclePanel from './PromptLifecyclePanel';
import { useSubscription } from '../../context/SubscriptionContext';
import { useMiaContext } from '../../context/MiaContext';
import { useShunt } from '../../hooks/useShunt';
import { usePersistedState } from '../../hooks/usePersistedState';
import { ShuntAction } from '../../types';

const DEMO_TEXT = `### **Feature Specification: Senior Documentation Specialist Workflow**
**Objective**: Automate the creation of high-quality, standardized documentation from raw code or messy notes.
**Context**: Developers often neglect documentation due to time constraints.
**Requirements**: 
1. Ingest raw code files.
2. Extract architectural patterns.
3. Output a clean README.md.`;

const Shunt: React.FC = () => {
  const { state, actions } = useShunt();
  
  const { 
      inputText, outputText, priority, bulletinDocuments, history, initialPrompt,
      isLoading, isEvolving, error, activeShunt, 
      selectedModel, modulesForLastRun, showAmplifyX2 
  } = state;

  const { 
      setInputText, setOutputText, setPriority, setBulletinDocuments,
      setSelectedModel, submitShunt, submitSmartShunt, submitModularShunt, submitCombinedShunt,
      evolve
  } = actions;

  // Local UI preferences
  const [isScratchpadVisible, setIsScratchpadVisible] = usePersistedState('shunt_scratchpad_visible', false);
  const [scratchpadPosition, setScratchpadPosition] = usePersistedState('shunt_scratchpad_pos', { x: 100, y: 100 });
  const [isScratchpadMinimized, setIsScratchpadMinimized] = usePersistedState('shunt_scratchpad_min', false);
  const [scratchpadContent, setScratchpadContent] = usePersistedState('shunt_scratchpad_content', '');
  const [isLifecycleMinimized, setIsLifecycleMinimized] = usePersistedState('shunt_lifecycle_min', false);
  
  const { usage, tierDetails } = useSubscription();
  const { diagnoseLastError } = useMiaContext();
  const shuntContainerRef = useRef<HTMLDivElement>(null);

  const handleAttachScratchpad = (content: string) => {
    setBulletinDocuments(prev => [...prev, { name: `Note ${Date.now()}`, content }]);
    setIsScratchpadVisible(false);
  };

  return (
    <div ref={shuntContainerRef} className="flex flex-col h-full relative bg-[#050505]">
      <div className="flex-grow p-4 md:p-6 overflow-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
            {/* Left: Input & Bulletin */}
            <div className="flex flex-col gap-6 overflow-hidden h-full">
                <div className="flex-shrink-0 max-h-[40%] flex flex-col">
                    <BulletinBoardPanel 
                        documents={bulletinDocuments} 
                        onUpdateDocuments={setBulletinDocuments} 
                    />
                </div>
                <div className="flex-grow min-h-0">
                    <InputPanel 
                        value={inputText} 
                        onChange={(e) => setInputText(e.target.value)} 
                        onBlur={() => {}}
                        onPasteDemo={() => setInputText(DEMO_TEXT)}
                        onFileLoad={(txt) => setInputText(txt)}
                        onClearFile={() => setInputText('')}
                        isLoading={isLoading} 
                        priority={priority} 
                        onPriorityChange={setPriority} 
                        onToggleScratchpad={() => setIsScratchpadVisible(!isScratchpadVisible)}
                    />
                </div>
            </div>

            {/* Center: Control Panel */}
            <div className="overflow-hidden h-full">
                <ControlPanel 
                    onShunt={submitShunt} 
                    onSmartShunt={submitSmartShunt}
                    onModularShunt={submitModularShunt}
                    onCombinedShunt={submitCombinedShunt}
                    isLoading={isLoading} 
                    activeShunt={activeShunt}
                    selectedModel={selectedModel} 
                    onModelChange={setSelectedModel} 
                    usage={usage} 
                    tierDetails={tierDetails}
                    showAmplifyX2={showAmplifyX2}
                    onAmplifyX2={() => submitShunt(ShuntAction.AMPLIFY_X2)}
                    error={error}
                />
            </div>

            {/* Right: Output & Lifecycle */}
            <div className="flex flex-col gap-6 overflow-hidden h-full">
                <div className="flex-grow min-h-0">
                    <OutputPanel 
                        text={outputText} 
                        isLoading={isLoading} 
                        error={error}
                        activeShunt={activeShunt}
                        modulesUsed={modulesForLastRun}
                        onEvolve={evolve}
                        isEvolving={isEvolving} 
                        onDiagnoseError={diagnoseLastError} 
                        onAttach={() => handleAttachScratchpad(outputText)}
                    />
                </div>
                <div className="flex-shrink-0 max-h-[40%] flex flex-col">
                    <PromptLifecyclePanel 
                        history={history}
                        initialPrompt={initialPrompt}
                        isMinimized={isLifecycleMinimized}
                        onToggleMinimize={() => setIsLifecycleMinimized(!isLifecycleMinimized)}
                    />
                </div>
            </div>
        </div>
      </div>

      <Scratchpad 
        isVisible={isScratchpadVisible} 
        onClose={() => setIsScratchpadVisible(false)} 
        isMinimized={isScratchpadMinimized} 
        onToggleMinimize={() => setIsScratchpadMinimized(!isScratchpadMinimized)} 
        position={scratchpadPosition} 
        onDrag={setScratchpadPosition} 
        content={scratchpadContent} 
        onContentChange={setScratchpadContent} 
        boundsRef={shuntContainerRef} 
        onAttach={handleAttachScratchpad} 
      />
      <TabFooter />
    </div>
  );
};

export default Shunt;
