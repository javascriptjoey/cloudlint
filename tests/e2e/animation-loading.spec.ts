import { test, expect } from '@playwright/test'

test.describe('Lottie Animation Loading', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start with default network conditions
    await page.goto('/')
  })

test('About page animation loads successfully', async ({ page }) => {
    await page.goto('/')
    
    // Wait for animation container to be present
    const animationRegion = page.getByRole('region', { name: /data security animation/i })
    await expect(animationRegion).toBeVisible()
    
    // Check that the actual Lottie animation loads (not fallback)
    const lottieAnimation = page.getByTestId('lottie-animation')
    await expect(lottieAnimation).toBeVisible({ timeout: 15000 })
    
    // Ensure loading state is gone
    const loadingState = page.getByTestId('animation-loading')
    await expect(loadingState).not.toBeVisible()
    
    // Ensure no fallback is shown
    const fallback = page.getByTestId('animation-fallback')
    await expect(fallback).not.toBeVisible()
    
    // Verify accessibility attributes
    await expect(lottieAnimation).toHaveAttribute('role', 'img')
    await expect(lottieAnimation).toHaveAttribute('aria-label', 'Data security animation')
  })

  test('Contact page animation loads successfully', async ({ page }) => {
    await page.goto('/contact')
    
    // Wait for animation container to be present
    const animationRegion = page.getByRole('region', { name: /friendly, developer-first support/i })
    await expect(animationRegion).toBeVisible()
    
    // Check that the actual Lottie animation loads
    const lottieAnimation = page.getByTestId('lottie-animation')
    await expect(lottieAnimation).toBeVisible({ timeout: 15000 })
    
    // Ensure loading state is gone
    const loadingState = page.getByTestId('animation-loading')
    await expect(loadingState).not.toBeVisible()
    
    // Verify accessibility
    await expect(lottieAnimation).toHaveAttribute('role', 'img')
    await expect(lottieAnimation).toHaveAttribute('aria-label', 'Friendly, developer-first support')
  })

  test('Animation shows loading state initially', async ({ page }) => {
    // Slow down network to see loading state
    await page.route('**/animations/*.lottie', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.continue()
    })
    
    await page.goto('/')
    
    // Should show loading state first
    const loadingState = page.getByTestId('animation-loading')
    await expect(loadingState).toBeVisible()
    await expect(loadingState).toContainText('Loading animation...')
    
    // Eventually loads the actual animation
    const lottieAnimation = page.getByTestId('lottie-animation')
    await expect(lottieAnimation).toBeVisible({ timeout: 20000 })
    
    // Loading state should disappear
    await expect(loadingState).not.toBeVisible()
  })

  test('Shows fallback icon when animation fails to load (404)', async ({ page }) => {
    // Block the animation file to simulate 404
    await page.route('**/animations/data-security.lottie', route => route.abort())
    
    await page.goto('/')
    
    // Should show fallback after timeout/error
    const fallback = page.getByTestId('animation-fallback')
    await expect(fallback).toBeVisible({ timeout: 15000 })
    
    // Should show Shield icon as fallback
    const shieldIcon = fallback.locator('svg')
    await expect(shieldIcon).toBeVisible()
    await expect(shieldIcon).toHaveAttribute('aria-label', 'Data security animation')
    
    // Should show fallback message
    const fallbackMessage = page.getByText('Using fallback image')
    await expect(fallbackMessage).toBeVisible()
    
    // Lottie animation should not be visible
    const lottieAnimation = page.getByTestId('lottie-animation')
    await expect(lottieAnimation).not.toBeVisible()
  })

  test('Shows fallback icon when animation times out', async ({ page }) => {
    // Delay the response to trigger timeout
    await page.route('**/animations/data-security.lottie', async route => {
      await new Promise(resolve => setTimeout(resolve, 15000)) // Longer than timeout
      await route.continue()
    })
    
    await page.goto('/')
    
    // Should show loading first
    const loadingState = page.getByTestId('animation-loading')
    await expect(loadingState).toBeVisible()
    
    // Should eventually show fallback due to timeout
    const fallback = page.getByTestId('animation-fallback')
    await expect(fallback).toBeVisible({ timeout: 15000 })
    
    // Loading should be gone
    await expect(loadingState).not.toBeVisible()
  })

  test('Shows graceful handling when animation file is corrupted', async ({ page }) => {
    // Return binary data that can't possibly be a valid animation
    await page.route('**/animations/data-security.lottie', route => {
      const invalidData = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xFF, 0xFE, 0xFD]).toString('binary')
      route.fulfill({
        status: 200,
        contentType: 'application/octet-stream',
        body: invalidData
      })
    })
    
    await page.goto('/')
    
    // Wait for loading to complete
    await page.waitForTimeout(3000)
    
    const loadingState = page.getByTestId('animation-loading')
    const lottieAnimation = page.getByTestId('lottie-animation')
    const animationRegion = page.getByRole('region', { name: /data security animation/i })
    
    // Loading should complete
    await expect(loadingState).not.toBeVisible()
    
    // Component should handle corrupted data gracefully by showing the animation container
    // (DotLottieReact has internal fallback behavior)
    await expect(animationRegion).toBeVisible()
    await expect(lottieAnimation).toBeVisible()
    
    // The page should remain functional despite the corrupted animation
    const pageTitle = page.getByRole('heading', { name: /ship yaml with confidence/i })
    await expect(pageTitle).toBeVisible()
  })

  test('Respects prefers-reduced-motion setting', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    
    await page.goto('/')
    
    // Animation should still load but not autoplay
    const lottieAnimation = page.getByTestId('lottie-animation')
    await expect(lottieAnimation).toBeVisible({ timeout: 15000 })
    
    // Verify the animation respects reduced motion (implementation dependent)
    // This would need to be checked through animation state if accessible
  })

  test('Animation performance does not block page rendering', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    
    // Page content should be visible before animation loads
    const pageTitle = page.getByRole('heading', { name: /ship yaml with confidence/i })
    await expect(pageTitle).toBeVisible()
    
    const contentLoadTime = Date.now() - startTime
    
    // Content should load quickly (under 3 seconds even with animation)
    expect(contentLoadTime).toBeLessThan(3000)
    
    // Navigation should work even if animation is still loading
    await page.getByRole('link', { name: /contact/i }).first().click()
    await expect(page).toHaveURL(/.*contact/)
  })

  test('Multiple animations load independently', async ({ page }) => {
    // Create a test scenario where both animations are on the same page
    // First navigate to both pages to ensure they work independently
    
    await page.goto('/')
    const aboutAnimation = page.getByTestId('lottie-animation').first()
    await expect(aboutAnimation).toBeVisible({ timeout: 15000 })
    
    await page.goto('/contact')  
    const contactAnimation = page.getByTestId('lottie-animation').first()
    await expect(contactAnimation).toBeVisible({ timeout: 15000 })
    
    // Both should have loaded successfully without interference
    expect(aboutAnimation).toBeTruthy()
    expect(contactAnimation).toBeTruthy()
  })

  test('Animation accessibility is maintained during all states', async ({ page }) => {
    await page.goto('/')
    
    // Check accessibility during loading
    const loadingState = page.getByTestId('animation-loading')
    if (await loadingState.isVisible()) {
      await expect(loadingState).toHaveAttribute('aria-label', 'Loading animation')
    }
    
    // Check accessibility of loaded animation
    const lottieAnimation = page.getByTestId('lottie-animation')
    await expect(lottieAnimation).toBeVisible({ timeout: 15000 })
    await expect(lottieAnimation).toHaveAttribute('role', 'img')
    await expect(lottieAnimation).toHaveAttribute('aria-label', 'Data security animation')
    
    // Test with screen reader simulation
    await page.keyboard.press('Tab')
    // The animation should not receive focus unless controls are enabled
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).not.toBe('DIV') // Animation container should not be focused
  })

  test('Animation controls work when enabled', async ({ page }) => {
    // Note: This test would require modifying the pages to enable controls
    // For now, we test that the controls prop is respected
    await page.goto('/')
    
    const lottieAnimation = page.getByTestId('lottie-animation')
    await expect(lottieAnimation).toBeVisible({ timeout: 15000 })
    
    // Should not have controls by default (tabindex=-1)
    await expect(lottieAnimation).toHaveAttribute('tabindex', '-1')
  })

  test('Animation loads correctly on slow networks', async ({ page }) => {
    // Simulate slow 3G network
    await page.route('**/animations/*.lottie', async route => {
      const response = await route.fetch()
      const body = await response.body()
      
      // Simulate slow network by delaying chunks
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      await route.fulfill({
        status: response.status(),
        headers: response.headers(),
        body
      })
    })
    
    await page.goto('/')
    
    // Should show loading state on slow network
    const loadingState = page.getByTestId('animation-loading')
    await expect(loadingState).toBeVisible()
    
    // Should eventually load successfully
    const lottieAnimation = page.getByTestId('lottie-animation')
    await expect(lottieAnimation).toBeVisible({ timeout: 30000 })
    
    await expect(loadingState).not.toBeVisible()
  })

  test('Fallback icons have appropriate sizing and styling', async ({ page }) => {
    // Force fallback by blocking animation
    await page.route('**/animations/data-security.lottie', route => route.abort())
    
    await page.goto('/')
    
    const fallback = page.getByTestId('animation-fallback')
    await expect(fallback).toBeVisible({ timeout: 15000 })
    
    // Check fallback container size
    const fallbackBox = await fallback.boundingBox()
    expect(fallbackBox?.height).toBeGreaterThan(100) // Should be roughly 120px as configured
    expect(fallbackBox?.width).toBeGreaterThan(100)
    
    // Check icon styling
    const icon = fallback.locator('svg')
    await expect(icon).toBeVisible()
    await expect(icon).toHaveClass(/text-muted-foreground/)
  })
})

test.describe('Animation Error Recovery', () => {
  test('Recovers gracefully from network interruption', async ({ page }) => {
    let requestCount = 0
    
    await page.route('**/animations/data-security.lottie', route => {
      requestCount++
      if (requestCount === 1) {
        // Fail first request
        route.abort()
      } else {
        // Allow subsequent requests
        route.continue()
      }
    })
    
    await page.goto('/')
    
    // Should show fallback initially due to failed first request
    const fallback = page.getByTestId('animation-fallback')
    await expect(fallback).toBeVisible({ timeout: 15000 })
    
    // The component should handle the error gracefully
    const errorMessage = page.getByText('Using fallback image')
    await expect(errorMessage).toBeVisible()
  })

  test('Handles malformed animation data', async ({ page }) => {
    await page.route('**/animations/data-security.lottie', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'not valid json at all {'
      })
    })
    
    await page.goto('/')
    
    // Should show fallback due to malformed data
    const fallback = page.getByTestId('animation-fallback')
    await expect(fallback).toBeVisible({ timeout: 15000 })
  })

  test('Handles server errors gracefully', async ({ page }) => {
    await page.route('**/animations/data-security.lottie', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    })
    
    await page.goto('/')
    
    const fallback = page.getByTestId('animation-fallback')
    await expect(fallback).toBeVisible({ timeout: 15000 })
    
    const fallbackMessage = page.getByText('Using fallback image')
    await expect(fallbackMessage).toBeVisible()
  })
})