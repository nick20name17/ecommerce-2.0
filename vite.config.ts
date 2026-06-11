/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true
    }),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']]
      }
    }),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}']
  },
  server: {
    port: 3000,
    watch: {
      ignored: ['**/.claude/**', '**/.tanstack/**']
    },
    // Same-origin dev mode: set VITE_API_URL= (empty) in .env.local and the
    // app calls /api + /ws on the Vite origin; these proxies forward to the
    // real backend server-side, so no CORS and no fixed port required.
    proxy: {
      '/api': {
        target: 'https://api.ebms.app',
        changeOrigin: true
      },
      '/ws': {
        target: 'https://api.ebms.app',
        changeOrigin: true,
        ws: true
      }
    }
  }
})
