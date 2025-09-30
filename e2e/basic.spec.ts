import { test, expect } from '@playwright/test'

// E2E assumes `npm run dev` is running separately.

test('navigation and drawer', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Cloudlint')).toBeVisible()
  await page.setViewportSize({ width: 375, height: 800 })
  await page.getByRole('button', { name: /open menu/i }).click()
  await expect(page.getByText('About')).toBeVisible()
})
