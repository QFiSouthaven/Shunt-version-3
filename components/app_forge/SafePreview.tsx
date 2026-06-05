
// components/app_forge/SafePreview.tsx
import React, { useMemo, useRef } from 'react';
import { LockIcon, ShieldCheckIcon } from '../icons';

interface SafePreviewProps {
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  title?: string;
  onAppMessage?: (data: any) => void;
}

/**
 * HARDENED SANDBOX PREVIEW
 * Implements strict origin isolation to prevent AI-generated code from
 * accessing the parent window's localStorage (where API keys reside).
 */
export const SafePreview: React.FC<SafePreviewProps> = ({
  htmlCode,
  cssCode,
  jsCode,
  title = "Aether Isolated Instance",
  onAppMessage
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const srcDoc = useMemo(() => `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; color: #333; }
          ${cssCode}
        </style>
      </head>
      <body>
        ${htmlCode}
        <script>
          // BLOCK SIBLING/PARENT ACCESS
          (function() {
            try {
              window.parent = null;
              window.top = null;
              window.localStorage = {};
              window.sessionStorage = {};
              window.indexedDB = null;
            } catch (e) {}

            // Communication Bridge (PostMessage Only)
            window.aether = {
              send: (data) => window.parent.postMessage({ type: 'AETHER_APP_SIGNAL', payload: data }, '*')
            };

            // Execute Application Logic
            try {
              ${jsCode}
            } catch (err) {
              console.error("Runtime Error:", err);
              document.body.innerHTML += \`
                <div style="margin-top:20px; padding:15px; background:#fee2e2; border:1px solid #ef4444; border-radius:8px; color:#b91c1c; font-family:monospace; font-size:12px;">
                  <strong>KERNEL_PANIC:</strong> \${String(err.message).replace(/</g,'&lt;').replace(/>/g,'&gt;')}
                </div>
              \`;
            }
          })();
        </script>
      </body>
    </html>
  `, [htmlCode, cssCode, jsCode]);

  return (
    <div className="w-full h-full flex flex-col border border-gray-800 rounded-xl overflow-hidden bg-white shadow-2xl">
      <div className="bg-gray-900 text-[10px] px-3 py-2 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-gray-400 font-bold uppercase tracking-widest">{title}</span>
        </div>
        <div className="flex items-center gap-2 text-indigo-400 font-mono">
          <ShieldCheckIcon className="w-3 h-3" />
          <span>ORIGIN_ISOLATION: ACTIVE</span>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        title={title}
        srcDoc={srcDoc}
        className="flex-grow w-full border-0"
        // SECURITY CONFIGURATION
        // - allow-scripts: Enables execution of the app
        // - allow-forms: Enables form submissions within the app
        // - NO allow-same-origin: Blocks access to parent localStorage/Cookies
        sandbox="allow-scripts allow-forms allow-modals"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
