import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  projects: [
    { name: 'Chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
