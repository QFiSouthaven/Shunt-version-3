
// hooks/useJobManager.ts
import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Job, JobLog, AgentState } from '../types';
import { requestIntelligence } from '../services/IntelligenceRouter';
import { initializeFileSystem, executeTool, ExecutionContext } from '../services/toolApi';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export const useJobManager = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const jobsRef = useRef(jobs);
    jobsRef.current = jobs;

    const updateJob = (jobId: string, updates: Partial<Job>) => {
        setJobs(prevJobs => prevJobs.map(job => 
            job.id === jobId ? { ...job, ...updates } : job
        ));
    };

    const addLog = (jobId: string, message: string, type: JobLog['type'] = 'info') => {
        const newLog: JobLog = { timestamp: new Date().toLocaleTimeString(), message, type };
        setJobs(prevJobs => prevJobs.map(job => 
            job.id === jobId ? { ...job, logs: [...job.logs, newLog] } : job
        ));
    };
    
    const updateAgentState = (jobId: string, updates: Partial<AgentState>) => {
        setJobs(prevJobs => prevJobs.map(job => {
            if (job.id !== jobId) return job;
            return {
                ...job,
                agentState: {
                    ...(job.agentState || { scratchpad: '', plan: [], completedSteps: [], inverseAnalysis: [] }),
                    ...updates
                }
            };
        }));
    };

    const isJobCancelled = (jobId: string): boolean => {
        const job = jobsRef.current.find(j => j.id === jobId);
        return job?.status === 'Cancelled';
    };

    const submitJob = useCallback(async (prompt: string, files: {filename: string; content: string}[] = []): Promise<string | null> => {
        setIsRunning(true);
        const newJob: Job = {
            id: uuidv4(),
            prompt,
            status: 'Pending',
            logs: [],
            result: null,
            startTime: Date.now(),
            endTime: null,
            agentState: {
                scratchpad: 'Initializing agent memory...',
                plan: [],
                completedSteps: [],
                inverseAnalysis: []
            }
        };
        setJobs(prev => [newJob, ...prev]);

        try {
            addLog(newJob.id, 'Job submitted and waiting in queue...');
            
            if (files.length > 0) {
                addLog(newJob.id, `Loading project context: ${files.length} file(s) loaded.`);
                const fileMap: Record<string, string> = {};
                files.forEach(f => { fileMap[f.filename] = f.content; });
                initializeFileSystem(fileMap);
            }

            await sleep(500);
            updateJob(newJob.id, { status: 'Running' });

            const systemPrompt = `You are an Autonomous AI Developer Agent. Use provided tools to execute the user's request. Always start with an inverse analysis.`;

            let history: any[] = [];
            
            const agentPermissions: ExecutionContext = {
                agentId: 'ai-job-runner',
                permissions: [
                    'filesystem:read', 'filesystem:write', 'execution:tests', 
                    'vcs:read', 'vcs:stage', 'vcs:branch', 'vcs:commit', 
                    'agent:analyze', 'agent:memory', 'agent:plan'
                ]
            };

            let turnCount = 0;
            const MAX_TURNS = 15;
            let finalResult = '';

            while (turnCount < MAX_TURNS) {
                if (isJobCancelled(newJob.id)) throw new Error('Job cancelled by user.');
                
                const currentPrompt = turnCount === 0 ? prompt : 'Continue task based on tool result.';
                
                const response = await requestIntelligence({
                    prompt: currentPrompt,
                    systemInstruction: systemPrompt,
                    useTools: true,
                    history: history
                });

                if (response.resultText) {
                    addLog(newJob.id, response.resultText, 'thought');
                    finalResult = response.resultText;
                    history.push({ role: 'model', content: response.resultText });
                }
                
                if (response.functionCalls && response.functionCalls.length > 0) {
                    for (const call of response.functionCalls) {
                        const toolName = call.name;
                        const toolArgs = call.args;
                        
                        addLog(newJob.id, `Executing tool: ${toolName}`, 'tool_call');
                        const result = await executeTool(toolName, toolArgs, agentPermissions);
                        
                        // Side effects for UI
                        if (toolName === 'perform_inverse_analysis' && result.success) {
                            updateAgentState(newJob.id, { 
                                inverseAnalysis: [...(newJob.agentState?.inverseAnalysis || []), `${result.data.failure_mode}`] 
                            });
                        }

                        history.push({ role: 'user', content: `Tool ${toolName} output: ${JSON.stringify(result.data)}` });
                        addLog(newJob.id, `Tool ${toolName} complete.`, 'tool_result');
                        await sleep(800);
                    }
                } else if (turnCount > 0) {
                    break;
                }

                turnCount++;
            }

            updateJob(newJob.id, { status: 'Completed', result: finalResult, endTime: Date.now() });
            return finalResult;

        } catch (error: any) {
            const message = error.message || 'An unknown error occurred.';
            const isCancelled = message.includes('cancelled');
            updateJob(newJob.id, { 
                status: isCancelled ? 'Cancelled' : 'Failed', 
                result: message, 
                endTime: Date.now() 
            });
            return null;
        } finally {
            setIsRunning(false);
        }
    }, []);

    const cancelJob = useCallback((jobId: string) => {
        updateJob(jobId, { status: 'Cancelled' });
    }, []);

    return { jobs, submitJob, cancelJob, isRunning };
};
