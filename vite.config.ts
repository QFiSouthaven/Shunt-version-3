
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SECURITY: Define secure headers for the server
const secureHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, path.resolve('.'), '');

  return {
    // Base public path — set DEPLOY_BASE=/app/ when building for hosting under a sub-path
    base: env.DEPLOY_BASE || '/',
    plugins: [
      react({
        babel: {
          plugins: [
            ["babel-plugin-react-compiler", { target: "19" }],
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
        '@components': path.resolve(__dirname, './components'),
        '@hooks': path.resolve(__dirname, './hooks'),
        '@services': path.resolve(__dirname, './services'),
        '@context': path.resolve(__dirname, './context'),
        '@types': path.resolve(__dirname, './types'),
        '@utils': path.resolve(__dirname, './utils'),
        '@data': path.resolve(__dirname, './data')
      },
    },
    define: {
      // Polyfill process.env.API_KEY specifically for the existing services
      // Gemini is dormant in production — empty string keeps the build/runtime safe without a key
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    server: {
      port: 3000,
      host: true, // Listen on all local IPs
      headers: secureHeaders,
      hmr: {
        overlay: true,
      },
      // Proxy configuration to bypass CORS for Local LLMs
      proxy: {
        // Proxy for LM Studio / OpenAI Compatible endpoints
        '/v1': {
          target: 'http://localhost:1234',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('proxy error', err);
            });
          },
        },
        // Proxy for Ollama endpoints
        '/api': {
          target: 'http://localhost:11434',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false, // Disable source maps in prod for security
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'reactflow'],
            ai: ['@google/genai'],
          },
        },
      },
    }
  };
});
