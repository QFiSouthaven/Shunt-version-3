
// types/agent.ts
import { ReactNode } from 'react';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'artifact';
export type SlotType = 'head' | 'chest' | 'main_hand' | 'off_hand' | 'legs' | 'accessory';
export type ItemType = SlotType | 'consumable' | 'artifact_slot';

export interface StatBlock {
    hp: number; // Health Points
    mp: number; // Mana/Energy
    atk: number; // Attack Power
    def: number; // Defense
    spd: number; // Speed
    crit: number; // Crit Chance %
}

export interface Item {
    id: string;
    name: string;
    type: ItemType;
    rarity: Rarity;
    stats: Partial<StatBlock>; // Modifiers (e.g., +5 Atk)
    effect?: string; // Special effect text
    lore?: string; // Flavor text
    description?: string; // Functional description
    icon?: ReactNode; // Optional UI icon override
}

export interface AgentConfiguration {
    id: string;
    name: string;
    class: 'Assault' | 'Support' | 'Infiltrator' | 'Tank' | 'Architect';
    baseStats: StatBlock;
    equipment: Partial<Record<SlotType, Item>>; // Equipped items
    artifacts: Item[]; // Active artifacts (constrained list)
    consumables: Item[]; // Equipped utility items
}

export interface SimulationLog {
    timestamp: string;
    event: string;
    type: 'info' | 'combat' | 'error' | 'success';
}
