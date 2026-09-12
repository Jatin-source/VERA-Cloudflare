import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Allow access from Cloudflare tunnel and any external host
    allowedHosts: ['.trycloudflare.com'],
    cors: true,
  },
})
