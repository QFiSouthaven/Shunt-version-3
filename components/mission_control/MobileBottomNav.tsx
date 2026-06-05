
import React, { useState } from 'react';
import { MissionControlTab, MissionControlTabKey } from '../../types';
import { MenuIcon, XMarkIcon } from '../icons';

interface MobileBottomNavProps {
    tabs: MissionControlTab[];
    activeTab: MissionControlTabKey;
    onTabClick: (tabKey: MissionControlTabKey) => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ tabs, activeTab, onTabClick }) => {
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    // Primary tabs shown directly on the bar
    // Replaced 'foundry' with 'dashboard' as the primary home key
    const primaryTabKeys: MissionControlTabKey[] = ['dashboard', 'shunt', 'weaver', 'chat'];
    
    const handleTabClick = (key: MissionControlTabKey) => {
        onTabClick(key);
        setIsMoreOpen(false);
    };

    const isPrimaryActive = primaryTabKeys.includes(activeTab);

    return (
        <>
            {/* The Bottom Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#18181b] border-t border-[#3f3f46] flex items-center justify-around z-50 pb-safe">
                {primaryTabKeys.map(key => {
                    const tab = tabs.find(t => t.key === key);
                    if (!tab) return null;
                    const isActive = activeTab === key;
                    return (
                        <button
                            key={key}
                            onClick={() => handleTabClick(key)}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-fuchsia-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {tab.icon}
                            <span className="text-[10px] font-medium">{tab.label}</span>
                        </button>
                    );
                })}
                
                <button
                    onClick={() => setIsMoreOpen(true)}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${!isPrimaryActive && !isMoreOpen ? 'text-fuchsia-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <MenuIcon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Apps</span>
                </button>
            </div>

            {/* The "More" Drawer / Overlay */}
            {isMoreOpen && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm lg:hidden flex flex-col justify-end animate-fade-in">
                    <div 
                        className="absolute inset-0" 
                        onClick={() => setIsMoreOpen(false)}
                    />
                    
                    <div className="relative bg-[#18181b] border-t border-[#3f3f46] rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white tracking-wide">All Applications</h3>
                            <button 
                                onClick={() => setIsMoreOpen(false)}
                                className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                            {tabs.map(tab => {
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleTabClick(tab.key)}
                                        className={`flex flex-col items-center gap-3 p-3 rounded-xl transition-all ${
                                            isActive 
                                                ? 'bg-fuchsia-900/30 border border-fuchsia-500/50 text-fuchsia-300' 
                                                : 'bg-gray-800/50 border border-transparent text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                        }`}
                                    >
                                        <div className={`p-3 rounded-lg ${isActive ? 'bg-fuchsia-500 text-white' : 'bg-gray-700/50 text-current'}`}>
                                            {React.cloneElement(tab.icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
                                        </div>
                                        <span className="text-xs font-medium text-center leading-tight">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        
                        <div className="mt-8 text-center">
                            <p className="text-xs text-gray-600">Aether Shunt OS v2.0</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MobileBottomNav;
