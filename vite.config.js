import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    host: '0.0.0.0', // Listen on all interfaces for Tailscale access
    strictPort: true,
    // Proxy configuration for backend API
    proxy: {
      '/api': {
        target: 'http://localhost:3002', // Match backend port
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: 'ws://localhost:3002', // Match backend WebSocket port
        ws: true,
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  optimizeDeps: {
    exclude: ['cesium']
  }
})
