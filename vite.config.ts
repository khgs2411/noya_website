import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { version } from './package.json'

export default defineConfig({
  base: '/noya_website/',
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
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
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'app-version',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ version }),
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
