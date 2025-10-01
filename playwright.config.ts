import { defineConfig, devices } from '@playwright/test'

const useWebServer = !process.env.CI

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://127.0.0.1:8787',
    headless: true,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: useWebServer ? {
    command: 'npm run start:server',
    url: 'http://localhost:8787',
    reuseExistingServer: true,
    timeout: 180_000,
    env: {
      SERVE_STATIC: '1',
      PORT: '8787',
      NODE_ENV: 'test',
    },
  } : undefined,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})
