
// components/network/NetworkHub.tsx
import React, { useState, useRef, useEffect, useTransition } from 'react';
import { useWebSockets } from '../../hooks/useWebSockets';
import { 
    SignalIcon, BoltIcon, PlusIcon, TrashIcon, 
    GlobeAltIcon, ServerIcon, PaperAirplaneIcon, 
    ServerStackIcon, CloudArrowDownIcon, CpuChipIcon
} from '../icons';
import Loader from '../Loader';
import TabFooter from '../common/TabFooter';
import { appEventBus } from '../../lib/eventBus';
import { useSystem } from '../../context/SystemContext';
import { MissionControlTabKey } from '../../types';
import { audioService } from '../../services/audioService';
import { useMailbox } from '../../context/MailboxContext';

const CLOUDFLARE_PRESETS = [
    { label: 'Durable Object (Chat)', url: 'wss://[worker].[user].workers.dev/websocket', protocol: 'chat-v1' },
    { label: 'Standard Worker (WS)', url: 'wss://[worker].[user].workers.dev/ws', protocol: '' },
    { label: 'Local Dev (Wrangler)', url: 'ws://localhost:8787/ws', protocol: '' },
    { label: 'Cloudflare Tunnel (Local)', url: 'wss://tunnel.your-domain.com/ws', protocol: '' },
];

const NetworkHub: React.FC = () => {
    const { configs, activeId, setActiveId, connect, disconnect, sendMessage, addSocket, removeSocket, clearMessages } = useWebSockets();
    const { dispatch } = useSystem();
    const { deliverFiles } = useMailbox();
    const [isPending, startTransition] = useTransition();
    
    const [newUrl, setNewUrl] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [newProtocol, setNewProtocol] = useState('');
    const [payload, setPayload] = useState('');
    const [showPresets, setShowPresets] = useState(false);
    
    const activeSocket = configs.find(c => c.id === activeId);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [activeSocket?.messages]);

    const handleAdd = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (newUrl.startsWith('ws')) {
            addSocket(newLabel || 'Uplink Node', newUrl, newProtocol);
            setNewUrl('');
            setNewLabel('');
            setNewProtocol('');
        }
    };

    const applyPreset = (preset: typeof CLOUDFLARE_PRESETS[0]) => {
        setNewLabel(preset.label);
        setNewUrl(preset.url);
        setNewProtocol(preset.protocol);
        setShowPresets(false);
        audioService.playSound('click');
    };

    const handleSend = () => {
        if (activeId && payload.trim()) {
            sendMessage(activeId, payload);
            setPayload('');
        }
    };

    const handleExportLog = async () => {
        if (!activeSocket || activeSocket.messages.length === 0) return;
        
        const logContent = activeSocket.messages
            .map(m => `[${m.timestamp}] ${m.direction === 'out' ? '>>' : '<<'} ${m.data}`)
            .join('\n');
            
        await deliverFiles([{
            path: `uplink_log_${activeSocket.label.replace(/\s+/g, '_')}_${Date.now()}.txt`,
            content: logContent
        }]);
        
        audioService.playSound('success');
        alert("Log exported to Mailbox.");
    };

    const shuntToModule = (data: string, target: MissionControlTabKey) => {
        audioService.playSound('click');
        startTransition(() => {
            if (target === 'shunt') {
                appEventBus.emit('trigger_shunt_action', { action: 'Analyze', data });
            } else if (target === 'chat') {
                appEventBus.emit('inject_chat_message', data);
            }
            dispatch({ type: 'SET_ACTIVE_TAB', payload: target });
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'connected': return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
            case 'connecting': return 'bg-yellow-500 animate-pulse';
            case 'error': return 'bg-red-500';
            default: return 'bg-gray-600';
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#050505] text-gray-200 overflow-hidden font-mono">
            {isPending && <div className="fixed top-0 left-0 right-0 h-0.5 bg-cyan-500 animate-pulse z-50" />}
            
            <div className="flex-grow flex flex-col md:flex-row h-full overflow-hidden">
                
                {/* Sidebar: Sockets List */}
                <div className="w-full md:w-80 border-r border-gray-800 bg-[#0a0a0a] flex flex-col">
                    <div className="p-4 border-b border-gray-800 bg-gray-900/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <SignalIcon className="w-5 h-5 text-cyan-400" />
                            <h2 className="text-xs font-bold uppercase tracking-widest">Neural Uplinks</h2>
                        </div>
                        <button 
                            onClick={() => setShowPresets(!showPresets)}
                            className="text-[10px] text-gray-500 hover:text-cyan-400 flex items-center gap-1"
                        >
                            <ServerStackIcon className="w-3 h-3" /> Presets
                        </button>
                    </div>

                    {showPresets && (
                        <div className="p-2 border-b border-gray-800 bg-black/40 animate-fade-in">
                            <div className="text-[9px] text-gray-600 uppercase font-bold mb-2 px-2">Cloudflare Edge Presets</div>
                            <div className="space-y-1">
                                {CLOUDFLARE_PRESETS.map((p, i) => (
                                    <button key={i} onClick={() => applyPreset(p)} className="w-full text-left p-2 rounded hover:bg-white/5 text-[10px] text-gray-400 border border-transparent hover:border-gray-800 transition-all">
                                        <div className="font-bold text-gray-300">{p.label}</div>
                                        <div className="opacity-50 truncate">{p.url}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="p-4 border-b border-gray-800">
                        <form onSubmit={handleAdd} className="space-y-2">
                            <input 
                                value={newLabel}
                                onChange={e => setNewLabel(e.target.value)}
                                placeholder="Node Label (e.g. KV Store)"
                                className="w-full bg-black border border-gray-800 rounded p-2 text-[10px] focus:border-cyan-500 outline-none"
                            />
                            <input 
                                value={newUrl}
                                onChange={e => setNewUrl(e.target.value)}
                                placeholder="wss://endpoint.workers.dev"
                                className="w-full bg-black border border-gray-800 rounded p-2 text-[10px] focus:border-cyan-500 outline-none"
                            />
                            <input 
                                value={newProtocol}
                                onChange={e => setNewProtocol(e.target.value)}
                                placeholder="Sub-protocol (Optional)"
                                className="w-full bg-black border border-gray-800 rounded p-2 text-[10px] focus:border-cyan-500 outline-none"
                            />
                            <button type="submit" className="w-full py-2 bg-cyan-900/20 border border-cyan-500/50 text-cyan-400 text-[10px] font-bold uppercase rounded hover:bg-cyan-900/40 transition-all flex items-center justify-center gap-2">
                                <PlusIcon className="w-3 h-3" /> Initialize Link
                            </button>
                        </form>
                    </div>

                    <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {configs.map(socket => (
                            <div 
                                key={socket.id}
                                onClick={() => setActiveId(socket.id)}
                                className={`p-3 rounded border cursor-pointer transition-all group ${activeId === socket.id ? 'bg-cyan-900/10 border-cyan-500/50 shadow-inner' : 'bg-gray-900/30 border-gray-800 hover:border-gray-700'}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className={`w-2 h-2 rounded-full ${getStatusColor(socket.status)}`} />
                                        <span className="text-[11px] font-bold truncate">{socket.label}</span>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); removeSocket(socket.id); }} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">
                                        <TrashIcon className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="text-[9px] text-gray-500 truncate">{socket.url}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content: Terminal & Input */}
                <div className="flex-grow flex flex-col bg-[#0c0c0c] relative">
                    {activeSocket ? (
                        <>
                            {/* Terminal Header */}
                            <div className="p-3 border-b border-gray-800 bg-black/50 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white uppercase">{activeSocket.label}</span>
                                            {activeSocket.protocol && <span className="text-[8px] bg-gray-800 px-1 rounded text-cyan-400 font-bold uppercase tracking-tighter">{activeSocket.protocol}</span>}
                                        </div>
                                        <span className="text-[9px] text-gray-500">{activeSocket.url}</span>
                                    </div>
                                    <div className="h-4 w-px bg-gray-800" />
                                    {activeSocket.status === 'connected' ? (
                                        <button onClick={() => disconnect(activeSocket.id)} className="text-[9px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest border border-red-900/50 px-2 py-0.5 rounded">Disconnect</button>
                                    ) : (
                                        <button onClick={() => connect(activeSocket.id)} disabled={activeSocket.status === 'connecting'} className="text-[9px] font-bold text-green-400 hover:text-green-300 uppercase tracking-widest border border-green-900/50 px-2 py-0.5 rounded">
                                            {activeSocket.status === 'connecting' ? 'Linking...' : 'Connect'}
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-2 items-center">
                                    <button onClick={handleExportLog} title="Export Log to Mailbox" className="text-gray-500 hover:text-blue-400 transition-colors">
                                        <CloudArrowDownIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => clearMessages(activeSocket.id)} title="Clear Terminal" className="text-gray-500 hover:text-red-400 transition-colors">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                    <div className="h-4 w-px bg-gray-800 mx-1" />
                                    <div className="text-[9px] text-gray-600 font-mono">PKTS: {activeSocket.messages.length}</div>
                                    <GlobeAltIcon className="w-4 h-4 text-gray-700" />
                                </div>
                            </div>

                            {/* Messages Stream */}
                            <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto flex flex-col-reverse gap-2 custom-scrollbar bg-black/20">
                                {activeSocket.messages.map(msg => (
                                    <div key={msg.id} className={`flex flex-col gap-1 max-w-[90%] animate-fade-in group ${msg.direction === 'out' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                                        <div className="flex items-center gap-2 text-[9px] text-gray-600">
                                            <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                            <span className={msg.direction === 'out' ? 'text-blue-400' : 'text-fuchsia-400'}>{msg.direction === 'out' ? '>> UPLINK' : '<< DOWNLINK'}</span>
                                            {msg.direction === 'in' && (
                                                <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => shuntToModule(msg.data, 'shunt')} className="hover:text-cyan-400" title="Shunt to Processor">
                                                        <BoltIcon className="w-3 h-3" />
                                                    </button>
                                                    <button onClick={() => shuntToModule(msg.data, 'chat')} className="hover:text-fuchsia-400" title="Shunt to AI Chat">
                                                        <CpuChipIcon className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`p-3 rounded border font-mono text-[11px] break-all whitespace-pre-wrap relative ${msg.direction === 'out' ? 'bg-blue-900/10 border-blue-900/30 text-blue-200' : 'bg-gray-800/50 border-gray-700 text-gray-300'}`}>
                                            {msg.data}
                                        </div>
                                    </div>
                                ))}
                                {activeSocket.messages.length === 0 && (
                                    <div className="h-full flex items-center justify-center opacity-20 select-none">
                                        <div className="flex flex-col items-center gap-4">
                                            <SignalIcon className="w-20 h-20" />
                                            <p className="text-[10px] uppercase tracking-[0.4em]">Listening for edge traffic...</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Panel */}
                            <div className="p-4 border-t border-gray-800 bg-black/40">
                                <div className="relative group">
                                    <textarea 
                                        value={payload}
                                        onChange={e => setPayload(e.target.value)}
                                        placeholder="Enter JSON payload or command..."
                                        className="w-full h-24 bg-black/50 border border-gray-800 rounded-lg p-3 text-xs text-blue-300 placeholder-gray-700 outline-none focus:border-blue-500/50 transition-all resize-none shadow-inner"
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                    />
                                    <button 
                                        onClick={handleSend}
                                        disabled={activeSocket.status !== 'connected' || !payload.trim()}
                                        className="absolute bottom-3 right-3 p-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-30 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                                    >
                                        <PaperAirplaneIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="mt-2 flex gap-4 overflow-x-auto pb-1 custom-scrollbar">
                                    <button onClick={() => setPayload('{"type": "ping", "id": "' + Date.now() + '"}')} className="text-[9px] text-gray-500 hover:text-gray-300 underline shrink-0">Template: Ping</button>
                                    <button onClick={() => setPayload('{"action": "status", "params": {}}')} className="text-[9px] text-gray-500 hover:text-gray-300 underline shrink-0">Template: Status</button>
                                    <button onClick={() => setPayload('{"broadcast": "SYSTEM_UPDATE", "data": {}}')} className="text-[9px] text-gray-500 hover:text-gray-300 underline shrink-0">Template: Broadcast</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-800 select-none">
                            <ServerIcon className="w-24 h-24 mb-6 opacity-10" />
                            <p className="font-mono text-sm tracking-widest opacity-50 uppercase">Network Isolation Active</p>
                            <p className="text-[10px] opacity-30 mt-2">Initialize an Edge Link via presets or manual entry</p>
                        </div>
                    )}
                </div>
            </div>
            <TabFooter />
        </div>
    );
};

export default NetworkHub;
