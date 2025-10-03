import { defineConfig, devices } from '@playwright/test'

const useWebServer = !process.env.CI

export default defineConfig({
  // No global testDir - each project defines its own to avoid conflicts
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: process.env.CI ? 1 : 2, // Reduce concurrency to avoid resource contention
  use: {
    baseURL: 'http://127.0.0.1:3001',
    headless: true,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: useWebServer ? {
    command: 'npm run start:server',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 180_000,
    env: {
      SERVE_STATIC: '1',
      PORT: '3001',
      NODE_ENV: 'test',
    },
  } : undefined,
  projects: [
    // Main E2E Tests - Cross-browser testing
    {
      name: 'e2e-chromium',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'e2e-firefox',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'e2e-webkit',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Safari'] }
    },
    
    // Performance Testing
    {
      name: 'performance',
      testDir: './tests/performance',
      timeout: 60000, // 1 minute timeout for load tests
      retries: 1,
      use: {
        ...devices['Desktop Chrome'],
        // Disable animations for consistent performance measurements
        reducedMotion: 'reduce',
      },
    },
    
    // API Contract Testing
    {
      name: 'contract',
      testDir: './tests/contract',
      timeout: 30000,
      retries: 2,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    
    // Visual Regression Testing
    {
      name: 'visual',
      testDir: './tests/visual',
      timeout: 30000,
      retries: 1,
      use: {
        ...devices['Desktop Chrome'],
        // Disable animations for consistent screenshots
        reducedMotion: 'reduce',
      },
    },
    
    // Mobile & Responsive Testing
    {
      name: 'mobile',
      testDir: './tests/mobile',
      timeout: 45000,
      retries: 1,
      use: {
        ...devices['iPhone 12'],
        hasTouch: true,
      },
    },
    
    // Accessibility Testing (WCAG 2.1 AA)
    {
      name: 'accessibility',
      testDir: './tests/accessibility',
      timeout: 30000,
      retries: 1,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    
    // Security Testing
    {
      name: 'security',
      testDir: './tests/security',
      timeout: 30000,
      retries: 2,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    
    // Edge Cases & Error Handling
    {
      name: 'edge-cases',
      testDir: './tests/edge-cases',
      timeout: 45000,
      retries: 2,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
})
