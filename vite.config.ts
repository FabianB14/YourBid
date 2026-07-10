import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During local development the Anthropic-backed item generator runs as a tiny
// Node server (see server/dev-server.mjs) on port 8787. We proxy /api to it so
// the frontend can call the same relative path it uses in production (Vercel
// serverless functions under /api).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
