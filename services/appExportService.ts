
// services/appExportService.ts
import { ShuntApp } from '../types';

export const generateStandaloneHtml = (app: { name: string; description: string; icon: string; color: string; instruction: string }) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${app.name} - Aether Shunt Executable</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script type="importmap">
    {
      "imports": {
        "@google/genai": "https://esm.sh/@google/genai@0.1.1"
      }
    }
    </script>
    <style>
        body { background-color: #09090b; color: #e2e8f0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        .glass { background: rgba(39, 39, 42, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .input-glass { background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); }
        /* Scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        .prose p { margin-bottom: 0.5em; }
        .prose ul { list-style-type: disc; padding-left: 1.5em; }
        .prose h1, .prose h2, .prose h3 { color: white; font-weight: bold; margin-top: 1em; margin-bottom: 0.5em; }
        .prose code { background: rgba(255,255,255,0.1); padding: 0.2em 0.4em; border-radius: 4px; font-family: monospace; }
        .prose pre { background: rgba(0,0,0,0.5); padding: 1em; border-radius: 8px; overflow-x: auto; }
        /* Animations */
        @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 15px -5px rgba(var(--color-rgb), 0.3); }
            50% { box-shadow: 0 0 25px -5px rgba(var(--color-rgb), 0.6); }
        }
    </style>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: colors => colors.${app.color}
                    }
                }
            }
        }
    </script>
</head>
<body class="h-screen flex flex-col overflow-hidden selection:bg-${app.color}-500/30 selection:text-${app.color}-200">
    <div class="flex-grow flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full gap-6">
        
        <!-- Header -->
        <header class="flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-4">
                <div class="text-4xl filter drop-shadow-lg">${app.icon}</div>
                <div>
                    <h1 class="text-2xl font-bold text-white tracking-tight">${app.name}</h1>
                    <p class="text-gray-400 text-sm font-medium">${app.description}</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                 <button id="clearKeyBtn" class="text-xs text-gray-500 hover:text-red-400 transition-colors hidden">Reset Key</button>
                 <div class="hidden md:block glass px-3 py-1.5 rounded-full text-xs font-bold text-${app.color}-400 border-${app.color}-500/30 border uppercase tracking-widest shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                    Standalone Executable
                </div>
            </div>
        </header>

        <!-- API Config -->
        <div id="apiKeySection" class="glass rounded-xl p-4 flex flex-col gap-2 flex-shrink-0">
            <label class="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                Gemini API Key
            </label>
            <input type="password" id="apiKey" placeholder="Paste your Google Gemini API Key here (starts with AIza...)" class="w-full input-glass rounded-lg p-2.5 text-sm text-white placeholder-gray-600 focus:border-${app.color}-500 outline-none transition-colors font-mono" />
            <p class="text-[10px] text-gray-600">Key is stored locally in your browser for convenience.</p>
        </div>

        <!-- Main Workspace -->
        <div class="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
            <!-- Input -->
            <div class="flex flex-col gap-2 h-full">
                <label class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Input Payload</label>
                <textarea id="input" class="flex-grow w-full input-glass bg-gray-900/40 rounded-xl p-4 text-gray-200 focus:border-${app.color}-500 outline-none resize-none transition-all placeholder-gray-700 font-mono text-sm leading-relaxed" placeholder="Enter text to process..."></textarea>
            </div>
            
            <!-- Output -->
            <div class="flex flex-col gap-2 h-full">
                <div class="flex justify-between items-center">
                    <label class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Neural Output</label>
                    <button id="copyBtn" class="text-[10px] text-gray-500 hover:text-white transition-colors">Copy</button>
                </div>
                <div id="output" class="flex-grow w-full glass bg-black/40 rounded-xl p-4 text-gray-300 overflow-y-auto font-mono text-sm whitespace-pre-wrap shadow-inner border-gray-800 prose prose-invert"></div>
            </div>
        </div>

        <!-- Action Bar -->
        <button id="runBtn" class="w-full py-4 bg-${app.color}-600 hover:bg-${app.color}-500 text-white font-bold rounded-xl shadow-lg hover:shadow-${app.color}-500/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-sm uppercase tracking-wide">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg>
            Execute Logic
        </button>
    </div>

    <script type="module">
        import { GoogleGenAI } from "@google/genai";

        const runBtn = document.getElementById('runBtn');
        const outputDiv = document.getElementById('output');
        const inputEl = document.getElementById('input');
        const apiKeyEl = document.getElementById('apiKey');
        const copyBtn = document.getElementById('copyBtn');
        const clearKeyBtn = document.getElementById('clearKeyBtn');
        const apiKeySection = document.getElementById('apiKeySection');

        // Load persisted key
        const savedKey = localStorage.getItem('gemini_api_key_standalone');
        if(savedKey) {
            apiKeyEl.value = savedKey;
            apiKeySection.style.display = 'none';
            clearKeyBtn.style.display = 'block';
        }

        // Auto-save key on input
        apiKeyEl.addEventListener('input', (e) => {
            localStorage.setItem('gemini_api_key_standalone', e.target.value.trim());
        });
        
        clearKeyBtn.addEventListener('click', () => {
            localStorage.removeItem('gemini_api_key_standalone');
            apiKeyEl.value = '';
            apiKeySection.style.display = 'flex';
            clearKeyBtn.style.display = 'none';
        });

        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(outputDiv.innerText);
            const original = copyBtn.innerText;
            copyBtn.innerText = 'Copied!';
            setTimeout(() => copyBtn.innerText = original, 2000);
        });

        runBtn.addEventListener('click', async () => {
            const key = apiKeyEl.value.trim();
            const prompt = inputEl.value.trim();
            
            if(!key) { 
                apiKeySection.style.display = 'flex';
                alert('API Key required'); 
                return; 
            }
            if(!prompt) { alert('Input required'); return; }
            
            // Hide key section if valid run
            if(savedKey) {
                 apiKeySection.style.display = 'none';
                 clearKeyBtn.style.display = 'block';
            }

            // UI Loading State
            runBtn.disabled = true;
            const originalText = runBtn.innerHTML;
            runBtn.innerHTML = '<span class="animate-pulse">Processing...</span>';
            outputDiv.innerHTML = '';
            outputDiv.classList.add('opacity-50');

            try {
                const ai = new GoogleGenAI({ apiKey: key });
                
                const response = await ai.models.generateContent({
                    model: 'gemini-3-pro-preview',
                    contents: prompt,
                    config: {
                        systemInstruction: ${JSON.stringify(app.instruction)}
                    }
                });

                // Render Markdown
                outputDiv.innerHTML = marked.parse(response.text);
                outputDiv.classList.remove('opacity-50');
            } catch (e) {
                outputDiv.innerHTML = '<span class="text-red-400 font-bold">Error:</span> ' + e.message;
                outputDiv.classList.remove('opacity-50');
                if(e.message.includes('API key')) {
                    apiKeySection.style.display = 'flex';
                }
            } finally {
                runBtn.disabled = false;
                runBtn.innerHTML = originalText;
            }
        });
    </script>
</body>
</html>`;
};
