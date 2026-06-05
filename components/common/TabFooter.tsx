
// components/common/TabFooter.tsx
import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheckIcon, CpuChipIcon, BoltIcon, GlobeAltIcon } from '../icons';

const TabFooter: React.FC = () => {
    const { globalContext } = useTelemetry();
    const { settings } = useSettings();
    const { user } = useAuth();
    
    const { appVersion, sessionID } = globalContext;
    const { masterProvider } = settings;

    return (
        <footer className="flex-shrink-0 px-4 py-2 border-t border-gray-700/50 bg-[#0a0a0c] text-xs text-gray-500">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <span className="truncate flex items-center gap-2">
                        {user ? (
                            <><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="text-gray-300">{user.name}</span></>
                        ) : (
                            <><div className="w-1.5 h-1.5 rounded-full bg-gray-600" /><span>Guest</span></>
                        )}
                    </span>
                    <div className="h-3 w-px bg-gray-800" />
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-gray-600">Core:</span>
                        {masterProvider === 'gemini' && <BoltIcon className="w-3 h-3 text-cyan-500" />}
                        {masterProvider === 'local' && <CpuChipIcon className="w-3 h-3 text-emerald-500" />}
                        {masterProvider === 'cloudflare' && <GlobeAltIcon className="w-3 h-3 text-orange-500" />}
                        <span className="text-gray-300 font-mono uppercase text-[10px]">{masterProvider}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="truncate hidden md:inline font-mono text-[10px]">v{appVersion}</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-900/10 border border-green-500/20 text-green-500">
                        <ShieldCheckIcon className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase tracking-tighter">Secure</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default TabFooter;
