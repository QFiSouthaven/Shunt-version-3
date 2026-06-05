// components/mission_control/HeaderActions.tsx
import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { useMailbox } from '../../context/MailboxContext';
import { 
    FeedbackIcon, MailboxIcon, BlueprintIcon, ExternalLinkIcon, EyeIcon, 
    BoltIcon, ViewColumnsIcon, CpuChipIcon, SparklesIcon, RoadmapIcon, 
    TrimIcon, CloudArrowDownIcon, ServerStackIcon 
} from '../icons';
import { MissionControlTabKey, TransformerState } from '../../types';
import { generateArchitecturalBlueprint, generateRefactoringPlan, generateContinuancePath } from '../../services/geminiService';
import { MODULE_REGISTRY } from './tabsConfig';
import { audioService } from '../../services/audioService';
import { parseApiError } from '../../utils/errorLogger';
import Loader from '../Loader';
import { useMiaContext } from '../../context/MiaContext';
import { v4 as uuidv4 } from 'uuid';
import { appEventBus } from '../../lib/eventBus';
import { fileSystemService } from '../../services/fileSystem';
import { TabIsolationButton } from '../common/TabIsolationButton';
import { infusionService } from '../../services/infusion.service';

interface HeaderActionsProps {
    activeTab: MissionControlTabKey;
    onOpenFeedback: () => void;
    onOpenMailbox: () => void;
}

const HeaderActions: React.FC<HeaderActionsProps> = ({
    activeTab,
    onOpenFeedback,
    onOpenMailbox,
}) => {
    const { unreadCount, deliverFiles } = useMailbox();
    const { addMessage } = useMiaContext();
    const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false);
    const [isGeneratingRefactor, setIsGeneratingRefactor] = useState(false);
    const [isGeneratingContinuance, setIsGeneratingContinuance] = useState(false);
    const [isInfusing, setIsInfusing] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportSnapshot = () => {
        fileInputRef.current?.click();
    };

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsInfusing(true);
        addMessage({ id: uuidv4(), sender: 'system-progress', text: `Infusing state snapshot: ${file.name}...`, timestamp: new Date().toISOString() });

        const result = await infusionService.infuseSnapshot(file);
        
        if (result.success) {
            addMessage({ 
                id: uuidv4(), 
                sender: 'mia', 
                text: `State Infusion Successful. Module **${result.module}** has been updated from snapshot. The page will reload to settle memory buffers.`, 
                timestamp: new Date().toISOString() 
            });
            setTimeout(() => window.location.reload(), 3000);
        } else {
            addMessage({ 
                id: uuidv4(), 
                sender: 'system-error', 
                text: `Infusion Failed: ${result.error}`, 
                timestamp: new Date().toISOString() 
            });
        }
        setIsInfusing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const gatherTabContext = async (tabKey: string): Promise<string> => {
        let context = `TARGET MODULE: ${tabKey}\n\n`;
        const activeModule = MODULE_REGISTRY.find(m => m.key === tabKey);
        if (activeModule?.architecturalContext) context += `ARCHITECTURAL SUMMARY:\n${activeModule.architecturalContext}\n\n`;

        if (fileSystemService.isMounted()) {
            try {
                const allFiles = await fileSystemService.listFiles();
                const keywords = [tabKey, activeModule?.label.replace(/\s+/g, '') || ''].map(k => k.toLowerCase());
                // Fixed: Correctly handle FileNode object in filtering and reading
                const targetFiles = allFiles.filter(node => {
                    const lower = node.path.toLowerCase();
                    if (lower.includes('node_modules') || lower.includes('.git/') || lower.includes('dist/')) return false;
                    return keywords.some(k => lower.includes(k));
                }).slice(0, 15);

                for (const node of targetFiles) {
                    const content = await fileSystemService.readFile(node.path);
                    context += `### FILE: ${node.path}\n\`\`\`typescript\n${content}\n\`\`\`\n\n`;
                }
            } catch (e) { console.error(e); }
        }
        return context;
    };

    const handleCreateRefactoringPlan = async () => {
        if (isGeneratingRefactor) return;
        setIsGeneratingRefactor(true);
        audioService.playSound('send');
        addMessage({ id: uuidv4(), sender: 'system-progress', text: `Refactoring ${activeTab}...`, timestamp: new Date().toISOString() });

        try {
            const context = await gatherTabContext(activeTab);
            const plan = await generateRefactoringPlan(activeTab, context);
            
            if (plan.implementationTasks && plan.implementationTasks.length > 0) {
                const filesToDeliver = plan.implementationTasks
                    .filter(t => t.newContent)
                    .map(t => ({ path: t.filePath, content: t.newContent! }));
                
                await deliverFiles(filesToDeliver);
                audioService.playSound('success');
                addMessage({
                    id: uuidv4(),
                    sender: 'mia',
                    text: `Refactor Complete: I have generated ${filesToDeliver.length} modernized files. You can apply them via the Mailbox.`,
                    timestamp: new Date().toISOString()
                });
                onOpenMailbox();
            }
        } catch (e) {
            console.error(e);
            audioService.playSound('error');
            alert(`Refactoring failed: ${parseApiError(e)}`);
        } finally {
            setIsGeneratingRefactor(false);
        }
    };

    const handleCreateBlueprints = async () => {
        if (isGeneratingBlueprint) return;
        setIsGeneratingBlueprint(true);
        try {
            const context = await gatherTabContext(activeTab);
            const { resultText } = await generateArchitecturalBlueprint(activeTab, context);
            await deliverFiles([{ path: `${activeTab}-blueprint.md`, content: resultText }]);
            onOpenMailbox();
        } finally { setIsGeneratingBlueprint(false); }
    };

    const handleGenerateContinuance = async () => {
        if (isGeneratingContinuance) return;
        setIsGeneratingContinuance(true);
        try {
            const context = await gatherTabContext(activeTab);
            const { resultText } = await generateContinuancePath(activeTab, context);
            await deliverFiles([{ path: `${activeTab}-roadmap.md`, content: resultText }]);
            onOpenMailbox();
        } finally { setIsGeneratingContinuance(false); }
    };

    const handleDisconnect = () => window.open(window.location.href + '&standalone=true', '_blank');

    return (
        <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={onFileChange} accept=".zip" className="hidden" />
            
            <button 
                onClick={handleImportSnapshot} 
                disabled={isInfusing}
                className="p-2 rounded-full text-indigo-400 hover:text-indigo-300 hover:bg-gray-700/50 transition-all"
                title="Infuse State (Import ZIP Snapshot)"
            >
                {isInfusing ? <Loader className="w-5 h-5" /> : <CloudArrowDownIcon className="w-6 h-6 rotate-180" />}
            </button>

            <TabIsolationButton tabKey={activeTab} />
            
            <div className="w-px h-6 bg-gray-700 mx-1"></div>

            <button onClick={handleGenerateContinuance} className="p-2 rounded-full text-emerald-400 hover:bg-gray-700/50"><RoadmapIcon className="w-6 h-6" /></button>
            <button onClick={handleCreateRefactoringPlan} disabled={isGeneratingRefactor} className="p-2 rounded-full text-purple-400 hover:bg-gray-700/50">{isGeneratingRefactor ? <Loader className="w-5 h-5"/> : <SparklesIcon className="w-6 h-6" />}</button>
            <button onClick={handleCreateBlueprints} className="p-2 rounded-full text-cyan-400 hover:bg-gray-700/50"><BlueprintIcon className="w-6 h-6" /></button>
            <button onClick={handleDisconnect} className="p-2 rounded-full text-green-400 hover:bg-gray-700/50"><ExternalLinkIcon className="w-6 h-6" /></button>
            
            <div className="w-px h-6 bg-gray-700 mx-2"></div>
            
            <button onClick={onOpenFeedback} className="p-2 hover:bg-gray-700/50 rounded-full"><FeedbackIcon className="w-6 h-6 text-gray-300" /></button>
            <button onClick={onOpenMailbox} className="relative p-2 hover:bg-gray-700/50 rounded-full">
                <MailboxIcon className="w-6 h-6 text-gray-300" />
                {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-fuchsia-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-[#18181b]">{unreadCount}</span>}
            </button>
        </div>
    );
};

export default React.memo(HeaderActions);
