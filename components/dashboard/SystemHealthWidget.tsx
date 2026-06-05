
// components/dashboard/SystemHealthWidget.tsx
import React, { useMemo } from 'react';
import { gapAnalysisService } from '../../services/gapAnalysisService';
import { ShieldCheckIcon, ErrorIcon, ExclamationTriangleIcon } from '../icons';

export const SystemHealthWidget: React.FC = () => {
    const manifest = gapAnalysisService.getManifest();
    
    const stats = useMemo(() => {
        const resolved = manifest.missing_components.filter(c => (c as any).status === 'Resolved').length;
        const total = manifest.missing_components.length;
        const readiness = Math.round((resolved / total) * 100);
        
        return { resolved, total, readiness };
    }, [manifest]);

    return (
        <div className="h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mb-1">
                <ShieldCheckIcon className="w-3 h-3 text-emerald-400" /> KERNEL_STABILITY
            </div>
            <div className="flex items-baseline gap-2">
                <div className={`text-xl font-bold tracking-tight ${stats.readiness > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {stats.readiness}%
                </div>
                <div className="text-[10px] text-gray-600 font-mono">READY</div>
            </div>
            <div className="text-[9px] text-gray-500 mt-1">
                {stats.total - stats.resolved} ARCHITECTURAL GAPS REMAINING
            </div>
        </div>
    );
};
