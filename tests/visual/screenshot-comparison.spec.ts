import { test, expect, type Page } from '@playwright/test'

// Visual testing configuration
const VISUAL_CONFIG = {
  // Screenshot comparison thresholds
  threshold: 0.2, // 20% difference allowed
  pixelCount: 100, // Max pixels that can be different
  
  // Viewport sizes for responsive testing
  viewports: {
    mobile: { width: 375, height: 667 },    // iPhone SE
    tablet: { width: 768, height: 1024 },   // iPad
    desktop: { width: 1280, height: 720 },  // Desktop
    widescreen: { width: 1920, height: 1080 } // Full HD
  },
  
  // Animation handling
  animations: 'disabled' as const, // Disable animations for consistent screenshots
  
  // Elements to mask (dynamic content)
  maskSelectors: [
    '[data-testid="timestamp"]',
    '.loading-spinner',
    '.animate-spin'
  ]
}

const goToPage = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForSelector('main', { timeout: 10000 })
  
  // Wait for fonts and images to load
  await page.evaluate(() => {
    return Promise.all([
      document.fonts.ready,
      ...Array.from(document.images).map(img => {
        if (img.complete) return Promise.resolve()
        return new Promise(resolve => {
          img.addEventListener('load', resolve)
          img.addEventListener('error', resolve)
        })
      })
    ])
  })
  
  // Small delay to ensure everything is stable
  await page.waitForTimeout(500)
}

const setupVisualTesting = async (page: Page) => {
  // Disable animations for consistent screenshots
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: -1ms !important;
        animation-duration: 1ms !important;
        animation-iteration-count: 1 !important;
        background-attachment: initial !important;
        scroll-behavior: auto !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
  })
  
  // Set consistent timestamp for testing
  await page.evaluate(() => {
    const now = new Date('2025-10-02T12:00:00Z')
    Date.now = () => now.getTime()
    Date.prototype.toISOString = () => now.toISOString()
  })
}

test.describe('Visual Regression - Homepage', () => {
  test('homepage renders consistently across viewports', async ({ page }) => {
    await setupVisualTesting(page)
    
    // Test different viewport sizes
    for (const [name, viewport] of Object.entries(VISUAL_CONFIG.viewports)) {
      await page.setViewportSize(viewport)
      await goToPage(page, '/')
      
      // Take screenshot
      await expect(page).toHaveScreenshot(`homepage-${name}.png`, {
        fullPage: true,
        threshold: VISUAL_CONFIG.threshold,
        animations: VISUAL_CONFIG.animations
      })
    }
  })

  test('homepage hero section visual consistency', async ({ page }) => {
    await setupVisualTesting(page)
    await page.setViewportSize(VISUAL_CONFIG.viewports.desktop)
    await goToPage(page, '/')
    
    // Test hero section specifically
    const heroSection = page.locator('section').first()
    await expect(heroSection).toHaveScreenshot('homepage-hero.png', {
      threshold: VISUAL_CONFIG.threshold,
      animations: VISUAL_CONFIG.animations
    })
  })

  test('homepage navigation consistency', async ({ page }) => {
    await setupVisualTesting(page)
    await page.setViewportSize(VISUAL_CONFIG.viewports.desktop)
    await goToPage(page, '/')
    
    // Test navigation bar
    const navbar = page.getByRole('banner')
    await expect(navbar).toHaveScreenshot('homepage-navbar.png', {
      threshold: VISUAL_CONFIG.threshold,
      animations: VISUAL_CONFIG.animations
    })
  })
})

test.describe('Visual Regression - Playground', () => {
  test('playground initial state renders consistently', async ({ page }) => {
    await setupVisualTesting(page)
    
    for (const [name, viewport] of Object.entries(VISUAL_CONFIG.viewports)) {
      await page.setViewportSize(viewport)
      await goToPage(page, '/playground')
      
      await expect(page).toHaveScreenshot(`playground-initial-${name}.png`, {
        fullPage: true,
        threshold: VISUAL_CONFIG.threshold,
        animations: VISUAL_CONFIG.animations,
        mask: page.locator('[data-testid="timestamp"]')
      })
    }
  })

  test('playground with YAML content visual consistency', async ({ page }) => {
    await setupVisualTesting(page)
    await page.setViewportSize(VISUAL_CONFIG.viewports.desktop)
    await goToPage(page, '/playground')
    
    const yamlInput = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: visual-test-config
  namespace: testing
data:
  config.yaml: |
    database:
      host: postgres.example.com
      port: 5432
      name: visualtest
    features:
      auth: enabled
      logging: debug
`
    
    // Fill with YAML content
    const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
    await yamlBox.fill(yamlInput)
    await page.waitForTimeout(300) // Let content settle
    
    await expect(page).toHaveScreenshot('playground-with-yaml.png', {
      fullPage: true,
      threshold: VISUAL_CONFIG.threshold,
      animations: VISUAL_CONFIG.animations
    })
  })

  test('playground validation success state visual consistency', async ({ page }) => {
    await setupVisualTesting(page)
    await page.setViewportSize(VISUAL_CONFIG.viewports.desktop)
    await goToPage(page, '/playground')
    
    const yamlInput = `
apiVersion: v1
kind: Service
metadata:
  name: test-service
spec:
  selector:
    app: test
  ports:
  - port: 80
    targetPort: 8080
`
    
    const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    
    await yamlBox.fill(yamlInput)
    await validateBtn.click()
    
    // Wait for validation success
    await expect(page.getByRole('status')).toBeVisible()
    await expect(page.getByRole('status')).toContainText(/no errors found/i)
    
    await expect(page).toHaveScreenshot('playground-validation-success.png', {
      fullPage: true,
      threshold: VISUAL_CONFIG.threshold,
      animations: VISUAL_CONFIG.animations
    })
  })

  test('playground validation error state visual consistency', async ({ page }) => {
    await setupVisualTesting(page)
    await page.setViewportSize(VISUAL_CONFIG.viewports.desktop)
    await goToPage(page, '/playground')
    
    const invalidYaml = `
invalid: yaml: [
  missing: bracket
  bad indentation
wrong: structure
`
    
    const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    
    await yamlBox.fill(invalidYaml)
    await validateBtn.click()
    
    // Wait for validation error
    await expect(page.getByRole('alert')).toBeVisible()
    
    await expect(page).toHaveScreenshot('playground-validation-error.png', {
      fullPage: true,
      threshold: VISUAL_CONFIG.threshold,
      animations: VISUAL_CONFIG.animations
    })
  })

  test('playground JSON conversion visual consistency', async ({ page }) => {
    await setupVisualTesting(page)
    await page.setViewportSize(VISUAL_CONFIG.viewports.desktop)
    await goToPage(page, '/playground')
    
    const yamlInput = `
name: visual-test
version: 1.0.0
config:
  port: 3000
  debug: true
dependencies:
  - react
  - typescript
`
    
    const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
    const convertBtn = page.getByRole('button', { name: 'Convert to JSON' })
    
    await yamlBox.fill(yamlInput)
    await convertBtn.click()
    
    // Wait for JSON output
    await expect(page.getByRole('heading', { name: 'JSON' })).toBeVisible()
    
    await expect(page).toHaveScreenshot('playground-json-conversion.png', {
      fullPage: true,
      threshold: VISUAL_CONFIG.threshold,
      animations: VISUAL_CONFIG.animations
    })
  })

  test('playground diff preview visual consistency', async ({ page }) => {
    await setupVisualTesting(page)
    await page.setViewportSize(VISUAL_CONFIG.viewports.desktop)
    await goToPage(page, '/playground')
    
    // Mock validation response with fix
    await page.route('**/validate', route => 
      route.fulfill({ 
        status: 200, 
        body: JSON.stringify({ 
          ok: false, 
          messages: [{ message: 'Typo in script', severity: 'error' }],
          fixed: 'steps:\\n  - script: echo hello\\n'
        }),
        headers: { 'Content-Type': 'application/json' } 
      })
    )
    
    await page.route('**/diff-preview', route => 
      route.fulfill({ 
        status: 200, 
        body: JSON.stringify({ 
          diff: '@@\\n-  - scirpt: echo hello\\n+  - script: echo hello\\n',
          before: 'steps:\\n  - scirpt: echo hello\\n',
          after: 'steps:\\n  - script: echo hello\\n'
        }),
        headers: { 'Content-Type': 'application/json' } 
      })
    )
    
    const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    
    await yamlBox.fill('steps:\\n  - scirpt: echo hello\\n')
    await validateBtn.click()
    
    // Wait for diff preview
    await expect(page.getByRole('heading', { name: 'Preview changes' })).toBeVisible()
    
    await expect(page).toHaveScreenshot('playground-diff-preview.png', {
      fullPage: true,
      threshold: VISUAL_CONFIG.threshold,
      animations: VISUAL_CONFIG.animations
    })
  })
})

test.describe('Visual Regression - About Page', () => {
  test('about page renders consistently across viewports', async ({ page }) => {
    await setupVisualTesting(page)
    
    for (const [name, viewport] of Object.entries(VISUAL_CONFIG.viewports)) {
      await page.setViewportSize(viewport)
      await goToPage(page, '/about')
      
      await expect(page).toHaveScreenshot(`about-${name}.png`, {
        fullPage: true,
        threshold: VISUAL_CONFIG.threshold,
        animations: VISUAL_CONFIG.animations
      })
    }
  })

  test('about page illustrations render consistently', async ({ page }) => {
    await setupVisualTesting(page)
    await page.setViewportSize(VISUAL_CONFIG.viewports.desktop)
    await goToPage(page, '/about')
    
    // Test illustration placeholders
    const illustrations = page.locator('[data-testid^="illustration-"]')
    const count = await illustrations.count()
    
    for (let i = 0; i < count; i++) {
      const illustration = illustrations.nth(i)
      await expect(illustration).toHaveScreenshot(`about-illustration-${i}.png`, {
        threshold: VISUAL_CONFIG.threshold,
        animations: VISUAL_CONFIG.animations
      })
    }
  })
})

test.describe('Visual Regression - Contact Page', () => {
  test('contact page renders consistently across viewports', async ({ page }) => {
    await setupVisualTesting(page)
    
    for (const [name, viewport] of Object.entries(VISUAL_CONFIG.viewports)) {
      await page.setViewportSize(viewport)
      await goToPage(page, '/contact')
      
      await expect(page).toHaveScreenshot(`contact-${name}.png`, {
        fullPage: true,
        threshold: VISUAL_CONFIG.threshold,
        animations: VISUAL_CONFIG.animations
      })
    }
  })
})

test.describe('Visual Regression - Cross-Browser Consistency', () => {
  test('key pages render consistently across browsers', async ({ page, browserName }) => {
    await setupVisualTesting(page)
    await page.setViewportSize(VISUAL_CONFIG.viewports.desktop)
    
    const pages = ['/', '/playground', '/about', '/contact']
    
    for (const pagePath of pages) {
      await goToPage(page, pagePath)
      
      const pageName = pagePath === '/' ? 'home' : pagePath.slice(1)
      
      await expect(page).toHaveScreenshot(`cross-browser-${pageName}-${browserName}.png`, {
        fullPage: true,
        threshold: VISUAL_CONFIG.threshold,
        animations: VISUAL_CONFIG.animations
      })
    }
  })
})

test.describe('Visual Regression - Component States', () => {
  test('button states render consistently', async ({ page }) => {
    await setupVisualTesting(page)
    await page.setViewportSize(VISUAL_CONFIG.viewports.desktop)
    await goToPage(page, '/playground')
    
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    const convertBtn = page.getByRole('button', { name: 'Convert to JSON' })
    
    // Test default button state
    await expect(validateBtn).toHaveScreenshot('button-validate-default.png', {
      threshold: VISUAL_CONFIG.threshold,
      animations: VISUAL_CONFIG.animations
    })
    
    // Test hover state
    await validateBtn.hover()
    await expect(validateBtn).toHaveScreenshot('button-validate-hover.png', {
      threshold: VISUAL_CONFIG.threshold,
      animations: VISUAL_CONFIG.animations
    })
    
    // Test disabled state
    const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
    await yamlBox.clear()
    await page.waitForTimeout(200) // Wait for disabled state
    
    await expect(validateBtn).toHaveScreenshot('button-validate-disabled.png', {
      threshold: VISUAL_CONFIG.threshold,
      animations: VISUAL_CONFIG.animations
    })
  })

  test('form elements render consistently', async ({ page }) => {
    await setupVisualTesting(page)
    await page.setViewportSize(VISUAL_CONFIG.viewports.desktop)
    await goToPage(page, '/playground')
    
    // Test textarea empty state
    const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
    await expect(yamlBox).toHaveScreenshot('textarea-empty.png', {
      threshold: VISUAL_CONFIG.threshold,
      animations: VISUAL_CONFIG.animations
    })
    
    // Test textarea with content
    await yamlBox.fill('test: value\\nconfig:\\n  port: 3000')
    await expect(yamlBox).toHaveScreenshot('textarea-with-content.png', {
      threshold: VISUAL_CONFIG.threshold,
      animations: VISUAL_CONFIG.animations
    })
    
    // Test textarea focused state
    await yamlBox.focus()
    await expect(yamlBox).toHaveScreenshot('textarea-focused.png', {
      threshold: VISUAL_CONFIG.threshold,
      animations: VISUAL_CONFIG.animations
    })
  })

  test('alert states render consistently', async ({ page }) => {
    await setupVisualTesting(page)
    await page.setViewportSize(VISUAL_CONFIG.viewports.desktop)
    await goToPage(page, '/playground')
    
    // Test success alert (status)
    const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
    const validateBtn = page.getByRole('button', { name: /Validate/ })
    
    await yamlBox.fill('test: valid-yaml\\n')
    await validateBtn.click()
    
    await expect(page.getByRole('status')).toBeVisible()
    const successAlert = page.getByRole('status')
    await expect(successAlert).toHaveScreenshot('alert-success.png', {
      threshold: VISUAL_CONFIG.threshold,
      animations: VISUAL_CONFIG.animations
    })
    
    // Test error alert
    await yamlBox.clear()
    await yamlBox.fill('invalid: yaml: [\\n  bad syntax')
    await validateBtn.click()
    
    await expect(page.getByRole('alert')).toBeVisible()
    const errorAlert = page.getByRole('alert')
    await expect(errorAlert).toHaveScreenshot('alert-error.png', {
      threshold: VISUAL_CONFIG.threshold,
      animations: VISUAL_CONFIG.animations
    })
  })
})

test.describe('Visual Regression - Theme Consistency', () => {
  test('light theme renders consistently', async ({ page }) => {
    await setupVisualTesting(page)
    await page.setViewportSize(VISUAL_CONFIG.viewports.desktop)
    
    // Ensure light theme
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    })
    
    await goToPage(page, '/playground')
    
    await expect(page).toHaveScreenshot('theme-light-playground.png', {
      fullPage: true,
      threshold: VISUAL_CONFIG.threshold,
      animations: VISUAL_CONFIG.animations
    })
  })

  test('dark theme renders consistently', async ({ page }) => {
    await setupVisualTesting(page)
    await page.setViewportSize(VISUAL_CONFIG.viewports.desktop)
    
    // Ensure dark theme
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    })
    
    await goToPage(page, '/playground')
    
    await expect(page).toHaveScreenshot('theme-dark-playground.png', {
      fullPage: true,
      threshold: VISUAL_CONFIG.threshold,
      animations: VISUAL_CONFIG.animations
    })
  })
})