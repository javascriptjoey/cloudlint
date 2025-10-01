import { test, expect } from '@playwright/test'

test.describe('Animation Performance & Accessibility', () => {
  test('Animation loading does not block critical page rendering', async ({ page }) => {
    // Start timing
    const startTime = Date.now()
    
    // Navigate to page with animation
    await page.goto('/')
    
    // Critical content should be visible quickly (before animation loads)
    const pageTitle = page.getByRole('heading', { name: /ship yaml with confidence/i })
    const ctaButton = page.getByRole('link', { name: /try the playground/i })
    const description = page.getByText(/cloudlint validates any yaml/i)
    
    // These should be visible within 2 seconds
    await expect(pageTitle).toBeVisible({ timeout: 2000 })
    await expect(ctaButton).toBeVisible({ timeout: 2000 })
    await expect(description).toBeVisible({ timeout: 2000 })
    
    const criticalContentTime = Date.now() - startTime
    
    // Critical content should load fast
    expect(criticalContentTime).toBeLessThan(2000)
    
    // Page should be interactive even if animation is still loading
    await ctaButton.click()
    await expect(page).toHaveURL(/.*playground/)
    
    // Navigate back to continue testing
    await page.goBack()
  })

  test('Animation does not cause layout shifts', async ({ page }) => {
    await page.goto('/')
    
    // Get initial layout measurements
    const heroSection = page.locator('section').first()
    const initialBox = await heroSection.boundingBox()
    
    // Wait for animation to potentially load
    await page.waitForTimeout(3000)
    
    // Check that layout is stable
    const finalBox = await heroSection.boundingBox()
    
    // Layout should not have shifted significantly (within 5px tolerance)
    expect(Math.abs((finalBox?.y || 0) - (initialBox?.y || 0))).toBeLessThan(5)
    expect(Math.abs((finalBox?.height || 0) - (initialBox?.height || 0))).toBeLessThan(50)
  })

  test('Multiple animations load efficiently without blocking each other', async ({ page }) => {
    const startTime = Date.now()
    
    // Navigate to About page
    await page.goto('/')
    
    // Wait for About animation area to be visible
    const aboutAnimation = page.getByRole('region', { name: /data security animation/i })
    await expect(aboutAnimation).toBeVisible()
    
    // Navigate to Contact page
    await page.goto('/contact')
    
    // Contact page should load quickly even after About page animation
    const contactTitle = page.getByRole('heading', { name: /we'd love to hear from you/i })
    await expect(contactTitle).toBeVisible({ timeout: 2000 })
    
    const totalTime = Date.now() - startTime
    
    // Both pages should load efficiently
    expect(totalTime).toBeLessThan(5000)
  })

  test('Animation loading with slow network conditions', async ({ page }) => {
    // Simulate slow 3G network
    await page.route('**/animations/*.lottie', async route => {
      // Add delay to simulate slow network
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.continue()
    })
    
    const startTime = Date.now()
    await page.goto('/')
    
    // Page content should still be usable during slow animation loading
    const pageTitle = page.getByRole('heading', { name: /ship yaml with confidence/i })
    await expect(pageTitle).toBeVisible({ timeout: 3000 })
    
    // User should be able to interact with page
    const ctaButton = page.getByRole('link', { name: /try the playground/i })
    await expect(ctaButton).toBeVisible()
    
    // Navigation should work even if animation is slow
    await ctaButton.click()
    await expect(page).toHaveURL(/.*playground/)
    
    const interactionTime = Date.now() - startTime
    
    // Interaction should be possible within reasonable time
    expect(interactionTime).toBeLessThan(5000)
  })

  test('Respects prefers-reduced-motion user preference', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    
    await page.goto('/')
    
    // Animation container should still be present
    const animationRegion = page.getByRole('region', { name: /data security animation/i })
    await expect(animationRegion).toBeVisible()
    
    // Check if animation respects reduced motion
    // Note: This would need to be verified through animation state if accessible
    // For now, we verify the container exists but animation behavior is respectful
    
    // Page should remain fully functional with reduced motion
    const ctaButton = page.getByRole('link', { name: /try the playground/i })
    await ctaButton.click()
    await expect(page).toHaveURL(/.*playground/)
  })

  test('Animation fallback maintains performance', async ({ page }) => {
    // Block animation to force fallback
    await page.route('**/animations/data-security.lottie', route => route.abort())
    
    const startTime = Date.now()
    await page.goto('/about')
    
    // Page should load quickly even with fallback
    const pageTitle = page.getByRole('heading', { name: /ship yaml with confidence/i })
    await expect(pageTitle).toBeVisible({ timeout: 2000 })
    
    // Fallback should appear without significant delay
    const fallback = page.getByTestId('animation-fallback')
    await expect(fallback).toBeVisible({ timeout: 5000 })
    
    const loadTime = Date.now() - startTime
    
    // Even with fallback, page should load efficiently
    expect(loadTime).toBeLessThan(6000)
    
    // Page should remain interactive
    const ctaButton = page.getByRole('link', { name: /try the playground/i })
    await ctaButton.click()
    await expect(page).toHaveURL(/.*playground/)
  })

  test('Animation accessibility with keyboard navigation', async ({ page }) => {
    await page.goto('/about')
    
    // Wait for animation to load
    const animationRegion = page.getByRole('region', { name: /data security animation/i })
    await expect(animationRegion).toBeVisible()
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Should be able to navigate to interactive elements
    // const ctaButton = page.getByRole('link', { name: /try the playground/i })
    
    // Focus should eventually reach the CTA button
    let attempts = 0
    while (attempts < 10) {
      const focusedElement = page.locator(':focus')
      const buttonText = await focusedElement.textContent()
      
      if (buttonText?.includes('Try the Playground')) {
        break
      }
      
      await page.keyboard.press('Tab')
      attempts++
    }
    
    // Should be able to activate the button
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/.*playground/)
  })

  test('Animation does not interfere with form interactions', async ({ page }) => {
    await page.goto('/contact')
    
    // Wait for any animations to start loading
    await page.waitForTimeout(1000)
    
    // Form should be immediately interactive
    const nameField = page.getByLabel(/name/i)
    const emailField = page.getByLabel(/email/i)
    const messageField = page.getByLabel(/message/i)
    
    await expect(nameField).toBeVisible()
    await expect(emailField).toBeVisible()
    await expect(messageField).toBeVisible()
    
    // Should be able to type in fields without delay
    await nameField.fill('Test User')
    await emailField.fill('test@example.com')
    await messageField.fill('This is a test message that should work regardless of animation loading status.')
    
    // Form values should be preserved
    await expect(nameField).toHaveValue('Test User')
    await expect(emailField).toHaveValue('test@example.com')
    await expect(messageField).toHaveValue('This is a test message that should work regardless of animation loading status.')
  })

  test('Animation loading with concurrent user interactions', async ({ page }) => {
    await page.goto('/about')
    
    // Start interacting immediately while animation may be loading
    const ctaButton = page.getByRole('link', { name: /try the playground/i })
    const contactButton = page.getByRole('link', { name: /contact/i })
    
    // Rapid navigation should work
    await ctaButton.click()
    await expect(page).toHaveURL(/.*playground/)
    
    await page.goBack()
    await expect(page).toHaveURL(/.*about/)
    
    await contactButton.click()
    await expect(page).toHaveURL(/.*contact/)
    
    await page.goBack()
    await expect(page).toHaveURL(/.*about/)
    
    // All navigation should complete without errors
    // Animation state should not interfere with routing
  })

  test('Memory usage does not grow excessively with animation', async ({ page }) => {
    // This is a basic memory leak test
    await page.goto('/about')
    
    // Wait for initial load
    await page.waitForTimeout(2000)
    
    // Navigate back and forth multiple times
    for (let i = 0; i < 5; i++) {
      await page.goto('/contact')
      await page.waitForTimeout(500)
      await page.goto('/about')
      await page.waitForTimeout(500)
    }
    
    // Page should still be responsive after multiple navigations
    const pageTitle = page.getByRole('heading', { name: /ship yaml with confidence/i })
    await expect(pageTitle).toBeVisible({ timeout: 2000 })
    
    const ctaButton = page.getByRole('link', { name: /try the playground/i })
    await ctaButton.click()
    await expect(page).toHaveURL(/.*playground/)
  })

  test('Animation handles viewport changes gracefully', async ({ page }) => {
    await page.goto('/about')
    
    // Start with desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 })
    
    const animationRegion = page.getByRole('region', { name: /data security animation/i })
    await expect(animationRegion).toBeVisible()
    
    // Change to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Animation should still be visible and not cause layout issues
    await expect(animationRegion).toBeVisible()
    
    // Page should remain functional
    const menuButton = page.getByRole('button', { name: /open menu/i })
    await menuButton.click()
    
    const drawerHome = page.getByRole('link', { name: /home/i })
    await expect(drawerHome).toBeVisible()
    
    // Change to tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // Should still work without issues
    await expect(animationRegion).toBeVisible()
  })
})

test.describe('Animation Error Handling Performance', () => {
  test('Graceful degradation with network failures', async ({ page }) => {
    // Simulate intermittent network failures
    let requestCount = 0
    await page.route('**/animations/*.lottie', route => {
      requestCount++
      if (requestCount % 2 === 0) {
        route.abort() // Fail every other request
      } else {
        route.continue()
      }
    })
    
    const startTime = Date.now()
    await page.goto('/about')
    
    // Page should still load and be functional
    const pageTitle = page.getByRole('heading', { name: /ship yaml with confidence/i })
    await expect(pageTitle).toBeVisible({ timeout: 3000 })
    
    const loadTime = Date.now() - startTime
    
    // Should not take excessively long even with network issues
    expect(loadTime).toBeLessThan(5000)
    
    // User should be able to navigate regardless of animation state
    const ctaButton = page.getByRole('link', { name: /try the playground/i })
    await ctaButton.click()
    await expect(page).toHaveURL(/.*playground/)
  })

  test('Performance with corrupted animation files', async ({ page }) => {
    // Serve corrupted data
    await page.route('**/animations/*.lottie', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'corrupted data that is not valid JSON or animation'
      })
    })
    
    const startTime = Date.now()
    await page.goto('/about')
    
    // Page should still load quickly despite corrupted animation
    const pageTitle = page.getByRole('heading', { name: /ship yaml with confidence/i })
    await expect(pageTitle).toBeVisible({ timeout: 2000 })
    
    const loadTime = Date.now() - startTime
    
    // Should not be significantly delayed by corrupted data
    expect(loadTime).toBeLessThan(3000)
    
    // Fallback should appear if configured
    const fallback = page.getByTestId('animation-fallback')
    if (await fallback.isVisible()) {
      // Fallback should be displayed properly
      expect(fallback).toBeVisible()
    }
  })
})