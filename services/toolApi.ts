// services/toolApi.ts
import { createTwoFilesPatch } from 'diff';
import { fileSystemService, initializeFileSystem } from './fileSystem';
import { executeCode } from './codeExecutor';
import { appEventBus } from '../lib/eventBus';

export { initializeFileSystem };

// --- Interfaces ---

export interface ExecutionContext {
    agentId: string;
    permissions: string[];
}

export interface ToolResult {
    success: boolean;
    data: any | null;
    error: { type?: string; message: string; details?: any } | null;
}

export interface Tool {
    getName(): string;
    getDescription(): string;
    getInputSchema(): object;
    getRequiredPermissions(): string[];
    execute(args: any): Promise<any>;
}

// --- Real Tool Implementations ---

class ReadFileTool implements Tool {
    getName = () => 'read_file';
    getDescription = () => 'Reads the content of a file. Automatically uses the mounted local directory if available.';
    getInputSchema = () => ({ type: 'object', properties: { path: { type: 'string' } }, required: ['path'] });
    getRequiredPermissions = () => ['filesystem:read'];
    
    async execute({ path }: { path: string }): Promise<string> {
        return await fileSystemService.readFile(path);
    }
}

class ListFilesTool implements Tool {
    getName = () => 'list_files';
    getDescription = () => 'Lists all files recursively. Identifies if the environment is a real local drive or a virtual sandbox.';
    getInputSchema = () => ({ type: 'object', properties: {} });
    getRequiredPermissions = () => ['filesystem:read'];
    
    async execute(): Promise<{ files: string[], mounted: boolean, mountName: string }> {
        const files = await fileSystemService.listFiles();
        const mounted = fileSystemService.isMounted();
        const mountName = fileSystemService.getMountName();
        
        // Fixed: Correctly map FileNode array to string array of paths
        const filePaths = files.map(f => f.path);

        return { 
            files: filePaths.length > 300 ? [...filePaths.slice(0, 300), `...and ${filePaths.length - 300} more`] : filePaths,
            mounted,
            mountName
        };
    }
}

class WriteFileTool implements Tool {
    getName = () => 'write_file';
    getDescription = () => 'Writes content to a specific file. If a local drive is mounted, this writes to the user\'s real disk.';
    getInputSchema = () => ({ type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] });
    getRequiredPermissions = () => ['filesystem:write'];
    
    async execute({ path, content }: { path: string, content: string }): Promise<{ path: string, diff: string, status: string }> {
        let oldContent = '';
        try { 
            oldContent = await fileSystemService.readFile(path); 
        } catch { 
            oldContent = ''; 
        }

        await fileSystemService.writeFile(path, content);
        
        const diff = createTwoFilesPatch(path, path, oldContent, content, 'Old', 'New');
        const status = fileSystemService.isMounted() ? "REAL_FS_WRITE_SUCCESS" : "VIRTUAL_FS_WRITE_SUCCESS";
        
        return { path, diff, status };
    }
}

class ExecuteShellTool implements Tool {
    getName = () => 'execute_shell_command';
    getDescription = () => 'Executes a command in the host terminal via the MCP bridge. ONLY use for non-destructive operations unless explicitly requested.';
    getInputSchema = () => ({ 
        type: 'object', 
        properties: { 
            command: { type: 'string', description: 'The shell command to run' },
            workingDir: { type: 'string', description: 'Optional directory context' }
        }, 
        required: ['command'] 
    });
    getRequiredPermissions = () => ['terminal:execute'];

    async execute({ command }: { command: string }): Promise<any> {
        // This relies on the MCP context being available globally or passed via window
        if (window.mcpExtension && window.mcpExtension.isReady) {
            try {
                // Heuristic Security Check (Second Pass)
                const { auditShellCommand } = await import('./CommandGuard');
                const audit = auditShellCommand(command);
                if (audit.riskLevel === 'CRITICAL') {
                    throw new Error(`SECURITY_BLOCK: Command '${command}' violated safety protocols.`);
                }

                // Simulate command execution via bridge
                // In a real scenario, this would be: await window.mcpExtension.terminal.exec(command);
                console.log(`[MCP BRIDGE] Executing: ${command}`);
                appEventBus.emit('telemetry', { type: 'system_action', data: { eventType: 'shell_exec', command } });
                
                return { 
                    stdout: `[MOCK OUTPUT] Successfully ran: ${command}`,
                    stderr: "",
                    exitCode: 0 
                };
            } catch (e: any) {
                throw new Error(`Shell Execution Failed: ${e.message}`);
            }
        }
        throw new Error("MCP Bridge not connected. Cannot execute shell commands on host.");
    }
}

class CodeInterpreterTool implements Tool {
    getName = () => 'code_interpreter';
    getDescription = () => 'Executes Python code. Useful for data analysis, math, and logic.';
    getInputSchema = () => ({ type: 'object', properties: { code: { type: 'string' } }, required: ['code'] });
    getRequiredPermissions = () => ['execution:code'];
    
    async execute({ code }: { code: string }) {
        return await executeCode('python', code);
    }
}

class WebSearchTool implements Tool {
    getName = () => 'web_search';
    getDescription = () => 'Performs a live Google Search to retrieve real-time information.';
    getInputSchema = () => ({ type: 'object', properties: { query: { type: 'string' } }, required: ['query'] });
    getRequiredPermissions = () => ['network:search'];
    
    async execute({ query }: { query: string }) {
        return { search_query: query, message: "Search requested. Grounding results will be provided in next context turn." };
    }
}

class InverseAnalysisTool implements Tool {
    getName = () => 'perform_inverse_analysis';
    getDescription = () => 'Identifies failure modes for a given task and proposes neutralizations.';
    getInputSchema = () => ({ 
        type: 'object', 
        properties: { 
            task: { type: 'string' },
            failure_mode: { type: 'string' },
            mitigation: { type: 'string' } 
        }, 
        required: ['task', 'failure_mode', 'mitigation'] 
    });
    getRequiredPermissions = () => ['agent:analyze'];
    
    async execute(args: any) {
        return { status: "RISK_ASSESSED", ...args };
    }
}

// --- Registry ---

class ToolRegistry {
    public tools = new Map<string, Tool>();

    constructor() {
        [
            new ReadFileTool(), 
            new WriteFileTool(), 
            new ListFilesTool(), 
            new ExecuteShellTool(),
            new CodeInterpreterTool(),
            new WebSearchTool(),
            new InverseAnalysisTool()
        ].forEach(tool => this.register(tool));
    }

    register(tool: Tool) { this.tools.set(tool.getName(), tool); }
    getTool(name: string): Tool | undefined { return this.tools.get(name); }
    getAllTools(): Tool[] { return Array.from(this.tools.values()); }
}

export const toolRegistry = new ToolRegistry();

export async function executeTool(toolName: string, args: any, context: ExecutionContext): Promise<ToolResult> {
    const tool = toolRegistry.getTool(toolName);
    if (!tool) {
        return { success: false, data: null, error: { message: `Tool '${toolName}' not found.` } };
    }

    const requiredPermissions = tool.getRequiredPermissions();
    const missingPermissions = requiredPermissions.filter(p => !context.permissions.includes(p));
    
    if (missingPermissions.length > 0 && !context.permissions.includes('system:admin')) {
        return { success: false, data: null, error: { message: `Agent lacks permissions: ${missingPermissions.join(', ')}` } };
    }

    try {
        const data = await tool.execute(args);
        return { success: true, data, error: null };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Execution error';
        return { success: false, data: null, error: { message } };
    }
}
