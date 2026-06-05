
import React, { useState } from 'react';
import { useMCPContext } from '../../context/MCPContext';
import { MCPConnectionStatus } from '../../types/mcp';
import { audioService } from '../../services/audioService';
import { DeviceFloppyIcon, CheckIcon, CopyIcon, CodeIcon } from '../icons';

interface ContentActionsProps {
    content: string;
    filename?: string;
    exclude?: ('download' | 'copy' | 'copyBlock')[];
    className?: string;
}

const ContentActions: React.FC<ContentActionsProps> = ({ 
    content, 
    filename = `export-${Date.now()}.md`, 
    exclude = [],
    className = '' 
}) => {
    const { status, extensionApi } = useMCPContext();
    const [copied, setCopied] = useState(false);
    const [blockCopied, setBlockCopied] = useState(false);

    const handleSave = async () => {
        if (!content) return;
        audioService.playSound('click');

        if (status === MCPConnectionStatus.Connected && extensionApi?.fs) {
            const path = prompt("Enter path to save (e.g. ./output.md):", `./${filename}`);
            if (path) {
                try {
                    await extensionApi.fs.saveFile(path, content);
                    audioService.playSound('success');
                    alert(`Successfully saved to ${path}`);
                } catch (e: any) {
                    audioService.playSound('error');
                    alert("Failed to save: " + e.message);
                }
            }
        } else {
            // Fallback download
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            audioService.playSound('success');
        }
    };

    const handleCopy = () => {
        if (!content) return;
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyAsBlock = () => {
        if (!content) return;
        // Basic detection to see if we should wrap in json or generic markdown
        const isJson = content.trim().startsWith('{') || content.trim().startsWith('[');
        const lang = isJson ? 'json' : '';
        const markdownContent = `\`\`\`${lang}\n${content}\n\`\`\``;
        
        navigator.clipboard.writeText(markdownContent);
        setBlockCopied(true);
        setTimeout(() => setBlockCopied(false), 2000);
    };

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {!exclude.includes('download') && (
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${status === MCPConnectionStatus.Connected ? 'text-green-400 hover:bg-green-900/30' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    title={status === MCPConnectionStatus.Connected ? "Save to Computer (MCP)" : "Download (Connect MCP for direct save)"}
                >
                    <DeviceFloppyIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">Save</span>
                </button>
            )}
            
            {!exclude.includes('download') && <div className="w-px h-3 bg-gray-600 mx-1"></div>}

            {!exclude.includes('copyBlock') && (
                <button
                    onClick={handleCopyAsBlock}
                    className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    title="Copy as Markdown Block"
                >
                    {blockCopied ? <CheckIcon className="w-3 h-3 text-green-400" /> : <CodeIcon className="w-3 h-3" />}
                </button>
            )}

            {!exclude.includes('copy') && (
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    title="Copy Raw Text"
                >
                    {copied ? <CheckIcon className="w-3 h-3 text-green-400" /> : <CopyIcon className="w-3 h-3" />}
                </button>
            )}
        </div>
    );
};

export default ContentActions;
