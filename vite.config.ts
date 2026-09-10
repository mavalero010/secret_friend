import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' permite GitHub Pages (project pages) sin hardcodear el nombre del repo
export default defineConfig({
  plugins: [react()],
  base: './',
})
