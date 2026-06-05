
// components/agent_builder/AgentDesigner.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AgentConfiguration, Item, SlotType, StatBlock, SimulationLog } from '../../types/agent';
import { ShieldCheckIcon, BoltIcon, StarIcon, TrimIcon, UserIcon, RocketLaunchIcon, XMarkIcon, PlayIcon, ErrorIcon, SparklesIcon } from '../icons';
import { audioService } from '../../services/audioService';

// --- MOCK DATA LIBRARY ---
const ITEM_LIBRARY: Item[] = [
    // Weapons
    { id: 'w1', name: 'Neural Katana', type: 'main_hand', rarity: 'rare', stats: { atk: 15, spd: 5 }, description: 'Vibrates at a frequency that severs synaptic links.' },
    { id: 'w2', name: 'Void Buster', type: 'main_hand', rarity: 'legendary', stats: { atk: 40, crit: 10 }, description: 'Collapses local space upon impact.' },
    { id: 'w3', name: 'Rusty Pipe', type: 'main_hand', rarity: 'common', stats: { atk: 3 }, description: 'Better than nothing.' },
    
    // Offhand
    { id: 'o1', name: 'Riot Shield', type: 'off_hand', rarity: 'common', stats: { def: 10, hp: 20 }, description: 'Standard issue poly-carb.' },
    { id: 'o2', name: 'Holo-Emitter', type: 'off_hand', rarity: 'epic', stats: { spd: 15, mp: 30 }, description: 'Distracts enemies with clones.' },

    // Armor
    { id: 'h1', name: 'Tactical Visor', type: 'head', rarity: 'rare', stats: { crit: 5, mp: 10 }, description: 'Highlights weak points.' },
    { id: 'c1', name: 'Nanofiber Vest', type: 'chest', rarity: 'epic', stats: { def: 25, hp: 50 }, description: 'Self-repairing weave.' },
    { id: 'l1', name: 'Exo-Greaves', type: 'legs', rarity: 'rare', stats: { spd: 10, def: 5 }, description: 'Hydraulic jump assist.' },

    // Artifacts
    { id: 'a1', name: 'Heart of the Swarm', type: 'artifact_slot', rarity: 'artifact', stats: { atk: 10, spd: 10 }, effect: 'Swarm Link: +5% stats per ally.', description: 'Pulses with collective intent.' },
    { id: 'a2', name: 'Chrono Shard', type: 'artifact_slot', rarity: 'artifact', stats: { spd: 30 }, effect: 'Time Skip: 10% chance to act twice.', description: 'Frozen in a moment of explosion.' },

    // Consumables
    { id: 'u1', name: 'Repair Nanites', type: 'consumable', rarity: 'common', stats: {}, effect: 'Restore 50% HP', description: 'Quick fix for flesh wounds.' },
    { id: 'u2', name: 'Overclock Stim', type: 'consumable', rarity: 'rare', stats: {}, effect: '+50% SPD for 3 turns', description: 'Burn bright, burn fast.' },
];

const INITIAL_AGENT: AgentConfiguration = {
    id: 'agent-001',
    name: 'Unit Alpha',
    class: 'Assault',
    baseStats: { hp: 100, mp: 50, atk: 10, def: 5, spd: 10, crit: 5 },
    equipment: {},
    artifacts: [],
    consumables: []
};

// --- HELPER COMPONENTS ---

const RarityBorder = ({ rarity, children, className = '' }: { rarity: string, children?: React.ReactNode, className?: string }) => {
    let color = 'border-gray-700';
    let bg = 'bg-gray-800';
    if (rarity === 'rare') { color = 'border-blue-500'; bg = 'bg-blue-900/20'; }
    if (rarity === 'epic') { color = 'border-purple-500'; bg = 'bg-purple-900/20'; }
    if (rarity === 'legendary') { color = 'border-orange-500'; bg = 'bg-orange-900/20'; }
    if (rarity === 'artifact') { color = 'border-red-500'; bg = 'bg-red-900/10'; }

    return <div className={`border ${color} ${bg} ${className}`}>{children}</div>;
};

const StatRow = ({ label, value, bonus }: { label: string, value: number, bonus: number }) => (
    <div className="flex justify-between items-center text-xs py-1 border-b border-gray-800 last:border-0">
        <span className="text-gray-400 font-mono uppercase">{label}</span>
        <div className="flex gap-2">
            <span className="text-gray-200">{value}</span>
            {bonus > 0 && <span className="text-green-400">+{bonus}</span>}
        </div>
    </div>
);

// --- MAIN COMPONENT ---

const AgentDesigner: React.FC = () => {
    const [agent, setAgent] = useState<AgentConfiguration>(INITIAL_AGENT);
    const [draggedItem, setDraggedItem] = useState<Item | null>(null);
    const [simulationLogs, setSimulationLogs] = useState<SimulationLog[]>([]);
    const [activeTab, setActiveTab] = useState<'equipment' | 'artifacts' | 'utilities'>('equipment');
    const logsRef = useRef<HTMLDivElement>(null);

    // --- LOGIC: Stat Aggregation ---
    const totalStats = useMemo(() => {
        const total = { ...agent.baseStats };
        const items = [
            ...Object.values(agent.equipment),
            ...agent.artifacts,
            ...agent.consumables // Usually consumables don't give passive stats, but let's allow it for "Charms"
        ];

        items.forEach(item => {
            if (!item) return;
            if (item.stats.hp) total.hp += item.stats.hp;
            if (item.stats.mp) total.mp += item.stats.mp;
            if (item.stats.atk) total.atk += item.stats.atk;
            if (item.stats.def) total.def += item.stats.def;
            if (item.stats.spd) total.spd += item.stats.spd;
            if (item.stats.crit) total.crit += item.stats.crit;
        });
        return total;
    }, [agent]);

    // --- LOGIC: Simulation ---
    const runSimulation = () => {
        setSimulationLogs([]);
        audioService.playSound('click');
        
        // Validation Check
        if (totalStats.hp <= 0) {
            setSimulationLogs([{ timestamp: new Date().toLocaleTimeString(), event: 'CRITICAL ERROR: Agent has 0 HP. Cannot deploy.', type: 'error' }]);
            audioService.playSound('error');
            return;
        }

        const logs: SimulationLog[] = [];
        logs.push({ timestamp: new Date().toLocaleTimeString(), event: 'Simulation Initialized. Target: Training Dummy (HP: 500)', type: 'info' });

        let dummyHp = 500;
        let turns = 0;

        const interval = setInterval(() => {
            turns++;
            const isCrit = Math.random() * 100 < totalStats.crit;
            const dmg = Math.floor(totalStats.atk * (isCrit ? 2 : 1) * (1 + (Math.random() * 0.2 - 0.1))); // +/- 10% variance
            dummyHp -= dmg;

            logs.push({ 
                timestamp: new Date().toLocaleTimeString(), 
                event: `Turn ${turns}: ${agent.name} deals ${dmg} damage${isCrit ? ' (CRITICAL!)' : ''}. Dummy HP: ${Math.max(0, dummyHp)}`, 
                type: 'combat' 
            });

            if (dummyHp <= 0) {
                logs.push({ timestamp: new Date().toLocaleTimeString(), event: `Target Destroyed in ${turns} turns. Simulation Successful.`, type: 'success' });
                audioService.playSound('success');
                clearInterval(interval);
            } else if (turns >= 5) {
                logs.push({ timestamp: new Date().toLocaleTimeString(), event: `Simulation Time Limit Reached. Target remains active.`, type: 'info' });
                clearInterval(interval);
            }

            setSimulationLogs([...logs]);
            if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
        }, 600);
    };

    // --- HANDLERS ---
    const handleDragStart = (e: React.DragEvent, item: Item) => {
        setDraggedItem(item);
        e.dataTransfer.setData('application/json', JSON.stringify(item));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDrop = (e: React.DragEvent, slotType: SlotType | 'artifact_slot' | 'consumable') => {
        e.preventDefault();
        const itemData = e.dataTransfer.getData('application/json');
        if (!itemData) return;
        
        const item: Item = JSON.parse(itemData);

        // Compatibility Check
        if (slotType === 'artifact_slot') {
            if (item.type !== 'artifact_slot') {
                audioService.playSound('error');
                return;
            }
            // Constraint: Only 1 artifact allowed
            if (agent.artifacts.length >= 1) {
                // Replace logic
                setAgent(prev => ({ ...prev, artifacts: [item] }));
            } else {
                setAgent(prev => ({ ...prev, artifacts: [...prev.artifacts, item] }));
            }
        } else if (slotType === 'consumable') {
             if (item.type !== 'consumable') {
                audioService.playSound('error');
                return;
            }
            setAgent(prev => ({ ...prev, consumables: [...prev.consumables, item] }));
        } else {
            // Equipment Slots
            if (item.type !== slotType) {
                audioService.playSound('error'); // Invalid slot
                return;
            }
            setAgent(prev => ({
                ...prev,
                equipment: { ...prev.equipment, [slotType]: item }
            }));
        }
        audioService.playSound('click');
        setDraggedItem(null);
    };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    const unequip = (slot: string) => {
        if (slot === 'artifact') {
            setAgent(prev => ({ ...prev, artifacts: [] }));
        } else if (slot.startsWith('consumable-')) {
            const idx = parseInt(slot.split('-')[1]);
            setAgent(prev => ({ ...prev, consumables: prev.consumables.filter((_, i) => i !== idx) }));
        } else {
            setAgent(prev => ({ ...prev, equipment: { ...prev.equipment, [slot]: undefined } }));
        }
        audioService.playSound('click');
    };

    return (
        <div className="h-full p-4 md:p-6 grid grid-cols-1 xl:grid-cols-4 gap-6 overflow-hidden">
            
            {/* COLUMN 1: Character Sheet */}
            <div className="xl:col-span-1 bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 flex flex-col gap-6 shadow-lg">
                <div className="flex items-center gap-4 border-b border-gray-800 pb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-900 to-black rounded-full border-2 border-emerald-500/50 flex items-center justify-center">
                        <UserIcon className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <input 
                            value={agent.name} 
                            onChange={(e) => setAgent(p => ({...p, name: e.target.value}))}
                            className="bg-transparent text-lg font-bold text-white outline-none w-full placeholder-gray-600"
                            placeholder="Agent Name"
                        />
                        <select 
                            value={agent.class}
                            onChange={(e) => setAgent(p => ({...p, class: e.target.value as any}))}
                            className="bg-transparent text-xs text-emerald-500 uppercase tracking-widest outline-none cursor-pointer"
                        >
                            <option>Assault</option>
                            <option>Support</option>
                            <option>Infiltrator</option>
                            <option>Tank</option>
                            <option>Architect</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Vital Statistics</h3>
                    <div className="space-y-2 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                        <StatRow label="Hit Points" value={totalStats.hp} bonus={totalStats.hp - agent.baseStats.hp} />
                        <StatRow label="Mana / Energy" value={totalStats.mp} bonus={totalStats.mp - agent.baseStats.mp} />
                        <StatRow label="Attack" value={totalStats.atk} bonus={totalStats.atk - agent.baseStats.atk} />
                        <StatRow label="Defense" value={totalStats.def} bonus={totalStats.def - agent.baseStats.def} />
                        <StatRow label="Speed" value={totalStats.spd} bonus={totalStats.spd - agent.baseStats.spd} />
                        <StatRow label="Critical %" value={totalStats.crit} bonus={totalStats.crit - agent.baseStats.crit} />
                    </div>
                </div>

                <div className="mt-auto">
                    <button 
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase text-xs rounded transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/50"
                        onClick={() => {
                            const blob = new Blob([JSON.stringify(agent, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${agent.name.replace(/\s+/g, '_')}_config.json`;
                            link.click();
                            audioService.playSound('success');
                        }}
                    >
                        <BoltIcon className="w-4 h-4" />
                        Serialize & Save
                    </button>
                </div>
            </div>

            {/* COLUMN 2: Paper Doll (Equipment Slots) */}
            <div className="xl:col-span-2 flex flex-col gap-6">
                <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6 flex-grow relative shadow-lg flex flex-col items-center justify-center">
                    {/* Background Grid */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    
                    <h3 className="absolute top-4 left-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Loadout Configuration</h3>

                    <div className="relative z-10 grid grid-cols-3 gap-8 w-full max-w-md">
                        {/* Head */}
                        <div className="col-start-2 flex justify-center">
                            <EquipmentSlot slot="head" item={agent.equipment.head} onDrop={(e) => handleDrop(e, 'head')} onUnequip={() => unequip('head')} />
                        </div>
                        
                        {/* Middle Row: Main Hand, Chest, Off Hand */}
                        <div className="col-start-1 flex justify-center items-center">
                            <EquipmentSlot slot="main_hand" item={agent.equipment.main_hand} onDrop={(e) => handleDrop(e, 'main_hand')} onUnequip={() => unequip('main_hand')} label="Main Hand" />
                        </div>
                        <div className="col-start-2 flex justify-center items-center">
                            <EquipmentSlot slot="chest" item={agent.equipment.chest} onDrop={(e) => handleDrop(e, 'chest')} onUnequip={() => unequip('chest')} label="Torso" />
                        </div>
                        <div className="col-start-3 flex justify-center items-center">
                            <EquipmentSlot slot="off_hand" item={agent.equipment.off_hand} onDrop={(e) => handleDrop(e, 'off_hand')} onUnequip={() => unequip('off_hand')} label="Off Hand" />
                        </div>

                        {/* Legs */}
                        <div className="col-start-2 flex justify-center">
                            <EquipmentSlot slot="legs" item={agent.equipment.legs} onDrop={(e) => handleDrop(e, 'legs')} onUnequip={() => unequip('legs')} label="Legs" />
                        </div>
                    </div>

                    {/* Artifact Container */}
                    <div className="absolute bottom-6 left-6 right-6 p-4 bg-gray-900/80 border border-gray-700 rounded-lg backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                <SparklesIcon className="w-4 h-4" /> Artifact Anchor
                            </h4>
                            <span className="text-[10px] text-gray-500">Limit: 1 Unique</span>
                        </div>
                        <div 
                            className={`h-16 border-2 border-dashed ${agent.artifacts.length > 0 ? 'border-amber-500/50 bg-amber-900/10' : 'border-gray-700'} rounded flex items-center justify-center transition-colors`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'artifact_slot')}
                        >
                            {agent.artifacts.length > 0 ? (
                                <div className="flex items-center gap-3 w-full px-4 group cursor-pointer relative" onClick={() => unequip('artifact')}>
                                    <div className="w-10 h-10 bg-amber-900 rounded border border-amber-500 flex items-center justify-center text-amber-200">
                                        <SparklesIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-amber-100">{agent.artifacts[0].name}</div>
                                        <div className="text-[10px] text-amber-400/80">{agent.artifacts[0].effect}</div>
                                    </div>
                                    <div className="absolute right-4 text-gray-500 group-hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <XMarkIcon className="w-5 h-5" />
                                    </div>
                                </div>
                            ) : (
                                <span className="text-xs text-gray-600">Drag Artifact Here</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Simulation Console */}
                <div className="h-48 bg-black border border-gray-800 rounded-lg flex flex-col overflow-hidden shadow-lg font-mono text-xs">
                    <div className="p-2 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
                        <span className="text-gray-400">&gt;&gt; SIMULATION_CONSOLE</span>
                        <button 
                            onClick={runSimulation}
                            className="flex items-center gap-1 px-2 py-1 bg-green-900/30 text-green-400 hover:bg-green-900/50 rounded border border-green-800 transition-colors"
                        >
                            <PlayIcon className="w-3 h-3" /> Test Run
                        </button>
                    </div>
                    <div ref={logsRef} className="flex-grow p-3 overflow-y-auto space-y-1">
                        {simulationLogs.length === 0 && <span className="text-gray-600 italic">Ready to simulate combat metrics...</span>}
                        {simulationLogs.map((log, i) => (
                            <div key={i} className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : log.type === 'combat' ? 'text-gray-300' : 'text-blue-400'}`}>
                                <span className="opacity-50">[{log.timestamp}]</span>
                                <span>{log.event}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* COLUMN 3: Asset Library */}
            <div className="xl:col-span-1 bg-[#0a0a0a] border border-gray-800 rounded-lg flex flex-col shadow-lg overflow-hidden">
                <div className="flex border-b border-gray-800">
                    <button 
                        onClick={() => setActiveTab('equipment')} 
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide ${activeTab === 'equipment' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Gear
                    </button>
                    <button 
                        onClick={() => setActiveTab('artifacts')} 
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide ${activeTab === 'artifacts' ? 'bg-gray-800 text-amber-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Artifacts
                    </button>
                    <button 
                        onClick={() => setActiveTab('utilities')} 
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide ${activeTab === 'utilities' ? 'bg-gray-800 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Utility
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-3 space-y-3">
                    {ITEM_LIBRARY.filter(i => {
                        if (activeTab === 'equipment') return ['head', 'chest', 'legs', 'main_hand', 'off_hand'].includes(i.type);
                        if (activeTab === 'artifacts') return i.type === 'artifact_slot';
                        if (activeTab === 'utilities') return i.type === 'consumable';
                        return false;
                    }).map(item => (
                        <div 
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item)}
                            className="cursor-grab active:cursor-grabbing"
                        >
                            <RarityBorder rarity={item.rarity} className="rounded p-3 hover:bg-gray-700/50 transition-colors group">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`font-bold text-sm ${item.rarity === 'legendary' ? 'text-orange-400' : item.rarity === 'epic' ? 'text-purple-400' : item.rarity === 'rare' ? 'text-blue-400' : 'text-gray-300'}`}>
                                        {item.name}
                                    </span>
                                    <span className="text-[10px] uppercase text-gray-500 border border-gray-600 px-1 rounded">{item.type.replace('_', ' ')}</span>
                                </div>
                                <p className="text-[10px] text-gray-400 italic mb-2">"{item.description}"</p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(item.stats).map(([stat, val]) => (
                                        <span key={stat} className="text-[10px] font-mono bg-black/40 px-1.5 py-0.5 rounded text-gray-300">
                                            {stat.toUpperCase()} +{val}
                                        </span>
                                    ))}
                                    {item.effect && (
                                        <span className="text-[10px] font-mono bg-amber-900/30 text-amber-200 px-1.5 py-0.5 rounded border border-amber-900/50">
                                            {item.effect}
                                        </span>
                                    )}
                                </div>
                            </RarityBorder>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Sub-component for individual slots
const EquipmentSlot: React.FC<{ slot: string, item: Item | undefined, onDrop: (e: React.DragEvent) => void, onUnequip: () => void, label?: string }> = ({ slot, item, onDrop, onUnequip, label }) => {
    return (
        <div className="flex flex-col items-center gap-1">
            <div 
                className={`w-24 h-24 border-2 rounded-lg flex items-center justify-center transition-all relative group ${item ? 'bg-gray-800 border-gray-600' : 'border-dashed border-gray-700 bg-gray-900/50'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
            >
                {item ? (
                    <>
                        <div className="text-center p-1">
                            <div className={`text-xs font-bold ${item.rarity === 'legendary' ? 'text-orange-400' : item.rarity === 'epic' ? 'text-purple-400' : 'text-gray-200'}`}>
                                {item.name}
                            </div>
                            <div className="text-[9px] text-gray-500 mt-1 uppercase">{item.type.replace('_', ' ')}</div>
                        </div>
                        <button 
                            onClick={onUnequip}
                            className="absolute -top-2 -right-2 bg-red-900 text-red-200 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity border border-red-500 shadow-lg"
                        >
                            <XMarkIcon className="w-3 h-3" />
                        </button>
                    </>
                ) : (
                    <div className="text-gray-600 text-xs uppercase font-bold tracking-widest">{label || slot}</div>
                )}
            </div>
        </div>
    );
};

export default AgentDesigner;
