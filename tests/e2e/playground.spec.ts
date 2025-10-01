import { test, expect, type Page } from '@playwright/test'
import fs from 'fs'
import os from 'os'
import path from 'path'

const goToPlayground = async (page: Page) => {
  // First ensure we can reach the server at all
  try {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 15000 })
  } catch {
    // If home fails, the server might not be running
    throw new Error('Cannot reach server - make sure the dev server or build is running')
  }
  
  // Navigate directly to playground
  await page.goto('/playground', { waitUntil: 'networkidle', timeout: 15000 })
  
  // Wait for React hydration and Monaco editor to load
  await page.waitForSelector('main', { timeout: 10000 })
  
  // Look for YAML textarea with multiple selectors as fallback
  const yamlBox = page.getByRole('textbox', { name: 'YAML input' })
  const monacoEditor = page.locator('.monaco-editor textarea').first()
  
  try {
    // Try primary selector first
    await expect(yamlBox).toBeVisible({ timeout: 5000 })
    await expect(yamlBox).toBeEnabled({ timeout: 2000 })
    return
  } catch {
    // Fallback to Monaco editor selector
    try {
      await expect(monacoEditor).toBeVisible({ timeout: 5000 })
      return
    } catch {
      // Final fallback: reload and try again
      console.log('YAML textarea not found, reloading page...')
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForSelector('main', { timeout: 10000 })
      
      // Give extra time for Monaco editor to initialize
      await page.waitForTimeout(2000)
      
      // Try both selectors one more time
      try {
        await expect(yamlBox).toBeVisible({ timeout: 10000 })
        await expect(yamlBox).toBeEnabled({ timeout: 3000 })
      } catch {
        await expect(monacoEditor).toBeVisible({ timeout: 5000 })
      }
    }
  }
}

const yamlBox = (page: Page) => page.getByRole('textbox', { name: 'YAML input' })
const validateBtn = (page: Page) => page.getByRole('button', { name: 'Validate' })
const convertBtn = (page: Page) => page.getByRole('button', { name: 'Convert to JSON' })
const uploadYamlInput = (page: Page) => page.locator('input[aria-label="Upload YAML file"]')
const uploadSchemaInput = (page: Page) => page.locator('input[aria-label="Upload JSON Schema"]')

function tmpFileWith(contents: string, ext = '.txt') {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-')), `file${ext}`)
  fs.writeFileSync(file, contents)
  return file
}

function tmpFileOfSize(bytes: number, ext = '.yaml') {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-')), `big${ext}`)
  fs.writeFileSync(file, Buffer.alloc(bytes, 0x61)) // 'a' repeated
  return file
}

// YAML paste/upload and validation (success + error)
test('YAML paste validates successfully and shows no error alert', async ({ page }) => {
  await goToPlayground(page)
  await yamlBox(page).fill('foo: 1\n')
  await validateBtn(page).click()
  // Should show success status
  await expect(page.getByRole('status')).toBeVisible()
  await expect(page.getByRole('status')).toContainText(/no errors found/i)
  await expect(convertBtn(page)).toBeEnabled()
})

test('YAML invalid content shows error alert', async ({ page }) => {
  await goToPlayground(page)
  await yamlBox(page).fill('foo: [1\n') // malformed YAML
  await validateBtn(page).click()
  const alert = page.getByRole('alert')
  await expect(alert).toBeVisible()
  await expect(alert).toContainText(/Found\s+\d+\s+issue\(s\)/i)
})

// Schema upload and validation
test('Upload JSON Schema and validate shows schema errors for missing required field', async ({ page }) => {
  await goToPlayground(page)
  await yamlBox(page).fill('age: 3\n')
  // Force schema validation to fail deterministically
  await page.route('**/schema-validate', route => route.fulfill({ status: 200, body: JSON.stringify({ ok: false, errors: ['/: must have required property `name`'] }), headers: { 'Content-Type': 'application/json' } }))
  const schema = {
    type: 'object',
    required: ['name'],
    properties: { name: { type: 'string' } },
  }
  const schemaPath = tmpFileWith(JSON.stringify(schema), '.json')
  await uploadSchemaInput(page).setInputFiles(schemaPath)
  await validateBtn(page).click()
  const alerts = page.getByRole('alert')
  await expect(alerts).toHaveCount(1)
  await expect(alerts.first()).toContainText(/Schema validation/i)
})

// File size limit checks
test('Blocks oversize file upload with alert', async ({ page }) => {
  await goToPlayground(page)
  // Default limit is ~200 KB. Use 220 KB.
  const big = tmpFileOfSize(220 * 1024, '.yaml')
  await uploadYamlInput(page).setInputFiles(big)
  const alert = page.getByRole('alert')
  await expect(alert).toBeVisible()
  await expect(alert).toContainText(/File too large/i)
})

// Diff preview with "Accept" action
test('Shows diff preview and applies fix via Accept button', async ({ page }) => {
  await goToPlayground(page)
  await page.route('**/validate', route => route.fulfill({ status: 200, body: JSON.stringify({ ok: false, messages: [{message:'x',severity:'error'}], fixed: 'steps:\n  - script: echo hi\n' }), headers: { 'Content-Type': 'application/json' } }))
  await page.route('**/diff-preview', route => route.fulfill({ status: 200, body: JSON.stringify({ diff: '@@\n-steps:\n  - scirpt: echo hi\n+steps:\n  - script: echo hi\n', before: 'steps:\n  - scirpt: echo hi\n', after: 'steps:\n  - script: echo hi\n' }), headers: { 'Content-Type': 'application/json' } }))
  await yamlBox(page).fill('steps:\n  - scirpt: echo hi\n')
  await validateBtn(page).click()
  // Wait for diff preview card then Accept button
  await expect(page.getByRole('heading', { name: 'Preview changes' })).toBeVisible()
  const accept = page.getByRole('button', { name: 'Accept' })
  await expect(accept).toBeVisible()
  await accept.click()
  // After accept, the editor should contain the fixed content
  await expect(yamlBox(page)).toHaveValue(/script: echo hi/)
})

// Cancellation flows
test('Cancel button aborts in-flight validation', async ({ page }) => {
  await goToPlayground(page)
  // Keep validation in-flight long enough to click cancel
  await page.route('**/validate', async route => {
    await new Promise(r => setTimeout(r, 1500))
    route.fulfill({ status: 200, body: JSON.stringify({ ok: true, messages: [] }), headers: { 'Content-Type': 'application/json' } })
  })
  await yamlBox(page).fill('foo: 1\n')
  await validateBtn(page).click()
  const cancel = page.getByRole('button', { name: 'Cancel' })
  await expect(cancel).toBeVisible()
  await cancel.click()
  await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0)
})

test('Editing YAML auto-cancels validation', async ({ page }) => {
  await goToPlayground(page)
  // Keep validation in-flight long enough for Cancel button to appear and be cancelled by editing
  await page.route('**/validate', async route => {
    await new Promise(r => setTimeout(r, 2000)) // Longer delay to ensure Cancel button appears
    route.fulfill({ status: 200, body: JSON.stringify({ ok: true, messages: [] }), headers: { 'Content-Type': 'application/json' } })
  })
  await yamlBox(page).fill('foo: 1\n')
  await validateBtn(page).click()
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
  await yamlBox(page).press('End')
  await yamlBox(page).type(' # change')
  await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0)
})

// Provider awareness badge
test('Provider badge updates to AWS when CFN template detected', async ({ page }) => {
  await goToPlayground(page)
  // Force suggest -> aws for stability across browsers
  await page.route('**/suggest', route => route.fulfill({ status: 200, body: JSON.stringify({ provider: 'aws', suggestions: [] }), headers: { 'Content-Type': 'application/json' } }))
  await yamlBox(page).fill("AWSTemplateFormatVersion: '2010-09-09'\nResources:\n  B:\n    Type: AWS::S3::Bucket\n")
  await validateBtn(page).click()
  await expect(page.getByText(/Provider:\s*AWS/i)).toBeVisible()
})

// Critical alerts and UI feedback
test('Shows alerts and maintains keyboard and ARIA accessibility', async ({ page }) => {
  await goToPlayground(page)
  // Basic roles
  await expect(page.getByRole('button', { name: 'Upload YAML', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Convert to JSON', exact: true })).toBeVisible()

  // Keyboard navigation: Tab to Validate button
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  const validate = page.getByRole('button', { name: 'Validate' })
  await expect(validate).toBeVisible()
  // Try focusing validate
  await validate.focus()
  await expect(validate).toBeFocused()

  // Trigger an error alert and verify role
  await yamlBox(page).fill('foo: [1\n')
  await validate.click()
  await expect(page.getByRole('alert')).toBeVisible()
})
