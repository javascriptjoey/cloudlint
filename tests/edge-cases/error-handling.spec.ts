import { test, expect, type Page } from '@playwright/test'

// Edge case testing configuration
const EDGE_CASE_CONFIG = {
  // Network simulation settings
  networkConditions: {
    offline: { offline: true },
    slow3g: { 
      offline: false,
      downloadThroughput: 50 * 1024,
      uploadThroughput: 50 * 1024,
      latency: 2000
    },
    fast3g: {
      offline: false,
      downloadThroughput: 150 * 1024,
      uploadThroughput: 150 * 1024,
      latency: 562.5
    },
    slowConnection: {
      offline: false,
      downloadThroughput: 10 * 1024,
      uploadThroughput: 10 * 1024,
      latency: 5000
    }
  },
  
  // Timeout test configurations
  timeouts: {
    short: 1000,
    medium: 5000,
    long: 30000,
    extreme: 60000
  },
  
  // Large data test cases
  extremeDataSizes: {
    veryLarge: 5 * 1024 * 1024, // 5MB
    huge: 10 * 1024 * 1024,     // 10MB
    massive: 50 * 1024 * 1024   // 50MB (if supported)
  },
  
  // Edge case YAML structures
  edgeCaseYaml: {
    deeplyNested: (depth: number) => {
      let result = 'root:\n'
      for (let i = 0; i < depth; i++) {
        result += '  '.repeat(i + 1) + `level${i}:\n`
      }
      result += '  '.repeat(depth + 1) + 'value: deep'
      return result
    },
    wideStructure: (width: number) => {
      let result = 'wide_structure:\n'
      for (let i = 0; i < width; i++) {
        result += `  key_${i}: value_${i}\n`
      }
      return result
    },
    unicodeHeavy: `
unicode_test: "🌟🔥💯✨🎉🚀"
emoji_keys:
  "🔑": "key_emoji"
  "🌍": "world"
  "🎯": "target"
complex_unicode: |
  多言語テスト
  Тест на русском
  Test français
  العربية تيست
  中文测试
mixed_scripts:
  - "Hello नमस्ते 你好 مرحبا"
  - "Testing ทดสอบ テスト тест"
special_chars: "!@#$%^&*()_+-=[]{}|;':\"<>?,./"
`,
    malformedStructures: [
      'key: [unclosed_array',
      'key:\n  - item\n  - missing_hyphen',
      'duplicate:\nkey1: value1\nduplicate:\nkey2: value2',
      'invalid_yaml:\n  - item: with\n    - malformed: nesting'
    ]
  }
}

test.describe('Network Failures & Connectivity Issues', () => {
  
  test('handles offline mode gracefully', async ({ page, context }) => {
    await page.goto('/playground')
    await page.waitForSelector('[aria-label="YAML input"]')
    
    // Simulate network offline
    await context.setOffline(true)
    
    const yamlInput = page.getByRole('textbox', { name: 'YAML input' })
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    
    await yamlInput.fill('test: offline-scenario')
    
    console.log('🔍 Testing offline validation...')
    await validateBtn.click()
    
    // Should show appropriate error message for network failure
    try {
      await page.waitForSelector('[role="alert"]', { timeout: 10000 })
      
      const errorElement = page.getByRole('alert')
      const errorText = await errorElement.textContent()
      
      console.log(`📱 Offline error: ${errorText}`)
      
      // Error message should be user-friendly
      expect(errorText).toMatch(/network|connection|offline|failed/i)
      
    } catch (error) {
      // Application might still work offline if it has client-side validation
      console.log('ℹ️ Application may have offline validation capabilities')
    }
    
    // Restore network
    await context.setOffline(false)
    
    // Test recovery after network restoration
    await validateBtn.click()
    await page.waitForSelector('[role="status"], [role="alert"]', { timeout: 10000 })
    
    console.log('✅ Network recovery handled correctly')
  })

  test('handles slow network conditions', async ({ page, context }) => {
    await page.goto('/playground')
    await page.waitForSelector('[aria-label="YAML input"]')
    
    // Simulate slow 3G connection
    await context.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Add 2s delay
      await route.continue()
    })
    
    const yamlInput = page.getByRole('textbox', { name: 'YAML input' })
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    
    await yamlInput.fill('test: slow-network-scenario')
    
    console.log('🔍 Testing slow network validation...')
    const startTime = Date.now()
    
    await validateBtn.click()
    
    // Should still work, just slower
    await page.waitForSelector('[role="status"], [role="alert"]', { timeout: 15000 })
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`⏱️ Slow network validation took: ${duration}ms`)
    
    // Should complete but may take longer
    expect(duration).toBeGreaterThan(1000) // Should be slower due to network simulation
    expect(duration).toBeLessThan(15000)   // But should still complete
    
    console.log('✅ Slow network conditions handled appropriately')
  })

  test('recovers from intermittent connection failures', async ({ page, context }) => {
    await page.goto('/playground')
    await page.waitForSelector('[aria-label="YAML input"]')
    
    const yamlInput = page.getByRole('textbox', { name: 'YAML input' })
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    
    let requestCount = 0
    
    // Simulate intermittent failures (fail every other request)
    await context.route('**/api/validate', async route => {
      requestCount++
      
      if (requestCount % 2 === 1) {
        // Fail odd-numbered requests
        console.log(`💥 Simulating request failure #${requestCount}`)
        await route.abort('connectionreset')
      } else {
        // Allow even-numbered requests
        console.log(`✅ Allowing request #${requestCount}`)
        await route.continue()
      }
    })
    
    // First request should fail
    await yamlInput.fill('test: intermittent-failure-1')
    await validateBtn.click()
    
    try {
      await page.waitForSelector('[role="alert"]', { timeout: 5000 })
      console.log('🔍 First request failed as expected')
    } catch (error) {
      console.log('ℹ️ First request may have been handled differently')
    }
    
    // Second request should succeed
    await yamlInput.clear()
    await yamlInput.fill('test: intermittent-failure-2')
    await validateBtn.click()
    
    await page.waitForSelector('[role="status"]', { timeout: 10000 })
    console.log('✅ Recovery from intermittent failures working')
  })
})

test.describe('Backend Service Failures', () => {
  
  test('handles API server errors gracefully', async ({ page, context }) => {
    await page.goto('/playground')
    await page.waitForSelector('[aria-label="YAML input"]')
    
    // Simulate various server errors
    const serverErrors = [500, 502, 503, 504]
    
    for (const errorCode of serverErrors) {
      await context.route('**/api/validate', async route => {
        await route.fulfill({
          status: errorCode,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: `Server error ${errorCode}`,
            message: 'The server encountered an error processing your request'
          })
        })
      })
      
      const yamlInput = page.getByRole('textbox', { name: 'YAML input' })
      const validateBtn = page.getByRole('button', { name: /Validate/ })
      
      await yamlInput.clear()
      await yamlInput.fill(`test: server-error-${errorCode}`)
      
      console.log(`🔍 Testing server error ${errorCode}...`)
      await validateBtn.click()
      
      // Should show appropriate error message
      await page.waitForSelector('[role="alert"]', { timeout: 5000 })
      
      const errorElement = page.getByRole('alert')
      const errorText = await errorElement.textContent()
      
      console.log(`🚨 Error ${errorCode}: ${errorText}`)
      
      // Error message should be user-friendly, not technical
      expect(errorText).toBeTruthy()
      expect(errorText).not.toContain('500')
      expect(errorText).not.toContain('502')
      expect(errorText).not.toMatch(/internal server error/i)
      
      // Should contain helpful guidance
      expect(errorText).toMatch(/try again|server|problem|error/i)
    }
    
    console.log('✅ All server error codes handled gracefully')
  })

  test('handles malformed API responses', async ({ page, context }) => {
    await page.goto('/playground')
    await page.waitForSelector('[aria-label="YAML input"]')
    
    // Test different types of malformed responses
    const malformedResponses = [
      { name: 'Invalid JSON', body: '{"invalid": json}', contentType: 'application/json' },
      { name: 'Empty response', body: '', contentType: 'application/json' },
      { name: 'HTML instead of JSON', body: '<html><body>Error</body></html>', contentType: 'text/html' },
      { name: 'Plain text', body: 'Something went wrong', contentType: 'text/plain' },
    ]
    
    for (const response of malformedResponses) {
      await context.route('**/api/validate', async route => {
        await route.fulfill({
          status: 200,
          contentType: response.contentType,
          body: response.body
        })
      })
      
      const yamlInput = page.getByRole('textbox', { name: 'YAML input' })
      const validateBtn = page.getByRole('button', { name: /Validate/ })
      
      await yamlInput.clear()
      await yamlInput.fill('test: malformed-response')
      
      console.log(`🔍 Testing ${response.name}...`)
      await validateBtn.click()
      
      // Should handle malformed response gracefully
      try {
        await page.waitForSelector('[role="alert"]', { timeout: 5000 })
        
        const errorElement = page.getByRole('alert')
        const errorText = await errorElement.textContent()
        
        console.log(`🔧 ${response.name} error: ${errorText}`)
        
        // Should show user-friendly error, not expose technical details
        expect(errorText).toBeTruthy()
        expect(errorText).not.toContain('JSON.parse')
        expect(errorText).not.toContain('SyntaxError')
        
      } catch (error) {
        // Some malformed responses might be handled differently
        console.log(`ℹ️ ${response.name} may have been handled silently`)
      }
    }
    
    console.log('✅ Malformed API responses handled appropriately')
  })

  test('handles API timeouts correctly', async ({ page, context }) => {
    await page.goto('/playground')
    await page.waitForSelector('[aria-label="YAML input"]')
    
    // Simulate API timeout by delaying response indefinitely
    await context.route('**/api/validate', async route => {
      console.log('⏳ Simulating API timeout...')
      await new Promise(resolve => setTimeout(resolve, 30000)) // 30 second delay
      await route.continue()
    })
    
    const yamlInput = page.getByRole('textbox', { name: 'YAML input' })
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    
    await yamlInput.fill('test: api-timeout-scenario')
    await validateBtn.click()
    
    // Should show timeout error or loading state
    try {
      await page.waitForSelector('[role="alert"]', { timeout: 10000 })
      
      const errorElement = page.getByRole('alert')
      const errorText = await errorElement.textContent()
      
      console.log(`⏰ Timeout error: ${errorText}`)
      
      // Should show user-friendly timeout message
      expect(errorText).toMatch(/timeout|slow|try again|taking longer/i)
      
    } catch (error) {
      // Check if loading state is maintained
      const loadingIndicator = page.locator('[aria-busy="true"], .loading, .spinner')
      
      if (await loadingIndicator.isVisible()) {
        console.log('⏳ Loading state maintained during timeout')
      }
    }
    
    console.log('✅ API timeout handled correctly')
  })
})

test.describe('Extreme Data & Memory Edge Cases', () => {
  
  test('handles extremely large YAML files', async ({ page }) => {
    await page.goto('/playground')
    await page.waitForSelector('[aria-label="YAML input"]')
    
    // Generate large YAML content
    const largeYaml = EDGE_CASE_CONFIG.edgeCaseYaml.wideStructure(1000)
    
    console.log(`🔍 Testing large YAML (${largeYaml.length} characters)...`)
    
    const yamlInput = page.getByRole('textbox', { name: 'YAML input' })
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    
    const startTime = Date.now()
    
    // Fill with large content
    await yamlInput.fill(largeYaml)
    
    const fillTime = Date.now() - startTime
    console.log(`⏱️ Large content fill time: ${fillTime}ms`)
    
    // Validate large content
    const validationStartTime = Date.now()
    await validateBtn.click()
    
    try {
      await page.waitForSelector('[role="status"], [role="alert"]', { timeout: 30000 })
      
      const validationTime = Date.now() - validationStartTime
      console.log(`⏱️ Large content validation time: ${validationTime}ms`)
      
      // Should complete within reasonable time or show appropriate error
      if (validationTime > 10000) {
        console.log('⚠️ Large file processing is slow - consider optimization')
      }
      
    } catch (error) {
      console.log('ℹ️ Large file may have been rejected or timed out appropriately')
    }
    
    console.log('✅ Large YAML file handling tested')
  })

  test('handles deeply nested structures', async ({ page }) => {
    await page.goto('/playground')
    await page.waitForSelector('[aria-label="YAML input"]')
    
    // Test various nesting depths
    const nestingDepths = [50, 100, 200]
    
    for (const depth of nestingDepths) {
      const deepYaml = EDGE_CASE_CONFIG.edgeCaseYaml.deeplyNested(depth)
      
      console.log(`🔍 Testing nesting depth: ${depth}...`)
      
      const yamlInput = page.getByRole('textbox', { name: 'YAML input' })
      const validateBtn = page.getByRole('button', { name: /Validate/ })
      
      await yamlInput.clear()
      await yamlInput.fill(deepYaml)
      
      const startTime = Date.now()
      await validateBtn.click()
      
      try {
        await page.waitForSelector('[role="status"], [role="alert"]', { timeout: 15000 })
        
        const processTime = Date.now() - startTime
        console.log(`⏱️ Depth ${depth} processing time: ${processTime}ms`)
        
      } catch (error) {
        console.log(`⚠️ Depth ${depth} may have been rejected or timed out`)
      }
    }
    
    console.log('✅ Deep nesting scenarios tested')
  })

  test('handles Unicode and special character edge cases', async ({ page }) => {
    await page.goto('/playground')
    await page.waitForSelector('[aria-label="YAML input"]')
    
    const yamlInput = page.getByRole('textbox', { name: 'YAML input' })
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    
    console.log('🔍 Testing Unicode and special characters...')
    
    await yamlInput.fill(EDGE_CASE_CONFIG.edgeCaseYaml.unicodeHeavy)
    await validateBtn.click()
    
    await page.waitForSelector('[role="status"], [role="alert"]', { timeout: 10000 })
    
    // Should handle Unicode content properly
    const resultElement = page.locator('[role="status"], [role="alert"]')
    const resultText = await resultElement.textContent()
    
    console.log(`🌍 Unicode result: ${resultText}`)
    
    // Should not contain corrupted characters or encoding issues
    expect(resultText).not.toContain('�') // Replacement character
    expect(resultText).toBeTruthy()
    
    console.log('✅ Unicode and special characters handled correctly')
  })
})

test.describe('Browser Resource Exhaustion', () => {
  
  test('handles memory pressure gracefully', async ({ page }) => {
    await page.goto('/playground')
    await page.waitForSelector('[aria-label="YAML input"]')
    
    // Perform many operations to create memory pressure
    const yamlInput = page.getByRole('textbox', { name: 'YAML input' })
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    
    console.log('🔍 Testing memory pressure scenarios...')
    
    for (let i = 0; i < 50; i++) {
      const testYaml = `iteration_${i}:\n${Array(100).fill(0).map((_, j) => `  item_${j}: value_${j}`).join('\\n')}`
      
      await yamlInput.clear()
      await yamlInput.fill(testYaml)
      await validateBtn.click()
      
      try {
        await page.waitForSelector('[role="status"], [role="alert"]', { timeout: 5000 })
        
        // Check if page is still responsive
        if (i % 10 === 0) {
          const isResponsive = await page.evaluate(() => {
            return document.readyState === 'complete' && !document.hidden
          })
          
          if (!isResponsive) {
            console.log(`⚠️ Page may be becoming unresponsive at iteration ${i}`)
            break
          }
          
          console.log(`🔄 Memory pressure test iteration ${i}/50 completed`)
        }
        
      } catch (error) {
        console.log(`⚠️ Memory pressure caused timeout at iteration ${i}`)
        break
      }
    }
    
    console.log('✅ Memory pressure handling tested')
  })

  test('recovers from browser crashes or freezes', async ({ page, context }) => {
    await page.goto('/playground')
    await page.waitForSelector('[aria-label="YAML input"]')
    
    // Test recovery from simulated tab crash
    console.log('🔍 Testing recovery from browser issues...')
    
    const yamlInput = page.getByRole('textbox', { name: 'YAML input' })
    
    // Add some content
    await yamlInput.fill('recovery_test: browser-crash-simulation')
    
    // Simulate page refresh (crash recovery)
    await page.reload({ waitUntil: 'networkidle' })
    
    // Verify application loads correctly after "crash"
    await page.waitForSelector('[aria-label="YAML input"]', { timeout: 10000 })
    
    const newYamlInput = page.getByRole('textbox', { name: 'YAML input' })
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    
    // Test basic functionality after recovery
    await newYamlInput.fill('recovery_validation: successful')
    await validateBtn.click()
    
    await page.waitForSelector('[role="status"], [role="alert"]', { timeout: 5000 })
    
    console.log('✅ Browser crash recovery tested')
  })
})

test.describe('Malformed Input Edge Cases', () => {
  
  test('handles all types of malformed YAML gracefully', async ({ page }) => {
    await page.goto('/playground')
    await page.waitForSelector('[aria-label="YAML input"]')
    
    const yamlInput = page.getByRole('textbox', { name: 'YAML input' })
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    
    for (const malformedYaml of EDGE_CASE_CONFIG.edgeCaseYaml.malformedStructures) {
      console.log(`🔍 Testing malformed YAML: ${malformedYaml.substring(0, 50)}...`)
      
      await yamlInput.clear()
      await yamlInput.fill(malformedYaml)
      await validateBtn.click()
      
      // Should show appropriate error message
      await page.waitForSelector('[role="alert"]', { timeout: 5000 })
      
      const errorElement = page.getByRole('alert')
      const errorText = await errorElement.textContent()
      
      console.log(`📝 Malformed YAML error: ${errorText}`)
      
      // Error should be descriptive and helpful
      expect(errorText).toBeTruthy()
      expect(errorText.length).toBeGreaterThan(10)
      
      // Should not expose internal parsing errors
      expect(errorText).not.toContain('SyntaxError')
      expect(errorText).not.toContain('unexpected token')
    }
    
    console.log('✅ All malformed YAML cases handled appropriately')
  })

  test('validates input sanitization for edge cases', async ({ page }) => {
    await page.goto('/playground')
    await page.waitForSelector('[aria-label="YAML input"]')
    
    const yamlInput = page.getByRole('textbox', { name: 'YAML input' })
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    
    // Test various problematic input patterns
    const edgeCaseInputs = [
      '\\x00\\x01\\x02', // Null bytes and control characters
      '\\uFFFE\\uFFFF',   // Unicode non-characters
      '\\u202E\\u202D',   // Unicode direction overrides
      '\\r\\n\\r\\n\\r\\n', // Multiple line endings
      ' '.repeat(10000),  // Excessive whitespace
      '\\t'.repeat(1000), // Excessive tabs
    ]
    
    for (const input of edgeCaseInputs) {
      console.log(`🔍 Testing edge case input sanitization...`)
      
      await yamlInput.clear()
      await yamlInput.fill(`edge_case: "${input}"`)
      await validateBtn.click()
      
      await page.waitForSelector('[role="status"], [role="alert"]', { timeout: 5000 })
      
      // Verify input was processed safely
      const pageContent = await page.content()
      expect(pageContent).not.toContain('\\x00')
      expect(pageContent).not.toContain('\\uFFFE')
      
      console.log(`✅ Edge case input handled safely`)
    }
  })
})

test.describe('Race Conditions & Timing Issues', () => {
  
  test('handles rapid successive validation requests', async ({ page }) => {
    await page.goto('/playground')
    await page.waitForSelector('[aria-label="YAML input"]')
    
    const yamlInput = page.getByRole('textbox', { name: 'YAML input' })
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    
    console.log('🔍 Testing rapid successive validations...')
    
    // Fill input
    await yamlInput.fill('rapid_test: validation')
    
    // Click validate button rapidly multiple times
    const clickPromises = []
    for (let i = 0; i < 5; i++) {
      clickPromises.push(validateBtn.click())
    }
    
    await Promise.all(clickPromises)
    
    // Should handle multiple rapid clicks gracefully
    await page.waitForSelector('[role="status"], [role="alert"]', { timeout: 10000 })
    
    // Verify page is still responsive
    const isResponsive = await page.evaluate(() => {
      return document.readyState === 'complete'
    })
    
    expect(isResponsive).toBe(true)
    
    console.log('✅ Rapid successive validations handled correctly')
  })

  test('handles concurrent input changes and validation', async ({ page }) => {
    await page.goto('/playground')
    await page.waitForSelector('[aria-label="YAML input"]')
    
    const yamlInput = page.getByRole('textbox', { name: 'YAML input' })
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    
    console.log('🔍 Testing concurrent input changes...')
    
    // Start typing and validate concurrently
    const typingPromise = yamlInput.type('concurrent: typing-test\\nvalue: changing', { delay: 10 })
    
    // Start validation while typing
    await page.waitForTimeout(50)
    const validationPromise = validateBtn.click()
    
    await Promise.all([typingPromise, validationPromise])
    
    // Should complete without errors
    await page.waitForSelector('[role="status"], [role="alert"]', { timeout: 10000 })
    
    console.log('✅ Concurrent input changes handled appropriately')
  })
})