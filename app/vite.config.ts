import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Honour the port assigned by the launcher (falls back to Vite's default).
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
});
