import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /api to the NestJS server during development so the browser talks to
// a single origin and CORS never gets in the way.
// The app is served at the domain root on the VPS (behind nginx/Traefik), so the
// base path is `/`. Override with VITE_BASE only if you host it under a subpath.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? process.env.VITE_BASE ?? '/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    // Allow reaching the dev server through an ngrok tunnel (handy for
    // previewing the public e-invite on a phone or sharing a temporary link).
    // A leading dot allows the domain and all its subdomains.
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.io', '.ngrok.app'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
}));
