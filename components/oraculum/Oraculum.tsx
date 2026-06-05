
// components/oraculum/Oraculum.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { appEventBus } from '../../lib/eventBus';
import { InteractionEvent } from '../../types/telemetry';
import { generateOraculumInsights } from '../../services/geminiService';
import KPIDashboard from './KPIDashboard';
import TelemetryFeed from './TelemetryFeed';
import { GlobeAltIcon, SignalIcon, DeviceFloppyIcon, ServerIcon, BoltIcon } from '../icons';
import Loader from '../Loader';
import MarkdownRenderer from '../common/MarkdownRenderer';
import { audioService } from '../../services/audioService';
import { parseApiError } from '../../utils/errorLogger';
import { useMailbox } from '../../context/MailboxContext';
import { useSubscription } from '../../context/SubscriptionContext';
import ContentActions from '../common/ContentActions';
import { useCortex } from '../../hooks/useCortex';
import { dataSink } from '../../services/dataSink';
import { NeuralBusTrace } from './NeuralBusTrace';

const MAX_FEED_EVENTS = 50;

const Oraculum: React.FC = () => {
    const [liveEvents, setLiveEvents] = useState<InteractionEvent[]>([]);
    const [insights, setInsights] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sinkCount, setSinkCount] = useState(dataSink.getBufferSize());
    const [activeTab, setActiveTab] = useState<'telemetry' | 'trace'>('telemetry');

    const { deliverFiles } = useMailbox();
    const { usage } = useSubscription();
    const { isActive: isCortexActive, toggleSystem: toggleCortex } = useCortex();

    const [sessionStats, setSessionStats] = useState({
        eventsCaptured: 0,
        tokensUsed: 0,
        errors: 0
    });

    useEffect(() => {
        const handleTelemetry = (payload: { type: string, data: Record<string, any> }) => {
            if (payload.type === 'interaction_event' && payload.data.eventType) {
                const event = payload.data as InteractionEvent;
                setLiveEvents(prev => [event, ...prev.slice(0, MAX_FEED_EVENTS - 1)]);
                setSessionStats(prev => ({
                    eventsCaptured: prev.eventsCaptured + 1,
                    tokensUsed: prev.tokensUsed + (event.tokenUsage?.total_tokens || 0),
                    errors: prev.errors + (event.outcome === 'error' || event.outcome === 'failure' ? 1 : 0)
                }));
            }
            if (payload.type === 'data_egress_ingestion') {
                setSinkCount(payload.data.bufferSize);
            }
        };

        const unsubscribe = appEventBus.on('telemetry', handleTelemetry);
        return () => unsubscribe();
    }, []);

    const handleBulkExport = async () => {
        await dataSink.exportBulk();
        setSinkCount(0);
    };

    const handleGenerateInsights = useCallback(async () => {
        if (liveEvents.length === 0 || isLoading) return;
        setIsLoading(true);
        setError(null);
        setInsights(null);
        audioService.playSound('send');
        
        try {
            const recentEvents = liveEvents.slice(0, 20);
            const eventsJson = JSON.stringify(recentEvents, null, 2);
            const generatedInsights = await generateOraculumInsights(eventsJson);
            setInsights(generatedInsights);
            audioService.playSound('success');
            await deliverFiles([{ path: `oraculum-insights-${Date.now()}.md`, content: generatedInsights }]);
        } catch(e) {
            setError(parseApiError(e));
            audioService.playSound('error');
        } finally {
            setIsLoading(false);
        }
    }, [liveEvents, isLoading, deliverFiles]);

    const agentExecutions = usage.shuntRuns + usage.weaverPlans + usage.trimAgentRuns;

    return (
        <div className="flex flex-col h-full p-4 md:p-6 gap-6 overflow-hidden">
            <header className="flex-shrink-0">
                <KPIDashboard 
                    agentExecutions={agentExecutions}
                    tokensUsed={sessionStats.tokensUsed}
                    eventsCaptured={sessionStats.eventsCaptured}
                    errorCount={sessionStats.errors}
                />
            </header>

            <div className="flex-grow grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-hidden">
                <div className="xl:col-span-1 h-full overflow-hidden flex flex-col">
                    <div className="flex bg-gray-900/50 rounded-t-lg p-1 border-x border-t border-gray-800">
                        <button 
                            onClick={() => setActiveTab('telemetry')}
                            className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'telemetry' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <SignalIcon className="w-3 h-3 inline mr-1.5" /> Event Feed
                        </button>
                        <button 
                            onClick={() => setActiveTab('trace')}
                            className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'trace' ? 'bg-gray-800 text-fuchsia-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <BoltIcon className="w-3 h-3 inline mr-1.5" /> Neural Trace
                        </button>
                    </div>
                    <div className="flex-grow">
                        {activeTab === 'telemetry' ? <TelemetryFeed events={liveEvents} /> : <NeuralBusTrace />}
                    </div>
                </div>
                
                <div className="xl:col-span-1 h-full overflow-hidden flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${isCortexActive ? 'bg-green-900/30 text-green-400 animate-pulse' : 'bg-gray-800 text-gray-500'}`}>
                                    <SignalIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-xs text-gray-200 uppercase">Cortex</h3>
                                    <p className="text-[10px] text-gray-500">{isCortexActive ? 'LINKED' : 'OFFLINE'}</p>
                                </div>
                            </div>
                            <button onClick={toggleCortex} className={`px-3 py-1 rounded text-[10px] font-bold ${isCortexActive ? 'bg-red-900/20 text-red-400 border border-red-900/50' : 'bg-green-900/20 text-green-400 border border-green-900/50'}`}>
                                {isCortexActive ? 'HALT' : 'INIT'}
                            </button>
                        </div>

                        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-indigo-900/30 text-indigo-400">
                                    <ServerIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-xs text-gray-200 uppercase">Data Sink</h3>
                                    <p className="text-[10px] text-gray-500">{sinkCount} Packets</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleBulkExport} 
                                disabled={sinkCount === 0}
                                className="px-3 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center gap-1"
                            >
                                <DeviceFloppyIcon className="w-3 h-3" /> EXPORT
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                        <button
                            onClick={handleGenerateInsights}
                            disabled={isLoading || liveEvents.length === 0}
                            className="w-full flex items-center justify-center gap-2 text-md font-semibold text-center p-3 rounded-md border transition-all duration-200 bg-fuchsia-600/80 border-fuchsia-500 text-white shadow-lg hover:bg-fuchsia-600 hover:border-fuchsia-400 disabled:opacity-50"
                        >
                            {isLoading ? <Loader /> : <GlobeAltIcon className="w-5 h-5" />}
                            Generate Insights from Live Feed
                        </button>
                    </div>

                    <div className="bg-gray-900/50 rounded-lg border border-gray-700/50 flex-grow overflow-hidden flex flex-col">
                        <div className="p-3 border-b border-gray-700/50 flex justify-between items-center">
                            <span className="font-semibold text-gray-300">Insights</span>
                            {insights && <ContentActions content={insights} filename={`oraculum-insights-${Date.now()}.md`} />}
                        </div>
                        <div className="p-4 overflow-y-auto custom-scrollbar">
                            {isLoading && <div className="flex justify-center items-center h-full"><Loader /></div>}
                            {error && <p className="text-red-400">{error}</p>}
                            {insights && <MarkdownRenderer content={insights} />}
                            {!isLoading && !error && !insights && (
                                <div className="text-center text-gray-500 flex flex-col justify-center items-center h-full">
                                    <p>AI-generated insights will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Oraculum;
