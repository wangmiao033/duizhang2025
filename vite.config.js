import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('node_modules/xlsx')) return 'xlsx'
          if (id.includes('node_modules/dayjs')) return 'date'
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/scheduler')
          ) {
            return 'react'
          }
          return 'vendor'
        }
      }
    }
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
})

