
// components/computer/FileExplorer.tsx
import React, { useState, useEffect } from 'react';
import { fileSystemService, FileNode } from '../../services/fileSystem';
import { DocumentIcon, FolderIcon, ArrowPathIcon, ChevronRightIcon } from '../icons';
import { audioService } from '../../services/audioService';

interface FileExplorerProps {
  onFileSelect: (content: string, path: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect }) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const refreshFiles = async () => {
    setLoading(true);
    try {
      const list = await fileSystemService.listFiles();
      setFiles(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fileSystemService.isMounted()) {
      refreshFiles();
    }
  }, []);

  const handleFileClick = async (node: FileNode) => {
    audioService.playSound('click');
    if (node.kind === 'file') {
      try {
        const content = await fileSystemService.readFile(node.path);
        onFileSelect(content, node.path);
      } catch (e) {
        alert("Failed to read file.");
      }
    } else {
      setExpandedFolders(prev => {
        const next = new Set(prev);
        if (next.has(node.path)) next.delete(node.path);
        else next.add(node.path);
        return next;
      });
    }
  };

  const formatSize = (bytes?: number) => {
    if (bytes === undefined) return '';
    if (bytes < 1024) return `${bytes}B`;
    return `${(bytes / 1024).toFixed(1)}KB`;
  };

  return (
    <div className="flex flex-col h-full bg-black/40 border border-gray-800 rounded-lg overflow-hidden font-mono">
      <header className="p-3 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Storage Root</span>
        <button onClick={refreshFiles} className="text-gray-500 hover:text-cyan-400 transition-colors">
          <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>
      
      <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
        {!fileSystemService.isMounted() && files.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-[10px] text-gray-600">DRIVE_NOT_MOUNTED</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {files.map(node => (
              <div 
                key={node.path}
                onClick={() => handleFileClick(node)}
                className="group flex items-center justify-between px-2 py-1 hover:bg-white/5 rounded cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {node.kind === 'directory' ? (
                    <FolderIcon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  ) : (
                    <DocumentIcon className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                  )}
                  <span className="text-[11px] text-gray-300 truncate">{node.name}</span>
                </div>
                <span className="text-[9px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatSize(node.size)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
