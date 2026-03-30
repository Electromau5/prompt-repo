import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  clearScreen: false,
  logLevel: 'info',
  server: {
    host: '127.0.0.1',
    strictPort: false,
  },
  plugins: [react(), tailwindcss()],
})
