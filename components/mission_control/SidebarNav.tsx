
// components/mission_control/SidebarNav.tsx
import React, { useMemo } from 'react';
import { MissionControlTab, MissionControlTabKey, TabCategory } from '../../types';
import { AppIcon } from '../icons';

interface SidebarNavProps {
    tabs: MissionControlTab[];
    activeTab: MissionControlTabKey;
    onTabClick: (tabKey: MissionControlTabKey) => void;
    isOpen: boolean;
}

const CATEGORY_LABELS: Record<TabCategory, string> = {
    workspace: 'Workspace',
    lab: 'Lab & Tools',
    ops: 'Operations',
    system: 'System',
};

const SidebarNav: React.FC<SidebarNavProps> = ({ tabs, activeTab, onTabClick, isOpen }) => {
    
    // Group tabs by category
    const groupedTabs = useMemo(() => {
        const groups: Partial<Record<TabCategory, MissionControlTab[]>> = {};
        tabs.forEach(tab => {
            const cat = tab.category || 'system';
            if (!groups[cat]) groups[cat] = [];
            groups[cat]!.push(tab);
        });
        return groups;
    }, [tabs]);

    const categories: TabCategory[] = ['workspace', 'lab', 'ops', 'system'];

    return (
        <nav className="flex flex-col h-full w-full bg-[#050505] border-r border-[#ffffff0d] transition-all duration-300">
            {/* Header */}
            <div className={`flex items-center gap-3 h-16 flex-shrink-0 transition-all duration-300 ${isOpen ? 'px-5' : 'justify-center px-0'}`}>
                <div className="relative group cursor-pointer" onClick={() => onTabClick('dashboard')}>
                    <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                    <AppIcon className="w-7 h-7 text-cyan-400 relative z-10" />
                </div>
                {isOpen && (
                    <div className="flex flex-col animate-fade-in">
                        <h1 className="text-sm font-bold tracking-widest text-white leading-none">
                            AETHER
                        </h1>
                        <span className="text-[9px] text-gray-500 tracking-wider font-medium uppercase mt-0.5">Shunt OS</span>
                    </div>
                )}
            </div>

            {/* Scrollable Navigation */}
            <div className="flex-grow overflow-y-auto custom-scrollbar py-2 space-y-6">
                {categories.map(cat => {
                    const groupTabs = groupedTabs[cat];
                    if (!groupTabs || groupTabs.length === 0) return null;

                    return (
                        <div key={cat} className="px-3">
                            {isOpen && (
                                <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 px-2">
                                    {CATEGORY_LABELS[cat]}
                                </h3>
                            )}
                            <ul className="space-y-1">
                                {groupTabs.map(tab => {
                                    const isActive = activeTab === tab.key;
                                    return (
                                        <li key={tab.key}>
                                            <button
                                                onClick={() => onTabClick(tab.key)}
                                                title={!isOpen ? tab.label : undefined}
                                                className={`
                                                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
                                                    ${isActive 
                                                        ? 'bg-white/5 text-white' 
                                                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                                    }
                                                    ${!isOpen ? 'justify-center' : ''}
                                                `}
                                            >
                                                {/* Active Indicator Line (Left) */}
                                                {isActive && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-500 rounded-r-full" />
                                                )}

                                                <span className={`relative z-10 transition-transform duration-200 ${isActive ? 'text-cyan-400' : 'group-hover:text-gray-200'}`}>
                                                    {tab.icon}
                                                </span>
                                                {isOpen && (
                                                    <span className="relative z-10 truncate">{tab.label}</span>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}
            </div>
            
            {/* Footer / Status */}
            <div className="p-4 border-t border-[#ffffff0d] flex-shrink-0">
                <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        {isOpen && <span className="text-[10px] text-gray-500 font-mono">ONLINE</span>}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default React.memo(SidebarNav);
