import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Get ports from environment variables or use defaults
const APP_PORT = parseInt(process.env.APP_PORT || '3456', 10);
const API_PORT = parseInt(process.env.API_PORT || '3458', 10);
const API_URL = process.env.VITE_API_URL || `http://localhost:${API_PORT}`;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: APP_PORT,
    host: '0.0.0.0',
    open: true,
    cors: true,
    proxy: {
      '/api/export': {
        target: API_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/videos': {
        target: API_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
  },
  esbuild: {
    loader: 'tsx',
    include: ['src/**/*.ts', 'src/**/*.tsx'],
  },
});
