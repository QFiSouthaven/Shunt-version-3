
// components/serendipity/SerendipityEngine.tsx
import React, { useState, useCallback } from 'react';
import { generateRawText } from '../../services/geminiService';
import { SparklesIcon, BoltIcon, ClipboardDocumentIcon, LightBulbIcon } from '../icons';
import Loader from '../Loader';
import { useMailbox } from '../../context/MailboxContext';
import { audioService } from '../../services/audioService';
import { useTelemetry } from '../../context/TelemetryContext';
import MarkdownRenderer from '../common/MarkdownRenderer';

const LENSES = [
    "Biomimicry", "Cybernetics", "Minimalism", "Chaos Theory", "Fractal Geometry", 
    "Game Theory", "Quantum Mechanics", "Brutalist Architecture", "Neuroplasticity",
    "Swarm Intelligence", "Retro-Futurism", "Industrial Design"
];

const TARGETS = [
    "User Interface", "Database Schema", "API Design", "User Journey", 
    "System Architecture", "Deployment Pipeline", "Error Handling", 
    "Onboarding Flow", "Data Visualization", "Notification System",
    "Search Algorithm", "Authentication Flow"
];

const TWISTS = [
    "Offline-first", "Voice-only interaction", "No text allowed", "Gamified rewards", 
    "Self-destructing data", "Collaborative real-time", "Zero-knowledge privacy", 
    "AI-driven adaptation", "Haptic feedback only", "Low-bandwidth optimized",
    "Blockchain-backed", "Ephemeral sessions"
];

const SerendipityEngine: React.FC = () => {
    const [slots, setSlots] = useState({ lens: '?', target: '?', twist: '?' });
    const [idea, setIdea] = useState<string | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const { deliverFiles } = useMailbox();
    const { telemetryService } = useTelemetry();

    const spinSlots = useCallback(async () => {
        if (isSpinning || isGenerating) return;
        
        setIsSpinning(true);
        setIdea(null);
        audioService.playSound('click');

        // Animation effect for slots
        let duration = 1500;
        let start = Date.now();
        
        const animate = () => {
            const now = Date.now();
            if (now - start < duration) {
                setSlots({
                    lens: LENSES[Math.floor(Math.random() * LENSES.length)],
                    target: TARGETS[Math.floor(Math.random() * TARGETS.length)],
                    twist: TWISTS[Math.floor(Math.random() * TWISTS.length)],
                });
                requestAnimationFrame(animate);
            } else {
                // Final Landing
                const finalSlots = {
                    lens: LENSES[Math.floor(Math.random() * LENSES.length)],
                    target: TARGETS[Math.floor(Math.random() * TARGETS.length)],
                    twist: TWISTS[Math.floor(Math.random() * TWISTS.length)],
                };
                setSlots(finalSlots);
                setIsSpinning(false);
                generateIdea(finalSlots);
            }
        };
        
        animate();
    }, [isSpinning, isGenerating]);

    const generateIdea = async (currentSlots: typeof slots) => {
        setIsGenerating(true);
        audioService.playSound('send');

        try {
            const prompt = `
You are a Radical Innovation Engine.
Generate a novel, innovative software concept by synthetically combining these three elements:

1.  **Theoretical Lens:** ${currentSlots.lens}
2.  **Target Domain:** ${currentSlots.target}
3.  **Constraint/Twist:** ${currentSlots.twist}

**Instructions:**
- Apply the *Lens* to the *Target* deeply, not superficially.
- Force the *Twist* to be a core mechanic, not an afterthought.
- Output a structured "Concept Card" with:
    - **Title:** A catchy, sci-fi or abstract name.
    - **The Pitch:** A 2-sentence elevator pitch.
    - **Core Mechanic:** How it works technically.
    - **Why it Matters:** The unique value proposition.

Keep it concise, provocative, and inspiring.
`;
            const { resultText } = await generateRawText(prompt, 'gemini-3-flash-preview');
            setIdea(resultText);
            audioService.playSound('success');
            
            telemetryService?.recordEvent({
                eventType: 'ai_response',
                interactionType: 'serendipity_generation',
                tab: 'serendipity_engine',
                userInput: JSON.stringify(currentSlots),
                outcome: 'success'
            });

        } catch (error) {
            console.error(error);
            setIdea("The Aether was cloudy. Please try again.");
            audioService.playSound('error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!idea) return;
        await deliverFiles([{
            path: `serendipity-idea-${Date.now()}.md`,
            content: `
# Serendipity Engine Export
**Lens:** ${slots.lens}
**Target:** ${slots.target}
**Twist:** ${slots.twist}

---
${idea}
            `
        }]);
        audioService.playSound('success');
    };

    return (
        <div className="flex flex-col h-full bg-[#050505] relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-fuchsia-900/10 blur-[100px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center h-full p-6">
                <div className="max-w-4xl w-full flex flex-col gap-8">
                    
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 tracking-tight uppercase">
                            Serendipity Engine
                        </h1>
                        <p className="text-gray-500 font-mono text-sm">Lateral Thinking Generator // v1.0</p>
                    </div>

                    {/* The Slots */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SlotCard label="Lens" value={slots.lens} color="border-fuchsia-500/50 text-fuchsia-300" isSpinning={isSpinning} delay={0} />
                        <SlotCard label="Target" value={slots.target} color="border-cyan-500/50 text-cyan-300" isSpinning={isSpinning} delay={100} />
                        <SlotCard label="Twist" value={slots.twist} color="border-yellow-500/50 text-yellow-300" isSpinning={isSpinning} delay={200} />
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-center">
                        <button
                            onClick={spinSlots}
                            disabled={isSpinning || isGenerating}
                            className="group relative px-8 py-4 bg-gray-900 border border-gray-700 rounded-full overflow-hidden transition-all hover:border-gray-500 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/20 to-cyan-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-3 relative z-10">
                                {isSpinning || isGenerating ? <Loader className="w-6 h-6" /> : <BoltIcon className="w-6 h-6 text-white" />}
                                <span className="text-lg font-bold text-white tracking-widest uppercase">
                                    {isSpinning ? 'Synchronizing...' : isGenerating ? 'Synthesizing...' : 'Ignite Spark'}
                                </span>
                            </div>
                        </button>
                    </div>

                    {/* Result Card */}
                    {idea && !isSpinning && !isGenerating && (
                        <div className="animate-fade-in bg-gray-900/80 border border-gray-700 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-fuchsia-500 to-cyan-500" />
                            
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <SparklesIcon className="w-5 h-5" />
                                    <span className="text-xs font-mono uppercase tracking-wider">Concept Generated</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleSave} className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors" title="Save to Mailbox">
                                        <ClipboardDocumentIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="prose prose-invert max-w-none">
                                <MarkdownRenderer content={idea} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SlotCard: React.FC<{ label: string, value: string, color: string, isSpinning: boolean, delay: number }> = ({ label, value, color, isSpinning, delay }) => (
    <div className={`bg-gray-900/50 border ${color} rounded-xl p-6 flex flex-col items-center justify-center h-32 relative overflow-hidden transition-all duration-300 ${isSpinning ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}>
        <span className="absolute top-3 left-3 text-[10px] font-bold uppercase text-gray-600 tracking-widest">{label}</span>
        <div className={`text-xl font-bold text-center transition-all duration-100 ${isSpinning ? 'blur-sm translate-y-1' : 'blur-0 translate-y-0'}`}>
            {value}
        </div>
    </div>
);

export default SerendipityEngine;
