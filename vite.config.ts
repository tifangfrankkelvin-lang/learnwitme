// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// This is the main Vite configuration file.
// We're adding two plugins:
// 1. react() — enables React support (JSX, fast refresh in dev)
// 2. tailwindcss() — processes Tailwind CSS classes automatically
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})