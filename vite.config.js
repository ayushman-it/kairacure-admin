import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: {
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', 'bogged-latticed-uncommon.ngrok-free.dev'],
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
