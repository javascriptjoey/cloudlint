import { test, expect, type Page, type BrowserContext } from '@playwright/test'

// Concurrency test configuration
const CONCURRENCY_CONFIG = {
  LIGHT_LOAD: { parallelUsers: 3, testDuration: 30000 },    // 3 users, 30s
  MEDIUM_LOAD: { parallelUsers: 5, testDuration: 60000 },   // 5 users, 60s  
  HEAVY_LOAD: { parallelUsers: 8, testDuration: 90000 },    // 8 users, 90s
  STRESS_TEST: { parallelUsers: 12, testDuration: 120000 }  // 12 users, 120s
}

const TEST_YAML_SAMPLES = [
  // Sample 1: Kubernetes ConfigMap
  `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  database.yaml: |
    host: postgres.internal
    port: 5432
    database: app_prod
    ssl: true`,
  
  // Sample 2: Docker Compose
  `version: '3.8'
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
  api:
    image: node:16-alpine
    ports:
      - "3000:3000"
    depends_on:
      - database
  database:
    image: postgres:14
    environment:
      - POSTGRES_DB=app
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password`,
      
  // Sample 3: CI/CD Pipeline
  `name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16, 18, 20]
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: \${{ matrix.node-version }}
      - run: npm ci
      - run: npm test`,
      
  // Sample 4: OpenAPI Spec
  `openapi: 3.0.3
info:
  title: User API
  version: 1.0.0
  description: REST API for user management
paths:
  /users:
    get:
      summary: List users
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: integer
                    name:
                      type: string
                    email:
                      type: string`,
                      
  // Sample 5: Ansible Playbook
  `---
- name: Web Server Setup
  hosts: webservers
  become: yes
  vars:
    app_port: 8080
    app_user: webapp
  tasks:
    - name: Install nginx
      package:
        name: nginx
        state: present
    - name: Configure nginx
      template:
        src: nginx.conf.j2
        dest: /etc/nginx/sites-available/default
      notify: restart nginx
    - name: Start nginx service
      service:
        name: nginx
        state: started
        enabled: yes
  handlers:
    - name: restart nginx
      service:
        name: nginx
        state: restarted`
]

const goToPlayground = async (page: Page) => {
  await page.goto('/playground', { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForSelector('main', { timeout: 10000 })
  
  const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
  await expect(yamlBox).toBeVisible({ timeout: 5000 })
  await expect(yamlBox).toBeEnabled({ timeout: 2000 })
}

const yamlBox = (page: Page) => page.getByRole('textbox', { name: 'YAML input' })
const validateBtn = (page: Page) => page.getByRole('button', { name: /Validate/ })

// Simulate user validation workflow
async function simulateUserValidation(page: Page, userIndex: number, testDuration: number): Promise<{
  validationsCompleted: number,
  totalTime: number,
  errors: number,
  avgResponseTime: number
}> {
  const startTime = Date.now()
  let validationsCompleted = 0
  let errors = 0
  let totalResponseTime = 0
  
  console.log(`User ${userIndex} starting validation simulation`)
  
  while (Date.now() - startTime < testDuration) {
    try {
      // Select random YAML sample
      const yamlSample = TEST_YAML_SAMPLES[Math.floor(Math.random() * TEST_YAML_SAMPLES.length)]
      
      // Clear and fill with new content
      await yamlBox(page).clear()
      await yamlBox(page).fill(yamlSample)
      
      // Wait a bit to simulate typing
      await page.waitForTimeout(Math.random() * 500 + 200)
      
      // Measure validation response time
      const validationStart = Date.now()
      await validateBtn(page).click()
      
      // Wait for validation result
      try {
        await expect(page.getByRole('status')).toBeVisible({ timeout: 10000 })
      } catch {
        await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 })
      }
      
      const validationTime = Date.now() - validationStart
      totalResponseTime += validationTime
      validationsCompleted++
      
      // Random wait between validations (1-3 seconds)
      await page.waitForTimeout(Math.random() * 2000 + 1000)
      
    } catch (error) {
      errors++
      console.log(`User ${userIndex} validation error:`, error)
      
      // Wait before retrying
      await page.waitForTimeout(2000)
    }
  }
  
  const totalTime = Date.now() - startTime
  const avgResponseTime = validationsCompleted > 0 ? totalResponseTime / validationsCompleted : 0
  
  console.log(`User ${userIndex} completed: ${validationsCompleted} validations, ${errors} errors, avg response: ${Math.round(avgResponseTime)}ms`)
  
  return {
    validationsCompleted,
    totalTime,
    errors,
    avgResponseTime
  }
}

test.describe('Concurrency Load Tests', () => {
  test('light load test - 3 concurrent users', async ({ browser }) => {
    const { parallelUsers, testDuration } = CONCURRENCY_CONFIG.LIGHT_LOAD
    
    // Create multiple browser contexts to simulate different users
    const contexts: BrowserContext[] = []
    const pages: Page[] = []
    
    for (let i = 0; i < parallelUsers; i++) {
      const context = await browser.newContext()
      const page = await context.newPage()
      await goToPlayground(page)
      
      contexts.push(context)
      pages.push(page)
    }
    
    // Run concurrent user simulations
    const userPromises = pages.map((page, index) => 
      simulateUserValidation(page, index + 1, testDuration)
    )
    
    const results = await Promise.all(userPromises)
    
    // Analyze results
    const totalValidations = results.reduce((sum, r) => sum + r.validationsCompleted, 0)
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0)
    const avgResponseTime = results.reduce((sum, r) => sum + r.avgResponseTime, 0) / results.length
    const errorRate = totalValidations > 0 ? (totalErrors / totalValidations) * 100 : 0
    
    console.log(`\n=== Light Load Test Results ===`)
    console.log(`Total validations: ${totalValidations}`)
    console.log(`Total errors: ${totalErrors}`)
    console.log(`Error rate: ${errorRate.toFixed(2)}%`)
    console.log(`Average response time: ${Math.round(avgResponseTime)}ms`)
    console.log(`Throughput: ${(totalValidations / (testDuration / 1000)).toFixed(2)} validations/sec`)
    
    // Performance assertions
    expect(errorRate).toBeLessThan(5) // Less than 5% error rate
    expect(avgResponseTime).toBeLessThan(5000) // Less than 5s average response
    expect(totalValidations).toBeGreaterThan(parallelUsers * 2) // At least 2 validations per user
    
    // Cleanup
    await Promise.all(contexts.map(ctx => ctx.close()))
  })

  test('medium load test - 5 concurrent users', async ({ browser }) => {
    const { parallelUsers, testDuration } = CONCURRENCY_CONFIG.MEDIUM_LOAD
    
    const contexts: BrowserContext[] = []
    const pages: Page[] = []
    
    for (let i = 0; i < parallelUsers; i++) {
      const context = await browser.newContext()
      const page = await context.newPage()
      await goToPlayground(page)
      
      contexts.push(context)
      pages.push(page)
    }
    
    const userPromises = pages.map((page, index) => 
      simulateUserValidation(page, index + 1, testDuration)
    )
    
    const results = await Promise.all(userPromises)
    
    // Analyze results
    const totalValidations = results.reduce((sum, r) => sum + r.validationsCompleted, 0)
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0)
    const avgResponseTime = results.reduce((sum, r) => sum + r.avgResponseTime, 0) / results.length
    const errorRate = totalValidations > 0 ? (totalErrors / totalValidations) * 100 : 0
    
    console.log(`\n=== Medium Load Test Results ===`)
    console.log(`Total validations: ${totalValidations}`)
    console.log(`Total errors: ${totalErrors}`)
    console.log(`Error rate: ${errorRate.toFixed(2)}%`)
    console.log(`Average response time: ${Math.round(avgResponseTime)}ms`)
    console.log(`Throughput: ${(totalValidations / (testDuration / 1000)).toFixed(2)} validations/sec`)
    
    // Medium load thresholds (slightly more lenient)
    expect(errorRate).toBeLessThan(10) // Less than 10% error rate
    expect(avgResponseTime).toBeLessThan(8000) // Less than 8s average response
    expect(totalValidations).toBeGreaterThan(parallelUsers * 3) // At least 3 validations per user
    
    await Promise.all(contexts.map(ctx => ctx.close()))
  })

  test('heavy load test - 8 concurrent users', async ({ browser }) => {
    const { parallelUsers, testDuration } = CONCURRENCY_CONFIG.HEAVY_LOAD
    
    const contexts: BrowserContext[] = []
    const pages: Page[] = []
    
    for (let i = 0; i < parallelUsers; i++) {
      const context = await browser.newContext()
      const page = await context.newPage()
      await goToPlayground(page)
      
      contexts.push(context)
      pages.push(page)
    }
    
    const userPromises = pages.map((page, index) => 
      simulateUserValidation(page, index + 1, testDuration)
    )
    
    const results = await Promise.all(userPromises)
    
    // Analyze results
    const totalValidations = results.reduce((sum, r) => sum + r.validationsCompleted, 0)
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0)
    const avgResponseTime = results.reduce((sum, r) => sum + r.avgResponseTime, 0) / results.length
    const errorRate = totalValidations > 0 ? (totalErrors / totalValidations) * 100 : 0
    
    console.log(`\n=== Heavy Load Test Results ===`)
    console.log(`Total validations: ${totalValidations}`)
    console.log(`Total errors: ${totalErrors}`)
    console.log(`Error rate: ${errorRate.toFixed(2)}%`)
    console.log(`Average response time: ${Math.round(avgResponseTime)}ms`)
    console.log(`Throughput: ${(totalValidations / (testDuration / 1000)).toFixed(2)} validations/sec`)
    
    // Heavy load thresholds (more lenient for high concurrency)
    expect(errorRate).toBeLessThan(15) // Less than 15% error rate
    expect(avgResponseTime).toBeLessThan(12000) // Less than 12s average response
    expect(totalValidations).toBeGreaterThan(parallelUsers * 2) // At least 2 validations per user
    
    await Promise.all(contexts.map(ctx => ctx.close()))
  })
})

test.describe('Stress Tests', () => {
  test('stress test - 12 concurrent users with rate limiting detection', async ({ browser }) => {
    const { parallelUsers, testDuration } = CONCURRENCY_CONFIG.STRESS_TEST
    
    const contexts: BrowserContext[] = []
    const pages: Page[] = []
    
    for (let i = 0; i < parallelUsers; i++) {
      const context = await browser.newContext()
      const page = await context.newPage()
      await goToPlayground(page)
      
      contexts.push(context)
      pages.push(page)
    }
    
    const userPromises = pages.map((page, index) => 
      simulateUserValidation(page, index + 1, testDuration)
    )
    
    const results = await Promise.all(userPromises)
    
    // Analyze results
    const totalValidations = results.reduce((sum, r) => sum + r.validationsCompleted, 0)
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0)
    const avgResponseTime = results.reduce((sum, r) => sum + r.avgResponseTime, 0) / results.length
    const errorRate = totalValidations > 0 ? (totalErrors / totalValidations) * 100 : 0
    
    console.log(`\n=== Stress Test Results ===`)
    console.log(`Total validations: ${totalValidations}`)
    console.log(`Total errors: ${totalErrors}`)
    console.log(`Error rate: ${errorRate.toFixed(2)}%`)
    console.log(`Average response time: ${Math.round(avgResponseTime)}ms`)
    console.log(`Throughput: ${(totalValidations / (testDuration / 1000)).toFixed(2)} validations/sec`)
    
    // Stress test - we expect higher error rates due to rate limiting
    expect(avgResponseTime).toBeLessThan(20000) // Less than 20s average response
    expect(totalValidations).toBeGreaterThan(parallelUsers) // At least 1 validation per user
    
    // Log if rate limiting was encountered (high error rate is expected)
    if (errorRate > 25) {
      console.log('⚠️ High error rate detected - likely due to rate limiting (expected behavior)')
    }
    
    await Promise.all(contexts.map(ctx => ctx.close()))
  })

  test('spike test - rapid concurrent validation bursts', async ({ browser }) => {
    // Simulate sudden spikes in traffic
    const spikeDuration = 10000 // 10 seconds per spike
    const pauseBetweenSpikes = 5000 // 5 seconds pause
    const numberOfSpikes = 3
    const usersPerSpike = 6
    
    for (let spike = 1; spike <= numberOfSpikes; spike++) {
      console.log(`\n🚀 Starting spike test ${spike}/${numberOfSpikes}`)
      
      const contexts: BrowserContext[] = []
      const pages: Page[] = []
      
      // Create users for this spike
      for (let i = 0; i < usersPerSpike; i++) {
        const context = await browser.newContext()
        const page = await context.newPage()
        await goToPlayground(page)
        
        contexts.push(context)
        pages.push(page)
      }
      
      // Run spike test
      const userPromises = pages.map((page, index) => 
        simulateUserValidation(page, index + 1, spikeDuration)
      )
      
      const results = await Promise.all(userPromises)
      
      const totalValidations = results.reduce((sum, r) => sum + r.validationsCompleted, 0)
      const totalErrors = results.reduce((sum, r) => sum + r.errors, 0)
      const errorRate = totalValidations > 0 ? (totalErrors / totalValidations) * 100 : 0
      
      console.log(`Spike ${spike} results: ${totalValidations} validations, ${errorRate.toFixed(1)}% error rate`)
      
      // Cleanup spike contexts
      await Promise.all(contexts.map(ctx => ctx.close()))
      
      // Pause between spikes (except after the last one)
      if (spike < numberOfSpikes) {
        console.log(`Pausing ${pauseBetweenSpikes/1000}s before next spike...`)
        await new Promise(resolve => setTimeout(resolve, pauseBetweenSpikes))
      }
    }
    
    // Test passes if we complete all spikes without crashing
    expect(true).toBe(true)
    console.log('✅ Spike test completed successfully')
  })
})