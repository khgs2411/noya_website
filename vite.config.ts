import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/noya_website/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return undefined

          if (id.includes('/node_modules/@class-kit/')) return 'class-kit'
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-i18next/') ||
            id.includes('/node_modules/i18next') ||
            id.includes('/node_modules/i18next-browser-languagedetector/')
          ) {
            return 'react-vendor'
          }
          if (id.includes('/node_modules/lucide-react/')) return 'icons'

          return 'vendor'
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
