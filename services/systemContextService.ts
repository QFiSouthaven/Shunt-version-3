
// services/systemContextService.ts
import { MODULE_REGISTRY } from '../components/mission_control/tabsConfig';
import { shuntActionDescriptions } from './prompts';
import { INITIAL_DOCUMENTATION } from '../context/constants';

interface SystemContext {
    modules: string;
    ontology: string;
    actions: string;
    constraints: string;
}

/**
 * Performs a "Deep-Stack Traversal" to gather the current state of the entire system.
 * This aggregates UI capabilities, Backend Logic (simulated via Memory), and Execution Triggers.
 */
export const getSystemHolisticContext = async (): Promise<SystemContext> => {
    
    // 1. Module Interoperability Layer
    // Scans the active registry to understand what parts of the system exist.
    const moduleMap = MODULE_REGISTRY.map(m => `- **${m.label} (${m.key})**: ${m.description} [Context: ${m.architecturalContext}]`).join('\n');

    // 2. Execution Trigger Analysis ("Shount" Buttons)
    // Aggregates all available atomic actions the system can perform.
    const actionMap = Object.entries(shuntActionDescriptions)
        .map(([action, desc]) => `- **${action}**: ${desc}`)
        .join('\n');

    // 3. Foundry Integration (Data & Ontology Layer)
    // Retrieves the "Single Source of Truth" from the Weaver's persistent memory.
    let projectMemory = INITIAL_DOCUMENTATION;
    try {
        const stored = localStorage.getItem('weaver-project-memory');
        if (stored) {
            projectMemory = { ...INITIAL_DOCUMENTATION, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.warn("Failed to read Weaver memory for system audit.");
    }

    const ontology = `
    **Data Context:**
    ${projectMemory.geminiContext}
    
    **Active Decisions:**
    ${projectMemory.decisions}
    `;

    return {
        modules: moduleMap,
        ontology: ontology,
        actions: actionMap,
        constraints: "Global Constraints: React 19, TypeScript, Tailwind CSS, Local-First Architecture."
    };
};
