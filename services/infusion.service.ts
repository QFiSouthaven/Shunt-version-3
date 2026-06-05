// services/infusion.service.ts
import JSZip from 'jszip';
import { dbService } from './db';
import { IsolatedState } from './restructuringUtil';
import { audioService } from './audioService';

/**
 * STATE INFUSION ENGINE
 * Processes Standardized Isolation Objects (SIO) and restores them into the local environment.
 */
export const infusionService = {
  /**
   * Infuses a module snapshot into the current system state.
   */
  async infuseSnapshot(file: File): Promise<{ success: boolean; module: string; error?: string }> {
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      
      const manifestFile = content.file('manifest.json');
      if (!manifestFile) {
        throw new Error("INVALID_PACKAGE: manifest.json not found in archive.");
      }

      const manifestText = await manifestFile.async('text');
      const sio: IsolatedState<any> = JSON.parse(manifestText);

      // --- LOGIC: INFUSION MAPPING ---
      // Distributes the payload back to its appropriate storage locations
      await this.restorePayload(sio);
      
      audioService.playSound('success');
      return { success: true, module: sio.module };
    } catch (e: any) {
      console.error("State Infusion Failed:", e);
      audioService.playSound('error');
      return { success: false, module: 'unknown', error: e.message };
    }
  },

  // Fix: Removed 'private' modifier as infusionService is an object literal, not a class.
  async restorePayload(sio: IsolatedState<any>) {
    const { module, payload, dependencies } = sio;

    // 1. Restore Main Module State
    switch (module) {
      case 'shunt':
        if (payload.input) await dbService.set(dbService.STORES.KEY_VALUE, 'shunt_inputText', payload.input);
        if (payload.output) await dbService.set(dbService.STORES.KEY_VALUE, 'shunt_outputText', payload.output);
        if (payload.history) await dbService.set(dbService.STORES.KEY_VALUE, 'shunt_history', payload.history);
        if (payload.docs) await dbService.set(dbService.STORES.FILES, 'shunt_bulletinDocuments', payload.docs);
        break;

      case 'weaver':
        if (payload.goal) localStorage.setItem('weaver_goal', payload.goal);
        if (payload.plan) await dbService.set(dbService.STORES.KEY_VALUE, 'weaver_active_plan', payload.plan);
        if (payload.memory) await dbService.set(dbService.STORES.KEY_VALUE, 'weaver_project_memory', payload.memory);
        break;

      case 'documentation':
        if (payload.files) await dbService.set(dbService.STORES.FILES, 'documentation_projectFiles', payload.files);
        if (payload.result) await dbService.set(dbService.STORES.KEY_VALUE, 'documentation_generatedDoc', payload.result);
        break;

      case 'agent_builder':
        if (payload.manifests) await dbService.set(dbService.STORES.KEY_VALUE, 'unified_agent_registry', payload.manifests);
        if (payload.executionHistory) {
            for (const run of payload.executionHistory) {
                await dbService.set(dbService.STORES.EVOLUTION, run.id, run);
            }
        }
        break;

      default:
        // Generic Restoration for keys stored in localStorage
        Object.entries(payload).forEach(([key, val]) => {
          localStorage.setItem(key, JSON.stringify(val));
        });
    }

    // 2. Restore Traced Dependencies (e.g. agent manifests referenced by Weaver)
    if (dependencies.agent_manifests) {
        await dbService.set(dbService.STORES.KEY_VALUE, 'unified_agent_registry', dependencies.agent_manifests);
    }
  }
};