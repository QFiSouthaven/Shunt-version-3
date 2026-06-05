// components/image_analysis/ImageAnalysis.tsx
import React, { useState, useCallback } from 'react';
import { requestIntelligence } from '../../services/IntelligenceRouter';
import FileUpload from '../common/FileUpload';
import Loader from '../Loader';
import { PhotoIcon, SparklesIcon, XMarkIcon } from '../icons';
import MarkdownRenderer from '../common/MarkdownRenderer';
import { audioService } from '../../services/audioService';
import { parseApiError } from '../../utils/errorLogger';
import { useMailbox } from '../../context/MailboxContext';
import ContentActions from '../common/ContentActions';
import { useAsyncState } from '../../hooks/useAsyncState';
import { dbService } from '../../services/db';
// Added TabFooter import to fix reference error
import TabFooter from '../common/TabFooter';

const ImageAnalysis: React.FC = () => {
    const [prompt, setPrompt] = useAsyncState<string>('imageAnalysis_prompt', 'Describe this image in detail.', dbService.STORES.KEY_VALUE);
    const [result, setResult] = useAsyncState<string | null>('imageAnalysis_result', null, dbService.STORES.KEY_VALUE);
    const [imageMeta, setImageMeta] = useAsyncState<{ name: string; type: string } | null>('imageAnalysis_imageMeta', null, dbService.STORES.KEY_VALUE);
    const [imageBase64, setImageBase64] = useAsyncState<string | null>('imageAnalysis_imageBase64', null, dbService.STORES.FILES);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { deliverFiles } = useMailbox();

    const handleFileUploaded = useCallback((files: any[]) => {
        if (files.length > 0) {
            const fileData = files[0];
            setImageMeta({ name: fileData.filename, type: fileData.mimeType });
            setImageBase64(fileData.content); // FileUpload already base64 encodes images
            audioService.playSound('success');
        }
    }, [setImageMeta, setImageBase64]);

    const handleAnalysis = useCallback(async () => {
        if (!prompt.trim() || !imageBase64 || !imageMeta || isLoading) return;

        setIsLoading(true);
        setError(null);
        setResult(null);
        audioService.playSound('send');

        try {
            const { resultText } = await requestIntelligence({
                prompt,
                image: {
                    base64Data: imageBase64,
                    mimeType: imageMeta.type,
                }
            });
            
            setResult(resultText);
            audioService.playSound('receive');
            await deliverFiles([{ path: `vision-analysis-${Date.now()}.md`, content: resultText }]);
        } catch (e) {
            setError(parseApiError(e));
            audioService.playSound('error');
        } finally {
            setIsLoading(false);
        }
    }, [prompt, imageBase64, imageMeta, isLoading, deliverFiles, setResult]);

    const handleClear = () => {
        setImageMeta(null);
        setImageBase64(null);
        setResult(null);
        audioService.playSound('click');
    }

    return (
        <div className="flex flex-col h-full bg-[#050505]">
            <div className="flex-grow p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-auto">
                <div className="flex flex-col gap-6">
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <PhotoIcon className="w-6 h-6 text-pink-400" /> Neural Vision Input
                        </h3>
                        {imageBase64 ? (
                            <div className="relative group bg-black/40 rounded-lg p-2 border border-gray-700">
                                <img src={`data:${imageMeta?.type};base64,${imageBase64}`} alt="preview" className="rounded-md w-full max-h-[400px] object-contain" />
                                <button onClick={handleClear} className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"><XMarkIcon className="w-5 h-5"/></button>
                            </div>
                        ) : (
                            <FileUpload onFilesUploaded={handleFileUploaded} acceptedFileTypes={['image/*']} maxFileSizeMB={5} enableDirectoryUpload={false} />
                        )}
                    </div>
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 flex-grow flex flex-col">
                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Inquiry Directive</h3>
                        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Analyze target..." className="w-full flex-grow bg-black/40 rounded-md border border-gray-700 p-3 text-gray-300 resize-none focus:border-pink-500 outline-none" />
                        <button onClick={handleAnalysis} disabled={isLoading || !imageBase64} className="w-full mt-4 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-md transition-all flex items-center justify-center gap-2 disabled:opacity-30">
                            {isLoading ? <Loader /> : <SparklesIcon className="w-5 h-5" />}
                            {isLoading ? 'ANALYZING...' : 'INITIATE SCAN'}
                        </button>
                    </div>
                </div>
                <div className="bg-black/40 border border-gray-800 rounded-lg flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 font-mono">
                        <span className="text-xs text-gray-500 uppercase tracking-widest">Vision Log</span>
                        {result && <ContentActions content={result} filename="analysis.md" />}
                    </div>
                    <div className="p-6 flex-grow overflow-y-auto">
                        {error && <div className="text-red-400 text-sm border border-red-900/50 p-4 rounded bg-red-900/10">{error}</div>}
                        {result ? <MarkdownRenderer content={result} /> : !isLoading && <p className="text-gray-600 italic">No analysis data available.</p>}
                        {isLoading && <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500 animate-pulse"><Loader className="w-10 h-10" /><p className="font-mono text-xs">DECRYPTING_VISUAL_SIGNAL...</p></div>}
                    </div>
                </div>
            </div>
            <TabFooter />
        </div>
    );
};

export default ImageAnalysis;