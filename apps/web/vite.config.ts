import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /api to the NestJS server during development so the browser talks to
// a single origin and CORS never gets in the way.
export default defineConfig({
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
});
