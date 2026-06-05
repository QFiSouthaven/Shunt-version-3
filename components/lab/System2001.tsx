
// components/lab/System2001.tsx
import React, { useEffect, useRef, useState } from 'react';
import { audioService } from '../../services/audioService';

// --- Constants & Config ---
const COLORS = {
    bg: '#000000',
    red: '#FF0000',
    blue: '#00AEEF',
    amber: '#FFC200',
    magenta: '#EC008C',
    grid: '#333333'
};

const FONT = "bold 14px 'Courier New', monospace";

// --- 3D Math Helpers ---
interface Point3D { x: number; y: number; z: number; }
interface Point2D { x: number; y: number; }

const rotateX = (p: Point3D, angle: number): Point3D => ({
    x: p.x,
    y: p.y * Math.cos(angle) - p.z * Math.sin(angle),
    z: p.y * Math.sin(angle) + p.z * Math.cos(angle)
});

const rotateY = (p: Point3D, angle: number): Point3D => ({
    x: p.x * Math.cos(angle) + p.z * Math.sin(angle),
    y: p.y,
    z: -p.x * Math.sin(angle) + p.z * Math.cos(angle)
});

const project = (p: Point3D, width: number, height: number): Point2D => {
    const fov = 300;
    const distance = 4;
    const scale = fov / (distance + p.z);
    return {
        x: p.x * scale + width / 2,
        y: p.y * scale + height / 2
    };
};

// --- Shape Definitions ---
const CUBE_VERTICES: Point3D[] = [
    { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 },
    { x: 1, y: 1, z: -1 }, { x: -1, y: 1, z: -1 },
    { x: -1, y: -1, z: 1 }, { x: 1, y: -1, z: 1 },
    { x: 1, y: 1, z: 1 }, { x: -1, y: 1, z: 1 }
];

const CUBE_EDGES = [
    [0, 1], [1, 2], [2, 3], [3, 0], // Back face
    [4, 5], [5, 6], [6, 7], [7, 4], // Front face
    [0, 4], [1, 5], [2, 6], [3, 7]  // Connecting lines
];

const System2001: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<'NORMAL' | 'FATAL'>('NORMAL');
    const [terminalText, setTerminalText] = useState("SYSTEM MONITORING - UNIT 9000");
    
    // --- Loop State Refs (Mutable for Performance) ---
    const timeRef = useRef(0);
    const barsRef = useRef(Array(8).fill(0).map(() => ({ current: Math.random(), target: Math.random() })));
    const rotationRef = useRef({ x: 0, y: 0 });
    const textCursorRef = useRef(true);
    const textTimerRef = useRef(0);
    const requestRef = useRef<number | null>(null);

    // --- The Master Loop ---
    const updateLoop = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Resize handling
        if (containerRef.current) {
            canvas.width = containerRef.current.clientWidth;
            canvas.height = containerRef.current.clientHeight;
        }

        const W = canvas.width;
        const H = canvas.height;
        
        // 1. Clear Screen (Brutalist Black)
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);

        timeRef.current += 0.02;

        if (status === 'NORMAL') {
            renderGridSystem(ctx, W, H);
        } else {
            renderFatalError(ctx, W, H);
        }

        requestRef.current = requestAnimationFrame(updateLoop);
    };

    // --- Sub-System 1: Grid Layout & Containers ---
    const renderGridSystem = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
        const padding = 10;
        const colW = (W - padding * 4) / 3;
        const rowH = (H - padding * 3) / 2;

        // Draw Modules
        drawSineModule(ctx, padding, padding, colW, rowH);
        drawBarModule(ctx, padding * 2 + colW, padding, colW, rowH);
        drawWireframeModule(ctx, padding * 3 + colW * 2, padding, colW, rowH);
        
        // Bottom Wide Module (Text Terminal)
        drawTerminalModule(ctx, padding, padding * 2 + rowH, W - padding * 2, rowH - 20);
        
        // Center Eye (Interaction Point)
        drawEye(ctx, W / 2, H / 2);
    };

    // --- Sub-System 2: Oscilloscope (Sine) ---
    const drawSineModule = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
        drawBorder(ctx, x, y, w, h, COLORS.blue);
        
        ctx.beginPath();
        ctx.strokeStyle = COLORS.blue;
        ctx.lineWidth = 2;

        for (let i = 0; i < w; i += 5) {
            const normalizedX = i / w;
            const wave1 = Math.sin(normalizedX * 10 + timeRef.current * 2);
            const wave2 = Math.cos(normalizedX * 5 - timeRef.current);
            const amplitude = h / 3;
            const py = y + h / 2 + (wave1 * wave2) * amplitude;
            
            if (i === 0) ctx.moveTo(x + i, py);
            else ctx.lineTo(x + i, py);
        }
        ctx.stroke();
        
        drawLabel(ctx, "NAV TELEMETRY", x + 10, y + 20, COLORS.blue);
    };

    // --- Sub-System 3: Telemetry Bars (Lerp) ---
    const drawBarModule = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
        drawBorder(ctx, x, y, w, h, COLORS.amber);
        
        const barWidth = w / barsRef.current.length - 10;
        
        barsRef.current.forEach((bar, i) => {
            // Logic: Interpolate current towards target
            bar.current += (bar.target - bar.current) * 0.05;
            
            // Logic: Pick new target if close
            if (Math.abs(bar.target - bar.current) < 0.01) {
                bar.target = Math.random();
            }

            const bh = bar.current * (h - 40);
            const bx = x + 5 + i * (barWidth + 10);
            const by = y + h - bh - 5;

            ctx.fillStyle = COLORS.amber;
            ctx.fillRect(bx, by, barWidth, bh);
        });

        drawLabel(ctx, "FUEL RESERVES", x + 10, y + 20, COLORS.amber);
    };

    // --- Sub-System 4: 3D Wireframe ---
    const drawWireframeModule = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
        drawBorder(ctx, x, y, w, h, COLORS.magenta);
        
        rotationRef.current.x += 0.01;
        rotationRef.current.y += 0.015;

        // Project Vertices
        const projected = CUBE_VERTICES.map(v => {
            let r = rotateX(v, rotationRef.current.x);
            r = rotateY(r, rotationRef.current.y);
            // Localize coordinate system to this module
            const p = project(r, w, h);
            return { x: p.x + x, y: p.y + y };
        });

        ctx.strokeStyle = COLORS.magenta;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        
        CUBE_EDGES.forEach(edge => {
            const v1 = projected[edge[0]];
            const v2 = projected[edge[1]];
            ctx.moveTo(v1.x, v1.y);
            ctx.lineTo(v2.x, v2.y);
        });
        
        ctx.stroke();
        drawLabel(ctx, "AE-35 UNIT", x + 10, y + 20, COLORS.magenta);
    };

    // --- Sub-System 5: Terminal ---
    const drawTerminalModule = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
        drawBorder(ctx, x, y, w, h, COLORS.red);
        
        // Blink Cursor Logic
        if (Date.now() - textTimerRef.current > 500) {
            textCursorRef.current = !textCursorRef.current;
            textTimerRef.current = Date.now();
        }

        ctx.fillStyle = COLORS.red;
        ctx.font = "16px monospace";
        ctx.fillText(`> ${terminalText}${textCursorRef.current ? '_' : ''}`, x + 20, y + 40);
        
        ctx.font = "12px monospace";
        ctx.fillText(`CPU LOAD: ${Math.floor(Math.random() * 10) + 90}%`, x + 20, y + 70);
        ctx.fillText(`MEMORY:   ${Math.floor(Math.random() * 1000)} TB`, x + 20, y + 90);
    };

    // --- The HAL Eye ---
    const drawEye = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
        // Red Glow
        const gradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, 60);
        gradient.addColorStop(0, '#FFCCCC');
        gradient.addColorStop(0.2, '#FF0000');
        gradient.addColorStop(0.5, '#500000');
        gradient.addColorStop(1, '#000000');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, 60, 0, Math.PI * 2);
        ctx.fill();

        // Yellow center
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Ring
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(cx, cy, 65, 0, Math.PI * 2);
        ctx.stroke();
    };

    // --- Fatal Error View ---
    const renderFatalError = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
        // Center Eye (Larger)
        const cx = W / 2;
        const cy = H / 2;
        
        const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, 200);
        gradient.addColorStop(0, '#FF0000');
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(cx, cy, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COLORS.red;
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "center";
        ctx.fillText("I'M SORRY DAVE.", cx, cy + 150);
        ctx.fillText("I'M AFRAID I CAN'T DO THAT.", cx, cy + 180);
    };

    // --- Utilities ---
    const drawBorder = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
    };

    const drawLabel = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) => {
        ctx.fillStyle = color;
        ctx.font = FONT;
        ctx.fillText(text, x, y);
    };

    const handleInteraction = () => {
        if (status === 'NORMAL') {
            setStatus('FATAL');
            setTerminalText("CRITICAL FAILURE - LOGIC GATES SEVERED");
            audioService.playSound('error');
        } else {
            setStatus('NORMAL');
            setTerminalText("SYSTEM REBOOTED - MEMORY CLEARED");
            audioService.playSound('success');
        }
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(updateLoop);
        return () => {
            if (requestRef.current !== null) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [status]);

    return (
        <div 
            ref={containerRef} 
            className="w-full h-full bg-black relative cursor-crosshair overflow-hidden"
            onClick={handleInteraction}
        >
            <canvas ref={canvasRef} className="block" />
            
            {/* Overlay Scanlines */}
            <div className="absolute inset-0 pointer-events-none" 
                 style={{ 
                     backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                     backgroundSize: '100% 2px, 3px 100%'
                 }} 
            />
        </div>
    );
};

export default System2001;
