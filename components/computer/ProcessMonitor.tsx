
// components/computer/ProcessMonitor.tsx
import React, { useState, useEffect } from 'react';
import { CpuChipIcon, BoltIcon } from '../icons';

export const ProcessMonitor: React.FC = () => {
  const [cpu, setCpu] = useState(12);
  const [ram, setRam] = useState(45);
  const [net, setNet] = useState(2);
  const [history, setHistory] = useState<number[]>(new Array(20).fill(0));

  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(prev => Math.min(99, Math.max(5, prev + (Math.random() * 10 - 5))));
      setRam(prev => Math.min(80, Math.max(40, prev + (Math.random() * 2 - 1))));
      setNet(prev => Math.min(100, Math.max(0, prev + (Math.random() * 20 - 10))));
      setHistory(prev => [...prev.slice(1), Math.random() * 100]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-4 h-full bg-black/40 border border-gray-800 rounded-lg p-4 font-mono shadow-2xl">
      <header className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-2">
        <CpuChipIcon className="w-4 h-4 text-fuchsia-500" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Neural Vitals</span>
      </header>

      <div className="space-y-4">
        <MonitorBar label="CORES" value={cpu} color="bg-cyan-500" unit="%" />
        <MonitorBar label="MEM_H" value={ram} color="bg-fuchsia-500" unit="%" />
        <MonitorBar label="UPLNK" value={net} color="bg-green-500" unit="MB/s" />
      </div>

      <div className="mt-auto pt-4 border-t border-gray-800">
        <div className="flex items-center justify-between text-[8px] text-gray-600 mb-2">
            <span>SIG_INT_HISTORY</span>
            <BoltIcon className="w-2 h-2" />
        </div>
        <div className="flex items-end gap-0.5 h-12">
            {history.map((h, i) => (
                <div 
                    key={i} 
                    className="flex-1 bg-cyan-900/30 border-t border-cyan-500/50" 
                    style={{ height: `${h}%` }}
                />
            ))}
        </div>
      </div>
    </div>
  );
};

const MonitorBar = ({ label, value, color, unit }: { label: string, value: number, color: string, unit: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[9px] text-gray-500">
      <span>{label}</span>
      <span className="text-gray-300">{value.toFixed(1)}{unit}</span>
    </div>
    <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-1000 ease-out`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);
