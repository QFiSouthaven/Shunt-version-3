
// services/diagramService.ts
import { VirtualFile } from '../types';

/**
 * Generates a text-based file tree from a list of files.
 */
export const generateFileTree = (files: VirtualFile[]): string => {
    const root: any = {};

    for (const file of files) {
        const parts = file.path.split('/');
        let current = root;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!current[part]) {
                current[part] = i === parts.length - 1 ? null : {};
            }
            current = current[part];
        }
    }

    const buildTreeString = (node: any, prefix = ''): string => {
        let result = '';
        const keys = Object.keys(node);
        keys.forEach((key, index) => {
            const isLast = index === keys.length - 1;
            result += `${prefix}${isLast ? '└── ' : '├── '}${key}\n`;
            if (node[key] !== null) {
                result += buildTreeString(node[key], `${prefix}${isLast ? '    ' : '│   '}`);
            }
        });
        return result;
    };

    return `\`\`\`
${buildTreeString(root)}
\`\`\``;
};

/**
 * Generates a Mermaid.js graph syntax for the component hierarchy.
 */
export const generateComponentDiagram = (files: VirtualFile[]): string => {
    const componentRegex = /<([A-Z][a-zA-Z0-9_]+)/g;
    const dependencies: { [parent: string]: Set<string> } = {};

    const getComponentName = (path: string): string => {
        const parts = path.split('/');
        const filename = parts[parts.length - 1];
        if (filename === 'index.tsx' && parts.length > 1) {
            return parts[parts.length - 2];
        }
        return filename.replace('.tsx', '');
    };

    for (const file of files) {
        if (!file.path.endsWith('.tsx')) continue;

        const parentComponent = getComponentName(file.path);
        if (!dependencies[parentComponent]) {
            dependencies[parentComponent] = new Set();
        }

        let match;
        while ((match = componentRegex.exec(file.content)) !== null) {
            const childComponent = match[1];
            // Basic filtering to avoid HTML tags and self-references
            if (childComponent !== parentComponent && /^[A-Z]/.test(childComponent)) {
                dependencies[parentComponent].add(childComponent);
            }
        }
    }

    let mermaidGraph = 'graph TD;\n';
    for (const parent in dependencies) {
        if (dependencies[parent].size > 0) {
            dependencies[parent].forEach(child => {
                // By quoting the node IDs, we prevent syntax errors if a component name
                // contains special characters or is a Mermaid keyword.
                mermaidGraph += `    "${parent}" --> "${child}";\n`;
            });
        }
    }

    return mermaidGraph;
};
