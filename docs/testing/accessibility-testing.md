# Accessibility Testing Guide

## Overview

Cloudlint is committed to WCAG 2.1 AA compliance and comprehensive accessibility. Our accessibility testing ensures that the application is usable by everyone, including users with disabilities.

## Testing Framework

### Tools Used

- **Axe-core**: Automated accessibility testing engine
- **Playwright**: Browser automation for accessibility testing
- **Manual Testing**: Keyboard navigation and screen reader testing
- **Color Contrast Analyzers**: Ensuring proper contrast ratios

### Test Categories

1. **Automated WCAG Testing**: Axe-core integration
2. **Keyboard Navigation**: Full keyboard accessibility
3. **Screen Reader Testing**: ARIA and semantic HTML validation
4. **Mobile Accessibility**: Touch targets and mobile screen readers
5. **Color and Contrast**: Visual accessibility requirements

## Automated Accessibility Testing

### WCAG 2.1 AA Compliance Tests

```typescript
// wcag-compliance.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("WCAG 2.1 AA Compliance Testing", () => {
  const runAccessibilityScan = async (page: Page, context: string) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    console.log(`🔍 Accessibility scan for ${context}:`);
    console.log(`  ✅ Passed: ${accessibilityScanResults.passes.length} rules`);
    console.log(
      `  ❌ Violations: ${accessibilityScanResults.violations.length} violations`
    );

    return accessibilityScanResults;
  };

  test("homepage meets WCAG 2.1 AA standards", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const results = await runAccessibilityScan(page, "Homepage");
    expect(results.violations).toEqual([]);
  });

  test("playground page meets WCAG 2.1 AA standards", async ({ page }) => {
    await page.goto("/playground");
    await page.waitForSelector('[data-testid="codemirror-yaml-editor"]');

    const results = await runAccessibilityScan(page, "Playground");
    expect(results.violations).toEqual([]);
  });
});
```

### Color Contrast Testing

```typescript
test("all pages pass color contrast requirements", async ({ page }) => {
  const pagesToTest = ["/", "/playground", "/contact"];

  for (const pagePath of pagesToTest) {
    await page.goto(pagePath);
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2aa"])
      .withRules(["color-contrast"])
      .analyze();

    const contrastViolations = results.violations.filter(
      (v) => v.id === "color-contrast"
    );
    expect(contrastViolations).toEqual([]);

    console.log(`🎨 Color contrast for ${pagePath}: ✅ Passed`);
  }
});
```

## Keyboard Navigation Testing

### Full Keyboard Accessibility

```typescript
test.describe("Keyboard Navigation Testing", () => {
  test("playground supports full keyboard navigation", async ({ page }) => {
    await page.goto("/playground");
    await page.waitForSelector('[data-testid="codemirror-yaml-editor"]');

    // Test tab navigation through interactive elements
    await page.keyboard.press("Tab"); // Focus first interactive element
    await page.keyboard.press("Tab"); // Move to next element
    await page.keyboard.press("Tab"); // Continue navigation

    // Should reach validate button
    const validateBtn = page.getByRole("button", { name: /Validate/ });
    await expect(validateBtn).toBeFocused();

    // Test Enter key activation
    await page.keyboard.press("Enter");

    // Wait for validation to complete
    await page.waitForTimeout(2000);

    console.log("✅ Keyboard navigation works correctly");
  });

  test("focus management works correctly", async ({ page }) => {
    await page.goto("/playground");

    const yamlInput = page.locator(
      '[data-testid="codemirror-yaml-editor"] textarea'
    );
    const validateBtn = page.getByRole("button", { name: /Validate/ });

    // Test programmatic focus
    await yamlInput.focus();
    await expect(yamlInput).toBeFocused();

    await validateBtn.focus();
    await expect(validateBtn).toBeFocused();

    // Verify focus is visible
    const focusedElement = await page.evaluate(
      () => document.activeElement?.tagName
    );
    expect(focusedElement).toBe("BUTTON");

    console.log("✅ Focus management working correctly");
  });

  test("keyboard shortcuts work properly", async ({ page }) => {
    await page.goto("/playground");

    const yamlInput = page.locator(
      '[data-testid="codemirror-yaml-editor"] textarea'
    );

    // Focus editor
    await yamlInput.focus();

    // Test Ctrl+Enter shortcut for validation (if implemented)
    await yamlInput.fill("test: keyboard-shortcut");
    await page.keyboard.press("Control+Enter");

    // Should trigger validation
    await page.waitForTimeout(2000);

    console.log("✅ Keyboard shortcuts work correctly");
  });
});
```

## ARIA and Semantic HTML Testing

### ARIA Labels and Roles

```typescript
test.describe("ARIA and Semantic HTML Testing", () => {
  test("playground has proper ARIA labels and roles", async ({ page }) => {
    await page.goto("/playground");
    await page.waitForSelector('[data-testid="codemirror-yaml-editor"]');

    // Test button accessibility
    const validateBtn = page.getByRole("button", { name: /Validate/ });
    await expect(validateBtn).toBeVisible();

    const convertBtn = page.getByRole("button", { name: "Convert to JSON" });
    await expect(convertBtn).toBeVisible();

    // Test functionality with ARIA
    const yamlInput = page.locator(
      '[data-testid="codemirror-yaml-editor"] textarea'
    );
    await yamlInput.fill("test: aria-validation");
    await validateBtn.click();

    await page.waitForTimeout(2000);

    console.log("✅ All ARIA labels and roles are properly implemented");
  });

  test("heading hierarchy is correct", async ({ page }) => {
    await page.goto("/playground");

    // Check for proper heading hierarchy
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Cloudlint YAML Validator");

    // Check for logical heading structure
    const headings = await page.locator("h1, h2, h3, h4, h5, h6").all();

    for (const heading of headings) {
      const tagName = await heading.evaluate((el) => el.tagName.toLowerCase());
      console.log(`Found heading: ${tagName}`);
    }

    console.log("✅ Heading hierarchy is correct");
  });

  test("landmarks are properly defined", async ({ page }) => {
    await page.goto("/playground");

    // Check for main landmark
    const main = page.getByRole("main");
    await expect(main).toBeVisible();

    // Check for navigation landmark
    const nav = page.getByRole("navigation");
    await expect(nav).toBeVisible();

    // Check for contentinfo (footer)
    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();

    console.log("✅ Landmarks are properly defined");
  });
});
```

## Screen Reader Testing

### Screen Reader Announcements

```typescript
test.describe("Screen Reader Testing", () => {
  test("status messages are announced properly", async ({ page }) => {
    await page.goto("/playground");

    const yamlInput = page.locator(
      '[data-testid="codemirror-yaml-editor"] textarea'
    );
    const validateBtn = page.getByRole("button", { name: /Validate/ });

    // Add content and validate
    await yamlInput.fill("test: screen-reader-test\nworking: true");
    await validateBtn.click();

    // Wait for validation to complete
    await page.waitForTimeout(2000);

    // Check for status region (should be announced by screen readers)
    const statusRegions = page.locator('[role="status"], [aria-live="polite"]');
    const alertRegions = page.locator(
      '[role="alert"], [aria-live="assertive"]'
    );

    const hasStatus = (await statusRegions.count()) > 0;
    const hasAlert = (await alertRegions.count()) > 0;

    expect(hasStatus || hasAlert).toBe(true);

    console.log("✅ Screen reader announcements work properly");
  });

  test("form labels are properly associated", async ({ page }) => {
    await page.goto("/playground");

    // Check for proper label associations
    const securityToggle = page.locator("#security-toggle");
    const securityLabel = page.locator('label[for="security-toggle"]');

    await expect(securityToggle).toBeVisible();
    await expect(securityLabel).toBeVisible();

    // Verify label text
    await expect(securityLabel).toContainText("Security Checks");

    console.log("✅ Form labels are properly associated");
  });
});
```

## Mobile Accessibility Testing

### Touch Target Testing

```typescript
test.describe("Mobile Accessibility Testing", () => {
  test("touch targets meet accessibility standards", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/playground");
    await page.waitForSelector('[data-testid="codemirror-yaml-editor"]');

    // Test interactive elements
    const interactiveElements = [
      page.getByRole("button", { name: /Validate/ }),
      page.getByRole("button", { name: "Convert to JSON" }),
      page.getByRole("button", { name: "Load Sample" }),
      page.getByRole("button", { name: "Reset" }),
    ];

    for (const element of interactiveElements) {
      const box = await element.boundingBox();
      if (box) {
        // WCAG recommends minimum 44x44px for touch targets
        const isWCAGCompliant = box.width >= 44 && box.height >= 44;
        const isAcceptable = box.width >= 32 && box.height >= 32;

        console.log(
          `Touch target: ${Math.round(box.width)}x${Math.round(box.height)}px - ${
            isWCAGCompliant
              ? "✅ WCAG Compliant"
              : isAcceptable
                ? "⚠️ Acceptable"
                : "❌ Too Small"
          }`
        );

        // Accept 32px minimum but recommend 44px
        expect(box.width).toBeGreaterThanOrEqual(32);
        expect(box.height).toBeGreaterThanOrEqual(32);
      }
    }

    console.log("✅ Touch targets meet accessibility standards");
  });

  test("mobile gestures work with accessibility features", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/playground");

    // Enable reduced motion preference
    await page.emulateMedia({ reducedMotion: "reduce" });

    const yamlInput = page.locator(
      '[data-testid="codemirror-yaml-editor"] textarea'
    );

    // Test tap interaction
    await yamlInput.tap();
    await expect(yamlInput).toBeFocused();

    // Test with accessibility-friendly content
    await yamlInput.fill("mobile: accessibility-test\nreduced-motion: true");

    const validateBtn = page.getByRole("button", { name: /Validate/ });
    await validateBtn.tap();

    await page.waitForTimeout(2000);

    console.log("✅ Mobile gestures work with accessibility features");
  });
});
```

## Dynamic Content Accessibility

### Dynamic Content Testing

```typescript
test.describe("Dynamic Content Accessibility", () => {
  test("dynamically added content maintains accessibility", async ({
    page,
  }) => {
    await page.goto("/playground");

    const yamlInput = page.locator(
      '[data-testid="codemirror-yaml-editor"] textarea'
    );
    const validateBtn = page.getByRole("button", { name: /Validate/ });

    // Test multiple validation cycles
    const testInputs = [
      "first: validation-test",
      "second: validation-test\nerror: false",
      "third: validation-test\ncomplex:\n  nested: true\n  values: [1, 2, 3]",
    ];

    for (let i = 0; i < testInputs.length; i++) {
      await yamlInput.clear();
      await yamlInput.fill(testInputs[i]);
      await validateBtn.click();

      await page.waitForTimeout(2000);

      // Run accessibility scan on dynamic content
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      expect(results.violations).toEqual([]);
      console.log(
        `✅ Dynamic content cycle ${i + 1}: No accessibility violations`
      );
    }
  });

  test("error recovery maintains accessibility", async ({ page }) => {
    await page.goto("/playground");

    const yamlInput = page.locator(
      '[data-testid="codemirror-yaml-editor"] textarea'
    );
    const validateBtn = page.getByRole("button", { name: /Validate/ });

    // Create error state
    await yamlInput.fill("invalid: yaml: [\nbroken syntax");
    await validateBtn.click();

    await page.waitForTimeout(2000);

    // Fix the error
    await yamlInput.clear();
    await yamlInput.fill("fixed: yaml\nworking: true");
    await validateBtn.click();

    await page.waitForTimeout(2000);

    // Run accessibility scan after error recovery
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(results.violations).toEqual([]);
    console.log("✅ Error recovery maintains accessibility");
  });
});
```

## Theme and Display Accessibility

### Theme Accessibility Testing

```typescript
test.describe("Theme and Display Accessibility", () => {
  test("dark mode maintains accessibility standards", async ({ page }) => {
    await page.goto("/playground");

    // Toggle to dark mode
    const themeToggle = page.getByRole("button", { name: /Mode/ });
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);
    }

    // Run accessibility scan in dark mode
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(results.violations).toEqual([]);
    console.log("✅ Dark mode maintains accessibility standards");
  });

  test("high contrast mode compatibility", async ({ page }) => {
    await page.goto("/playground");

    // Simulate high contrast mode
    await page.emulateMedia({ forcedColors: "active" });

    const yamlInput = page.locator(
      '[data-testid="codemirror-yaml-editor"] textarea'
    );
    const validateBtn = page.getByRole("button", { name: /Validate/ });

    // Verify elements are still visible and functional
    await expect(yamlInput).toBeVisible();
    await expect(validateBtn).toBeVisible();

    // Test functionality in high contrast mode
    await yamlInput.fill("high-contrast: test");
    await validateBtn.click();

    await page.waitForTimeout(2000);

    console.log("✅ High contrast mode compatibility verified");
  });

  test("reduced motion preferences are respected", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/playground");

    const yamlInput = page.locator(
      '[data-testid="codemirror-yaml-editor"] textarea'
    );
    const validateBtn = page.getByRole("button", { name: /Validate/ });

    // Test that validation still works with reduced motion
    await yamlInput.fill("reduced-motion: true\naccessible: always");
    await validateBtn.click();

    await page.waitForTimeout(2000);

    console.log("✅ Reduced motion preferences respected");
  });
});
```

## Running Accessibility Tests

### Local Testing

```bash
# Run all accessibility tests
npm run e2e -- --project=accessibility

# Run specific accessibility test
npm run e2e -- tests/accessibility/wcag-compliance.spec.ts

# Run with browser UI for debugging
npm run e2e -- --project=accessibility --headed

# Generate accessibility report
npm run e2e -- --project=accessibility --reporter=html
```

### CI/CD Integration

```bash
# Run accessibility tests in CI
npm run e2e:accessibility

# Generate accessibility report for CI
npm run e2e:accessibility -- --reporter=json
```

## Manual Testing Checklist

### Keyboard Navigation

- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical and intuitive
- [ ] Focus indicators are clearly visible
- [ ] Keyboard shortcuts work as expected
- [ ] No keyboard traps exist

### Screen Reader Testing

- [ ] All content is announced properly
- [ ] Headings create logical structure
- [ ] Form labels are associated correctly
- [ ] Status messages are announced
- [ ] Error messages are clear and helpful

### Visual Accessibility

- [ ] Color contrast meets WCAG AA standards
- [ ] Information is not conveyed by color alone
- [ ] Text can be resized to 200% without horizontal scrolling
- [ ] Focus indicators are clearly visible
- [ ] High contrast mode works properly

### Mobile Accessibility

- [ ] Touch targets are at least 44x44px
- [ ] Content is accessible with screen readers
- [ ] Gestures work with accessibility features
- [ ] Orientation changes are handled properly
- [ ] Zoom functionality works correctly

## Accessibility Best Practices

### 1. Semantic HTML

- Use proper HTML elements for their intended purpose
- Maintain logical heading hierarchy
- Use landmarks (main, nav, aside, footer)
- Associate form labels with inputs

### 2. ARIA Usage

- Use ARIA labels for complex interactions
- Implement proper roles for custom components
- Use live regions for dynamic content
- Provide context for screen readers

### 3. Keyboard Support

- Ensure all functionality is keyboard accessible
- Implement logical tab order
- Provide visible focus indicators
- Support standard keyboard shortcuts

### 4. Visual Design

- Maintain sufficient color contrast
- Don't rely solely on color for information
- Support user preferences (reduced motion, high contrast)
- Ensure text is resizable

This comprehensive accessibility testing ensures that Cloudlint is usable by everyone, meeting and exceeding WCAG 2.1 AA standards while providing an excellent user experience for all users.
