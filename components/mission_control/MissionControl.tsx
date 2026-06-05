
// components/mission_control/MissionControl.tsx
import React, { useState, Suspense, useTransition } from 'react';
import { MissionControlTabKey, ShuntAction } from '../../types';
import Loader from '../Loader';
import SidebarNav from './SidebarNav';
import MobileBottomNav from './MobileBottomNav';
import { ActiveTabProvider } from '../../context/ActiveTabContext';
import HeaderActions from './HeaderActions';
import FeedbackModal from '../common/FeedbackModal';
import MailboxModal from '../weaver/MailboxModal';
import { audioService } from '../../services/audioService';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import Dashboard from '../dashboard/Dashboard';
import CommandPalette from '../common/CommandPalette';
import { MODULE_REGISTRY } from './tabsConfig';
import { SparklesIcon } from '../icons';
import { appEventBus } from '../../lib/eventBus';
import { SystemProvider, useSystem } from '../../context/SystemContext';
import { TokenCounter } from '../common/TokenCounter'; // NEW

const LoadingFallback = () => (
    <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 aether-panel p-8">
            <Loader />
            <p className="text-gray-400">Loading Module...</p>
        </div>
    </div>
);

const MissionControlCore: React.FC = () => {
    const { state, dispatch } = useSystem();
    const activeTabKey = state.activeTab;
    
    // React 19 Transition for Tab Switching
    const [isPending, startTransition] = useTransition();

    const [isStandalone] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('standalone') === 'true';
    });

    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isMailboxModalOpen, setIsMailboxModalOpen] = useState(false);
    
    const isDesktop = useMediaQuery('(min-width: 1024px)');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    const handleTabClick = (tabKey: MissionControlTabKey) => {
        if (tabKey === activeTabKey) return;
        
        audioService.playSound('tab_switch');
        
        startTransition(() => {
            dispatch({ type: 'SET_ACTIVE_TAB', payload: tabKey });
            
            if (!isStandalone) {
                try {
                    const url = new URL(window.location.href);
                    url.searchParams.set('tab', tabKey);
                    window.history.pushState({}, '', url.toString());
                } catch (e) {
                    console.warn('URL update suppressed.');
                }
            }
        });
    };

    const handleUpdateProject = () => {
        audioService.playSound('click');
        appEventBus.emit('trigger_shunt_action', { action: ShuntAction.MODERNIZE_CODE });
    };

    const activeTab = MODULE_REGISTRY.find(tab => tab.key === activeTabKey);
    const ActiveComponent = activeTab ? activeTab.component : null;
    
    const mainMarginClass = isStandalone ? 'ml-0' : (isDesktop ? (isSidebarExpanded ? 'ml-64' : 'ml-16') : 'ml-0');

    return (
        <div className={`flex h-screen w-full bg-[#09090b] text-gray-200 overflow-hidden relative ${isPending ? 'cursor-wait opacity-90' : ''}`}>
            {/* Transition Indicator */}
            {isPending && (
                <div className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-fuchsia-500 animate-pulse z-[60]" />
            )}

            <CommandPalette onNavigate={handleTabClick} />

            {!isStandalone && (
                <div 
                    className="hidden lg:flex fixed left-0 top-0 bottom-0 z-50 flex-shrink-0 border-r border-[#3f3f46] bg-[#18181b] transition-all duration-300 ease-out"
                    style={{ width: isSidebarExpanded ? '16rem' : '4rem' }}
                    onMouseEnter={() => setIsSidebarExpanded(true)}
                    onMouseLeave={() => setIsSidebarExpanded(false)}
                >
                    <SidebarNav tabs={MODULE_REGISTRY} activeTab={activeTabKey} onTabClick={handleTabClick} isOpen={isSidebarExpanded} />
                </div>
            )}

            {!isStandalone && (
                <MobileBottomNav tabs={MODULE_REGISTRY} activeTab={activeTabKey} onTabClick={handleTabClick} />
            )}
            
            <main className={`flex-grow flex flex-col z-10 h-full relative transition-all duration-300 ease-in-out ${mainMarginClass} ${isStandalone ? '' : 'pb-16 lg:pb-0'}`}>
                
                {(activeTabKey !== 'dashboard' || isStandalone) && (
                    <header className="h-14 border-b border-[#3f3f46] bg-[#18181b] px-4 md:px-6 flex items-center justify-between flex-shrink-0">
                         <div className="flex items-center gap-4">
                            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                                <span className={`${isStandalone ? "block" : "lg:hidden"} ${activeTab?.colorTheme || 'text-gray-400'}`}>
                                    {activeTab?.icon}
                                </span>
                                {activeTab?.label}
                                {isStandalone && <span className="text-[10px] bg-red-900/50 text-red-300 px-2 py-0.5 rounded border border-red-800 ml-2">STANDALONE</span>}
                            </h2>
                            
                            {activeTabKey === 'shunt' && (
                                <button
                                    onClick={handleUpdateProject}
                                    className="ml-4 px-3 py-1 bg-cyan-900/30 border border-cyan-500/30 text-cyan-400 text-xs font-semibold rounded-full flex items-center gap-2 hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-colors animate-fade-in"
                                >
                                    <SparklesIcon className="w-3 h-3" />
                                    Update Project
                                </button>
                            )}

                            {/* Session Metrics HUD */}
                            <div className="hidden md:block ml-4">
                                <TokenCounter />
                            </div>
                        </div>
                        <HeaderActions 
                            activeTab={activeTabKey}
                            onOpenFeedback={() => setIsFeedbackModalOpen(true)}
                            onOpenMailbox={() => setIsMailboxModalOpen(true)}
                        />
                    </header>
                )}

                <div className="flex-grow relative overflow-hidden bg-[#09090b]">
                    <ActiveTabProvider activeTab={activeTabKey}>
                        {activeTabKey === 'dashboard' && !isStandalone ? (
                            <Dashboard onNavigate={handleTabClick} />
                        ) : (
                            <Suspense fallback={<LoadingFallback />}>
                                {ActiveComponent && <ActiveComponent />}
                            </Suspense>
                        )}
                    </ActiveTabProvider>
                </div>
            </main>

            <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} />
            <MailboxModal isOpen={isMailboxModalOpen} onClose={() => setIsMailboxModalOpen(false)} />
        </div>
    );
};

const MissionControl = () => {
  return (
    <SystemProvider>
      <MissionControlCore />
    </SystemProvider>
  );
};

export default MissionControl;
