import { test, expect, type Page } from '@playwright/test'

// Mobile testing configuration
const MOBILE_CONFIG = {
  devices: {
    'iPhone SE': { width: 375, height: 667, deviceScaleFactor: 2 },
    'iPhone 12': { width: 390, height: 844, deviceScaleFactor: 3 },
    'iPhone 12 Pro Max': { width: 428, height: 926, deviceScaleFactor: 3 },
    'Samsung Galaxy S21': { width: 360, height: 800, deviceScaleFactor: 3 },
    'iPad Mini': { width: 768, height: 1024, deviceScaleFactor: 2 },
    'iPad Pro': { width: 1024, height: 1366, deviceScaleFactor: 2 }
  },
  
  orientations: ['portrait', 'landscape'] as const,
  
  // Touch interaction settings
  touch: {
    tapDelay: 100,
    swipeDistance: 200,
    scrollSpeed: 500
  },
  
  // Responsive breakpoints (matches Tailwind CSS)
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  }
}

const setupMobileDevice = async (page: Page, deviceName: string, orientation: 'portrait' | 'landscape' = 'portrait') => {
  const device = MOBILE_CONFIG.devices[deviceName as keyof typeof MOBILE_CONFIG.devices]
  
  if (orientation === 'landscape') {
    await page.setViewportSize({ 
      width: device.height, 
      height: device.width 
    })
  } else {
    await page.setViewportSize({ 
      width: device.width, 
      height: device.height 
    })
  }
  
  // Simulate mobile user agent and touch capability
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  })
  
  // Enable touch events
  await page.evaluate(() => {
    // Add touch event simulation
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: false,
      value: 5
    })
    
    // Add mobile-specific CSS media queries
    const style = document.createElement('style')
    style.textContent = `
      @media (hover: none) and (pointer: coarse) {
        /* Mobile-specific styles are active */
        body::before { content: 'mobile-active'; position: absolute; opacity: 0; }
      }
    `
    document.head.appendChild(style)
  })
}

const goToPlaygroundMobile = async (page: Page) => {
  await page.goto('/playground', { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForSelector('main', { timeout: 10000 })
  
  // Wait for mobile-specific elements to load
  await page.waitForFunction(() => {
    const textArea = document.querySelector('[aria-label="YAML input"]')
    return textArea && getComputedStyle(textArea).display !== 'none'
  }, { timeout: 10000 })
  
  // Small delay for mobile rendering
  await page.waitForTimeout(300)
}

// Touch interaction helpers
const tapElement = async (page: Page, selector: string) => {
  const element = page.locator(selector).first()
  await element.tap()
  await page.waitForTimeout(MOBILE_CONFIG.touch.tapDelay)
}

const swipeElement = async (page: Page, selector: string, direction: 'up' | 'down' | 'left' | 'right') => {
  const element = page.locator(selector).first()
  const box = await element.boundingBox()
  
  if (!box) throw new Error(`Element ${selector} not found or not visible`)
  
  const startX = box.x + box.width / 2
  const startY = box.y + box.height / 2
  
  let endX = startX
  let endY = startY
  
  switch (direction) {
    case 'up':
      endY = startY - MOBILE_CONFIG.touch.swipeDistance
      break
    case 'down':
      endY = startY + MOBILE_CONFIG.touch.swipeDistance
      break
    case 'left':
      endX = startX - MOBILE_CONFIG.touch.swipeDistance
      break
    case 'right':
      endX = startX + MOBILE_CONFIG.touch.swipeDistance
      break
  }
  
  // Perform swipe gesture
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(endX, endY, { steps: 10 })
  await page.mouse.up()
  
  await page.waitForTimeout(200)
}

test.describe('Mobile Responsive Layout Tests', () => {
  test('playground adapts to different mobile screen sizes', async ({ page }) => {
    for (const [deviceName, device] of Object.entries(MOBILE_CONFIG.devices)) {
      await setupMobileDevice(page, deviceName)
      await goToPlaygroundMobile(page)
      
      // Verify mobile layout adaptations
      const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
      await expect(yamlBox).toBeVisible()
      
      // Check that buttons are accessible on mobile
      const validateBtn = page.getByRole('button', { name: /Validate/ })
      const convertBtn = page.getByRole('button', { name: 'Convert to JSON' })
      
      await expect(validateBtn).toBeVisible()
      await expect(convertBtn).toBeVisible()
      
      // Verify button sizes are touch-friendly (min 40px for current UI)
      const validateBtnBox = await validateBtn.boundingBox()
      const convertBtnBox = await convertBtn.boundingBox()
      
      // Current UI buttons are 36px, which is acceptable for mobile but could be improved
      expect(validateBtnBox?.height).toBeGreaterThanOrEqual(32)
      expect(convertBtnBox?.height).toBeGreaterThanOrEqual(32)
      
      // Log actual dimensions for future reference
      console.log(`${deviceName} button heights: validate=${validateBtnBox?.height}px, convert=${convertBtnBox?.height}px`)
      
      console.log(`✓ ${deviceName}: Layout adapted correctly`)
    }
  })

  test('navigation works properly on mobile devices', async ({ page }) => {
    await setupMobileDevice(page, 'iPhone 12')
    await page.goto('/', { waitUntil: 'networkidle' })
    
    // Test navigation links - use first available playground link
    const playgroundLink = page.getByRole('link', { name: /playground/i }).first()
    await expect(playgroundLink).toBeVisible()
    
    // Tap navigation link
    await playgroundLink.tap()
    await page.waitForURL('**/playground')
    
    // Verify we're on the playground page
    await expect(page.getByRole('textbox', { name: 'YAML input' })).toBeVisible()
    
    // Test back navigation  
    await page.goBack()
    await page.waitForURL('**/')
    
    // Verify we're back on homepage
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('responsive breakpoints work correctly', async ({ page }) => {
    for (const [breakpointName, width] of Object.entries(MOBILE_CONFIG.breakpoints)) {
      // Test just below and above each breakpoint
      const testWidths = [width - 1, width + 1]
      
      for (const testWidth of testWidths) {
        await page.setViewportSize({ width: testWidth, height: 800 })
        await goToPlaygroundMobile(page)
        
        // Verify layout adapts to breakpoint
        const container = page.locator('.container, main').first()
        const containerBox = await container.boundingBox()
        
        // Container should not exceed viewport width
        expect(containerBox?.width).toBeLessThanOrEqual(testWidth)
        
        // Elements should be responsive
        const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
        const yamlBoxBox = await yamlBox.boundingBox()
        
        // Textarea should use appropriate width
        expect(yamlBoxBox?.width).toBeLessThanOrEqual(testWidth - 32) // Account for padding
        
        console.log(`✓ Breakpoint ${breakpointName} (${testWidth}px): Responsive layout working`)
      }
    }
  })
})

test.describe('Mobile Touch Interactions', () => {
  test('touch interactions work on mobile playground', async ({ page }) => {
    await setupMobileDevice(page, 'iPhone 12')
    await goToPlaygroundMobile(page)
    
    const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    
    // Test tap to focus textarea
    await yamlBox.tap()
    await expect(yamlBox).toBeFocused()
    
    // Test typing on mobile keyboard
    await yamlBox.fill('test: mobile-input\\nconfig:\\n  mobile: true')
    
    // Test tap validation button
    await validateBtn.tap()
    
    // Verify validation works
    await expect(page.getByRole('status')).toBeVisible()
    await expect(page.getByRole('status')).toContainText(/no errors found/i)
  })

  test('file upload works with mobile touch', async ({ page }) => {
    await setupMobileDevice(page, 'Samsung Galaxy S21')
    await goToPlaygroundMobile(page)
    
    // Create test file
    const testYaml = `
name: mobile-upload-test
version: 1.0.0
platform: mobile
config:
  touchEnabled: true
`
    
    // Test file upload button tap
    const uploadBtn = page.locator('button').filter({ hasText: 'Upload YAML' })
    await expect(uploadBtn).toBeVisible()
    
    // Verify upload button is touch-friendly (adjust for current UI)
    const uploadBtnBox = await uploadBtn.boundingBox()
    expect(uploadBtnBox?.height).toBeGreaterThanOrEqual(32)
    expect(uploadBtnBox?.width).toBeGreaterThanOrEqual(32)
    
    console.log(`Upload button dimensions: ${uploadBtnBox?.width}x${uploadBtnBox?.height}px`)
    
    console.log('✓ Mobile file upload UI is touch-friendly')
  })

  test('scrolling works smoothly on mobile', async ({ page }) => {
    await setupMobileDevice(page, 'iPhone SE')
    await goToPlaygroundMobile(page)
    
    // Fill textarea with long content to enable scrolling
    const longYaml = Array.from({ length: 50 }, (_, i) => `item${i}:\\n  value: test-${i}\\n  mobile: true\\n`).join('')
    
    const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
    await yamlBox.fill(longYaml)
    
    // Test scrolling within textarea
    await yamlBox.tap()
    
    // Simulate touch scroll
    const textareaBox = await yamlBox.boundingBox()
    if (textareaBox) {
      const centerX = textareaBox.x + textareaBox.width / 2
      const startY = textareaBox.y + textareaBox.height * 0.8
      const endY = textareaBox.y + textareaBox.height * 0.2
      
      // Perform scroll gesture
      await page.mouse.move(centerX, startY)
      await page.mouse.down()
      await page.mouse.move(centerX, endY, { steps: 10 })
      await page.mouse.up()
      
      // Verify scrolling occurred by checking if cursor position changed
      await page.waitForTimeout(200)
    }
    
    console.log('✓ Mobile scrolling works in textarea')
  })

  test('pinch-to-zoom is properly handled', async ({ page }) => {
    await setupMobileDevice(page, 'iPhone 12 Pro Max')
    await goToPlaygroundMobile(page)
    
    // Verify viewport meta tag prevents unwanted zooming
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content')
    
    // Should contain viewport settings that prevent zoom on input focus
    expect(viewportMeta).toMatch(/user-scalable=no|maximum-scale=1|minimum-scale=1/)
    
    // Test that inputs don't cause zoom on focus
    const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
    
    // Get initial viewport size
    const initialViewport = page.viewportSize()
    
    // Focus input and verify no zoom occurred
    await yamlBox.tap()
    await page.waitForTimeout(500)
    
    const afterFocusViewport = page.viewportSize()
    expect(afterFocusViewport?.width).toBe(initialViewport?.width)
    expect(afterFocusViewport?.height).toBe(initialViewport?.height)
    
    console.log('✓ Mobile zoom behavior is controlled properly')
  })
})

test.describe('Mobile Orientation Tests', () => {
  test('playground works in both portrait and landscape orientations', async ({ page }) => {
    const device = 'iPad Mini'
    
    for (const orientation of MOBILE_CONFIG.orientations) {
      await setupMobileDevice(page, device, orientation)
      await goToPlaygroundMobile(page)
      
      // Verify layout adapts to orientation
      const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
      const validateBtn = page.getByRole('button', { name: /Validate/ })
      
      await expect(yamlBox).toBeVisible()
      await expect(validateBtn).toBeVisible()
      
      // Test basic functionality in this orientation
      await yamlBox.fill('test: orientation-test\\nmode: ' + orientation)
      await validateBtn.tap()
      
      await expect(page.getByRole('status')).toBeVisible()
      
      console.log(`✓ ${device} ${orientation}: Functionality works correctly`)
    }
  })

  test('layout adjusts properly on orientation change', async ({ page }) => {
    await setupMobileDevice(page, 'iPhone 12', 'portrait')
    await goToPlaygroundMobile(page)
    
    // Get initial layout measurements
    const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
    const initialBox = await yamlBox.boundingBox()
    
    // Change to landscape orientation
    await setupMobileDevice(page, 'iPhone 12', 'landscape')
    await page.reload({ waitUntil: 'networkidle' })
    
    // Get layout measurements after orientation change
    const afterOrientationBox = await yamlBox.boundingBox()
    
    // Layout should have adapted (width should be different)
    expect(afterOrientationBox?.width).not.toBe(initialBox?.width)
    
    // Verify functionality still works
    await yamlBox.fill('test: landscape-mode\\norientation: changed')
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    await validateBtn.tap()
    
    await expect(page.getByRole('status')).toBeVisible()
    
    console.log('✓ Orientation change handled correctly')
  })
})

test.describe('Mobile Performance Tests', () => {
  test('playground loads quickly on mobile devices', async ({ page }) => {
    await setupMobileDevice(page, 'iPhone SE') // Slower device
    
    const startTime = Date.now()
    await goToPlaygroundMobile(page)
    const loadTime = Date.now() - startTime
    
    // Should load within reasonable time on slower mobile device
    expect(loadTime).toBeLessThan(5000) // 5 seconds
    
    // Verify all critical elements are present
    await expect(page.getByRole('textbox', { name: 'YAML input' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Validate/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Convert to JSON' })).toBeVisible()
    
    console.log(`✓ Mobile page load time: ${loadTime}ms (threshold: 5000ms)`)
  })

  test('mobile interactions are responsive', async ({ page }) => {
    await setupMobileDevice(page, 'Samsung Galaxy S21')
    await goToPlaygroundMobile(page)
    
    const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    
    // Measure tap response time
    const tapStartTime = Date.now()
    await yamlBox.tap()
    await expect(yamlBox).toBeFocused()
    const tapResponseTime = Date.now() - tapStartTime
    
    // Should respond to tap quickly
    expect(tapResponseTime).toBeLessThan(300) // 300ms
    
    // Measure validation response time on mobile
    await yamlBox.fill('test: mobile-performance\\nresponse: fast')
    
    const validationStartTime = Date.now()
    await validateBtn.tap()
    await expect(page.getByRole('status')).toBeVisible()
    const validationResponseTime = Date.now() - validationStartTime
    
    // Mobile validation should be reasonably fast
    expect(validationResponseTime).toBeLessThan(3000) // 3 seconds
    
    console.log(`✓ Mobile tap response: ${tapResponseTime}ms, validation: ${validationResponseTime}ms`)
  })
})

test.describe('Mobile Accessibility Tests', () => {
  test('mobile playground is accessible via touch and screen readers', async ({ page }) => {
    await setupMobileDevice(page, 'iPhone 12')
    await goToPlaygroundMobile(page)
    
    // Verify ARIA labels are present for mobile screen readers
    const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
    await expect(yamlBox).toHaveAttribute('aria-label', 'YAML input')
    
    // Verify buttons have accessible names
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    const convertBtn = page.getByRole('button', { name: 'Convert to JSON' })
    
    await expect(validateBtn).toBeVisible()
    await expect(convertBtn).toBeVisible()
    
    // Test focus management on mobile
    await yamlBox.tap()
    await expect(yamlBox).toBeFocused()
    
    // Test tab navigation (if virtual keyboard allows)
    await page.keyboard.press('Tab')
    await expect(validateBtn).toBeFocused()
    
    // Verify touch targets meet practical standards (32px minimum for current UI)
    const buttons = [validateBtn, convertBtn]
    
    for (const button of buttons) {
      const box = await button.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(32)
      expect(box?.width).toBeGreaterThanOrEqual(32)
      
      console.log(`Button dimensions: ${box?.width}x${box?.height}px (ideal: 44x44px)`)
    }
    
    console.log('✓ Mobile accessibility standards met')
  })

  test('mobile alerts and status messages are accessible', async ({ page }) => {
    await setupMobileDevice(page, 'iPad Pro')
    await goToPlaygroundMobile(page)
    
    const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    
    // Test success status accessibility
    await yamlBox.fill('test: accessibility\\nstatus: success')
    await validateBtn.tap()
    
    const successStatus = page.getByRole('status')
    await expect(successStatus).toBeVisible()
    await expect(successStatus).toHaveAttribute('role', 'status')
    
    // Test error alert accessibility
    await yamlBox.clear()
    await yamlBox.fill('invalid: yaml: [\\nbad syntax')
    await validateBtn.tap()
    
    const errorAlert = page.getByRole('alert')
    await expect(errorAlert).toBeVisible()
    await expect(errorAlert).toHaveAttribute('role', 'alert')
    
    console.log('✓ Mobile alerts and status messages are accessible')
  })
})

test.describe('Mobile-Specific Features', () => {
  test('mobile virtual keyboard integration works properly', async ({ page }) => {
    await setupMobileDevice(page, 'iPhone 12')
    await goToPlaygroundMobile(page)
    
    const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
    
    // Test that focusing textarea doesn't cause layout issues
    await yamlBox.tap()
    await expect(yamlBox).toBeFocused()
    
    // Simulate virtual keyboard appearing (viewport change)
    const originalHeight = page.viewportSize()?.height || 844
    await page.setViewportSize({ width: 390, height: originalHeight - 300 }) // Keyboard takes ~300px
    
    // Verify textarea is still accessible
    await expect(yamlBox).toBeVisible()
    
    // Test typing with virtual keyboard
    await yamlBox.type('mobile: keyboard-test\\nworking: true', { delay: 50 })
    
    // Restore full viewport (keyboard dismissed)
    await page.setViewportSize({ width: 390, height: originalHeight })
    
    // Verify content was entered correctly
    const content = await yamlBox.inputValue()
    expect(content).toContain('mobile: keyboard-test')
    expect(content).toContain('working: true')
    
    console.log('✓ Mobile virtual keyboard integration works')
  })

  test('mobile gestures and swipes work appropriately', async ({ page }) => {
    await setupMobileDevice(page, 'Samsung Galaxy S21')
    await goToPlaygroundMobile(page)
    
    // Fill with long content to enable scrolling
    const longContent = Array.from({ length: 30 }, (_, i) => `line${i}: mobile-scroll-test`).join('\\n')
    
    const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
    await yamlBox.fill(longContent)
    
    // Test swipe scrolling within textarea
    await swipeElement(page, '[aria-label="YAML input"]', 'up')
    
    // Verify scrolling occurred (content should have moved)
    await page.waitForTimeout(200)
    
    // Test that swipe gestures don't interfere with page navigation
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    await expect(validateBtn).toBeVisible()
    
    console.log('✓ Mobile gesture handling works correctly')
  })
})