
// components/todo/Todo.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAsyncState } from '../../hooks/useAsyncState';
import { dbService } from '../../services/db';
import { Todo } from '../../types';
import { 
    QueueListIcon, PlusIcon, TrashIcon, 
    CheckCircleIcon, SparklesIcon, BoltIcon, 
    XMarkIcon, ChevronRightIcon 
} from '../icons';
import Loader from '../Loader';
import { audioService } from '../../services/audioService';
import { generateRawText } from '../../services/geminiService';
import { Type } from "@google/genai";
import TabFooter from '../common/TabFooter';

const TodoModule: React.FC = () => {
    const [todos, setTodos] = useAsyncState<Todo[]>('global_todos', [], dbService.STORES.TODOS);
    const [inputValue, setInputValue] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [isDecomposing, setIsDecomposing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    const handleAddTodo = useCallback((text: string = inputValue) => {
        if (!text.trim()) return;
        
        const newTodo: Todo = {
            id: uuidv4(),
            text: text.trim(),
            completed: false,
            priority,
            createdAt: new Date().toISOString()
        };

        setTodos(prev => [newTodo, ...prev]);
        setInputValue('');
        audioService.playSound('success');
    }, [inputValue, priority, setTodos]);

    const toggleTodo = (id: string) => {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
        audioService.playSound('click');
    };

    const deleteTodo = (id: string) => {
        setTodos(prev => prev.filter(t => t.id !== id));
        audioService.playSound('tab_switch');
    };

    const decomposeTask = async (todo: Todo) => {
        setIsDecomposing(true);
        audioService.playSound('send');
        
        try {
            const prompt = `Deconstruct the following task into 3-5 specific, tactical sub-tasks. 
            Task: "${todo.text}"
            Return ONLY a valid JSON array of strings.`;

            const { resultText } = await generateRawText(prompt, 'gemini-3-flash-preview');
            const subtasks = JSON.parse(resultText.replace(/```json\n?|\n?```/g, '').trim());

            if (Array.isArray(subtasks)) {
                const newTodos = subtasks.map(st => ({
                    id: uuidv4(),
                    text: `[${todo.text.substring(0, 10)}...] ${st}`,
                    completed: false,
                    priority: todo.priority,
                    createdAt: new Date().toISOString()
                }));
                setTodos(prev => [...newTodos, ...prev]);
                audioService.playSound('receive');
            }
        } catch (e) {
            console.error("Task decomposition failed:", e);
            audioService.playSound('error');
        } finally {
            setIsDecomposing(false);
        }
    };

    const filteredTodos = useMemo(() => {
        return todos.filter(t => {
            if (filter === 'active') return !t.completed;
            if (filter === 'completed') return t.completed;
            return true;
        });
    }, [todos, filter]);

    return (
        <div className="flex flex-col h-full bg-[#050505] text-gray-200 overflow-hidden">
            <div className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full overflow-y-auto custom-scrollbar">
                
                {/* Header Area */}
                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3 uppercase">
                            <QueueListIcon className="w-8 h-8 text-cyan-400" />
                            Tactical Queue
                        </h1>
                        <p className="text-sm text-gray-500 font-mono mt-1 uppercase tracking-widest">Aether_Mission_Control // v2.4</p>
                    </div>
                    
                    <div className="flex bg-gray-900/50 p-1 rounded-lg border border-gray-800">
                        {['all', 'active', 'completed'].map(f => (
                            <button 
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${filter === f ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Input Panel */}
                <div className="aether-panel p-6 mb-8 border-cyan-500/20 bg-gray-900/40 backdrop-blur-xl">
                    <div className="flex flex-col gap-4">
                        <div className="relative group">
                            <input 
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
                                placeholder="Enter objective directive..."
                                className="w-full bg-black/60 border border-gray-700 rounded-xl p-4 pr-32 text-lg text-white placeholder-gray-600 focus:border-cyan-500 outline-none transition-all shadow-inner"
                            />
                            <div className="absolute right-2 top-2 bottom-2 flex gap-2">
                                <select 
                                    value={priority}
                                    onChange={e => setPriority(e.target.value as any)}
                                    className="bg-gray-800 border border-gray-700 text-[10px] font-bold text-gray-400 rounded-lg px-2 outline-none uppercase"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Med</option>
                                    <option value="high">High</option>
                                </select>
                                <button 
                                    onClick={() => handleAddTodo()}
                                    className="px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors flex items-center justify-center"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">
                                {todos.filter(t => !t.completed).length} Pending Missions
                            </span>
                            <div className="flex items-center gap-2">
                                <BoltIcon className="w-3 h-3 text-cyan-500" />
                                <span className="text-[9px] text-gray-500">SYSTEM_AUTOSAVE_ACTIVE</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-3">
                    {filteredTodos.map(todo => (
                        <div 
                            key={todo.id}
                            className={`group relative bg-gray-900/30 border rounded-xl p-4 flex items-center justify-between transition-all hover:bg-gray-800/40 ${todo.completed ? 'border-emerald-500/20 opacity-50 grayscale-[0.5]' : 'border-gray-800 hover:border-cyan-500/30'}`}
                        >
                            <div className="flex items-center gap-4 flex-grow overflow-hidden">
                                <button 
                                    onClick={() => toggleTodo(todo.id)}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${todo.completed ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-gray-700 hover:border-cyan-500'}`}
                                >
                                    {todo.completed && <CheckCircleIcon className="w-4 h-4" />}
                                </button>
                                <div className="flex-grow min-w-0">
                                    <p className={`text-sm font-medium truncate ${todo.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                                        {todo.text}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${todo.priority === 'high' ? 'bg-red-900/20 text-red-400' : todo.priority === 'medium' ? 'bg-amber-900/20 text-amber-400' : 'bg-gray-800 text-gray-500'}`}>
                                            {todo.priority}
                                        </span>
                                        <span className="text-[8px] text-gray-600 font-mono">{new Date(todo.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!todo.completed && (
                                    <button 
                                        onClick={() => decomposeTask(todo)}
                                        disabled={isDecomposing}
                                        className="p-2 text-fuchsia-400 hover:bg-fuchsia-900/20 rounded-lg transition-colors flex items-center gap-1"
                                        title="AI Decompose Task"
                                    >
                                        {isDecomposing ? <Loader className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                                        <span className="text-[10px] font-bold uppercase hidden sm:inline">Decompose</span>
                                    </button>
                                )}
                                <button 
                                    onClick={() => deleteTodo(todo.id)}
                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredTodos.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center text-gray-700 opacity-30 select-none">
                            <QueueListIcon className="w-20 h-20 mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest">No Active Directives</p>
                        </div>
                    )}
                </div>
            </div>
            <TabFooter />
        </div>
    );
};

export default TodoModule;
