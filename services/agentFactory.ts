
import { v4 as uuidv4 } from 'uuid';
import { AgentManifest, AgentManifestSchema, AgentInstance, ValidationResult } from '../types/agentSystem';
import { toolRegistry } from './toolApi';
import { executeAIRequest } from './geminiService';

export class AgentFactory {
    /**
     * Validates a raw object against the AgentManifest schema and checks tool availability.
     */
    static validateManifest(manifest: unknown): ValidationResult {
        const result = AgentManifestSchema.safeParse(manifest);
        
        if (!result.success) {
            const errors = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`);
            return { valid: false, errors };
        }

        const data = result.data;
        const missingTools: string[] = [];
        
        data.tools.forEach(toolName => {
            if (!toolRegistry.getTool(toolName)) {
                missingTools.push(toolName);
            }
        });

        if (missingTools.length > 0) {
            return { 
                valid: false, 
                errors: [`The following tools are required but not found in the registry: ${missingTools.join(', ')}`],
                manifest: data
            };
        }

        return { valid: true, errors: [], manifest: data };
    }

    /**
     * Instantiates an executable agent from a validated manifest.
     */
    static createAgent(manifest: AgentManifest): AgentInstance {
        const id = uuidv4();
        
        return {
            id,
            manifest,
            status: 'ready',
            execute: async (input: string, context: any = {}) => {
                // In a real system, context might be injected into the prompt
                // Here we perform a standard execution using the manifest's config
                
                const { resultText } = await executeAIRequest({
                    model: manifest.modelConfig.model,
                    systemInstruction: manifest.systemInstruction,
                    prompt: input,
                    useTools: manifest.tools.length > 0,
                    allowedTools: manifest.tools,
                    config: {
                        temperature: manifest.modelConfig.temperature,
                        maxOutputTokens: manifest.modelConfig.maxOutputTokens
                    }
                });
                
                return resultText;
            }
        };
    }
}
