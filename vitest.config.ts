/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    isolate: true,
    sequence: {
      shuffle: false,
    },
    silent: false,
    reporter: ['verbose'],
    onConsoleLog(log, type) {
      // Suppress Node.js internal module warnings
      if (log.includes('node:internal') || 
          log.includes('Module._compile') || 
          log.includes('Module.load') ||
          log.includes('Object.Module._extensions')) {
        return false
      }
      return true
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
})