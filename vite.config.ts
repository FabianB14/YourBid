import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The production `base` must match where the app is served from. For a GitHub
// Pages *project* site that's `/<repo>/` (e.g. https://user.github.io/YourBid/).
// Override with the VITE_BASE env var (the Pages workflow sets it automatically
// from the repo name); defaults to '/YourBid/'. Dev always serves from '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? process.env.VITE_BASE || '/YourBid/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // During local dev the Anthropic-backed generator runs as a tiny Node
      // server (server/dev-server.mjs) on :8787. Proxy /api to it so the
      // frontend calls the same relative path it would in a serverless deploy.
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
}));
