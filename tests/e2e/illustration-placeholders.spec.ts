import { test, expect } from '@playwright/test'

// Tests for static illustration placeholders that replaced Lottie animations
test.describe('Illustration Placeholders', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start with clean state
    await page.goto('/')
  })

  test('About page shows security illustration placeholder', async ({ page }) => {
    await page.goto('/')
    
    // Check that the placeholder card is visible
    const placeholderText = page.getByText('Security Illustration')
    await expect(placeholderText).toBeVisible()
    
    // Check for "Coming Soon" text
    const comingSoonText = page.getByText('Coming Soon')
    await expect(comingSoonText).toBeVisible()
    
    // Check for the provider intelligence text
    const providerText = page.getByText('Provider‑aware YAML Intelligence')
    await expect(providerText).toBeVisible()
    
    // Verify the Shield icon is present
    const shieldIcon = page.locator('svg').first()
    await expect(shieldIcon).toBeVisible()
  })

  test('Contact page shows support illustration placeholder', async ({ page }) => {
    await page.goto('/contact')
    
    // Check that the placeholder card is visible
    const placeholderText = page.getByText('Support Illustration')
    await expect(placeholderText).toBeVisible()
    
    // Check for "Coming Soon" text
    const comingSoonText = page.getByText('Coming Soon')
    await expect(comingSoonText).toBeVisible()
    
    // Check for the support text
    const supportText = page.getByText('Friendly, developer‑first support')
    await expect(supportText).toBeVisible()
    
    // Verify the UserCheck icon is present
    const userIcon = page.locator('svg').first()
    await expect(userIcon).toBeVisible()
  })

  test('Page functionality works with placeholders', async ({ page }) => {
    await page.goto('/')
    
    // Page should load quickly with placeholders
    const pageTitle = page.getByRole('heading', { name: /ship yaml with confidence/i })
    await expect(pageTitle).toBeVisible()
    
    // Navigation should work normally
    await page.getByRole('link', { name: /contact/i }).first().click()
    await expect(page).toHaveURL(/.*contact/)
    
    // Contact page placeholder should be visible
    const contactPlaceholder = page.getByText('Support Illustration')
    await expect(contactPlaceholder).toBeVisible()
  })

  test('Placeholder design is consistent and accessible', async ({ page }) => {
    await page.goto('/')
    
    // Check that placeholder has proper styling
    const placeholder = page.locator('.border-dashed').first()
    await expect(placeholder).toBeVisible()
    
    // Verify proper contrast and visibility
    const placeholderText = page.getByText('Security Illustration')
    await expect(placeholderText).toBeVisible()
    
    // Check that icons are properly displayed
    const icon = placeholder.locator('svg')
    await expect(icon).toBeVisible()
    await expect(icon).toHaveAttribute('aria-hidden', 'true')
  })
})