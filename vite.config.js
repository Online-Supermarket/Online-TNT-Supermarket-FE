import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api/auth': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/api/products': {
        target: 'http://localhost:5003',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://localhost:5003',
        changeOrigin: true,
      },
      '/api/categories': {
        target: 'http://localhost:5003',
        changeOrigin: true,
      },
      '/api/stores': {
        target: 'http://localhost:5003',
        changeOrigin: true,
      },
      '/api/inventory': {
        target: 'http://localhost:5003',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
