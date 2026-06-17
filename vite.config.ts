import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * 生产构建收紧 CSP：index.html 的 CSP 为兼容 Vite 开发期 HMR 保留了
 * script-src 'unsafe-inline' 'unsafe-eval'；生产构建无需 inline script，
 * 这里在构建产物里把 script-src 收紧为 'self'，开发期不受影响。
 */
function strictCspOnBuild(): Plugin {
  return {
    name: 'strict-csp-on-build',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        "script-src 'self' 'unsafe-inline' 'unsafe-eval';",
        "script-src 'self';"
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), strictCspOnBuild()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'android/',
        'ios/',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor';
          }
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }
          if (id.includes('node_modules/antd-mobile')) {
            return 'mobile';
          }
          if (id.includes('node_modules/zustand') || id.includes('node_modules/dayjs')) {
            return 'utils';
          }
        },
      },
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/healthz': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
