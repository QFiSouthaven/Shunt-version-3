
// components/shunt/BulletinBoardPanel.tsx
import React from 'react';
import { ClipboardDocumentListIcon, XMarkIcon, MinusIcon, AmplifyIcon } from '../icons';
import FileUpload from '../common/FileUpload';

interface Document {
    name: string;
    content: string;
}
interface BulletinBoardPanelProps {
    documents: Document[];
    onUpdateDocuments: (documents: Document[]) => void;
    isMinimized?: boolean;
    onToggleMinimize?: () => void;
    isTransformerMode?: boolean;
}

const BulletinBoardPanel: React.FC<BulletinBoardPanelProps> = ({ documents, onUpdateDocuments, isMinimized, onToggleMinimize, isTransformerMode }) => {

    const handleFilesUploaded = (files: Array<{ filename: string; content: string; file: File }>) => {
        const newDocs = files.map(f => ({ name: f.filename, content: f.content }));
        onUpdateDocuments([...documents, ...newDocs]);
    };

    const removeDocument = (index: number) => {
        onUpdateDocuments(documents.filter((_, i) => i !== index));
    };

    const containerClass = isTransformerMode 
        ? "bg-slate-300 border-slate-400 text-slate-800 shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
        : "bg-gray-800/50 border-gray-700/50";
        
    const headerClass = isTransformerMode
        ? "border-slate-400 bg-slate-300/50"
        : "border-gray-700/50";
        
    const textClass = isTransformerMode ? "text-slate-800" : "text-gray-300";
    const subTextClass = isTransformerMode ? "text-slate-600" : "text-gray-400";
    const listItemClass = isTransformerMode ? "bg-slate-200" : "bg-gray-900/50";

    return (
        <div className={`${containerClass} rounded-lg border flex flex-col shadow-lg transition-colors duration-500`}>
            <header className={`p-3 border-b ${headerClass} flex justify-between items-center`}>
                <div className="flex items-center gap-2">
                    {onToggleMinimize && (
                      <button onClick={onToggleMinimize} title={isMinimized ? 'Expand' : 'Minimize'} className={`p-1 hover:opacity-75 ${subTextClass}`}>
                        {isMinimized ? <AmplifyIcon className="w-5 h-5"/> : <MinusIcon className="w-5 h-5"/>}
                      </button>
                    )}
                    <ClipboardDocumentListIcon className={`w-5 h-5 ${isTransformerMode ? 'text-slate-700' : 'text-cyan-400'}`} />
                    <h2 className={`font-semibold ${textClass}`}>Bulletin Board</h2>
                </div>
                {isTransformerMode && <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-slate-400 px-2 py-0.5 rounded">Transformer Mode</span>}
            </header>
            {!isMinimized && (
                <main className="p-3 flex flex-col gap-4">
                    <FileUpload
                        onFilesUploaded={handleFilesUploaded}
                        acceptedFileTypes={['.txt', '.md', '.json', '.js', '.py', '.html', '.css', '.ts']}
                        maxFileSizeMB={2}
                    />
                    {documents.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            <h3 className={`text-sm font-semibold ${subTextClass}`}>Attached Documents:</h3>
                            <ul className="space-y-1">
                                {documents.map((doc, index) => (
                                    <li key={index} className={`flex items-center justify-between ${listItemClass} p-2 rounded text-sm`}>
                                        <span className={`truncate ${textClass}`} title={doc.name}>{doc.name}</span>
                                        <button onClick={() => removeDocument(index)} className={`p-1 ${subTextClass} hover:text-red-500`}>
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </main>
            )}
        </div>
    );
};

export default BulletinBoardPanel;
