
// components/dashboard/Dashboard.tsx
import React, { useState, useEffect, Suspense, use } from 'react';
import { useMCPContext } from '../../context/MCPContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useMailbox } from '../../context/MailboxContext';
import { MCPConnectionStatus } from '../../types/mcp';
import { 
    SparklesIcon, HistoryIcon, ChevronRightIcon, CpuChipIcon,
    BoltIcon, SignalIcon, ShieldCheckIcon, StarIcon, XMarkIcon, PlusIcon, CheckIcon,
    QueueListIcon, GlobeAltIcon
} from '../icons';
import { MissionControlTabKey, Todo } from '../../types';
import TabFooter from '../common/TabFooter';
import { dbService } from '../../services/db';
import { MODULE_REGISTRY } from '../mission_control/tabsConfig';
import { usePersistedState } from '../../hooks/usePersistedState';
import Loader from '../Loader';
import { SystemHealthWidget } from './SystemHealthWidget';

type WidgetType = 'token_usage' | 'cortex_health' | 'agent_status' | 'mailbox_preview' | 'host_info' | 'mission_status' | 'system_health' | 'network_latency';

// --- Resource Cache for use() API pattern ---
const hostInfoResourceCache = new Map<string, Promise<string>>();

function getHostInfoResource() {
    const key = 'host_info';
    let resource = hostInfoResourceCache.get(key);
    if (!resource) {
        resource = new Promise<string>((resolve) => {
            setTimeout(() => {
                const cores = navigator.hardwareConcurrency || 'UNKNOWN';
                const platform = navigator.platform.toUpperCase();
                resolve(`HOST: ${platform} // CORES: ${cores}`);
            }, 1500);
        });
        hostInfoResourceCache.set(key, resource);
    }
    return resource;
}

const HostInfoWidget = () => {
    const info = use(getHostInfoResource());
    return (
        <>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                <CpuChipIcon className="w-3 h-3 text-emerald-400" /> SYSTEM_CORE
            </div>
            <div className="text-sm font-bold text-white tracking-tight mt-1 truncate">{info}</div>
            <div className="text-[10px] text-gray-600 font-mono uppercase">Thread_Pool: Optimal</div>
        </>
    );
};

const Dashboard: React.FC<{ onNavigate: (tab: MissionControlTabKey) => void }> = ({ onNavigate }) => {
    const { status: mcpStatus } = useMCPContext();
    const { tier } = useSubscription();
    const { unreadCount, files } = useMailbox();
    
    const [greeting, setGreeting] = useState('');
    const [quickShuntText, setQuickShuntText] = useState('');
    const [todoStats, setTodoStats] = useState({ total: 0, pending: 0 });
    
    const [activeWidgets, setActiveWidgets] = usePersistedState<WidgetType[]>('dashboard_active_widgets', ['token_usage', 'mission_status', 'system_health', 'host_info']);
    const [isWidgetMenuOpen, setIsWidgetMenuOpen] = useState(false);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 18) setGreeting('Good afternoon');
        else setGreeting('Good evening');

        // Fetch Todo Stats
        dbService.getAll<Todo>(dbService.STORES.TODOS).then(todos => {
            setTodoStats({
                total: todos.length,
                pending: todos.filter(t => !t.completed).length
            });
        });
    }, []);

    const handleQuickShunt = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (quickShuntText.trim()) {
            await dbService.set(dbService.STORES.KEY_VALUE, 'shunt_inputText', quickShuntText);
            onNavigate('shunt');
        }
    };

    const toggleWidget = (type: WidgetType) => {
        setActiveWidgets(prev => 
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    return (
        <div className="flex flex-col h-full bg-[#050505] text-gray-200 overflow-hidden relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[500px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="flex-grow p-8 md:p-12 overflow-y-auto relative z-10 custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-10">
                    
                    <header className="space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <h1 className="text-4xl font-light text-white tracking-tight">
                                    {greeting}, <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">Creator.</span>
                                </h1>
                                <p className="text-gray-500 text-lg">System nominal. What are we building today?</p>
                            </div>
                            
                            <div className="relative">
                                <button 
                                    onClick={() => setIsWidgetMenuOpen(!isWidgetMenuOpen)}
                                    className="p-2 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-600 transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                                >
                                    <PlusIcon className="w-4 h-4" /> Widgets
                                </button>
                                {isWidgetMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 p-2 animate-fade-in">
                                        {(['token_usage', 'cortex_health', 'agent_status', 'mailbox_preview', 'host_info', 'mission_status', 'system_health', 'network_latency'] as WidgetType[]).map(w => (
                                            <button 
                                                key={w}
                                                onClick={() => toggleWidget(w)}
                                                className={`w-full text-left px-3 py-2 rounded-md text-[10px] font-bold uppercase transition-colors flex justify-between items-center ${activeWidgets.includes(w) ? 'bg-indigo-900/20 text-indigo-300' : 'text-gray-500 hover:bg-gray-800'}`}
                                            >
                                                {w.replace('_', ' ')}
                                                {activeWidgets.includes(w) && <CheckIcon className="w-3 h-3" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleQuickShunt} className="relative group max-w-2xl">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-lg rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative bg-[#121214] border border-[#ffffff1a] rounded-xl flex items-center p-2 shadow-2xl focus-within:border-cyan-500/50 transition-colors">
                                <div className="p-3 text-cyan-400">
                                    <SparklesIcon className="w-6 h-6" />
                                </div>
                                <input 
                                    type="text"
                                    value={quickShuntText}
                                    onChange={(e) => setQuickShuntText(e.target.value)}
                                    placeholder="Draft a prompt, summarize text, or start a task..."
                                    className="flex-grow bg-transparent border-none outline-none text-white placeholder-gray-600 text-lg h-10 px-2"
                                />
                                <button 
                                    type="submit"
                                    disabled={!quickShuntText.trim()}
                                    className="px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Shunt
                                </button>
                            </div>
                        </form>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {activeWidgets.map(w => (
                                <div key={w} className="bg-[#121214] border border-[#ffffff0d] p-4 rounded-xl flex flex-col gap-2 relative group overflow-hidden h-28 justify-center">
                                    <button 
                                        onClick={() => toggleWidget(w)}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all z-20"
                                    >
                                        <XMarkIcon className="w-3 h-3" />
                                    </button>
                                    <Suspense fallback={<div className="flex items-center gap-2 text-xs text-gray-500"><Loader className="w-3 h-3"/> Initializing...</div>}>
                                        <WidgetRenderer type={w} onNavigate={onNavigate} todoStats={todoStats} />
                                    </Suspense>
                                </div>
                            ))}
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <section>
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Core Workspaces</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {MODULE_REGISTRY.filter(m => ['shunt', 'weaver', 'chat', 'foundry'].includes(m.key)).map(app => (
                                        <button
                                            key={app.key}
                                            onClick={() => onNavigate(app.key)}
                                            className="group relative bg-[#121214] border border-[#ffffff0d] p-5 rounded-2xl hover:bg-[#1a1a1d] hover:border-[#ffffff1a] transition-all text-left flex flex-col justify-between h-32 overflow-hidden"
                                        >
                                            <div className="relative z-10 flex justify-between items-start">
                                                <div className={`p-2 rounded-lg bg-opacity-10 ${app.colorTheme?.replace('text-', 'bg-') || 'bg-gray-800'}`}>
                                                    {React.cloneElement(app.icon as React.ReactElement<any>, { className: `w-6 h-6 ${app.colorTheme}` })}
                                                </div>
                                                <ChevronRightIcon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                                            </div>
                                            <div className="relative z-10">
                                                <h3 className="font-semibold text-gray-200">{app.label}</h3>
                                                <p className="text-xs text-gray-500 line-clamp-1">{app.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <aside className="lg:col-span-1">
                            <div className="bg-[#121214] border border-[#ffffff0d] rounded-2xl p-6 h-full flex flex-col">
                                <div className="flex items-center gap-2 mb-6">
                                    <HistoryIcon className="w-5 h-5 text-gray-400" />
                                    <h2 className="font-semibold text-gray-300">Recent Files</h2>
                                </div>
                                {files.length > 0 ? (
                                    <ul className="space-y-4 flex-grow">
                                        {files.slice(0, 5).map(file => (
                                            <li key={file.id} className="group cursor-pointer" onClick={() => onNavigate('weaver')}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-sm font-medium text-gray-300 group-hover:text-cyan-400 transition-colors truncate w-3/4">
                                                        {file.path.split('/').pop()}
                                                    </span>
                                                    {!file.isRead && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5" />}
                                                </div>
                                                <div className="text-[10px] text-gray-500 font-mono">
                                                    {new Date(file.timestamp).toLocaleDateString()}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="flex-grow flex items-center justify-center text-gray-600 text-sm">No activity.</div>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
            <TabFooter />
        </div>
    );
};

const WidgetRenderer = ({ type, onNavigate, todoStats }: { type: WidgetType, onNavigate: any, todoStats: { total: number, pending: number } }) => {
    const { unreadCount } = useMailbox();
    const { status } = useMCPContext();

    switch (type) {
        case 'token_usage':
            return (
                <>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                        <BoltIcon className="w-3 h-3 text-cyan-400" /> SESSION_LOAD
                    </div>
                    <div className="text-xl font-bold text-white tracking-tight">1.2k <span className="text-[10px] text-gray-600 uppercase">Tokens</span></div>
                    <div className="w-full bg-gray-800 h-1 rounded-full mt-1 overflow-hidden">
                        <div className="bg-cyan-500 h-full w-[45%]" />
                    </div>
                </>
            );
        case 'mission_status':
            return (
                <button onClick={() => onNavigate('todo')} className="text-left w-full h-full flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                        <QueueListIcon className="w-3 h-3 text-cyan-400" /> MISSIONS
                    </div>
                    <div className="text-xl font-bold text-white tracking-tight">{todoStats.pending} <span className="text-[10px] text-gray-600 uppercase">Active</span></div>
                    <div className="text-[10px] text-gray-500 uppercase">Total: {todoStats.total} // {todoStats.total - todoStats.pending} DONE</div>
                </button>
            );
        case 'cortex_health':
            return (
                <>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                        <SignalIcon className="w-3 h-3 text-fuchsia-500" /> CORTEX_LINK
                    </div>
                    <div className="text-xl font-bold text-white tracking-tight">STABLE</div>
                    <div className="text-[10px] text-emerald-500 font-bold tracking-widest animate-pulse uppercase">Optimal Flow</div>
                </>
            );
        case 'mailbox_preview':
            return (
                <button onClick={() => onNavigate('weaver')} className="text-left w-full h-full flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                        <StarIcon className="w-3 h-3 text-yellow-500" /> MAILBOX
                    </div>
                    <div className="text-xl font-bold text-white tracking-tight">{unreadCount} <span className="text-[10px] text-gray-600 uppercase">New Files</span></div>
                    <div className="text-[10px] text-gray-500 underline uppercase tracking-tighter">View All &rarr;</div>
                </button>
            );
        case 'agent_status':
            return (
                <>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                        <ShieldCheckIcon className="w-3 h-3 text-emerald-500" /> MCP_STATUS
                    </div>
                    <div className={`text-xl font-bold tracking-tight ${status === MCPConnectionStatus.Connected ? 'text-emerald-400' : 'text-red-400'}`}>
                        {status === MCPConnectionStatus.Connected ? 'LINKED' : 'OFFLINE'}
                    </div>
                    <div className="text-[10px] text-gray-600 font-mono uppercase">Host Bridge V1.0</div>
                </>
            );
        case 'system_health':
            return <SystemHealthWidget />;
        case 'network_latency':
            return (
                <>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                        <GlobeAltIcon className="w-3 h-3 text-orange-400" /> EDGE_LATENCY
                    </div>
                    <div className="text-xl font-bold text-white tracking-tight">14ms</div>
                    <div className="text-[10px] text-gray-600 uppercase tracking-tighter">Region: US-East-1</div>
                </>
            );
        case 'host_info':
            return <HostInfoWidget />;
    }
};

export default Dashboard;
