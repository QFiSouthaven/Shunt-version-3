
import React, { useState, useEffect, useRef } from 'react';
import { 
    BoltIcon, BrainIcon, BranchingIcon, ChevronRightIcon, 
    ServerStackIcon, ShieldCheckIcon, CpuChipIcon, GlobeAltIcon,
    LockIcon, UserIcon, CheckIcon, ViewfinderCircleIcon, SparklesIcon, WrenchIcon
} from './icons';
import { audioService } from '../services/audioService';
import { performSystemSelfOptimization } from '../services/geminiService';
import { getSystemHolisticContext } from '../services/systemContextService';
import { useMailbox } from '../context/MailboxContext';
import Loader from './Loader';
import { TokenOptimizationButton } from './TokenOptimizationButton';
import { SecurityAuditModule } from './SecurityAuditModule';

interface LandingPageProps {
    onLaunch: () => void;
}

const BOOT_LOGS = [
    "KERNEL_INIT: LOADING AETHER_CORE_V3...",
    "MOUNTING: /dev/neural_shunt [RW]",
    "NET: ESTABLISHING SECURE SOCKET LAYER...",
    "AUTH: BIOMETRIC HANDSHAKE REQUIRED...",
    "MODULES: WEAVER [OK], FOUNDRY [OK], MIA [OK]",
    "SYSTEM: BACKEND GATEWAY READY."
];

const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
    const [phase, setPhase] = useState<'boot' | 'access' | 'launching'>('boot');
    const [bootLines, setBootLines] = useState<string[]>([]);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizationStatus, setOptimizationStatus] = useState<string | null>(null);
    
    const { deliverFiles } = useMailbox();

    // Hold-to-Unlock State
    const [holdProgress, setHoldProgress] = useState(0);
    const holdIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isHolding, setIsHolding] = useState(false);
    
    // Boot Sequence Effect
    useEffect(() => {
        let delay = 0;
        const timeouts: ReturnType<typeof setTimeout>[] = [];

        BOOT_LOGS.forEach((line, index) => {
            delay += Math.random() * 150 + 50; // Faster boot for elite feel
            const timeout = setTimeout(() => {
                setBootLines(prev => [...prev, line]);
                audioService.playSound('click');
                
                if (index === BOOT_LOGS.length - 1) {
                    setTimeout(() => setPhase('access'), 500);
                }
            }, delay);
            timeouts.push(timeout);
        });

        return () => timeouts.forEach(clearTimeout);
    }, []);

    // Hold Interaction Logic
    const startHold = () => {
        if (phase !== 'access' || isOptimizing) return;
        setIsHolding(true);
        audioService.playSound('click'); // Initial click
        
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        
        holdIntervalRef.current = setInterval(() => {
            setHoldProgress(prev => {
                if (prev >= 100) {
                    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
                    handleUnlock();
                    return 100;
                }
                return prev + 2.5; // Fill speed (approx 800ms to fill)
            });
        }, 20); // Smooth update rate
    };

    const stopHold = () => {
        if (holdProgress < 100) {
            setIsHolding(false);
            if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
            setHoldProgress(0); // Reset progress if released early (Friction as Feature)
        }
    };

    const handleUnlock = () => {
        audioService.playSound('success');
        setPhase('launching');
        setTimeout(() => {
            onLaunch();
        }, 1200);
    };

    const handleRefactorAudit = async () => {
        if (isOptimizing) return;
        setIsOptimizing(true);
        setOptimizationStatus("INITIATING HOLISTIC AUDIT...");
        audioService.playSound('send');

        try {
            setOptimizationStatus("TRAVERSING ONTOLOGY...");
            const context = await getSystemHolisticContext();
            
            setOptimizationStatus("SYNTHESIZING GOD-MODE REFACTOR...");
            const { resultText } = await performSystemSelfOptimization(context);
            
            setOptimizationStatus("DELIVERING MANIFEST TO MAILBOX...");
            await deliverFiles([{
                path: `SYSTEM_OPTIMIZATION_REPORT_${Date.now()}.md`,
                content: resultText
            }]);
            
            audioService.playSound('success');
            setOptimizationStatus("OPTIMIZATION COMPLETE.");
            setTimeout(() => {
                setIsOptimizing(false);
                setOptimizationStatus(null);
            }, 2000);
        } catch (e) {
            console.error(e);
            audioService.playSound('error');
            setOptimizationStatus("AUDIT INTERRUPTED. RETRYING...");
            setTimeout(() => setIsOptimizing(false), 2000);
        }
    };

    // Calculate SVG Circle props
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (holdProgress / 100) * circumference;

    if (phase === 'boot') {
        return (
            <div className="w-full h-screen bg-[#050505] text-green-500 font-mono text-xs p-8 flex flex-col justify-end">
                <div className="max-w-2xl space-y-1">
                    {bootLines.map((line, i) => (
                        <div key={i} className="flex gap-4 opacity-80 animate-fade-in">
                            <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span>
                            <span className="typing-effect">{line}</span>
                        </div>
                    ))}
                    <div className="animate-pulse bg-green-500 w-2 h-4 inline-block ml-1"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative w-full h-screen bg-[#030304] text-gray-200 overflow-hidden flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${phase === 'launching' ? 'scale-[1.5] opacity-0 blur-sm' : 'scale-100 opacity-100'}`}>
            
            {/* Background Grid & Scanlines */}
            <div className="absolute inset-0 pointer-events-none select-none">
                <div className="absolute inset-0 opacity-[0.03]" 
                     style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
                />
                <div className="scanline"></div>
                
                {/* Decorative Ambient Orbs */}
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-cyan-900/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-fuchsia-900/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s'}} />
            </div>

            {/* Main HUD Container */}
            <div className="relative z-10 w-full max-w-6xl h-[80vh] grid grid-cols-1 md:grid-cols-12 gap-8 p-6 items-center">
                
                {/* Left Panel: Backend Diagnostics */}
                <div className="hidden md:flex col-span-3 flex-col justify-between h-3/4 animate-fade-in border-r border-gray-800/50 pr-8">
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 text-cyan-400">
                            <ServerStackIcon className="w-5 h-5" />
                            <span className="font-mono text-xs tracking-widest font-bold">BACKEND::GATEWAY</span>
                        </div>
                        
                        <div className="space-y-4">
                            <StatBlock label="NEURAL LOAD" value="12%" color="bg-cyan-500" />
                            <StatBlock label="MEMORY HEAP" value="4.2 TB" color="bg-fuchsia-500" />
                            <StatBlock label="LATENCY" value="14ms" color="bg-green-500" />
                        </div>

                        {/* System Actions Grid */}
                        <div className="pt-8 border-t border-gray-800/50 flex flex-col gap-4">
                            <button
                                onClick={handleRefactorAudit}
                                disabled={isOptimizing}
                                className={`w-full group p-3 rounded-lg border flex flex-col gap-2 transition-all duration-300 relative overflow-hidden
                                    ${isOptimizing 
                                        ? 'bg-amber-900/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                                        : 'bg-indigo-900/10 border-indigo-500/30 hover:bg-indigo-900/20 hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]'}`}
                            >
                                <div className="flex items-center gap-2">
                                    {isOptimizing ? <Loader className="w-4 h-4 text-amber-400" /> : <WrenchIcon className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />}
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isOptimizing ? 'text-amber-400 animate-pulse' : 'text-indigo-400 group-hover:text-indigo-300'}`}>
                                        {isOptimizing ? 'Optimizing...' : 'Self-Optimize System'}
                                    </span>
                                </div>
                                <p className="text-[9px] text-gray-500 leading-tight text-left">
                                    Triggers a zero-cost heuristic audit for logic and performance bottlenecks.
                                </p>
                                {optimizationStatus && (
                                    <div className="mt-1 font-mono text-[8px] text-amber-500/80 animate-pulse">
                                        &gt; {optimizationStatus}
                                    </div>
                                )}
                            </button>

                            <TokenOptimizationButton />
                            <SecurityAuditModule />
                        </div>
                    </div>
                    
                    <div className="space-y-2 font-mono text-[10px] text-gray-600">
                        <div className="uppercase tracking-widest">Secure Connection</div>
                        <div className="text-gray-500">
                            ID: 8X-9942-ALPHA<br/>
                            ENCRYPTION: AES-256-GCM
                        </div>
                    </div>
                </div>

                {/* Center Panel: Interaction Core */}
                <div className="col-span-12 md:col-span-6 flex flex-col items-center justify-center relative">
                    {/* Concentric Rings Decoration */}
                    <div className="absolute w-[500px] h-[500px] border border-cyan-500/5 rounded-full animate-[spin_20s_linear_infinite]"></div>
                    <div className="absolute w-[400px] h-[400px] border border-fuchsia-500/5 rounded-full animate-[spin_25s_linear_infinite_reverse]"></div>
                    
                    <div className="text-center space-y-10 relative z-20">
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 tracking-tighter">
                                AETHER<span className="text-cyan-500">.OS</span>
                            </h1>
                            <p className="text-xs font-mono text-cyan-400/60 tracking-[0.3em] uppercase">Cognitive Backend Interface</p>
                        </div>

                        {/* Hold-to-Connect Interaction Node */}
                        <div className="relative group flex flex-col items-center justify-center">
                            <button 
                                onMouseDown={startHold}
                                onMouseUp={stopHold}
                                onMouseLeave={stopHold}
                                onTouchStart={startHold}
                                onTouchEnd={stopHold}
                                disabled={isOptimizing}
                                className={`relative w-32 h-32 rounded-full flex items-center justify-center bg-gray-900/50 backdrop-blur-md border border-gray-700/50 shadow-2xl transition-transform active:scale-95 outline-none cursor-pointer select-none
                                    ${isOptimizing ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                style={{ boxShadow: `0 0 ${holdProgress * 0.5}px rgba(6,182,212, ${holdProgress/200})` }}
                            >
                                {/* Progress Ring SVG */}
                                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                                    <circle 
                                        cx="50%" cy="50%" r={radius} 
                                        stroke="#1f2937" strokeWidth="2" fill="transparent" 
                                    />
                                    <circle 
                                        cx="50%" cy="50%" r={radius} 
                                        stroke="#22d3ee" strokeWidth="4" fill="transparent"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        className="transition-all duration-75 ease-linear"
                                        style={{ filter: 'drop-shadow(0 0 4px rgba(34,211,238,0.5))' }}
                                    />
                                </svg>

                                {/* Center Icon */}
                                <div className={`relative z-10 transition-colors duration-300 ${holdProgress >= 100 ? 'text-green-400' : isHolding ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                    {holdProgress >= 100 ? (
                                        <CheckIcon className="w-10 h-10 animate-bounce" />
                                    ) : (
                                        <div className="relative">
                                            <ViewfinderCircleIcon className={`w-12 h-12 ${isHolding ? 'animate-pulse' : ''}`} />
                                            {!isHolding && <LockIcon className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50" />}
                                        </div>
                                    )}
                                </div>
                            </button>
                            
                            <div className="mt-6 h-4 flex items-center justify-center">
                                <p className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${isHolding ? 'text-cyan-400 animate-pulse' : 'text-gray-600'}`}>
                                    {holdProgress >= 100 ? 'ACCESS GRANTED' : isHolding ? 'ESTABLISHING UPLINK...' : 'HOLD TO CONNECT'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Modules */}
                <div className="hidden md:flex col-span-3 flex-col justify-center h-3/4 gap-4 border-l border-gray-800/50 pl-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-2 font-bold">Active Modules</div>
                    <ModuleCard 
                        icon={<BoltIcon className="w-4 h-4 text-cyan-400" />}
                        label="SHUNT ENGINE"
                        status="ONLINE"
                    />
                    <ModuleCard 
                        icon={<BrainIcon className="w-4 h-4 text-fuchsia-400" />}
                        label="WEAVER PROTOCOL"
                        status="STANDBY"
                    />
                    <ModuleCard 
                        icon={<BranchingIcon className="w-4 h-4 text-purple-400" />}
                        label="FOUNDRY SWARM"
                        status="READY"
                    />
                </div>

            </div>

            {/* Footer */}
            <div className="absolute bottom-0 w-full p-6 border-t border-gray-900/50 bg-[#050505] text-center">
                <p className="text-[10px] text-gray-700 font-mono">
                    AETHER OPERATING SYSTEM v3.0 | <span className="text-gray-600">UNAUTHORIZED ACCESS PROHIBITED</span>
                </p>
            </div>
        </div>
    );
};

// --- Sub-components for UXI ---

const StatBlock = ({ label, value, color }: { label: string, value: string, color: string }) => (
    <div className="group cursor-default">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-mono group-hover:text-gray-300 transition-colors">
            <span>{label}</span>
            <span className="text-gray-400 group-hover:text-white">{value}</span>
        </div>
        <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
            <div className={`h-full ${color} w-3/4 group-hover:animate-pulse`} />
        </div>
    </div>
);

const ModuleCard = ({ icon, label, status }: { icon: React.ReactNode, label: string, status: string }) => (
    <div className="p-4 bg-gray-900/30 border border-gray-800 rounded flex items-center justify-between group hover:border-gray-600 hover:bg-gray-800/50 transition-all cursor-default">
        <div className="flex items-center gap-3">
            <div className="p-1.5 bg-black rounded border border-gray-800 group-hover:border-white/20 transition-colors shadow-lg">
                {icon}
            </div>
            <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors tracking-wide">{label}</span>
        </div>
        <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'ONLINE' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`}></div>
            <span className={`text-[9px] font-mono ${status === 'ONLINE' ? 'text-green-500' : 'text-gray-600'}`}>
                {status}
            </span>
        </div>
    </div>
);

export default LandingPage;
