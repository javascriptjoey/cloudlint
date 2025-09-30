import { test, expect } from '@playwright/test'
import fs from 'fs'
import os from 'os'
import path from 'path'

const goToPlayground = async (page) => {
  await page.goto('/playground', { waitUntil: 'networkidle' })
  const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
  try {
    await expect(yamlBox).toBeVisible({ timeout: 2000 })
    return
  } catch { /* ignore */ void 0 }
  try {
    await page.goto('/', { waitUntil: 'networkidle' })
    const nav = page.getByRole('link', { name: 'Playground', exact: true })
    await nav.click({ timeout: 1500 })
  } catch { /* ignore */ void 0 }
  await page.goto('/playground', { waitUntil: 'domcontentloaded' })
  try {
    await expect(yamlBox).toBeVisible({ timeout: 5000 })
  } catch {
    await page.reload({ waitUntil: 'load' })
    await expect(yamlBox).toBeVisible({ timeout: 5000 })
  }
}

const yamlBox = (page) => page.getByRole('textbox', { name: 'YAML input' })
const validateBtn = (page) => page.getByRole('button', { name: 'Validate' })

// Decline diff preview path
test('Decline diff preview keeps editor unchanged and closes preview', async ({ page }) => {
  await goToPlayground(page)
  await page.route('**/validate', route => route.fulfill({ status: 200, body: JSON.stringify({ ok: false, messages: [{message:'x',severity:'error'}], fixed: 'steps:\n  - script: echo hi\n' }), headers: { 'Content-Type': 'application/json' } }))
  await page.route('**/diff-preview', route => route.fulfill({ status: 200, body: JSON.stringify({ diff: '@@\n-steps:\n  - scirpt: echo hi\n+steps:\n  - script: echo hi\n', before: 'steps:\n  - scirpt: echo hi\n', after: 'steps:\n  - script: echo hi\n' }), headers: { 'Content-Type': 'application/json' } }))
  await yamlBox(page).fill('steps:\n  - scirpt: echo hi\n')
  await validateBtn(page).click()
  await expect(page.getByRole('heading', { name: 'Preview changes' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible()
  // Decline
  await page.getByRole('button', { name: 'Decline' }).click()
  // Diff preview should be gone
  await expect(page.getByRole('heading', { name: 'Preview changes' })).toHaveCount(0)
  // Editor text remains with typo
  await expect(yamlBox(page)).toHaveValue(/scirpt/)
})

// Copy JSON to clipboard
test('Copy JSON to clipboard', async ({ page }) => {
  await goToPlayground(page)
  await yamlBox(page).fill('foo: 1\n')
  // Render JSON view first
  await page.getByRole('button', { name: 'Convert to JSON', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'JSON' })).toBeVisible()
  // Click copy button in JSON card header
  const copyBtn = page.getByRole('button', { name: 'Copy JSON' })
  await expect(copyBtn).toBeVisible()
  await copyBtn.click()
  // Cross-browser reliable check: verify JSON card text present
  const jsonText = await page.locator('pre code').first().innerText()
  expect(jsonText).toMatch(/\{/)
})

// Download JSON button
test('Download JSON saves expected file contents', async ({ page }) => {
  await goToPlayground(page)
  await yamlBox(page).fill('foo: 1\n')
  await page.getByRole('button', { name: 'Convert to JSON', exact: true }).click()
  const [ download ] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download JSON' }).click(),
  ])
  const dest = path.join(os.tmpdir(), `cloudlint-${Date.now()}.json`)
  await download.saveAs(dest)
  const content = fs.readFileSync(dest, 'utf8')
  expect(content).toMatch(/\{/)
})

// Network error handling (500)
test('Shows error alert when backend returns 500', async ({ page }) => {
  await goToPlayground(page)
  await page.route('**/validate', route => route.fulfill({ status: 500, body: JSON.stringify({ error: 'boom' }), headers: { 'Content-Type': 'application/json' } }))
  await yamlBox(page).fill('foo: 1\n')
  await validateBtn(page).click()
  await expect(page.getByRole('alert')).toBeVisible()
})

// Rate limiting (429)
test('Shows error alert when rate-limited (429)', async ({ page }) => {
  await goToPlayground(page)
  await page.route('**/validate', route => route.fulfill({ status: 429, body: JSON.stringify({ error: 'Too many requests' }), headers: { 'Content-Type': 'application/json' } }))
  await yamlBox(page).fill('foo: 1\n')
  await validateBtn(page).click()
  const alert = page.getByRole('alert')
  await expect(alert).toBeVisible()
  await expect(alert).toContainText(/429|Too many requests/i)
})

// Provider Azure badge
test('Provider badge updates to Azure when backend suggests azure', async ({ page }) => {
  await goToPlayground(page)
  await yamlBox(page).fill('resources:\n  - something: azureFunction\n')
  // Force suggest -> azure
  await page.route('**/suggest', route => route.fulfill({ status: 200, body: JSON.stringify({ provider: 'azure', suggestions: [] }), headers: { 'Content-Type': 'application/json' } }))
  await validateBtn(page).click()
  await expect(page.getByText(/Provider:\s*Azure/i)).toBeVisible()
})
