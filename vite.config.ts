import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Let ngrok links through; otherwise Vite answers "Blocked request. This host is not allowed."
  server: { allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev'] },
})
