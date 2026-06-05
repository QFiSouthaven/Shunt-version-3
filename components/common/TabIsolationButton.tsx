
// components/common/TabIsolationButton.tsx
import React, { useState } from 'react';
import JSZip from 'jszip';
import { restructureForIsolation, gatherTabState } from '../../services/restructuringUtil';
import { performStateAudit } from '../../services/geminiService';
import { ServerStackIcon, CheckIcon, ShieldCheckIcon, BoltIcon, ErrorIcon } from '../icons';
import { audioService } from '../../services/audioService';
import Loader from '../Loader';

interface TabIsolationButtonProps {
    tabKey: string;
    className?: string;
}

export const TabIsolationButton: React.FC<TabIsolationButtonProps> = ({ tabKey, className }) => {
    const [status, setStatus] = useState<'idle' | 'gathering' | 'auditing' | 'packaging' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleExtraction = async () => {
        if (status !== 'idle') return;
        
        setStatus('gathering');
        setProgress(10);
        setErrorMessage(null);
        audioService.playSound('click');

        try {
            // 1. Gather Deep State (Discovery Engine)
            const { state, dependencies } = await gatherTabState(tabKey);
            setProgress(30);
            
            // 2. Normalize into SIO
            const isolatedState = restructureForIsolation(state, tabKey, dependencies);
            const stateJsonString = JSON.stringify(isolatedState, null, 2);
            setProgress(45);

            // 3. AI Structural Integrity Audit (Gemini 3 Pro)
            setStatus('auditing');
            audioService.playSound('notification');
            
            let auditReport: string;
            try {
                // Inform the user this might take a moment
                setProgress(60);
                auditReport = await performStateAudit(stateJsonString, tabKey);
            } catch (auditError: any) {
                console.warn("Audit Pipeline Interrupted:", auditError);
                auditReport = `# Audit Interrupted\n\nAutomated structural integrity audit failed for ${tabKey}.\nReason: ${auditError.message}\n\n**Proceed with caution.**`;
            }
            setProgress(80);

            // 4. Multi-Artifact Packaging (JSZip)
            setStatus('packaging');
            const zip = new JSZip();
            const filenameBase = `${tabKey}_snapshot_${new Date().toISOString().split('T')[0]}`;

            // Artifact A: The Hot-Swappable Payload
            zip.file(`manifest.json`, stateJsonString);
            
            // Artifact B: The Self-Healing Plan (AI Output)
            zip.file(`AUDIT_REPORT.md`, auditReport);
            
            // Artifact C: Deployment Readme
            zip.file(`README.txt`, 
                `AETHER SHUNT ISOLATION PACKAGE\n` +
                `=============================\n` +
                `Module: ${tabKey}\n` +
                `Timestamp: ${isolatedState.timestamp}\n` +
                `SIO Version: ${isolatedState.version}\n\n` +
                `USAGE: Use the 'Import State' function to infuse this manifest into a clean instance.\n` +
                `Refer to AUDIT_REPORT.md for structural health metrics and refactoring advice.`
            );

            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            
            // 5. Trigger System Egress
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filenameBase}.zip`;
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setStatus('success');
            setProgress(100);
            audioService.playSound('success');
            
            setTimeout(() => {
                setStatus('idle');
                setProgress(0);
            }, 4000);

        } catch (e: any) {
            console.error("Isolation Egress Failed:", e);
            audioService.playSound('error');
            setStatus('error');
            setErrorMessage(e.message || "Unknown Extraction Error");
            setTimeout(() => {
                setStatus('idle');
                setErrorMessage(null);
            }, 6000);
        }
    };

    const getIcon = () => {
        switch (status) {
            case 'gathering': return <Loader className="w-5 h-5 text-indigo-400" />;
            case 'auditing': return <ShieldCheckIcon className="w-5 h-5 text-fuchsia-400 animate-pulse" />;
            case 'packaging': return <BoltIcon className="w-5 h-5 text-yellow-400" />;
            case 'success': return <CheckIcon className="w-5 h-5 text-green-400" />;
            case 'error': return <ErrorIcon className="w-5 h-5 text-red-500" />;
            default: return <ServerStackIcon className="w-6 h-6" />;
        }
    };

    const getTooltip = () => {
        if (status === 'error') return `CRITICAL: ${errorMessage}`;
        switch (status) {
            case 'gathering': return "Gathering module state from IndexedDB...";
            case 'auditing': return "Analyzing state structure with Gemini 3 Pro...";
            case 'packaging': return "Compressing assets into ZIP package...";
            case 'success': return "Snapshot complete! Check your downloads.";
            default: return "Generate Module Snapshot (Isolation ZIP)";
        }
    };

    return (
        <div className="relative inline-flex items-center group">
            {status !== 'idle' && status !== 'error' && (
                <div className="absolute inset-0 rounded-full border border-fuchsia-500/30 animate-ping opacity-20"></div>
            )}
            <button
                onClick={handleExtraction}
                disabled={status !== 'idle'}
                className={`relative p-2 rounded-full transition-all duration-300 ${
                    status === 'success'
                    ? 'bg-green-900/30 text-green-400 border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                    : status === 'error'
                    ? 'bg-red-900/30 text-red-400 border border-red-500/50'
                    : status === 'auditing'
                    ? 'bg-fuchsia-900/30 text-fuchsia-300 border border-fuchsia-500/50'
                    : 'hover:bg-gray-700/50 text-indigo-400 hover:text-indigo-300'
                } ${className}`}
                title={getTooltip()}
            >
                {getIcon()}
            </button>

            {/* Stage Progress Ring */}
            {status !== 'idle' && status !== 'success' && status !== 'error' && (
                <svg className="absolute top-0 left-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 40 40">
                    <circle 
                        cx="20" cy="20" r="18" 
                        fill="none" strokeWidth="2" 
                        stroke="#1f2937" 
                        className="opacity-20"
                    />
                    <circle 
                        cx="20" cy="20" r="18" 
                        fill="none" strokeWidth="2" 
                        stroke={status === 'auditing' ? '#d946ef' : '#6366f1'}
                        strokeDasharray="113"
                        strokeDashoffset={113 - (113 * progress) / 100}
                        className="transition-all duration-500 ease-out"
                    />
                </svg>
            )}

            {/* Error Tooltip HUD */}
            {status === 'error' && errorMessage && (
                <div className="absolute top-full mt-3 right-0 w-64 p-3 bg-red-950/90 border border-red-500/50 text-[10px] text-red-200 rounded-md shadow-2xl z-[100] backdrop-blur-md animate-fade-in font-mono">
                    <div className="flex items-center gap-2 mb-1 text-red-400 font-bold">
                        <ErrorIcon className="w-3 h-3" /> SNAPSHOT_FAILED
                    </div>
                    {errorMessage}
                </div>
            )}
        </div>
    );
};
