
// hooks/useWebSockets.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SocketConfig, SocketMessage, SocketStatus } from '../types';
import { audioService } from '../services/audioService';
import { useAsyncState } from './useAsyncState';
import { dbService } from '../services/db';

export const useWebSockets = () => {
    const [configs, setConfigs] = useAsyncState<SocketConfig[]>('network_sockets', [], dbService.STORES.KEY_VALUE);
    const [activeId, setActiveId] = useState<string | null>(null);
    const socketsRef = useRef<Map<string, WebSocket>>(new Map());

    const updateSocketStatus = useCallback((id: string, status: SocketStatus) => {
        setConfigs(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    }, [setConfigs]);

    const addMessage = useCallback((id: string, direction: 'in' | 'out', data: any) => {
        const msg: SocketMessage = {
            id: uuidv4(),
            direction,
            timestamp: new Date().toISOString(),
            data: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
            isJson: typeof data !== 'string'
        };
        setConfigs(prev => prev.map(c => 
            c.id === id ? { ...c, messages: [msg, ...c.messages].slice(0, 100) } : c
        ));
    }, [setConfigs]);

    const connect = useCallback((id: string) => {
        const config = configs.find(c => c.id === id);
        if (!config) return;

        // Cleanup existing
        if (socketsRef.current.has(id)) {
            const existing = socketsRef.current.get(id);
            if (existing) {
                existing.onclose = null;
                existing.close();
            }
        }

        updateSocketStatus(id, 'connecting');
        audioService.playSound('click');

        try {
            const ws = new WebSocket(config.url, config.protocol || undefined);
            
            ws.onopen = () => {
                updateSocketStatus(id, 'connected');
                audioService.playSound('success');
            };

            ws.onmessage = (event) => {
                let data = event.data;
                try { data = JSON.parse(event.data); } catch (e) { /* use raw */ }
                addMessage(id, 'in', data);
                audioService.playSound('receive');
            };

            ws.onerror = () => {
                updateSocketStatus(id, 'error');
                audioService.playSound('error');
            };

            ws.onclose = () => {
                updateSocketStatus(id, 'disconnected');
                // Auto-reconnect logic if enabled
                if (config.autoReconnect) {
                    setTimeout(() => connect(id), 3000);
                }
            };

            socketsRef.current.set(id, ws);
        } catch (e) {
            updateSocketStatus(id, 'error');
            audioService.playSound('error');
        }
    }, [configs, updateSocketStatus, addMessage]);

    const disconnect = useCallback((id: string) => {
        const ws = socketsRef.current.get(id);
        if (ws) {
            ws.onclose = null; // Prevent auto-reconnect
            ws.close();
            updateSocketStatus(id, 'disconnected');
            audioService.playSound('tab_switch');
            socketsRef.current.delete(id);
        }
    }, [updateSocketStatus]);

    const sendMessage = useCallback((id: string, data: string) => {
        const ws = socketsRef.current.get(id);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(data);
            addMessage(id, 'out', data);
            audioService.playSound('send');
        } else {
            console.error("Socket not open for sending:", id);
            audioService.playSound('error');
        }
    }, [addMessage]);

    const clearMessages = useCallback((id: string) => {
        setConfigs(prev => prev.map(c => c.id === id ? { ...c, messages: [] } : c));
        audioService.playSound('click');
    }, [setConfigs]);

    const addSocket = useCallback((label: string, url: string, protocol?: string) => {
        const newSocket: SocketConfig = {
            id: uuidv4(),
            label: label || 'New Edge Link',
            url,
            protocol,
            status: 'disconnected',
            messages: [],
            autoReconnect: false
        };
        setConfigs(prev => [...prev, newSocket]);
        setActiveId(newSocket.id);
        audioService.playSound('click');
    }, [setConfigs]);

    const removeSocket = useCallback((id: string) => {
        disconnect(id);
        setConfigs(prev => prev.filter(c => c.id !== id));
        if (activeId === id) setActiveId(null);
        audioService.playSound('click');
    }, [activeId, disconnect, setConfigs]);

    return {
        configs,
        activeId,
        setActiveId,
        connect,
        disconnect,
        sendMessage,
        addSocket,
        removeSocket,
        clearMessages
    };
};
