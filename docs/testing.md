# Testing Strategy

## Overview

Cloudlint employs a comprehensive testing strategy that ensures code quality, functionality, accessibility, and performance. Our testing approach follows the testing pyramid with a focus on fast feedback and reliable automation.

## Testing Pyramid

```
        E2E Tests (Playwright)
             ↑ (Few, Slow, High Confidence)
        Integration Tests
             ↑ (Some, Medium Speed)
        Unit Tests (Vitest)
             ↑ (Many, Fast, Low Level)
```

## Test Categories

### 1. Unit Tests (Vitest)

**Purpose**: Test individual components and functions in isolation

**Tools**:

- Vitest (test runner)
- React Testing Library (component testing)
- Jest DOM (DOM assertions)

**Coverage**:

- React components
- Utility functions
- API client functions
- Custom hooks

**Example**:

```typescript
// PlaygroundSimple.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { PlaygroundSimple } from './PlaygroundSimple'

test('loads sample YAML when button is clicked', async () => {
  render(<PlaygroundSimple />)

  const loadSampleBtn = screen.getByRole('button', { name: 'Load Sample' })
  fireEvent.click(loadSampleBtn)

  const editor = screen.getByTestId('codemirror-yaml-editor')
  expect(editor).toHaveValue(expect.stringContaining('name: cloudlint-example'))
})
```

**Running Unit Tests**:

```bash
npm run test          # Watch mode
npm run test:run      # Single run
npm run test:ui       # UI mode
npm run test:coverage # With coverage
```

### 2. Integration Tests

**Purpose**: Test API endpoints and backend functionality

**Tools**:

- Vitest
- Supertest (HTTP assertions)
- Node.js test environment

**Coverage**:

- API endpoints
- YAML processing pipeline
- Error handling
- Security validation

**Example**:

```typescript
// api.test.ts
import request from "supertest";
import { app } from "../src/server";

test("validates YAML successfully", async () => {
  const yaml = "name: test\nversion: 1.0.0";

  const response = await request(app)
    .post("/api/yaml/validate")
    .send({ yaml })
    .expect(200);

  expect(response.body.valid).toBe(true);
  expect(response.body.errors).toHaveLength(0);
});
```

### 3. End-to-End Tests (Playwright)

**Purpose**: Test complete user workflows across browsers

**Tools**:

- Playwright (browser automation)
- Multiple browser support (Chromium, Firefox, WebKit)

**Coverage**:

- User workflows
- Cross-browser compatibility
- Real browser interactions
- Visual regression testing

**Example**:

```typescript
// playground-simple.spec.ts
import { test, expect } from "@playwright/test";

test("complete YAML validation workflow", async ({ page }) => {
  await page.goto("/playground");

  // Load sample YAML
  await page.getByRole("button", { name: "Load Sample" }).click();

  // Validate YAML
  await page.getByRole("button", { name: /Validate/ }).click();

  // Check validation completed
  await expect(page.getByText("Validating...")).toBeVisible();
  await page.waitForTimeout(2000);
  await expect(page.getByRole("button", { name: "Validate" })).toBeEnabled();
});
```

**Running E2E Tests**:

```bash
npm run e2e                    # All e2e tests
npm run e2e -- --headed        # With browser UI
npm run e2e -- --debug         # Debug mode
```

### 4. Accessibility Tests

**Purpose**: Ensure WCAG 2.1 AA compliance

**Tools**:

- Axe-core (accessibility engine)
- Playwright (browser automation)
- Manual testing procedures

**Coverage**:

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus management

**Example**:

```typescript
// wcag-compliance.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("playground meets WCAG 2.1 AA standards", async ({ page }) => {
  await page.goto("/playground");
  await page.waitForSelector('[data-testid="codemirror-yaml-editor"]');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### 5. Performance Tests

**Purpose**: Ensure application performance meets standards

**Tools**:

- Playwright (performance metrics)
- Custom performance utilities
- Browser performance APIs

**Coverage**:

- Page load times
- Large content handling
- Memory usage
- Response times

**Example**:

```typescript
// large-yaml-files.spec.ts
test("validates large YAML content within performance threshold", async ({
  page,
}) => {
  const largeContent = generateLargeYamlContent(1000); // 1000 lines

  await page.goto("/playground");
  await page
    .locator('[data-testid="codemirror-yaml-editor"] textarea')
    .fill(largeContent);

  const startTime = Date.now();
  await page.getByRole("button", { name: /Validate/ }).click();
  await page.waitForTimeout(2000);
  const validationTime = Date.now() - startTime;

  expect(validationTime).toBeLessThan(10000); // 10 seconds
});
```

### 6. Mobile Tests

**Purpose**: Ensure mobile compatibility and responsiveness

**Tools**:

- Playwright (mobile emulation)
- Device-specific testing
- Touch interaction testing

**Coverage**:

- Responsive design
- Touch interactions
- Mobile performance
- Accessibility on mobile

**Example**:

```typescript
// responsive-interactions.spec.ts
test("playground works on mobile devices", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
  await page.goto("/playground");

  const yamlBox = page.locator(
    '[data-testid="codemirror-yaml-editor"] textarea'
  );
  await yamlBox.tap();
  await expect(yamlBox).toBeFocused();

  await yamlBox.fill("test: mobile-input");
  await page.getByRole("button", { name: /Validate/ }).tap();

  await page.waitForTimeout(2000);
  console.log("✓ Mobile touch interactions work correctly");
});
```

## Test Configuration

### Vitest Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/"],
    },
  },
});
```

### Playwright Configuration

```typescript
// playwright.config.ts
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
  },
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
    {
      name: "accessibility",
      testDir: "./tests/accessibility",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testDir: "./tests/mobile",
      use: { ...devices["iPhone 12"] },
    },
    {
      name: "performance",
      testDir: "./tests/performance",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

## Test Data Management

### Fixtures

```typescript
// Test fixtures for consistent test data
export const YAML_FIXTURES = {
  valid: {
    simple: "name: test\nversion: 1.0.0",
    complex: `
      apiVersion: v1
      kind: ConfigMap
      metadata:
        name: test-config
      data:
        config.yaml: |
          database:
            host: localhost
            port: 5432
    `,
  },
  invalid: {
    syntax: "invalid: yaml: [\nbroken syntax",
    indentation: "name: test\n version: 1.0.0", // wrong indentation
  },
};
```

### Mock Services

```typescript
// MSW for API mocking
import { rest } from "msw";
import { setupServer } from "msw/node";

export const server = setupServer(
  rest.post("/api/yaml/validate", (req, res, ctx) => {
    return res(ctx.json({ valid: true, errors: [] }));
  })
);
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - run: npm ci
      - run: npx playwright install
      - run: npm run build
      - run: npm run e2e
```

## Test Quality Metrics

### Coverage Targets

- **Unit Tests**: 80%+ line coverage
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: Critical user paths covered
- **Accessibility**: 100% WCAG 2.1 AA compliance

### Performance Benchmarks

- **Page Load**: < 3 seconds
- **Validation Response**: < 2 seconds for typical content
- **Large Content**: < 10 seconds for 1000+ lines
- **Mobile Performance**: Comparable to desktop

## Best Practices

### Test Writing

1. **Descriptive Names**: Clear test descriptions
2. **Arrange-Act-Assert**: Consistent test structure
3. **Single Responsibility**: One assertion per test
4. **Test Independence**: Tests don't depend on each other

### Maintenance

1. **Regular Updates**: Keep tests updated with features
2. **Flaky Test Management**: Fix or remove unreliable tests
3. **Performance Monitoring**: Track test execution times
4. **Documentation**: Keep test documentation current

### Debugging

1. **Debug Mode**: Use Playwright debug mode for e2e tests
2. **Screenshots**: Capture screenshots on failures
3. **Logs**: Comprehensive logging for troubleshooting
4. **Isolation**: Run tests in isolation for debugging

## Running Tests

### Development Workflow

```bash
# Run tests during development
npm run test              # Unit tests in watch mode
npm run test:run          # Single run of unit tests
npm run e2e -- --headed   # E2E tests with browser UI

# Before committing
npm run test:run          # All unit tests
npm run e2e               # All e2e tests
npm run lint              # Code linting
npm run type-check        # TypeScript checks
```

### CI/CD Pipeline

```bash
# Full test suite (runs in CI)
npm run test:run          # Unit tests
npm run test:coverage     # Coverage report
npm run e2e               # E2E tests all browsers
npm run e2e:accessibility # Accessibility tests
npm run e2e:performance   # Performance tests
```

This comprehensive testing strategy ensures that Cloudlint maintains high quality, accessibility, and performance standards while providing fast feedback to developers.
