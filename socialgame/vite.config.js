import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        // React em um chunk próprio (cache longo); modais pesados já saem em chunks via React.lazy.
        manualChunks: { react: ['react', 'react-dom'] },
      },
    },
  },
});
