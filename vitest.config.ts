/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
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
    css: true,
    // Run test files serially to avoid cross-file env interference (timeout tests)
    fileParallelism: false,
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules', 'dist', '.idea', '.git', '.cache', 
      'tests/e2e/**',
      // Exclude Playwright test files - they should run under the Playwright test runner
      'tests/performance/**/*.spec.*',
      'tests/contract/**/*.spec.*', 
      'tests/visual/**/*.spec.*',
      'tests/mobile/**/*.spec.*',
      'tests/accessibility/**/*.spec.*',
      'tests/security/**/*.spec.*',
      'tests/edge-cases/**/*.spec.*',
      // More specific exclusions
      '**/tests/performance/**',
      '**/tests/contract/**',
      '**/tests/visual/**',
      '**/tests/mobile/**',
      '**/tests/accessibility/**',
      '**/tests/security/**',
      '**/tests/edge-cases/**'
    ],
  },
})