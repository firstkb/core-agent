import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 8788,
      proxy: {
        '/api': env.VITE_MAESTRO_API_PROXY_TARGET || 'http://127.0.0.1:8787'
      }
    },
    preview: {
      host: '127.0.0.1',
      port: 8789
    }
  };
});
