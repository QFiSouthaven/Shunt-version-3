
// components/mission_control/tabsConfig.tsx
import React, { lazy } from 'react';
import {
    SparklesIcon, BrainIcon, HistoryIcon,
    ChatBubbleLeftRightIcon, PhotoIcon, DocumentIcon, Cog6ToothIcon, StarIcon,
    GlobeAltIcon, BranchingIcon, DeveloperIcon, CpuChipIcon, HomeIcon, LightBulbIcon, EyeIcon, UserIcon,
    BoltIcon, ServerStackIcon, TerminalIcon, SignalIcon, QueueListIcon, DatabaseIcon
} from '../icons';
import { MissionControlTab } from '../../types';

// Lazy load components
const Shunt = lazy(() => import('../shunt/Shunt'));
const Weaver = lazy(() => import('../weaver/Weaver'));
const Foundry = lazy(() => import('../foundry/Foundry'));
const Chat = lazy(() => import('../chat/Chat'));
const ImageAnalysis = lazy(() => import('../image_analysis/ImageAnalysis'));
const Oraculum = lazy(() => import('../oraculum/Oraculum'));
const Subscription = lazy(() => import('../subscription/Subscription'));
const KnowledgeStudio = lazy(() => import('../knowledge/KnowledgeStudio'));
const Settings = lazy(() => import('../settings/Settings'));
const Chronicle = lazy(() => import('../chronicle/Chronicle'));
const ToolforAI = lazy(() => import('../tool_for_ai/ToolforAI'));
const AgentBuilder = lazy(() => import('../agent_builder/AgentBuilder'));
const SerendipityEngine = lazy(() => import('../serendipity/SerendipityEngine'));
const System2001 = lazy(() => import('../lab/System2001'));
const PersistentDeveloperModule = lazy(() => import('../persistent_developer').then(module => ({ default: module.PersistentDeveloperModule })));
const Ecosystem = lazy(() => import('../ecosystem/Ecosystem'));
const AppForge = lazy(() => import('../app_forge/AppForge'));
const ComputerShunt = lazy(() => import('../computer/ComputerShunt'));
const NetworkHub = lazy(() => import('../network/NetworkHub'));
const TodoModule = lazy(() => import('../todo/Todo'));

const DashboardPlaceholder: React.FC = () => null;

export const MODULE_REGISTRY: MissionControlTab[] = [
    { 
        key: 'dashboard', 
        label: 'Dashboard', 
        icon: <HomeIcon className="w-5 h-5" />, 
        component: DashboardPlaceholder,
        keywords: ['home', 'main', 'overview', 'stats'],
        colorTheme: 'text-gray-400',
        primaryColor: 'gray',
        description: 'System Overview & Launchpad',
        architecturalContext: 'The landing page and central',
        category: 'workspace'
    },
    { 
        key: 'todo', 
        label: 'Missions', 
        icon: <QueueListIcon className="w-5 h-5" />, 
        component: TodoModule,
        keywords: ['todo', 'tasks', 'list', 'goals', 'mission'],
        colorTheme: 'text-cyan-400',
        primaryColor: 'cyan',
        description: 'Tactical Task Orchestrator',
        architecturalContext: 'Task management with AI decomposition logic.',
        category: 'workspace'
    },
    { 
        key: 'network_hub', 
        label: 'Uplink', 
        icon: <SignalIcon className="w-5 h-5" />, 
        component: NetworkHub,
        keywords: ['websocket', 'network', 'socket', 'cloudflare', 'edge', 'durable'],
        colorTheme: 'text-cyan-400',
        primaryColor: 'cyan',
        description: 'Multi-Socket Edge Hub',
        architecturalContext: 'Low-latency bridge for Cloudflare Workers and Durable Objects.',
        category: 'workspace'
    },
    { 
        key: 'computer', 
        label: 'Computer', 
        icon: <TerminalIcon className="w-5 h-5" />, 
        component: ComputerShunt,
        keywords: ['terminal', 'shell', 'bash', 'script', 'sysop'],
        colorTheme: 'text-green-400',
        primaryColor: 'green',
        description: 'System Operations & Shell Gen',
        architecturalContext: 'Dedicated shunt for generating shell commands and scripts.',
        category: 'workspace'
    },
    { 
        key: 'app_forge', 
        label: 'App Forge', 
        icon: <CpuChipIcon className="w-5 h-5" />, 
        component: AppForge,
        keywords: ['build', 'create', 'app', 'generate', 'tool'],
        colorTheme: 'text-indigo-400',
        primaryColor: 'indigo',
        description: 'Build Standalone Shunt Applications',
        architecturalContext: 'A studio for creating persistent, specialized AI tools.',
        category: 'lab'
    },
    { 
        key: 'shunt', 
        label: 'Shunt', 
        icon: <BoltIcon className="w-5 h-5" />, 
        component: Shunt,
        keywords: ['text', 'transform', 'prompt', 'amplify', 'summarize'],
        colorTheme: 'text-cyan-400',
        primaryColor: 'cyan',
        description: 'Text Transformation Engine',
        architecturalContext: 'Prompt engineering lab for content refinement.',
        category: 'workspace'
    },
    { 
        key: 'weaver', 
        label: 'Weaver', 
        icon: <BrainIcon className="w-5 h-5" />, 
        component: Weaver,
        keywords: ['plan', 'roadmap', 'tasks', 'architecture'],
        colorTheme: 'text-fuchsia-400',
        primaryColor: 'fuchsia',
        description: 'Strategic Planning Module',
        architecturalContext: 'Generates structured development plans based on goals.',
        category: 'workspace'
    },
    { 
        key: 'foundry', 
        label: 'Foundry', 
        icon: <BranchingIcon className="w-5 h-5" />, 
        component: Foundry,
        keywords: ['agent', 'swarm', 'simulation', 'merge', 'launch'],
        colorTheme: 'text-purple-400',
        primaryColor: 'purple',
        description: 'Multi-Agent Simulation Lab',
        architecturalContext: 'Simulates a team of agents to audit and design systems.',
        category: 'lab'
    },
    { 
        key: 'ecosystem', 
        label: 'Ecosystem', 
        icon: <UserIcon className="w-5 h-5" />, 
        component: Ecosystem,
        keywords: ['agents', 'world', 'map', 'simulation', 'graph'],
        colorTheme: 'text-green-400',
        primaryColor: 'green',
        description: 'Corporate Agent World Map',
        architecturalContext: 'Visualizes the hierarchy and flow of a corporate agent ecosystem.',
        category: 'lab'
    },
    { 
        key: 'persistent_developer', 
        label: 'Persistent Dev', 
        icon: <UserIcon className="w-5 h-5" />, 
        component: PersistentDeveloperModule,
        keywords: ['dev', 'architect', 'speedster', 'updater', 'persona'],
        colorTheme: 'text-indigo-400',
        primaryColor: 'indigo',
        description: 'Your Dedicated AI Developer',
        architecturalContext: 'An always-on developer persona that maintains state.',
        category: 'lab'
    },
    { 
        key: 'chat', 
        label: 'Chat', 
        icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />, 
        component: Chat,
        keywords: ['conversation', 'ask', 'gemini', 'code'],
        colorTheme: 'text-blue-400',
        primaryColor: 'blue',
        description: 'Direct Neural Interface',
        architecturalContext: 'Standard conversational interface with code execution capabilities.',
        category: 'workspace'
    },
    { 
        key: 'image_analysis', 
        label: 'Vision', 
        icon: <PhotoIcon className="w-5 h-5" />, 
        component: ImageAnalysis,
        keywords: ['image', 'vision', 'analyze', 'ocr'],
        colorTheme: 'text-pink-400',
        primaryColor: 'pink',
        description: 'Multimodal Analysis Unit',
        architecturalContext: 'Analyzes images using Gemini Vision models.',
        category: 'lab'
    },
    { 
        key: 'tool_for_ai', 
        label: 'Jobs', 
        icon: <DeveloperIcon className="w-5 h-5" />, 
        component: ToolforAI,
        keywords: ['job', 'agent', 'runner', 'task', 'background'],
        colorTheme: 'text-orange-400',
        primaryColor: 'orange',
        description: 'Asynchronous Job Runner',
        architecturalContext: 'Executes complex, multi-step tasks in the background.',
        category: 'ops'
    },
    { 
        key: 'oraculum', 
        label: 'Oraculum', 
        icon: <GlobeAltIcon className="w-5 h-5" />, 
        component: Oraculum,
        keywords: ['telemetry', 'analytics', 'insights', 'dashboard'],
        colorTheme: 'text-teal-400',
        primaryColor: 'teal',
        description: 'System Telemetry & Insights',
        architecturalContext: 'Monitors system events and generates AI insights.',
        category: 'ops'
    },
    { 
        key: 'chronicle', 
        label: 'Chronicle', 
        icon: <HistoryIcon className="w-5 h-5" />, 
        component: Chronicle,
        keywords: ['history', 'version', 'diff', 'audit'],
        colorTheme: 'text-amber-400',
        primaryColor: 'amber',
        description: 'Version Control History',
        architecturalContext: 'Tracks changes to prompts, plans, and code over time.',
        category: 'ops'
    },
    { 
        key: 'documentation', 
        label: 'Knowledge', 
        icon: <DatabaseIcon className="w-5 h-5" />, 
        component: KnowledgeStudio,
        keywords: ['rag', 'vector', 'docs', 'etl', 'ingest', 'database'],
        colorTheme: 'text-emerald-300',
        primaryColor: 'emerald',
        description: 'Vector Knowledge Management',
        architecturalContext: 'Interactive RAG interface for managing project data and embeddings.',
        category: 'ops'
    },
    { 
        key: 'deploy', 
        label: 'Deploy', 
        icon: <ServerStackIcon className="w-5 h-5" />, 
        component: lazy(() => import('../deploy/Deploy')),
        keywords: ['release', 'production', 'staging', 'environment'],
        colorTheme: 'text-green-500',
        primaryColor: 'green',
        description: 'Deployment Manager',
        architecturalContext: 'Simulates deployment pipelines to various environments.',
        category: 'ops'
    },
    { 
        key: 'agent_builder', 
        label: 'Agent Builder', 
        icon: <CpuChipIcon className="w-5 h-5" />, 
        component: AgentBuilder,
        keywords: ['meta', 'self', 'improve', 'roadmap'],
        colorTheme: 'text-emerald-400',
        primaryColor: 'emerald',
        description: 'Self-Reflective Workspace',
        architecturalContext: 'A workspace for the AI to plan its own evolution.',
        category: 'system'
    },
    { 
        key: 'serendipity_engine', 
        label: 'Serendipity', 
        icon: <SparklesIcon className="w-5 h-5" />, 
        component: SerendipityEngine,
        keywords: ['idea', 'random', 'inspire', 'creative'],
        colorTheme: 'text-rose-400',
        primaryColor: 'rose',
        description: 'Innovation Generator',
        architecturalContext: 'Generates novel ideas using a slot-machine mechanic.',
        category: 'lab'
    },
    { 
        key: 'system_2001', 
        label: 'HAL 9000', 
        icon: <EyeIcon className="w-5 h-5" />, 
        component: System2001,
        keywords: ['lab', 'visual', '3d', 'hal'],
        colorTheme: 'text-red-500',
        primaryColor: 'red',
        description: 'Experimental Interface',
        architecturalContext: 'A 2001: A Space Odyssey themed visual experiment.',
        category: 'lab'
    },
    { 
        key: 'subscription', 
        label: 'Plan', 
        icon: <StarIcon className="w-5 h-5" />, 
        component: Subscription,
        keywords: ['billing', 'tier', 'usage', 'upgrade'],
        colorTheme: 'text-yellow-400',
        primaryColor: 'yellow',
        description: 'Subscription Management',
        architecturalContext: 'Manages user tiers and feature access limits.',
        category: 'system'
    },
    { 
        key: 'settings', 
        label: 'Settings', 
        icon: <Cog6ToothIcon className="w-5 h-5" />, 
        component: Settings,
        keywords: ['config', 'preferences', 'api', 'key'],
        colorTheme: 'text-slate-400',
        primaryColor: 'slate',
        description: 'System Configuration',
        architecturalContext: 'Global settings for API keys, theming, and feature flags.',
        category: 'system'
    }
];
