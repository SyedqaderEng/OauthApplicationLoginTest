import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/oauth': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/.well-known': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/jwks': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
})
