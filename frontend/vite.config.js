import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true
  },
  build: {
    rollupOptions: {
      output: {
        // Letting Vite/Rollup handle chunking natively
      }
    }
  }
})
