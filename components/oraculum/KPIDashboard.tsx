
// components/oraculum/KPIDashboard.tsx
import React, { useState, useEffect } from 'react';
import { BoltIcon, StarIcon, DocumentChartBarIcon, ErrorIcon, ShieldCheckIcon, ServerIcon } from '../icons';
import { appEventBus } from '../../lib/eventBus';

interface KPIDashboardProps {
    agentExecutions: number;
    tokensUsed: number;
    eventsCaptured: number;
    errorCount: number;
}

const KPIDashboard: React.FC<KPIDashboardProps> = ({ agentExecutions, tokensUsed, eventsCaptured, errorCount }) => {
    const [neuralPressure, setNeuralPressure] = useState({ tokensRemaining: 10, pressure: 0, status: 'STABLE' });
    const [sinkSize, setSinkSize] = useState(0);

    useEffect(() => {
        const unsub = appEventBus.on('telemetry', (payload) => {
            if (payload.type === 'neural_pressure_update') {
                setNeuralPressure({
                    tokensRemaining: payload.data.tokensRemaining,
                    pressure: payload.data.pressurePercentage,
                    status: payload.data.status
                });
            }
            if (payload.type === 'data_egress_ingestion') {
                setSinkSize(payload.data.bufferSize);
            }
        });
        return () => unsub();
    }, []);

    const kpis = [
        { 
            title: 'Agent Executions', 
            value: agentExecutions.toLocaleString(), 
            icon: <BoltIcon className="w-6 h-6 text-cyan-400" />, 
            description: 'Total AI agent runs' 
        },
        { 
            title: 'Neural Pressure', 
            value: `${neuralPressure.pressure}%`, 
            icon: <ShieldCheckIcon className={`w-6 h-6 ${neuralPressure.status === 'CRITICAL' ? 'text-red-500' : 'text-fuchsia-400'}`} />, 
            description: `Rate Limit: ${neuralPressure.tokensRemaining} tokens avail` 
        },
        { 
            title: 'Data Sink', 
            value: sinkSize.toString(), 
            icon: <ServerIcon className="w-6 h-6 text-indigo-400" />, 
            description: 'Packets staged for egress' 
        },
        {
            title: 'Session Errors',
            value: errorCount.toString(),
            icon: <ErrorIcon className="w-6 h-6 text-red-400" />,
            description: 'Errors detected in live feed'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(kpi => (
                <div key={kpi.title} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 flex items-center gap-4 relative overflow-hidden group">
                    {kpi.title === 'Neural Pressure' && (
                        <div className="absolute bottom-0 left-0 h-0.5 bg-fuchsia-500 transition-all duration-500" style={{ width: `${neuralPressure.pressure}%` }} />
                    )}
                    <div className="relative z-10">{kpi.icon}</div>
                    <div className="relative z-10">
                        <h3 className="text-sm font-medium text-gray-400">{kpi.title}</h3>
                        <p className="text-2xl font-bold text-gray-100">{kpi.value}</p>
                        <p className="text-[10px] text-gray-500">{kpi.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KPIDashboard;
