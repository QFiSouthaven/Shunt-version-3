
import { v4 as uuidv4 } from 'uuid';
import { VirtualFile } from '../types';
import { dbService } from './db';

export interface Chunk {
    id: string;
    sourceFile: string;
    content: string;
    startIndex: number;
    endIndex: number;
}

export interface VectorRecord {
    id: string;
    vector: number[]; 
    metadata: {
        path: string;
        text: string;
        chunkId: string;
        mimeType?: string;
    };
}

export type ETLStep = 'scanning' | 'filtering' | 'chunking' | 'embedding' | 'ingesting' | 'complete' | 'error';

interface ETLProgressCallback {
    (step: ETLStep, progress: number, message: string): void;
}

const IGNORE_PATTERNS = [
    'node_modules', '.git', 'dist', 'build', '.env', '.DS_Store',
    '__pycache__', 'coverage', 'package-lock.json', 'yarn.lock'
];

const ALLOWED_EXTENSIONS = [
    '.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.java', '.c', '.cpp',
    '.md', '.txt', '.json', '.yaml', '.yml', '.html', '.css', '.sql',
    '.jpg', '.jpeg', '.png', '.webp', '.svg' 
];

const chunkContent = (file: VirtualFile, chunkSize: number = 1000, overlap: number = 200): Chunk[] => {
    const chunks: Chunk[] = [];
    
    if (file.encoding === 'base64' || (file.mimeType && file.mimeType.startsWith('image/'))) {
        chunks.push({
            id: uuidv4(),
            sourceFile: file.path,
            content: `[Binary Asset: ${file.path}] (${file.mimeType})`,
            startIndex: 0,
            endIndex: 0
        });
        return chunks;
    }

    const text = file.content;
    let start = 0;
    while (start < text.length) {
        let end = start + chunkSize;
        if (end < text.length) {
            const nextNewLine = text.indexOf('\n', end);
            if (nextNewLine !== -1 && nextNewLine - end < 100) {
                end = nextNewLine; 
            }
        } else {
            end = text.length;
        }

        const chunkText = text.slice(start, end);
        if (chunkText.trim().length > 50) {
            chunks.push({
                id: uuidv4(),
                sourceFile: file.path,
                content: chunkText,
                startIndex: start,
                endIndex: end
            });
        }
        start = end - overlap;
        if (start >= end) start = end; 
    }
    return chunks;
};

export const generateMockEmbedding = (text: string): number[] => {
    const vec: number[] = [];
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }
    for (let i = 0; i < 384; i++) {
        vec.push(Math.sin(hash + i));
    }
    return vec;
};

export const runETLPipeline = async (
    files: VirtualFile[], 
    onProgress: ETLProgressCallback
): Promise<{ vectors: VectorRecord[], stats: { filesProcessed: number; chunksCreated: number; totalTokens: number } }> => {
    
    onProgress('scanning', 10, 'Scanning file system...');
    await new Promise(r => setTimeout(r, 500));

    const filteredFiles = files.filter(f => {
        const isIgnored = IGNORE_PATTERNS.some(pattern => f.path.includes(pattern));
        const ext = '.' + f.path.split('.').pop()?.toLowerCase();
        const isAllowed = ALLOWED_EXTENSIONS.includes(ext);
        return !isIgnored && isAllowed;
    });

    onProgress('filtering', 20, `Filtered ${files.length} down to ${filteredFiles.length} eligible files.`);
    await new Promise(r => setTimeout(r, 500));

    let allChunks: Chunk[] = [];
    let processedCount = 0;
    
    for (const file of filteredFiles) {
        processedCount++;
        const percent = 20 + Math.floor((processedCount / filteredFiles.length) * 30);
        onProgress('chunking', percent, `Processing: ${file.path}`);
        
        if (file.encoding !== 'base64') {
            file.content = file.content.replace(/\r\n/g, '\n'); 
        }
        
        const fileChunks = chunkContent(file);
        allChunks = [...allChunks, ...fileChunks];
        
        if (processedCount % 5 === 0) await new Promise(r => setTimeout(r, 10));
    }

    const vectors: VectorRecord[] = [];
    let embeddedCount = 0;
    
    onProgress('ingesting', 60, 'Initializing Vector Store Sync...');
    await dbService.clear(dbService.STORES.VECTORS);

    for (const chunk of allChunks) {
        embeddedCount++;
        const percent = 60 + Math.floor((embeddedCount / allChunks.length) * 35); 
        
        if (embeddedCount % 20 === 0) {
            onProgress('embedding', percent, `Generating Embeddings & Storing: ${embeddedCount}/${allChunks.length} chunks`);
            await new Promise(r => setTimeout(r, 5));
        }

        const vector = generateMockEmbedding(chunk.content);
        const record = {
            id: uuidv4(),
            vector,
            metadata: {
                path: chunk.sourceFile,
                text: chunk.content,
                chunkId: chunk.id
            }
        };
        
        vectors.push(record);
        await dbService.set(dbService.STORES.VECTORS, record.id, record);
    }

    onProgress('complete', 100, 'Ingestion Complete. Knowledge base is live.');

    return {
        vectors,
        stats: {
            filesProcessed: filteredFiles.length,
            chunksCreated: allChunks.length,
            totalTokens: allChunks.reduce((acc, c) => acc + (c.content.length / 4), 0)
        }
    };
};
