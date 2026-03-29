import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Default true clears the terminal; some setups look "empty" after npm prints the script line.
  clearScreen: false,
  logLevel: 'info',
  server: {
    host: '127.0.0.1',
    strictPort: false,
  },
  plugins: [react(), tailwindcss()],
})
