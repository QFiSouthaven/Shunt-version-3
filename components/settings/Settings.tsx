
// components/settings/Settings.tsx
import React, { useState } from 'react';
import { useSettings, MasterIntelligenceProvider } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import TabFooter from '../common/TabFooter';
import ToggleSwitch from '../common/ToggleSwitch';
import { useMCPContext } from '../../context/MCPContext';
import { MCPConnectionStatus } from '../../types/mcp';
import { BoltIcon, ServerStackIcon, XMarkIcon, CpuChipIcon, GlobeAltIcon, SparklesIcon, UserIcon, LockIcon } from '../icons';
import Loader from '../Loader';
import { v4 as uuidv4 } from 'uuid';

const Settings: React.FC = () => {
    const { settings, updateSetting, addCustomPrompt, removeCustomPrompt } = useSettings();
    const { status, connect, disconnect } = useMCPContext();
    const { user, login, logout, isLoading: isAuthLoading } = useAuth();
    
    const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            updateSetting(name as keyof typeof settings, checked);
        } else {
            updateSetting(name as keyof typeof settings, value);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#050505]">
            <div className="p-4 md:p-6 space-y-6 flex-grow overflow-y-auto custom-scrollbar">
                <div className="max-w-2xl mx-auto space-y-6">
                    <h2 className="text-xl font-semibold text-white mb-6">System Control Center</h2>

                    {/* Master Intelligence Router */}
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6 shadow-xl">
                        <h3 className="font-semibold text-lg text-white mb-4 flex items-center gap-2">
                            <SparklesIcon className="w-6 h-6 text-fuchsia-400" />
                            Master Intelligence Provider
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            {(['gemini', 'local', 'cloudflare'] as MasterIntelligenceProvider[]).map(p => (
                                <button
                                    key={p}
                                    onClick={() => updateSetting('masterProvider', p)}
                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                        settings.masterProvider === p 
                                        ? 'bg-fuchsia-900/20 border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.3)]' 
                                        : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                                    }`}
                                >
                                    {p === 'gemini' && <BoltIcon className="w-6 h-6 text-cyan-400" />}
                                    {p === 'local' && <CpuChipIcon className="w-6 h-6 text-emerald-400" />}
                                    {p === 'cloudflare' && <GlobeAltIcon className="w-6 h-6 text-orange-400" />}
                                    <span className="text-xs font-bold uppercase tracking-wider">{p}</span>
                                </button>
                            ))}
                        </div>
                        <div className="mt-6 p-3 bg-blue-950/30 border border-blue-900/50 rounded-lg flex gap-3 items-start">
                            <LockIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-[10px] text-blue-300 leading-relaxed">
                                <strong>System Vault Active:</strong> Any sensitive keys (Cloudflare/Local) provided below are automatically XOR-encrypted before being committed to your browser's persistent storage. The Aether Kernel ensures tokens remain obfuscated during system idle.
                            </div>
                        </div>
                    </div>

                    {/* Cloudflare Workers AI Config */}
                    {settings.masterProvider === 'cloudflare' && (
                        <div className="bg-gray-800/50 border border-orange-500/30 rounded-lg p-6 animate-fade-in">
                            <h3 className="font-semibold text-lg text-orange-400 mb-4 flex items-center gap-2">
                                <GlobeAltIcon className="w-6 h-6" /> Cloudflare Workers AI
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Account ID</label>
                                    <input name="cfAccountId" value={settings.cfAccountId} onChange={handleSettingChange} className="w-full bg-black border border-gray-700 rounded p-2 text-white font-mono text-sm" placeholder="Paste Cloudflare Account ID..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">API Token</label>
                                    <input type="password" name="cfApiToken" value={settings.cfApiToken} onChange={handleSettingChange} className="w-full bg-black border border-gray-700 rounded p-2 text-white font-mono text-sm" placeholder="Workers AI enabled Token..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Model Map</label>
                                    <input name="cfModelId" value={settings.cfModelId} onChange={handleSettingChange} className="w-full bg-black border border-gray-700 rounded p-2 text-white font-mono text-sm" />
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Local LLM Settings */}
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6 shadow-xl">
                        <h3 className="font-semibold text-lg text-white mb-4 flex items-center gap-2">
                            <CpuChipIcon className="w-6 h-6 text-emerald-400" />
                            Local Intelligence Link
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Local Provider</label>
                                <select name="localLlmProvider" value={settings.localLlmProvider} onChange={handleSettingChange} className="w-full bg-black border border-gray-700 rounded p-2 text-white text-sm">
                                    <option value="lm-studio">LM Studio</option>
                                    <option value="ollama">Ollama</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Base Endpoint URL</label>
                                <input name="localLlmBaseUrl" value={settings.localLlmBaseUrl} onChange={handleSettingChange} className="w-full bg-black border border-gray-700 rounded p-2 text-white font-mono text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Default Model ID</label>
                                <input name="localLlmModelId" value={settings.localLlmModelId} onChange={handleSettingChange} className="w-full bg-black border border-gray-700 rounded p-2 text-white font-mono text-sm" />
                            </div>
                            <div className="pt-2">
                                <ToggleSwitch 
                                    id="force-local-toggle" 
                                    label="Bypass Cloud (Force Local for all shunts)" 
                                    checked={settings.forceLocalForAll} 
                                    onChange={(val) => updateSetting('forceLocalForAll', val)} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Identity & Account */}
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6 shadow-xl">
                        <h3 className="font-semibold text-lg text-white mb-4 flex items-center gap-2">
                            <UserIcon className="w-6 h-6 text-cyan-400" />
                            Operator Identity
                        </h3>
                        {user ? (
                            <div className="flex items-center justify-between bg-black/40 p-4 rounded-lg border border-gray-700">
                                <div className="flex items-center gap-3">
                                    <img src={user.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full" />
                                    <div>
                                        <div className="text-sm font-bold text-white">{user.name}</div>
                                        <div className="text-[10px] text-gray-500 uppercase">{user.role} // {user.provider}</div>
                                    </div>
                                </div>
                                <button onClick={logout} className="text-xs text-red-400 hover:text-red-300 font-bold uppercase">Terminate Session</button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-xs text-gray-500">Sign in to sync your encrypted vault and project memory across sessions.</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => login('github')} disabled={isAuthLoading} className="py-2 bg-gray-900 border border-gray-700 rounded text-xs font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                                        {isAuthLoading ? <Loader className="w-3 h-3"/> : null} GitHub Sync
                                    </button>
                                    <button onClick={() => login('google')} disabled={isAuthLoading} className="py-2 bg-gray-900 border border-gray-700 rounded text-xs font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                                        {isAuthLoading ? <Loader className="w-3 h-3"/> : null} Google Sync
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
            <TabFooter />
        </div>
    );
};

export default Settings;
