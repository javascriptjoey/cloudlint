# YAML Validation Testing Guide

This document describes the comprehensive testing approach for CloudLint's YAML validation functionality, including unit tests, integration tests, and end-to-end tests.

## Background

This testing suite was created to prevent regressions like the original issue where YAML with inconsistent list indentation was incorrectly passing validation. The problematic case was:

```yaml
fruits:
  - apple
   - banana  # 3 spaces instead of 2 - should fail validation
  - orange
```

## Test Structure

```
tests/
├── fixtures/              # Test data and edge cases
│   └── yaml-validation-cases.js
├── unit/                  # Unit tests
│   └── validation.test.js
├── integration/           # API integration tests  
│   └── api.test.js
├── e2e/                   # End-to-end tests
│   └── validation.spec.js
└── setup/                 # Test configuration
    ├── jest.setup.js
    ├── playwright.setup.js
    └── playwright.teardown.js
```

## Test Categories

### 1. Unit Tests (`tests/unit/validation.test.js`)

Tests the core `validateYAML()` function in isolation.

**Coverage includes:**
- ✅ Valid YAML cases (properly formatted)
- ❌ Invalid YAML cases (indentation errors, tabs, missing spaces)  
- 🔍 Edge cases (empty input, comments only, URLs)
- 🚀 Performance tests (large files, deep nesting)
- 📝 Error message quality and specificity
- 🔄 Regression tests for known issues

**Key regression test:**
```javascript
test('regression: banana indentation issue should be caught', () => {
  const problematicYaml = `fruits:
  - apple
   - banana
  - orange`;
  
  const result = validateYAML(problematicYaml);
  
  expect(result.ok).toBe(false);
  expect(result.messages).toContainEqual(
    expect.objectContaining({
      message: expect.stringMatching(/line 3.*expected 2.*got 3/i),
      severity: 'error'
    })
  );
});
```

### 2. Integration Tests (`tests/integration/api.test.js`)

Tests the validation API endpoints using Supertest.

**Coverage includes:**
- 🌐 POST `/validate` endpoint with various YAML inputs
- 📊 Response structure consistency  
- 🚨 Error handling and edge conditions
- 📦 Request/response serialization
- ⚡ Performance under load

**Example test:**
```javascript
test('should reject invalid YAML and return specific errors', async () => {
  const response = await request(app)
    .post('/validate')
    .send({ yaml: invalidYamlWithIndentationError })
    .expect(200);

  expect(response.body.ok).toBe(false);
  expect(response.body.messages).toContainEqual(
    expect.objectContaining({
      message: expect.stringMatching(/inconsistent list indentation/i),
      severity: 'error'
    })
  );
});
```

### 3. End-to-End Tests (`tests/e2e/validation.spec.js`)

Tests the complete user workflow using Playwright.

**Coverage includes:**
- 🎯 Full validation workflow (enter YAML → validate → see results)
- 🖥️ UI behavior and user experience
- ⏳ Loading states and error messages  
- 📝 Editor integration
- 🌐 Cross-browser compatibility
- ♿ Accessibility features

**Example test:**
```javascript
test('should show validation error for banana indentation issue', async ({ page }) => {
  const invalidYaml = `fruits:
  - apple
   - banana
  - orange`;

  await page.locator('.cm-editor .cm-content').fill(invalidYaml);
  await page.locator('button:has-text("Validate")').click();
  
  await page.waitForSelector('[role="status"]');
  const statusElement = page.locator('[role="status"]');
  
  await expect(statusElement).not.toContainText('No errors found');
  await expect(statusElement).toContainText(/indentation|inconsistent/i);
  await expect(statusElement).toContainText(/line 3/i);
});
```

## Test Fixtures

### YAML Test Cases (`tests/fixtures/yaml-validation-cases.js`)

Comprehensive collection of YAML samples:

**Valid Cases:**
- Simple key-value pairs
- Properly indented lists (2-space, 4-space)
- Nested structures with consistent indentation
- Comments and empty values
- URLs (should not trigger colon errors)

**Invalid Cases:**
- Inconsistent list indentation (the main issue)
- Mixed tabs and spaces
- Odd number of spaces for indentation
- Missing space after colon
- Complex nested indentation errors

**Edge Cases:**
- Empty input
- Whitespace only
- Very long lines
- Deeply nested structures

## Custom Test Utilities

### Jest Custom Matchers

```javascript
// Check for specific indentation errors
expect(result).toHaveIndentationError(3, 2, 3); // line 3, expected 2, got 3

// Check for error types  
expect(result).toHaveErrorOfType('indentation');
expect(result).toHaveErrorOfType('tab');
expect(result).toHaveErrorOfType('odd-spacing');
expect(result).toHaveErrorOfType('missing-space');
```

### Helper Functions

```javascript
// Create YAML with specific indentation issues
const yaml = testUtils.createIndentedYaml(baseIndent, errorIndent);

// Find errors by type in validation results
const error = testUtils.findErrorByType(messages, 'indentation');
```

## Running Tests

### All Tests
```bash
npm run test:all
```

### Individual Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only  
npm run test:integration

# E2E tests only
npm run test:e2e

# Jest tests (unit + integration)
npm run test:jest

# Jest with watch mode for development
npm run test:jest:watch

# Jest with coverage report
npm run test:jest:coverage

# Quick validation function test
npm run test:validation
```

## Test Configuration

### Jest (`jest.config.js`)
- ESM module support
- 30-second timeout for integration tests
- Coverage reporting (text, lcov, html)
- Custom validation matchers

### Playwright (`playwright.config.js`)
- Multi-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile viewport testing
- Automatic server startup before tests
- Screenshot/video capture on failure
- Trace collection for debugging

## Debugging Tests

### Jest Debugging
```bash
# Run with verbose output
npm run test:jest -- --verbose

# Run specific test file
npm run test:jest -- validation.test.js  

# Debug mode with breakpoints
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright Debugging  
```bash
# Interactive debug mode
npm run test:e2e:ui

# Debug specific test
npx playwright test --debug -g "banana indentation"

# View test traces after failure
npx playwright show-trace trace.zip
```

## Regression Prevention

### Original Issue Test Cases

1. **Banana Indentation Issue** - The main reported bug:
   ```yaml
   fruits:
     - apple
      - banana  # Wrong indentation
     - orange
   ```

2. **URL Colon Handling** - Prevent false positives:
   ```yaml
   website: https://example.com
   api: http://localhost:3000/api
   ```

3. **Multiple Error Detection**:
   ```yaml
   root:
   	name: John    # Tab character
      age:30       # Missing space + odd indentation  
   ```

### Test Coverage Requirements

- **Unit Tests**: 95%+ coverage of validation logic
- **Integration Tests**: 100% coverage of API endpoints
- **E2E Tests**: All major user workflows
- **Edge Cases**: Comprehensive coverage of YAML edge cases

## Performance Testing

Tests ensure validation performance meets requirements:

- **Large Files**: 1000-line YAML validates in < 1 second
- **Deep Nesting**: 20+ levels of indentation handled correctly
- **Memory Usage**: No memory leaks during validation
- **Concurrent Requests**: API handles multiple simultaneous validations

## Adding New Tests

### For New YAML Edge Cases:

1. **Add to fixtures**: Update `yaml-validation-cases.js`
2. **Unit test**: Add test case in `validation.test.js`
3. **Integration test**: Add API test in `api.test.js`  
4. **E2E test**: Add user workflow test in `validation.spec.js`

### Example: Adding a new edge case

```javascript
// 1. Add to fixtures
export const newEdgeCase = {
  name: 'Description of edge case',
  yaml: `your: yaml
  content: here`,
  expectedErrors: [
    {
      type: 'error-type',
      line: 2,
      message: /expected error pattern/i
    }
  ]
};

// 2. Unit test automatically picks up from fixtures

// 3. Integration test automatically tests API

// 4. Add E2E test if needed for UI behavior
test('should handle new edge case in UI', async ({ page }) => {
  // Test user interaction
});
```

## Continuous Integration

Tests are designed for CI/CD pipelines:

- **Parallel execution** for faster feedback
- **Retry logic** for flaky E2E tests  
- **Coverage reporting** for quality gates
- **Cross-platform support** (Windows, macOS, Linux)

## Summary

This comprehensive testing approach ensures:

✅ **No more validation regressions** like the banana indentation issue  
✅ **Comprehensive edge case coverage** for YAML validation  
✅ **Fast feedback** during development with watch mode  
✅ **Reliable CI/CD** with automated testing  
✅ **Easy debugging** with detailed error reporting  
✅ **Future-proof** architecture for adding new test cases  

The test suite serves as both a safety net and documentation for how YAML validation should behave across all edge cases.