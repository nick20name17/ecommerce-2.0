import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ['lucide-react']
  },
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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/'))
            return 'vendor-react'
          if (id.includes('node_modules/@tanstack/react-router'))
            return 'vendor-router'
          if (id.includes('node_modules/@tanstack/react-query'))
            return 'vendor-query'
          if (id.includes('node_modules/radix-ui') || id.includes('node_modules/recharts'))
            return 'vendor-ui'
        }
      }
    }
  },
  server: {
    port: 3000,
    watch: {
      ignored: ['**/.claude/**', '**/.tanstack/**']
    }
  }
})
