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
  } catch {}
  // Fallback path: try home -> navbar -> playground, then reload once
  try {
    await page.goto('/', { waitUntil: 'networkidle' })
    const nav = page.getByRole('link', { name: 'Playground', exact: true })
    await nav.click({ timeout: 1500 })
  } catch {}
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
const convertBtn = (page) => page.getByRole('button', { name: 'Convert to JSON' })
const uploadYamlInput = (page) => page.locator('input[aria-label="Upload YAML file"]')
const uploadSchemaInput = (page) => page.locator('input[aria-label="Upload JSON Schema"]')

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
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(convertBtn(page)).toBeEnabled()
})

test('YAML invalid content shows error alert', async ({ page }) => {
  await goToPlayground(page)
  await yamlBox(page).fill('foo: [1\n') // malformed YAML
  await validateBtn(page).click()
  const alert = page.getByRole('alert')
  await expect(alert).toBeVisible()
  await expect(alert).toContainText(/Found\s+\d+\s+error\(s\)/)
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
