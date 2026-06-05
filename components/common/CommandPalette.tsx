
// components/common/CommandPalette.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    SpeakerWaveIcon, MailboxIcon, BoltIcon, ViewfinderCircleIcon,
    AmplifyIcon
} from '../icons';
import { useSettings } from '../../context/SettingsContext';
import { useMailbox } from '../../context/MailboxContext';
import { dbService } from '../../services/db';
import { audioService } from '../../services/audioService';
import { MissionControlTabKey } from '../../types';
import { MODULE_REGISTRY } from '../mission_control/tabsConfig';

interface CommandPaletteProps {
    onNavigate: (tab: MissionControlTabKey) => void;
}

type CommandType = 'navigation' | 'action' | 'shunt';

interface Command {
    id: string;
    label: string;
    type: CommandType;
    icon: React.ReactNode;
    keywords: string[];
    action?: () => void;
    path?: MissionControlTabKey;
    shortcut?: string;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const { settings, updateSetting } = useSettings();
    const { clearMailbox } = useMailbox();

    // Toggle Palette
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
                audioService.playSound('click');
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            // Small delay to ensure render is complete
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Generate Commands Dynamically
    const commands: Command[] = useMemo(() => {
        // 1. Generate Navigation Commands from Registry
        const navCommands: Command[] = MODULE_REGISTRY.map(module => ({
            id: `nav-${module.key}`,
            label: `Go to ${module.label}`,
            type: 'navigation',
            path: module.key,
            // Clone icon with specific color theme if available
            icon: React.cloneElement(module.icon as React.ReactElement<any>, { 
                className: `w-5 h-5 ${module.colorTheme || 'text-gray-400'}` 
            }),
            keywords: module.keywords || []
        }));

        // 2. Static Action Commands
        const actionCommands: Command[] = [
            { 
                id: 'act-toggle-audio', 
                label: settings.audioFeedbackEnabled ? 'Mute Audio Feedback' : 'Enable Audio Feedback', 
                type: 'action', 
                icon: <SpeakerWaveIcon className={`w-5 h-5 ${settings.audioFeedbackEnabled ? 'text-green-400' : 'text-gray-500'}`} />, 
                keywords: ['mute', 'audio', 'sound', 'volume', 'quiet'],
                action: () => {
                    updateSetting('audioFeedbackEnabled', !settings.audioFeedbackEnabled);
                    audioService.playSound(settings.audioFeedbackEnabled ? 'click' : 'success');
                }
            },
            { 
                id: 'act-toggle-anim', 
                label: settings.animationsEnabled ? 'Disable Animations' : 'Enable Animations', 
                type: 'action', 
                icon: <BoltIcon className={`w-5 h-5 ${settings.animationsEnabled ? 'text-yellow-400' : 'text-gray-500'}`} />, 
                keywords: ['animation', 'motion', 'visual', 'reduce'],
                action: () => {
                    updateSetting('animationsEnabled', !settings.animationsEnabled);
                    audioService.playSound('click');
                }
            },
            { 
                id: 'act-clear-mailbox', 
                label: 'Clear Mailbox', 
                type: 'action', 
                icon: <MailboxIcon className="w-5 h-5 text-red-400" />, 
                keywords: ['clear', 'mailbox', 'delete', 'messages', 'empty'],
                action: () => {
                    if (confirm('Are you sure you want to clear all mailbox files?')) {
                        clearMailbox();
                        audioService.playSound('click');
                    }
                }
            },
        ];

        return [...navCommands, ...actionCommands];
    }, [settings, updateSetting, clearMailbox]);

    // Filter Logic
    const filteredCommands = useMemo(() => {
        if (!query.trim()) return commands.slice(0, 5); // Show top 5 by default

        const lowerQuery = query.toLowerCase();
        
        // Match against label or keywords
        const matches = commands.filter(c => 
            c.label.toLowerCase().includes(lowerQuery) || 
            c.keywords.some(k => k.toLowerCase().includes(lowerQuery))
        );

        return matches;
    }, [query, commands]);

    // Final list includes "Quick Shunt" option dynamically
    const displayList = useMemo(() => {
        const list = [...filteredCommands];
        if (query.trim()) {
            list.push({
                id: 'shunt-input',
                label: `Shunt: "${query}"`,
                type: 'shunt',
                icon: <AmplifyIcon className="w-5 h-5 text-fuchsia-500" />,
                keywords: [],
                action: async () => {
                    await dbService.set(dbService.STORES.KEY_VALUE, 'shunt_inputText', query);
                    onNavigate('shunt');
                }
            });
        }
        return list;
    }, [filteredCommands, query, onNavigate]);

    // Handle Keyboard Navigation within List
    useEffect(() => {
        const handleNavigation = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % displayList.length);
                if (listRef.current) {
                    const itemHeight = 60; 
                    listRef.current.scrollTop = selectedIndex * itemHeight; 
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + displayList.length) % displayList.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selected = displayList[selectedIndex];
                if (selected) {
                    executeCommand(selected);
                }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % displayList.length);
            }
        };

        window.addEventListener('keydown', handleNavigation);
        return () => window.removeEventListener('keydown', handleNavigation);
    }, [isOpen, selectedIndex, displayList]);

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const executeCommand = (command: Command) => {
        if (command.type === 'navigation' && command.path) {
            onNavigate(command.path);
            setIsOpen(false);
            audioService.playSound('tab_switch');
        } else if (command.action) {
            command.action();
            setIsOpen(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
            
            <div className="relative w-full max-w-xl bg-[#18181b] border border-[#3f3f46] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fade-in scale-100 opacity-100 transition-all">
                <div className="flex items-center px-4 py-3 border-b border-[#3f3f46]">
                    <ViewfinderCircleIcon className="w-5 h-5 text-gray-500 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Type a command or search..."
                        className="flex-grow bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none text-lg"
                        spellCheck={false}
                    />
                    <div className="text-xs text-gray-500 font-mono border border-gray-700 rounded px-1.5 py-0.5">ESC</div>
                </div>
                
                <ul ref={listRef} className="max-h-[350px] overflow-y-auto py-2 custom-scrollbar">
                    {displayList.length === 0 ? (
                        <li className="px-4 py-8 text-center text-gray-500">
                            No matching commands.
                        </li>
                    ) : (
                        displayList.map((cmd, index) => (
                            <li key={cmd.id}>
                                <button
                                    onClick={() => executeCommand(cmd)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                                        index === selectedIndex 
                                            ? 'bg-fuchsia-900/20 border-l-2 border-fuchsia-500' 
                                            : 'border-l-2 border-transparent hover:bg-gray-800/50'
                                    }`}
                                >
                                    <div className={`flex-shrink-0 ${index === selectedIndex ? 'scale-110 transition-transform' : ''}`}>
                                        {cmd.icon}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-medium truncate ${index === selectedIndex ? 'text-fuchsia-100' : 'text-gray-300'}`}>
                                                {cmd.label}
                                            </span>
                                            {cmd.type === 'shunt' && (
                                                <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">Quick Action</span>
                                            )}
                                        </div>
                                    </div>
                                    {cmd.type === 'navigation' && (
                                        <span className="text-xs text-gray-600 font-mono hidden sm:inline">Jump</span>
                                    )}
                                    {cmd.type === 'action' && (
                                        <span className="text-xs text-gray-600 font-mono hidden sm:inline">Run</span>
                                    )}
                                </button>
                            </li>
                        ))
                    )}
                </ul>
                
                <div className="bg-[#18181b] border-t border-[#3f3f46] px-4 py-2 flex justify-between items-center text-[10px] text-gray-500">
                    <div className="flex gap-3">
                        <span><strong className="text-gray-400">↑↓</strong> Navigate</span>
                        <span><strong className="text-gray-400">↵</strong> Select</span>
                    </div>
                    <div>
                        Aether Shunt OS
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
