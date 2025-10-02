import { test, expect, type Page } from '@playwright/test'
import fs from 'fs'
import os from 'os'
import path from 'path'

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  SMALL_FILE: { size: 50 * 1024, maxValidationTime: 3000 },      // 50KB, 3s
  MEDIUM_FILE: { size: 500 * 1024, maxValidationTime: 10000 },   // 500KB, 10s  
  LARGE_FILE: { size: 1024 * 1024, maxValidationTime: 30000 },   // 1MB, 30s
  XLARGE_FILE: { size: 2 * 1024 * 1024, maxValidationTime: 60000 } // 2MB, 60s
}

const goToPlayground = async (page: Page) => {
  await page.goto('/playground', { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForSelector('main', { timeout: 10000 })
  
  const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
  await expect(yamlBox).toBeVisible({ timeout: 5000 })
  await expect(yamlBox).toBeEnabled({ timeout: 2000 })
}

const yamlBox = (page: Page) => page.getByRole('textbox', { name: 'YAML input' })
const validateBtn = (page: Page) => page.getByRole('button', { name: /Validate/ })
const uploadInput = (page: Page) => page.locator('input[aria-label="Upload YAML file"]')

// Generate large YAML files for testing
function generateLargeYamlFile(targetSize: number, filename: string): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-test-'))
  const filePath = path.join(tmpDir, filename)
  
  let yamlContent = `# Performance Test YAML - Target Size: ${Math.round(targetSize/1024)}KB\nmetadata:\n  name: performance-test\n  namespace: testing\n  labels:\n    test-type: performance\n    size: ${Math.round(targetSize/1024)}kb\n\n`
  
  // Generate repetitive but valid YAML structure
  let itemCount = 0
  while (Buffer.from(yamlContent).length < targetSize) {
    yamlContent += `items:\n  - id: item-${itemCount}\n    name: "Performance Test Item ${itemCount}"\n    description: "This is a test item for performance validation with a longer description to increase file size"\n    metadata:\n      created: "2025-10-02T00:00:00Z"\n      tags: ["performance", "test", "yaml", "validation"]\n      properties:\n        string_prop: "test-value-${itemCount}"\n        number_prop: ${itemCount}\n        boolean_prop: ${itemCount % 2 === 0}\n    data:\n      config:\n        setting1: "value1"\n        setting2: "value2"\n        setting3: "value3"\n      nested:\n        level1:\n          level2:\n            level3: "deep-value-${itemCount}"\n    resources:\n      - type: "compute"\n        amount: ${itemCount * 10}\n      - type: "memory"\n        amount: ${itemCount * 100}\n      - type: "storage"\n        amount: ${itemCount * 1000}\n\n`
    itemCount++
    
    // Prevent infinite loop
    if (itemCount > 10000) break
  }
  
  fs.writeFileSync(filePath, yamlContent)
  return filePath
}

// Performance measurement utilities
async function measureValidationTime(page: Page, action: () => Promise<void>): Promise<number> {
  const startTime = Date.now()
  await action()
  
  // Wait for validation to complete (success or error)
  try {
    await expect(page.getByRole('status')).toBeVisible({ timeout: 60000 })
  } catch {
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 60000 })
  }
  
  return Date.now() - startTime
}

test.describe('Large YAML File Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await goToPlayground(page)
  })

  test('validates 50KB YAML file within performance threshold', async ({ page }) => {
    const testFile = generateLargeYamlFile(PERFORMANCE_THRESHOLDS.SMALL_FILE.size, 'small-test.yaml')
    
    // Upload the file
    await uploadInput(page).setInputFiles(testFile)
    
    // Measure validation performance
    const validationTime = await measureValidationTime(page, async () => {
      await validateBtn(page).click()
    })
    
    // Verify performance threshold
    expect(validationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SMALL_FILE.maxValidationTime)
    
    // Verify functional correctness 
    const status = page.getByRole('status')
    if (await status.isVisible()) {
      await expect(status).toContainText(/no errors found/i)
    } else {
      // File might have validation issues, but should still process
      await expect(page.getByRole('alert')).toBeVisible()
    }
    
    console.log(`✓ Small file (50KB) validated in ${validationTime}ms (threshold: ${PERFORMANCE_THRESHOLDS.SMALL_FILE.maxValidationTime}ms)`)
    
    // Cleanup
    fs.unlinkSync(testFile)
  })

  test('validates 500KB YAML file within performance threshold', async ({ page }) => {
    const testFile = generateLargeYamlFile(PERFORMANCE_THRESHOLDS.MEDIUM_FILE.size, 'medium-test.yaml')
    
    await uploadInput(page).setInputFiles(testFile)
    
    const validationTime = await measureValidationTime(page, async () => {
      await validateBtn(page).click()
    })
    
    expect(validationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.MEDIUM_FILE.maxValidationTime)
    
    // Verify processing completed
    const hasStatus = await page.getByRole('status').isVisible()
    const hasAlert = await page.getByRole('alert').isVisible()
    expect(hasStatus || hasAlert).toBe(true)
    
    console.log(`✓ Medium file (500KB) validated in ${validationTime}ms (threshold: ${PERFORMANCE_THRESHOLDS.MEDIUM_FILE.maxValidationTime}ms)`)
    
    fs.unlinkSync(testFile)
  })

  test('validates 1MB YAML file within performance threshold', async ({ page }) => {
    const testFile = generateLargeYamlFile(PERFORMANCE_THRESHOLDS.LARGE_FILE.size, 'large-test.yaml')
    
    await uploadInput(page).setInputFiles(testFile)
    
    const validationTime = await measureValidationTime(page, async () => {
      await validateBtn(page).click()
    })
    
    expect(validationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_FILE.maxValidationTime)
    
    // Verify processing completed (may hit size limits)
    const hasStatus = await page.getByRole('status').isVisible()
    const hasAlert = await page.getByRole('alert').isVisible()  
    expect(hasStatus || hasAlert).toBe(true)
    
    console.log(`✓ Large file (1MB) validated in ${validationTime}ms (threshold: ${PERFORMANCE_THRESHOLDS.LARGE_FILE.maxValidationTime}ms)`)
    
    fs.unlinkSync(testFile)
  })

  test('handles 2MB YAML file gracefully (size limit test)', async ({ page }) => {
    const testFile = generateLargeYamlFile(PERFORMANCE_THRESHOLDS.XLARGE_FILE.size, 'xlarge-test.yaml')
    
    await uploadInput(page).setInputFiles(testFile)
    
    // This should either process within threshold or show size limit error
    try {
      const validationTime = await measureValidationTime(page, async () => {
        await validateBtn(page).click()
      })
      
      // If it processes, it should be within threshold  
      expect(validationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.XLARGE_FILE.maxValidationTime)
      console.log(`✓ XLarge file (2MB) processed in ${validationTime}ms`)
      
    } catch (error) {
      // Should show file too large error
      const sizeAlert = page.getByRole('alert')
      await expect(sizeAlert).toBeVisible()
      await expect(sizeAlert).toContainText(/too large|size limit/i)
      console.log('✓ XLarge file (2MB) correctly rejected due to size limit')
    }
    
    fs.unlinkSync(testFile)
  })

  test('performance regression test - baseline measurement', async ({ page }) => {
    // Standard test file for baseline performance measurement
    const standardYaml = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: performance-baseline
  namespace: default
data:
  config.yaml: |
    database:
      host: localhost
      port: 5432
      name: testdb
    server:
      port: 8080
      cors: true
    features:
      auth: enabled
      logging: debug
`
    
    await yamlBox(page).fill(standardYaml)
    
    const validationTime = await measureValidationTime(page, async () => {
      await validateBtn(page).click()
    })
    
    // Baseline should be very fast
    expect(validationTime).toBeLessThan(1000) // 1 second
    
    await expect(page.getByRole('status')).toBeVisible()
    await expect(page.getByRole('status')).toContainText(/no errors found/i)
    
    console.log(`✓ Baseline validation completed in ${validationTime}ms`)
  })
})

test.describe('Memory Usage Tests', () => {
  test('monitors memory usage during large file processing', async ({ page }) => {
    await goToPlayground(page)
    
    // Generate medium-sized file for memory test
    const testFile = generateLargeYamlFile(300 * 1024, 'memory-test.yaml') // 300KB
    
    // Monitor memory before upload
    const initialMetrics = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null
    })
    
    await uploadInput(page).setInputFiles(testFile)
    await validateBtn(page).click()
    
    // Wait for processing
    try {
      await expect(page.getByRole('status')).toBeVisible({ timeout: 30000 })
    } catch {
      await expect(page.getByRole('alert')).toBeVisible({ timeout: 30000 })
    }
    
    // Monitor memory after processing
    const finalMetrics = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null
    })
    
    if (initialMetrics && finalMetrics) {
      const memoryIncrease = finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize
      console.log(`Memory usage increased by ${Math.round(memoryIncrease / 1024)}KB during processing`)
      
      // Memory increase should be reasonable (less than 50MB for 300KB file)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    } else {
      console.log('Memory monitoring not available in this browser')
    }
    
    fs.unlinkSync(testFile)
  })
})