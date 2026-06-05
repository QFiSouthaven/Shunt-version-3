
// hooks/useWeaver.ts
import { useState, useCallback, useEffect } from 'react';
import { weaverService } from '../services/weaver.service';
import { GeminiResponse, Documentation } from '../types';
import { useTelemetry } from '../context/TelemetryContext';
import { useSubscription } from '../context/SubscriptionContext';
import { parseApiError } from '../utils/errorLogger';
import { useMailbox } from '../context/MailboxContext';
import { audioService } from '../services/audioService';
import { appEventBus } from '../lib/eventBus';

export const useWeaver = () => {
    const [goal, setGoal] = useState(() => localStorage.getItem('weaver_goal') || '');
    const [plan, setPlan] = useState<GeminiResponse | null>(null);
    const [documentation, setDocumentation] = useState<Documentation>(weaverService.getState().documentation);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newlyGenerated, setNewlyGenerated] = useState(false);

    const { telemetryService, versionControlService, updateTelemetryContext } = useTelemetry();
    const { usage, tierDetails, incrementUsage } = useSubscription();
    const { deliverFiles } = useMailbox();

    useEffect(() => {
        updateTelemetryContext({ tab: 'Weaver' });
        
        // Initial state sync
        const state = weaverService.getState();
        setDocumentation(state.documentation);
        setPlan(state.activePlan);

        // Listen for service updates
        const unsubscribe = appEventBus.on('telemetry', (payload) => {
            if (payload.type === 'weaver_update') {
                setDocumentation(payload.data.documentation);
                setPlan(payload.data.activePlan);
            }
        });

        return () => unsubscribe();
    }, [updateTelemetryContext]);

    useEffect(() => localStorage.setItem('weaver_goal', goal), [goal]);

    useEffect(() => {
        if (newlyGenerated) {
            const timer = setTimeout(() => setNewlyGenerated(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [newlyGenerated]);

    const handleDocumentationChange = useCallback((field: keyof Documentation, value: string) => {
        weaverService.updateDocumentation(field, value);
    }, []);

    const generatePlan = useCallback(async () => {
        if (tierDetails.weaverPlans !== 'unlimited' && usage.weaverPlans >= tierDetails.weaverPlans) {
            setError("Monthly limit reached.");
            audioService.playSound('error');
            return;
        }
        if (!goal.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        setNewlyGenerated(false);

        try {
            const generatedPlan = await weaverService.generatePlan(goal);
            setNewlyGenerated(true);
            incrementUsage('weaverPlans');

            await deliverFiles([{
                path: `weaver-plan-${Date.now()}.json`,
                content: JSON.stringify(generatedPlan, null, 2)
            }]);

            telemetryService?.recordEvent({
                eventType: 'ai_response',
                interactionType: 'generate_dev_plan',
                tab: 'Weaver',
                outcome: 'success',
                tokenUsage: generatedPlan.tokenUsage
            });

            versionControlService?.captureVersion(
                'development_plan',
                `weaver_plan_${Date.now()}`,
                JSON.stringify(generatedPlan, null, 2),
                'ai_response',
                `Generated plan: ${goal.substring(0, 30)}...`
            );

        } catch (e: any) {
            setError(parseApiError(e));
        } finally {
            setIsLoading(false);
        }
    }, [goal, isLoading, tierDetails, usage, incrementUsage, deliverFiles, telemetryService, versionControlService]);

    return {
        goal, setGoal,
        plan,
        documentation, handleDocumentationChange,
        isLoading,
        error, setError,
        newlyGenerated,
        generatePlan,
        usage, tierDetails
    };
};
