
// services/restructuringUtil.ts
import { dbService } from './db';

/**
 * Standardized Isolation Object (SIO) structure.
 * This represents a "deployable-ready" state unit.
 */
export interface IsolatedState<T> {
  version: string;
  timestamp: string;
  tabId: string;
  module: string;
  payload: T;
  dependencies: Record<string, any>; // Extra state discovered via tracing
  meta: {
      origin: string;
      environment: string;
      dependenciesFound: string[];
  }
}

/**
 * Sanitizes and flattens raw data into a deployable manifest.
 */
export const restructureForIsolation = <T>(data: T, moduleName: string, dependencies: Record<string, any>): IsolatedState<T> => {
  const payload = data as any;

  // --- EXPORT GUARD RAILS ---
  const isTrivial = !payload || (typeof payload === 'object' && Object.keys(payload).length === 0);
  const isFallback = payload.info && payload.info.includes("No specific persistence mapping");

  if (isTrivial || isFallback) {
      throw new Error(`CRITICAL_VOID: Payload for '${moduleName}' contains no domain logic. Extraction aborted to prevent deployment of empty state.`);
  }

  return {
    version: "3.2.0-deployable-isolation",
    timestamp: new Date().toISOString(),
    tabId: `isolation-${moduleName}-${Math.random().toString(36).substring(2, 9)}`,
    module: moduleName,
    payload: data,
    dependencies,
    meta: {
        origin: "Aether Shunt OS",
        environment: navigator.userAgent,
        dependenciesFound: Object.keys(dependencies)
    }
  };
};

/**
 * Deep State Aggregator.
 * Scans storage layers for module-specific data and traces cross-module dependencies.
 */
export const gatherTabState = async (tabKey: string): Promise<{ state: any; dependencies: Record<string, any> }> => {
    const state: Record<string, any> = {};
    const dependencies: Record<string, any> = {};
    
    const fromLS = (k: string) => {
        try {
            const v = localStorage.getItem(k);
            return v ? JSON.parse(v) : null;
        } catch { return null; }
    };

    const fromDB = async (store: string, k: string) => {
        try {
            return await dbService.get(store, k);
        } catch { return null; }
    };

    // 1. Primary Module Discovery
    switch (tabKey) {
        case 'shunt':
            state.input = await fromDB(dbService.STORES.KEY_VALUE, 'shunt_inputText');
            state.output = await fromDB(dbService.STORES.KEY_VALUE, 'shunt_outputText');
            state.history = await fromDB(dbService.STORES.KEY_VALUE, 'shunt_history');
            state.docs = await fromDB(dbService.STORES.FILES, 'shunt_bulletinDocuments');
            break;
            
        case 'weaver':
            state.goal = localStorage.getItem('weaver_goal');
            state.plan = await fromDB(dbService.STORES.KEY_VALUE, 'weaver_active_plan');
            state.memory = await fromDB(dbService.STORES.KEY_VALUE, 'weaver_project_memory');
            
            // TRACE: If weaver references an agent in its memory, grab agent manifests
            if (state.memory?.geminiContext?.toLowerCase().includes('agent')) {
                dependencies.agent_manifests = fromLS('unified_agent_registry');
            }
            break;
            
        case 'foundry':
            state.feed = await fromDB(dbService.STORES.KEY_VALUE, 'foundry_live_feed');
            state.settings = fromLS('foundry_settings'); // Hypothetical future settings
            break;
            
        case 'agent_builder':
            state.manifests = await fromDB(dbService.STORES.KEY_VALUE, 'unified_agent_registry');
            // TRACE: Pull history of agent runs if they exist in DB
            const allRuns = await dbService.getAll(dbService.STORES.EVOLUTION);
            state.executionHistory = allRuns;
            break;
            
        case 'documentation':
            state.files = await fromDB(dbService.STORES.FILES, 'documentation_projectFiles');
            state.result = await fromDB(dbService.STORES.KEY_VALUE, 'documentation_generatedDoc');
            break;

        case 'image_analysis':
            state.prompt = await fromDB(dbService.STORES.KEY_VALUE, 'imageAnalysis_prompt');
            state.result = await fromDB(dbService.STORES.KEY_VALUE, 'imageAnalysis_result');
            // Heavy asset tracing
            state.imageBase64 = await fromDB(dbService.STORES.FILES, 'imageAnalysis_imageBase64');
            break;

        default:
            // Dynamic Scanning: Try to find keys prefixed with the module name
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.toLowerCase().includes(tabKey.toLowerCase())) {
                    state[key] = fromLS(key);
                }
            }
            if (Object.keys(state).length === 0) {
                state.info = "No specific persistence mapping defined for this module.";
            }
    }
    
    return { state, dependencies };
};
