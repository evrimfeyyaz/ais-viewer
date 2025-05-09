import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  process.env = {...process.env, ...loadEnv(mode, process.cwd())};

  return {
    server: {
      proxy: {
        '/api': {
          target: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
          changeOrigin: true,
      },
    },
    port: 5173,
    },
  };
});
