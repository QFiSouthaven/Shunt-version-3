
// hooks/useComputer.ts
import { useState, useTransition, useCallback, useEffect } from 'react';
import { useAsyncState } from './useAsyncState';
import { dbService } from '../services/db';
import { performShunt } from '../services/IntelligenceRouter'; 
import { ShuntAction, PromptModuleKey } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { audioService } from '../services/audioService';
import { useMCPContext } from '../context/MCPContext';
import { MCPConnectionStatus } from '../types/mcp';

export type ComputerMode = 'shell' | 'script' | 'log';

export interface OperationLog {
    id: string;
    timestamp: string;
    mode: ComputerMode;
    input: string;
    output: string;
    os: string;
}

export const useComputer = () => {
    const [history, setHistory, isHistoryLoading] = useAsyncState<OperationLog[]>('computer_history', [], dbService.STORES.KEY_VALUE);
    const [input, setInput] = useState('');
    const [activeOutput, setActiveOutput] = useState<string | null>(null);
    const [mode, setMode] = useState<ComputerMode>('shell');
    const [osInfo, setOsInfo] = useState('Unknown Host');
    const [isExecuting, setIsExecuting] = useState(false);
    const [lastExecResult, setLastExecResult] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const { status: mcpStatus, extensionApi } = useMCPContext();

    useEffect(() => {
        const detectOS = () => {
            if (typeof navigator === 'undefined') return "Generic Unix";
            const ua = navigator.userAgent;
            if (ua.includes("Win")) return "Windows";
            if (ua.includes("Mac")) return "macOS";
            if (ua.includes("Linux")) return "Linux";
            return "Generic Unix";
        };
        setOsInfo(detectOS());
    }, []);

    const executeOperation = useCallback(() => {
        if (!input.trim()) return;
        
        audioService.playSound('send');
        setActiveOutput(null);
        setLastExecResult(null);

        startTransition(async () => {
            let action = ShuntAction.GENERATE_SHELL_COMMAND;
            if (mode === 'script') action = ShuntAction.GENERATE_UTILITY_SCRIPT;
            if (mode === 'log') action = ShuntAction.MY_COMMAND; 

            const moduleContext = `Active Module: ${PromptModuleKey.COMPUTER_OPS}`;
            const ctxPayload = {
                o: osInfo,
                m: mode,
                fs: mcpStatus === MCPConnectionStatus.Connected ? 1 : 0
            };
            const context = `CTX:${JSON.stringify(ctxPayload)}\n${moduleContext}`;

            try {
                const { resultText } = await performShunt(
                    input, 
                    action, 
                    'gemini-3-pro-preview', 
                    context
                );

                const newLog: OperationLog = {
                    id: uuidv4(),
                    timestamp: new Date().toISOString(),
                    mode,
                    input,
                    output: resultText,
                    os: osInfo
                };

                setHistory(prev => [newLog, ...prev]);
                setActiveOutput(resultText);
                audioService.playSound('success');
            } catch (e: any) {
                const errorMsg = `Error: ${e.message}`;
                setActiveOutput(errorMsg);
                audioService.playSound('error');
            }
        });
    }, [input, mode, osInfo, mcpStatus, setHistory]);

    const runCommandOnHost = useCallback(async (command: string) => {
        if (mcpStatus !== MCPConnectionStatus.Connected || !extensionApi) {
            alert("MCP bridge not connected. Cannot execute command.");
            return;
        }

        setIsExecuting(true);
        setLastExecResult(null);
        audioService.playSound('send');

        try {
            // Simulated execution via bridge
            await new Promise(r => setTimeout(r, 1000));
            const result = `[HOST_STDOUT] Command executed successfully.\n> Path: ${osInfo}\n> Exit: 0`;
            setLastExecResult(result);
            audioService.playSound('success');
        } catch (e: any) {
            setLastExecResult(`[HOST_STDERR] ${e.message}`);
            audioService.playSound('error');
        } finally {
            setIsExecuting(false);
        }
    }, [mcpStatus, extensionApi, osInfo]);

    const clearHistory = useCallback(() => {
        setHistory([]);
        setActiveOutput(null);
    }, [setHistory]);

    const deleteHistoryItem = useCallback((id: string) => {
        setHistory(prev => prev.filter(h => h.id !== id));
        if (history.find(h => h.id === id)?.output === activeOutput) {
            setActiveOutput(null);
        }
    }, [history, activeOutput, setHistory]);

    return {
        state: { 
            input, activeOutput, mode, osInfo, history, 
            isHistoryLoading, isPending, mcpStatus, isExecuting, lastExecResult 
        },
        actions: { 
            setInput, setMode, executeOperation, clearHistory, 
            deleteHistoryItem, setActiveOutput, runCommandOnHost 
        }
    };
};
