import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base "./" so the built site works from any folder on a static host
export default defineConfig({
  base: './',
  plugins: [react()],
})
