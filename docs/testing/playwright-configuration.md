# Playwright Testing Configuration & Usage Guide

## 🎯 Overview

This guide documents the refactored Playwright configuration for Cloudlint's comprehensive testing infrastructure. The configuration has been optimized to eliminate conflicts and provide reliable test execution across multiple test categories.

## 🏗️ Architecture

### **Configuration Structure**

The Playwright configuration (`playwright.config.ts`) has been refactored with the following key principles:

- **No Global `testDir`**: Eliminates conflicts between main testDir and project-specific directories
- **Project-Based Organization**: Each test category has its own isolated project configuration
- **Clean Separation**: No overlapping or conflicting test discovery patterns

### **Test Projects**

| Project | Directory | Purpose | Browser/Device |
|---------|-----------|---------|----------------|
| `e2e-chromium` | `tests/e2e` | Core E2E tests | Chrome Desktop |
| `e2e-firefox` | `tests/e2e` | Cross-browser validation | Firefox Desktop |
| `e2e-webkit` | `tests/e2e` | Safari compatibility | WebKit Desktop |
| `performance` | `tests/performance` | Load & performance testing | Chrome Desktop |
| `contract` | `tests/contract` | API contract validation | Chrome Desktop |
| `visual` | `tests/visual` | Visual regression testing | Chrome Desktop |
| `mobile` | `tests/mobile` | Mobile responsiveness | iPhone 12 |
| `accessibility` | `tests/accessibility` | WCAG 2.1 AA compliance | Chrome Desktop |
| `security` | `tests/security` | Security & vulnerability testing | Chrome Desktop |
| `edge-cases` | `tests/edge-cases` | Error handling & edge cases | Chrome Desktop |

## 📝 NPM Scripts

### **Individual Test Categories**

```bash
# Core E2E Tests
npm run e2e                    # Main E2E tests (Chromium only, with browser install)
npm run e2e:all-browsers       # Cross-browser E2E testing (Chrome, Firefox, Safari)

# Advanced Test Categories
npm run e2e:performance        # Performance and load testing
npm run e2e:contract           # API contract validation
npm run e2e:visual             # Visual regression testing
npm run e2e:mobile             # Mobile and responsive testing
npm run e2e:accessibility      # Accessibility compliance (WCAG 2.1 AA)
npm run e2e:security           # Security and vulnerability testing
npm run e2e:edge-cases         # Error handling and edge cases

# Comprehensive Testing
npm run e2e:advanced           # All advanced test categories
npm run test:all               # Unit + E2E + Advanced tests
```

### **Direct Playwright Commands**

```bash
# Run specific project
npx playwright test --project=performance

# Run multiple projects
npx playwright test --project=visual --project=accessibility

# List all discovered tests
npx playwright test --list

# Run with specific options
npx playwright test --project=security --reporter=html --headed
```

## 🔧 Test Execution Patterns

### **Development Workflow**

1. **Feature Development**: Run relevant test category
   ```bash
   npm run e2e                    # Core functionality
   npm run e2e:accessibility      # If adding UI components
   npm run e2e:mobile            # If affecting responsive design
   ```

2. **Pre-commit Validation**:
   ```bash
   npm run test:all              # Full test suite
   ```

3. **CI/CD Pipeline**: Automated execution via GitHub Actions

### **Test Discovery**

The refactored configuration discovers **217 total tests** across **13 files**:

- **E2E Tests**: 35 tests × 3 browsers = 105 tests
- **Performance Tests**: 11 tests
- **Contract Tests**: 15 tests  
- **Visual Tests**: 18 tests
- **Mobile Tests**: 15 tests
- **Accessibility Tests**: 16 tests
- **Security Tests**: 15 tests
- **Edge Cases Tests**: 15 tests

## 🚀 CI/CD Integration

### **GitHub Actions**

The existing workflows automatically use the refactored configuration:

- **`ci-cd.yml`**: Runs unit tests and basic E2E tests
- **`e2e.yml`**: Manual trigger for comprehensive E2E testing
- Uses `npm run e2e` which now properly targets `tests/e2e` directory

### **Environment Variables**

Tests run with appropriate environment configuration:

```bash
CI=true                    # Enables CI-specific behaviors
NODE_ENV=test             # Test environment mode
SERVE_STATIC=1            # Serves built assets
PORT=3001                 # Consistent port across environments
```

## 🎛️ Configuration Options

### **Per-Project Customization**

Each project can have specific settings:

```typescript
{
  name: 'performance',
  testDir: './tests/performance',
  timeout: 60000,           // Extended timeout for load tests
  retries: 1,               // Fewer retries for performance consistency
  use: {
    ...devices['Desktop Chrome'],
    reducedMotion: 'reduce', // Disable animations for measurements
  },
}
```

### **Global Settings**

Shared across all projects:

```typescript
{
  timeout: 60_000,          // 1 minute default timeout
  expect: { timeout: 10_000 }, // 10 second assertion timeout
  workers: process.env.CI ? 1 : 2, // Concurrency control
  use: {
    baseURL: 'http://127.0.0.1:3001',
    headless: true,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
}
```

## 🛠️ Troubleshooting

### **Test Discovery Issues**

```bash
# Verify test discovery
npx playwright test --list

# Check specific project
npx playwright test --project=performance --list
```

### **Configuration Conflicts**

✅ **Fixed Issues**:
- Eliminated `testDir` conflicts between global and project settings
- Removed duplicate test discovery patterns
- Proper project isolation

### **Browser Installation**

```bash
# Install browsers for all projects
npx playwright install

# Install specific browser
npx playwright install chromium
```

## 📊 Test Results & Reporting

### **Built-in Reporters**

```bash
# HTML report (default for local)
npx playwright test --project=visual --reporter=html

# List reporter (CI-friendly)
npx playwright test --project=security --reporter=list

# Multiple reporters
npx playwright test --reporter=list,html
```

### **Test Artifacts**

- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Traces**: On first retry
- **HTML Reports**: Available in `playwright-report/`

## 🔄 Maintenance

### **Adding New Test Categories**

1. Create test directory (e.g., `tests/new-category/`)
2. Add project to `playwright.config.ts`:
   ```typescript
   {
     name: 'new-category',
     testDir: './tests/new-category',
     // ... configuration options
   }
   ```
3. Add npm script to `package.json`:
   ```json
   "e2e:new-category": "playwright test --project=new-category"
   ```

### **Project-Specific Settings**

Customize timeout, retries, and browser settings per project based on test requirements:

- **Performance tests**: Extended timeouts, reduced motion
- **Visual tests**: Consistent browser settings, reduced motion  
- **Mobile tests**: Touch device simulation
- **Security tests**: Additional retries for stability

---

**The refactored configuration provides reliable, maintainable, and comprehensive test coverage across all critical areas of the Cloudlint application! 🚀**