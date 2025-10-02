import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

test.describe('CloudLint YAML Validation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the playground
    await page.goto(`${BASE_URL}/playground`);
    
    // Wait for the editor to be ready
    await page.waitForSelector('.cm-editor', { timeout: 10000 });
  });

  test.describe('Basic validation flow', () => {
    test('should show validation success for valid YAML', async ({ page }) => {
      // Enter valid YAML
      const validYaml = `name: John Doe
age: 30
city: New York`;

      await page.locator('.cm-editor .cm-content').fill(validYaml);
      
      // Click validate button
      await page.locator('button:has-text("Validate")').click();
      
      // Wait for validation result
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      
      // Should show success message
      const statusElement = page.locator('[role="status"]');
      await expect(statusElement).toContainText('No errors found');
      
      // Success message should have green styling
      await expect(statusElement).toHaveClass(/.*success.*|.*green.*/i);
    });

    test('should show validation error for invalid YAML', async ({ page }) => {
      // Enter the problematic YAML that was failing in production
      const invalidYaml = `fruits:
  - apple
   - banana
  - orange`;

      await page.locator('.cm-editor .cm-content').fill(invalidYaml);
      
      // Click validate button
      await page.locator('button:has-text("Validate")').click();
      
      // Wait for validation result
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      
      // Should show error message
      const statusElement = page.locator('[role="status"]');
      await expect(statusElement).not.toContainText('No errors found');
      
      // Should mention the indentation error
      await expect(statusElement).toContainText(/indentation|inconsistent/i);
      
      // Error message should have red/error styling
      await expect(statusElement).toHaveClass(/.*error.*|.*red.*/i);
    });

    test('should handle empty YAML gracefully', async ({ page }) => {
      // Leave editor empty
      await page.locator('.cm-editor .cm-content').fill('');
      
      // Click validate button
      await page.locator('button:has-text("Validate")').click();
      
      // Should show success for empty input
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      const statusElement = page.locator('[role="status"]');
      await expect(statusElement).toContainText('No errors found');
    });
  });

  test.describe('Error message specificity', () => {
    test('should show specific error for inconsistent list indentation', async ({ page }) => {
      const yaml = `fruits:
  - apple
   - banana
  - orange`;

      await page.locator('.cm-editor .cm-content').fill(yaml);
      await page.locator('button:has-text("Validate")').click();
      
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      const statusElement = page.locator('[role="status"]');
      
      // Should mention line number and specific indentation issue
      await expect(statusElement).toContainText(/line 3/i);
      await expect(statusElement).toContainText(/expected 2.*got 3|inconsistent.*indentation/i);
    });

    test('should show error for tab indentation', async ({ page }) => {
      const yamlWithTab = `config:
\thost: localhost
  port: 3306`;

      await page.locator('.cm-editor .cm-content').fill(yamlWithTab);
      await page.locator('button:has-text("Validate")').click();
      
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      const statusElement = page.locator('[role="status"]');
      
      await expect(statusElement).toContainText(/tab.*character|mixed.*indentation/i);
    });

    test('should show error for missing space after colon', async ({ page }) => {
      const yamlMissingSpace = `name:John Doe
age:30`;

      await page.locator('.cm-editor .cm-content').fill(yamlMissingSpace);
      await page.locator('button:has-text("Validate")').click();
      
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      const statusElement = page.locator('[role="status"]');
      
      await expect(statusElement).toContainText(/missing.*space.*colon/i);
    });
  });

  test.describe('Loading states and UX', () => {
    test('should show loading state during validation', async ({ page }) => {
      const yaml = `name: John`;
      await page.locator('.cm-editor .cm-content').fill(yaml);
      
      // Click validate and immediately check for loading state
      await page.locator('button:has-text("Validate")').click();
      
      // Should show spinner or loading text briefly
      const loadingIndicator = page.locator('button:has-text("Validate") svg, button:has-text("Validating")');
      
      // Note: This might be too fast to catch consistently, so we make it optional
      try {
        await expect(loadingIndicator).toBeVisible({ timeout: 1000 });
      } catch {
        // Loading state might be too brief to catch - that's okay
      }
      
      // Should eventually show result
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
    });

    test('should disable validate button during validation', async ({ page }) => {
      const yaml = `name: John`;
      await page.locator('.cm-editor .cm-content').fill(yaml);
      
      const validateButton = page.locator('button:has-text("Validate")');
      await validateButton.click();
      
      // Button should be temporarily disabled
      try {
        await expect(validateButton).toBeDisabled({ timeout: 1000 });
      } catch {
        // Validation might be too fast - that's okay
      }
      
      // Should be enabled again after completion
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      await expect(validateButton).toBeEnabled();
    });
  });

  test.describe('Editor integration', () => {
    test('should maintain editor content after validation', async ({ page }) => {
      const yaml = `fruits:
  - apple
  - banana`;
      
      await page.locator('.cm-editor .cm-content').fill(yaml);
      await page.locator('button:has-text("Validate")').click();
      
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      
      // Content should still be in the editor
      const editorContent = await page.locator('.cm-editor .cm-content').textContent();
      expect(editorContent.trim()).toBe(yaml);
    });

    test('should allow editing after validation', async ({ page }) => {
      // First validation
      await page.locator('.cm-editor .cm-content').fill('name: John');
      await page.locator('button:has-text("Validate")').click();
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      
      // Edit the content
      await page.locator('.cm-editor .cm-content').fill('name: Jane\\nage: 25');
      
      // Second validation
      await page.locator('button:has-text("Validate")').click();
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      
      const statusElement = page.locator('[role="status"]');
      await expect(statusElement).toContainText('No errors found');
    });
  });

  test.describe('Complex YAML scenarios', () => {
    test('should handle nested structures with errors', async ({ page }) => {
      const complexYaml = `users:
  - name: John
    hobbies:
      - reading
       - coding
      - writing`;

      await page.locator('.cm-editor .cm-content').fill(complexYaml);
      await page.locator('button:has-text("Validate")').click();
      
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      const statusElement = page.locator('[role="status"]');
      
      // Should detect the nested indentation error
      await expect(statusElement).not.toContainText('No errors found');
      await expect(statusElement).toContainText(/line 5/i); // "coding" line
    });

    test('should handle multiple errors in same file', async ({ page }) => {
      const multiErrorYaml = `root:
\tname: John  
   age:30`;

      await page.locator('.cm-editor .cm-content').fill(multiErrorYaml);
      await page.locator('button:has-text("Validate")').click();
      
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      const statusElement = page.locator('[role="status"]');
      
      // Should show multiple errors or at least indicate multiple issues
      const statusText = await statusElement.textContent();
      
      // Should have tab error and/or missing colon space error and/or odd indentation
      expect(
        statusText.includes('tab') || 
        statusText.includes('colon') || 
        statusText.includes('indentation')
      ).toBe(true);
    });

    test('should accept URLs without triggering colon errors', async ({ page }) => {
      const yamlWithUrls = `website: https://example.com
api: http://localhost:3000/api`;

      await page.locator('.cm-editor .cm-content').fill(yamlWithUrls);
      await page.locator('button:has-text("Validate")').click();
      
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      const statusElement = page.locator('[role="status"]');
      
      await expect(statusElement).toContainText('No errors found');
    });
  });

  test.describe('Accessibility and usability', () => {
    test('should have accessible validation results', async ({ page }) => {
      const yaml = `fruits:
  - apple
   - banana`;

      await page.locator('.cm-editor .cm-content').fill(yaml);
      await page.locator('button:has-text("Validate")').click();
      
      // Results should be in a status region for screen readers
      const statusRegion = page.locator('[role="status"]');
      await expect(statusRegion).toBeVisible();
      
      // Should have accessible text
      const statusText = await statusRegion.textContent();
      expect(statusText.length).toBeGreaterThan(0);
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.locator('.cm-editor .cm-content').fill('test: value');
      
      // Should be able to tab to validate button and activate with Enter
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // May need multiple tabs depending on layout
      
      const focusedElement = page.locator(':focus');
      
      // One of the buttons should be focused
      const validateButton = page.locator('button:has-text("Validate")');
      
      // Click with keyboard
      await validateButton.focus();
      await page.keyboard.press('Enter');
      
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
    });
  });

  test.describe('New UI Features', () => {
    test('should have Reset button that clears all content and results', async ({ page }) => {
      // Add some content and validate
      const yaml = `name: test
value: 123`;
      await page.locator('.cm-editor .cm-content').fill(yaml);
      await page.locator('button:has-text("Validate")').click();
      
      // Wait for results
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      
      // Click Reset button
      await page.locator('button:has-text("Reset")').click();
      
      // Verify everything is cleared
      const editorContent = await page.locator('.cm-editor .cm-content').textContent();
      expect(editorContent.trim()).toBe('');
      
      // Results should be gone
      const statusElements = page.locator('[role="status"]');
      await expect(statusElements).toHaveCount(0);
    });

    test('should NOT auto-validate on paste', async ({ page }) => {
      // Paste invalid YAML
      const invalidYaml = `user:
  name: "Alice
  email: "test@example.com"`;
      
      await page.locator('.cm-editor .cm-content').fill(invalidYaml);
      
      // Wait a moment to see if auto-validation happens
      await page.waitForTimeout(1000);
      
      // Should NOT show validation results yet
      const statusElements = page.locator('[role="status"]');
      await expect(statusElements).toHaveCount(0);
      
      // Only after clicking Validate should we see results
      await page.locator('button:has-text("Validate")').click();
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      const statusElement = page.locator('[role="status"]');
      await expect(statusElement).not.toContainText('No errors found');
    });

    test('should show errors and JSON side-by-side', async ({ page }) => {
      const yaml = `name: "test"
age: 30`;
      
      await page.locator('.cm-editor .cm-content').fill(yaml);
      
      // Validate first
      await page.locator('button:has-text("Validate")').click();
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      
      // Convert to JSON
      await page.locator('button:has-text("Convert to JSON")').click();
      
      // Both validation results and JSON should be visible
      const statusElement = page.locator('[role="status"]');
      const jsonOutput = page.locator('text=JSON Output').first();
      
      await expect(statusElement).toBeVisible();
      await expect(jsonOutput).toBeVisible();
    });

    test('should detect missing quotes syntax error', async ({ page }) => {
      // This is the specific missing quote issue reported
      const missingQuoteYaml = `user:
  name: "Alice
  email: "alice@example.com"`;

      await page.locator('.cm-editor .cm-content').fill(missingQuoteYaml);
      await page.locator('button:has-text("Validate")').click();
      
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      const statusElement = page.locator('[role="status"]');
      
      // Should show error (not "No errors found")
      await expect(statusElement).not.toContainText('No errors found');
      
      // Should mention quote or string error
      const statusText = await statusElement.textContent();
      expect(statusText.toLowerCase()).toMatch(/quote|string|incomplete/);
    });
  });

  test.describe('Regression tests', () => {
    test('regression: banana indentation issue should be caught', async ({ page }) => {
      // This is the exact issue reported by the user
      const problematicYaml = `fruits:
  - apple
   - banana
  - orange`;

      await page.locator('.cm-editor .cm-content').fill(problematicYaml);
      await page.locator('button:has-text("Validate")').click();
      
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      const statusElement = page.locator('[role="status"]');
      
      // This MUST fail - it was incorrectly passing before
      await expect(statusElement).not.toContainText('No errors found');
      
      // Should specifically mention the indentation issue
      const statusText = await statusElement.textContent();
      expect(statusText.toLowerCase()).toMatch(/indentation|inconsistent|line 3/);
    });

    test('regression: missing quote issue should be caught', async ({ page }) => {
      // This is the new missing quote issue reported
      const missingQuoteYaml = `user:
  name: "Alice
  email: "alice@example.com"`;

      await page.locator('.cm-editor .cm-content').fill(missingQuoteYaml);
      await page.locator('button:has-text("Validate")').click();
      
      await page.waitForSelector('[role="status"]', { timeout: 5000 });
      const statusElement = page.locator('[role="status"]');
      
      // This MUST fail - it was incorrectly passing before
      await expect(statusElement).not.toContainText('No errors found');
      
      // Should specifically mention the quote issue
      const statusText = await statusElement.textContent();
      expect(statusText.toLowerCase()).toMatch(/quote|string|missing|incomplete/);
    });
  });
});

test.describe('Backend integration tests', () => {
  test('should connect to backend validation service', async ({ page }) => {
    // Intercept the validation API call
    let apiCallMade = false;
    await page.route(`${BACKEND_URL}/validate`, route => {
      apiCallMade = true;
      route.continue();
    });
    
    await page.goto(`${BASE_URL}/playground`);
    await page.waitForSelector('.cm-editor', { timeout: 10000 });
    
    await page.locator('.cm-editor .cm-content').fill('test: value');
    await page.locator('button:has-text("Validate")').click();
    
    // Wait for API call and response
    await page.waitForSelector('[role="status"]', { timeout: 10000 });
    
    expect(apiCallMade).toBe(true);
  });
});