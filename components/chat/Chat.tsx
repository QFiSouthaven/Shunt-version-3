
// components/chat/Chat.tsx
import React, { useState, useEffect, useRef, useCallback, useOptimistic, startTransition } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TabFooter from '../common/TabFooter';
import { useTelemetry } from '../../context/TelemetryContext';
import { audioService } from '../../services/audioService';
import { executeCode } from '../../services/codeExecutor';
import { chatSessionService, ChatMessage as ChatMessageType } from '../../services/chatSession.service';
import { CpuChipIcon, BoltIcon, SparklesIcon, XMarkIcon } from '../icons';
import { appEventBus } from '../../lib/eventBus';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [currentModel, setCurrentModel] = useState('gemini-3-pro-preview');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { versionControlService } = useTelemetry();

  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: ChatMessageType) => [...state, newMessage]
  );

  useEffect(() => {
      const init = async () => {
          const { messages: msgs, model } = await chatSessionService.initialize();
          setMessages(msgs);
          setCurrentModel(model);
      };
      init();

      const unsubModel = appEventBus.on('telemetry', (payload) => {
          if (payload.type === 'chat_model_changed') {
              setCurrentModel(payload.data.model);
          }
      });

      // Handle cross-module injection
      const unsubInject = appEventBus.on('inject_chat_message', (text) => {
          onSendMessage(`Analyze this data packet:\n\n${text}`);
      });

      return () => {
          unsubModel();
          unsubInject();
      };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [optimisticMessages, isLoading]);
  
  const saveChatHistory = useCallback(() => {
      versionControlService?.captureVersion(
          'chat_export',
          `chat_session_${new Date().toISOString()}`,
          JSON.stringify(messages, null, 2),
          'user_action',
          'User saved chat session'
      );
      alert('Chat history saved to Chronicle!');
  }, [messages, versionControlService]);
  
  const onClearHistory = useCallback(async () => {
      const newMsgs = await chatSessionService.clearHistory();
      setMessages(newMsgs);
      audioService.playSound('click');
  }, []);

  const handleExecuteCode = useCallback(async (language: string, code: string) => {
    let currentMsgs = await chatSessionService.addSystemMessage('system-progress', `Executing ${language} code...`);
    setMessages([...currentMsgs]);
    audioService.playSound('send');
    
    const result = await executeCode(language, code);
    const role = result.startsWith('Error:') ? 'error' : 'code-output';
    currentMsgs = await chatSessionService.addSystemMessage(role, result);
    setMessages([...currentMsgs]);
    audioService.playSound('receive');
  }, []);

  const onSendMessage = async (messageText: string) => {
    const pythonMatch = messageText.match(/^(?:python|py):\s*([\s\S]*)/i);
    if (pythonMatch) {
        const code = pythonMatch[1];
        await chatSessionService.addSystemMessage('user', messageText);
        const { messages: currentMsgs } = await chatSessionService.initialize();
        setMessages([...currentMsgs]);
        audioService.playSound('send');
        setIsLoading(true);
        try {
            const result = await executeCode('python', code);
            const role = result.startsWith('Error:') ? 'error' : 'code-output';
            const msgs = await chatSessionService.addSystemMessage(role, result);
            setMessages([...msgs]);
            audioService.playSound('receive');
        } catch (e: any) {
             const msgs = await chatSessionService.addSystemMessage('error', `Execution failed: ${e.message}`);
             setMessages([...msgs]);
             audioService.playSound('error');
        } finally {
            setIsLoading(false);
        }
        return;
    }

    startTransition(async () => {
        addOptimisticMessage({ id: Date.now().toString(), role: 'user', content: messageText });
        setIsLoading(true);
        audioService.playSound('send');

        try {
            const tempId = 'streaming-' + Date.now();
            await chatSessionService.sendMessageStream(messageText, (chunkText) => {
                setMessages(prev => {
                    const userMsgExists = prev.some(m => m.role === 'user' && m.content === messageText);
                    const userMsg: ChatMessageType = { id: 'sent-' + Date.now(), role: 'user', content: messageText };
                    const baseState = userMsgExists ? prev : [...prev, userMsg];
                    const filteredBase = baseState.filter(m => m.id !== tempId);
                    const streamingMsg: ChatMessageType = { id: tempId, role: 'model', content: chunkText, isLoading: true };
                    return [...filteredBase, streamingMsg];
                });
            });
            const { messages: finalMsgs } = await chatSessionService.initialize();
            setMessages(finalMsgs);
            audioService.playSound('receive');
        } catch (error) {
            const { messages: msgs } = await chatSessionService.initialize();
            setMessages(msgs);
            audioService.playSound('error');
        } finally {
            setIsLoading(false);
        }
    });
  };

  const handleModelChange = (model: string) => {
      chatSessionService.setModel(model);
      audioService.playSound('click');
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-gray-200">
        <div className="p-3 border-b border-gray-800 bg-gray-900/30 flex justify-between items-center px-6">
            <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30">
                    <SparklesIcon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-sm font-bold tracking-wide uppercase">Neural Interface</h2>
                    <p className="text-[10px] text-gray-500 font-mono">ENCRYPTED_UPLINK</p>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-gray-800">
                    <select 
                        value={currentModel}
                        onChange={(e) => handleModelChange(e.target.value)}
                        className="bg-transparent text-[10px] font-bold text-gray-400 uppercase tracking-widest outline-none px-2 py-1 cursor-pointer hover:text-white transition-colors"
                    >
                        <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
                        <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    </select>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1" />
                </div>
            </div>
        </div>

        <div className="flex-grow p-4 md:p-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-6">
                {optimisticMessages.map((msg) => (
                    <ChatMessage key={msg.id} role={msg.role} content={msg.content} isLoading={msg.isLoading} onExecuteCode={handleExecuteCode} />
                ))}
                {isLoading && optimisticMessages[optimisticMessages.length-1]?.role !== 'model' && (
                     <ChatMessage key="loading" role="model" content="" isLoading={true} />
                )}
                 <div ref={messagesEndRef} />
            </div>
        </div>
        
        <div className="flex-shrink-0 p-4 md:p-6 bg-black/40 border-t border-gray-800">
            <div className="max-w-4xl mx-auto">
                 <div className="flex items-center gap-4 mb-3 px-1">
                    {messages.length > 0 && (
                        <button onClick={saveChatHistory} className='text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors flex items-center gap-1.5'>
                            <BoltIcon className="w-3 h-3" /> Save to Chronicle
                        </button>
                    )}
                    {messages.length > 0 && (
                        <button onClick={onClearHistory} className='text-[10px] font-bold uppercase tracking-widest text-red-900/80 hover:text-red-400 transition-colors flex items-center gap-1.5'>
                            <XMarkIcon className="w-3 h-3" /> Reset Session
                        </button>
                    )}
                </div>
                <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
            </div>
        </div>
        <TabFooter />
    </div>
  );
};

export default Chat;
