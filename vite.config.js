import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    /* Target modern browsers — drops legacy polyfills, smaller bundles */
    target: 'es2020',
    /* Warn if any chunk exceeds 250KB (default is 500KB) */
    chunkSizeWarningLimit: 250,
    /* Enable CSS code splitting — each lazy route gets its own CSS chunk */
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          /* Core framework — changes rarely, cached long-term */
          vendor: ['react', 'react-dom', 'react-router'],
          /* State management */
          state: ['zustand'],
          /* Supabase client — ~40KB, separate from vendor for cache efficiency */
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
