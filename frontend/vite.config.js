import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/open-browser':   'http://localhost:8000',
      '/confirm-login':  'http://localhost:8000',
      '/analyse':        'http://localhost:8000',
      '/tailor':         'http://localhost:8000',
      '/cover-letter':   'http://localhost:8000',
      '/download':       'http://localhost:8000',
      '/outputs':        'http://localhost:8000',
      '/shutdown':       'http://localhost:8000',
    }
  }
})