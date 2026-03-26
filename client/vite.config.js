import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    allowedHosts: ['maximus-eudiometric-teughly.ngrok-free.dev'],
    proxy: {
      '/api': 'https://net-stack-fruit-gone.trycloudflare.com/'
    }
  },
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
})

