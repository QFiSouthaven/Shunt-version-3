
// services/fileSystem.ts

/**
 * Service to manage real file system access via the Browser File System Access API.
 * This allows the AI to read/write actual files on the user's computer after permission is granted.
 */

// Augment Window interface for File System Access API
declare global {
    interface Window {
        showDirectoryPicker(options?: any): Promise<FileSystemDirectoryHandle>;
    }
}

export interface FileNode {
    name: string;
    kind: 'file' | 'directory';
    path: string;
    size?: number;
    lastModified?: number;
}

let rootHandle: FileSystemDirectoryHandle | null = null;
const virtualFiles: Map<string, string> = new Map();

/**
 * Initializes the file system with a set of virtual files.
 * This is useful for simulations (previous behavior) or when local file access is not available.
 * @param files A map of filenames to content
 */
export const initializeFileSystem = (files: Record<string, string>) => {
    virtualFiles.clear();
    Object.entries(files).forEach(([name, content]) => {
        virtualFiles.set(name, content);
    });
    console.log("Virtual file system initialized with", Object.keys(files).length, "files.");
};

export const fileSystemService = {
    /**
     * Request the user to select a local directory to mount.
     */
    async mountDirectory(): Promise<void> {
        if (typeof window.showDirectoryPicker !== 'function') {
            throw new Error("File System Access API is not supported in this browser. Please use Chrome, Edge, or Opera.");
        }
        try {
            rootHandle = await window.showDirectoryPicker();
            console.log("Directory mounted:", rootHandle.name);
        } catch (e) {
            console.error("Failed to mount directory:", e);
            throw new Error("Access denied or cancelled by user.");
        }
    },

    isMounted(): boolean {
        return !!rootHandle;
    },

    getMountName(): string {
        return rootHandle ? rootHandle.name : 'Virtual Environment';
    },

    /**
     * Recursively list files in the mounted directory with metadata.
     */
    async listFiles(dirHandle = rootHandle, path = ''): Promise<FileNode[]> {
        if (!dirHandle) {
            // Fallback to virtual files if no directory is mounted
            return Array.from(virtualFiles.keys()).map(k => ({
                name: k.split('/').pop() || k,
                kind: 'file',
                path: k
            }));
        }
        
        const nodes: FileNode[] = [];
        
        // @ts-ignore
        for await (const entry of dirHandle.values()) {
            const entryPath = path ? `${path}/${entry.name}` : entry.name;
            if (entry.kind === 'file') {
                const file = await (entry as FileSystemFileHandle).getFile();
                nodes.push({
                    name: entry.name,
                    kind: 'file',
                    path: entryPath,
                    size: file.size,
                    lastModified: file.lastModified
                });
            } else if (entry.kind === 'directory') {
                if (['node_modules', '.git', 'dist', 'build', '.next', '.vscode'].includes(entry.name)) continue;
                nodes.push({
                    name: entry.name,
                    kind: 'directory',
                    path: entryPath
                });
            }
        }
        return nodes.sort((a, b) => {
            if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
    },

    async readFile(path: string): Promise<string> {
        if (!rootHandle) {
            if (virtualFiles.has(path)) {
                return virtualFiles.get(path) || '';
            }
            throw new Error(`Virtual file not found: ${path}. Mount a drive to access real files.`);
        }
        
        try {
            const handle = await this.getFileHandle(path);
            const file = await handle.getFile();
            return await file.text();
        } catch (e) {
            if (virtualFiles.has(path)) return virtualFiles.get(path)!;
            throw new Error(`Failed to read file '${path}': ${(e as Error).message}`);
        }
    },

    async writeFile(path: string, content: string): Promise<void> {
        virtualFiles.set(path, content);

        if (rootHandle) {
            try {
                const handle = await this.getFileHandle(path, true);
                const writable = await handle.createWritable();
                await writable.write(content);
                await writable.close();
            } catch (e) {
                throw new Error(`Failed to write to real FS '${path}': ${(e as Error).message}`);
            }
        }
    },

    async getFileHandle(path: string, create = false): Promise<FileSystemFileHandle> {
        if (!rootHandle) throw new Error("No directory mounted.");

        const parts = path.split('/').filter(p => p !== '.' && p !== '');
        const fileName = parts.pop();
        
        if (!fileName) throw new Error("Invalid file path.");

        let currentDir = rootHandle;
        
        for (const dirName of parts) {
            try {
                currentDir = await currentDir.getDirectoryHandle(dirName, { create });
            } catch {
                throw new Error(`Directory '${dirName}' not found in path '${path}'.`);
            }
        }

        return await currentDir.getFileHandle(fileName, { create });
    }
};
