# End-to-End Testing Guide

## Overview

End-to-end (E2E) testing in Cloudlint uses Playwright to test complete user workflows across multiple browsers. Our E2E tests ensure that the application works correctly from the user's perspective.

## Test Structure

### Current E2E Tests

#### 1. Playground Simple Tests (`playground-simple.spec.ts`)

Tests the core playground functionality:

```typescript
test.describe("Playground Simple E2E Tests", () => {
  test("loads playground page successfully", async ({ page }) => {
    await goToPlayground(page);

    // Check that main elements are visible
    await expect(page.getByText("Cloudlint YAML Validator")).toBeVisible();
    await expect(validateBtn(page)).toBeVisible();
    await expect(convertBtn(page)).toBeVisible();
  });

  test("load sample YAML works", async ({ page }) => {
    await goToPlayground(page);

    // Click load sample
    await loadSampleBtn(page).click();

    // Should now have sample content
    const content = await yamlBox(page).inputValue();
    expect(content).toContain("name: cloudlint-example");
  });
});
```

#### 2. Illustration Placeholders Tests (`illustration-placeholders.spec.ts`)

Tests placeholder content and navigation:

```typescript
test.describe("Illustration Placeholders", () => {
  test("About page shows security illustration placeholder", async ({
    page,
  }) => {
    await page.goto("/about");

    const placeholder = page.locator(
      '[data-testid="security-illustration-placeholder"]'
    );
    await expect(placeholder).toBeVisible();
    await expect(placeholder).toContainText(
      "Security Illustration Placeholder"
    );
  });
});
```

### Test Helpers

#### Navigation Helper

```typescript
const goToPlayground = async (page: Page) => {
  await page.goto("/playground", { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForSelector('[data-testid="codemirror-yaml-editor"]', {
    timeout: 10000,
  });
  await page.waitForTimeout(300); // Allow for CodeMirror initialization
};
```

#### Element Selectors

```typescript
const yamlBox = (page: Page) =>
  page.locator('[data-testid="codemirror-yaml-editor"] textarea');
const validateBtn = (page: Page) =>
  page.getByRole("button", { name: /Validate/ });
const convertBtn = (page: Page) =>
  page.getByRole("button", { name: "Convert to JSON" });
const loadSampleBtn = (page: Page) =>
  page.getByRole("button", { name: "Load Sample" });
const resetBtn = (page: Page) => page.getByRole("button", { name: "Reset" });
```

## Browser Configuration

### Supported Browsers

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: "e2e-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "e2e-firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "e2e-webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
```

### Test Configuration

```typescript
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
});
```

## Test Scenarios

### 1. Core Functionality Tests

#### YAML Validation Workflow

```typescript
test("complete YAML validation workflow", async ({ page }) => {
  await goToPlayground(page);

  // Load sample YAML
  await loadSampleBtn(page).click();

  // Validate YAML
  await validateBtn(page).click();

  // Check validation state
  await expect(page.getByText("Validating...")).toBeVisible();
  await page.waitForTimeout(2000);
  await expect(validateBtn(page)).toBeEnabled();
});
```

#### JSON Conversion

```typescript
test("convert to JSON works", async ({ page }) => {
  await goToPlayground(page);

  // Load sample YAML
  await loadSampleBtn(page).click();

  // Convert to JSON
  await convertBtn(page).click();

  // Switch to JSON tab
  await page.getByRole("tab", { name: "JSON Output" }).click();

  // Verify JSON output
  await expect(
    page.getByRole("heading", { name: "JSON Output" })
  ).toBeVisible();
  await expect(page.locator("pre code")).toBeVisible();
});
```

### 2. UI Interaction Tests

#### Theme Toggle

```typescript
test("theme toggle works", async ({ page }) => {
  await goToPlayground(page);

  const themeToggle = page.getByRole("button", { name: /Mode/ });
  await expect(themeToggle).toBeVisible();

  // Toggle theme
  await themeToggle.click();

  // Check for dark class
  const htmlElement = page.locator("html");
  await expect(htmlElement).toHaveClass(/dark/);
});
```

#### Security Checks Toggle

```typescript
test("security checks toggle works", async ({ page }) => {
  await goToPlayground(page);

  const securityToggle = page.locator("#security-toggle");
  await expect(securityToggle).toBeVisible();

  // Should be off by default
  await expect(securityToggle).not.toBeChecked();

  // Enable security checks
  await securityToggle.click();
  await expect(securityToggle).toBeChecked();
});
```

### 3. Navigation Tests

#### Page Navigation

```typescript
test("navigation between pages works", async ({ page }) => {
  // Start at home
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Navigate to playground
  const playgroundLink = page
    .getByRole("link", { name: /playground/i })
    .first();
  await playgroundLink.click();
  await page.waitForURL("**/playground");

  // Verify playground loaded
  await expect(
    page.locator('[data-testid="codemirror-yaml-editor"]')
  ).toBeVisible();
});
```

## Error Handling Tests

### Invalid Input Handling

```typescript
test("handles invalid YAML gracefully", async ({ page }) => {
  await goToPlayground(page);

  // Enter invalid YAML
  await yamlBox(page).fill("invalid: yaml: [\nbroken syntax");

  // Attempt validation
  await validateBtn(page).click();

  // Should handle error gracefully (no crash)
  await page.waitForTimeout(2000);
  await expect(validateBtn(page)).toBeEnabled();
});
```

### Network Error Handling

```typescript
test("handles network errors gracefully", async ({ page }) => {
  // Intercept API calls to simulate network error
  await page.route("/api/yaml/validate", (route) => {
    route.abort("failed");
  });

  await goToPlayground(page);
  await loadSampleBtn(page).click();
  await validateBtn(page).click();

  // Should handle network error gracefully
  await page.waitForTimeout(2000);
  await expect(validateBtn(page)).toBeEnabled();
});
```

## Performance Testing

### Load Time Testing

```typescript
test("playground loads within performance budget", async ({ page }) => {
  const startTime = Date.now();

  await goToPlayground(page);

  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(5000); // 5 second budget

  console.log(`Playground loaded in ${loadTime}ms`);
});
```

### Large Content Handling

```typescript
test("handles large YAML content", async ({ page }) => {
  await goToPlayground(page);

  // Generate large content
  const largeContent = Array.from(
    { length: 100 },
    (_, i) => `item_${i}:\n  name: "Item ${i}"\n  value: ${i}`
  ).join("\n");

  // Fill editor
  const startTime = Date.now();
  await yamlBox(page).fill(largeContent);
  const fillTime = Date.now() - startTime;

  expect(fillTime).toBeLessThan(2000); // 2 second budget

  // Validate large content
  await validateBtn(page).click();
  await page.waitForTimeout(3000);

  console.log(`Large content handled in ${fillTime}ms`);
});
```

## Visual Testing

### Screenshot Comparison

```typescript
test("playground visual regression", async ({ page }) => {
  await goToPlayground(page);

  // Take screenshot of initial state
  await expect(page).toHaveScreenshot("playground-initial.png");

  // Load sample and take screenshot
  await loadSampleBtn(page).click();
  await expect(page).toHaveScreenshot("playground-with-content.png");
});
```

## Running E2E Tests

### Local Development

```bash
# Run all e2e tests
npm run e2e

# Run with browser UI (headed mode)
npm run e2e -- --headed

# Run specific test file
npm run e2e -- tests/e2e/playground-simple.spec.ts

# Run in debug mode
npm run e2e -- --debug

# Run specific browser
npm run e2e -- --project=e2e-chromium
```

### CI/CD Environment

```bash
# Run all browsers in parallel
npm run e2e

# Generate HTML report
npm run e2e -- --reporter=html

# Run with retries
npm run e2e -- --retries=2
```

## Debugging E2E Tests

### Debug Mode

```bash
# Run in debug mode with browser UI
npm run e2e -- --debug tests/e2e/playground-simple.spec.ts
```

### Screenshots and Videos

```typescript
// Automatic screenshots on failure
test("failing test example", async ({ page }) => {
  await page.goto("/playground");
  // Test will automatically capture screenshot on failure
});

// Manual screenshots
test("manual screenshot example", async ({ page }) => {
  await page.goto("/playground");
  await page.screenshot({ path: "debug-screenshot.png" });
});
```

### Trace Viewer

```bash
# Generate trace on failure
npm run e2e -- --trace=on-first-retry

# View trace
npx playwright show-trace trace.zip
```

## Best Practices

### 1. Test Independence

- Each test should be independent
- Clean up state between tests
- Don't rely on test execution order

### 2. Reliable Selectors

- Use data-testid attributes for test-specific selectors
- Prefer role-based selectors for accessibility
- Avoid CSS selectors that might change

### 3. Waiting Strategies

- Use explicit waits instead of arbitrary timeouts
- Wait for specific conditions, not just time
- Handle loading states appropriately

### 4. Error Handling

- Test both success and failure scenarios
- Verify graceful error handling
- Test network failure scenarios

### 5. Performance Considerations

- Set reasonable performance budgets
- Test with realistic content sizes
- Monitor test execution times

## Maintenance

### Regular Tasks

1. **Update Browser Versions**: Keep Playwright browsers updated
2. **Review Flaky Tests**: Fix or remove unreliable tests
3. **Performance Monitoring**: Track test execution times
4. **Screenshot Updates**: Update visual regression baselines when UI changes

### Troubleshooting Common Issues

1. **Timing Issues**: Add appropriate waits for dynamic content
2. **Selector Issues**: Use more robust selectors
3. **Browser Differences**: Test across all supported browsers
4. **CI/CD Failures**: Check for environment-specific issues

This comprehensive E2E testing approach ensures that Cloudlint works correctly for real users across all supported browsers and scenarios.
