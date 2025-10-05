# E2E Testing Guide for Cloudlint

## 🎯 Quick Start

### **Option 1: Manual Server Start (Recommended for Local Development)**

This avoids port conflicts and gives you better control:

```bash
# Terminal 1: Start the backend server
npm run build
npm run start:server

# Wait for: [server] listening on http://localhost:3001

# Terminal 2: Run E2E tests
npm run e2e
```

### **Option 2: Automatic Server Start**

Let Playwright start the server automatically:

```bash
# Build first
npm run build

# Run E2E tests (Playwright will start server)
npm run e2e
```

## 🔧 Troubleshooting

### **Port 3001 Already in Use**

If you get `EADDRINUSE` error:

```powershell
# Kill all Node processes
taskkill /F /IM node.exe

# Wait 10 seconds for port to be released
Start-Sleep -Seconds 10

# Try again
npm run e2e
```

### **Server Won't Start**

Check if something is holding the port:

```powershell
# Check what's using port 3001
netstat -ano | findstr :3001

# If you see a process, kill it by PID
taskkill /F /PID <PID_NUMBER>
```

### **Tests Timing Out**

If tests timeout waiting for server:

1. **Check server logs**: Look for errors in the terminal
2. **Verify build**: Make sure `npm run build` completed successfully
3. **Check health endpoint**: Open http://localhost:3001/health in browser

## 📋 Test Categories

### **Core E2E Tests**

```bash
# Run main E2E tests (Chromium only)
npm run e2e

# Run across all browsers (Chrome, Firefox, Safari)
npm run e2e:all-browsers
```

### **Advanced Test Categories**

```bash
# Performance testing
npm run e2e:performance

# API contract validation
npm run e2e:contract

# Visual regression testing
npm run e2e:visual

# Mobile responsiveness
npm run e2e:mobile

# Accessibility (WCAG 2.1 AA)
npm run e2e:accessibility

# Security testing
npm run e2e:security

# Edge cases & error handling
npm run e2e:edge-cases

# Run ALL advanced tests
npm run e2e:advanced
```

## 🎬 Running Tests

### **Development Mode**

```bash
# Run with browser visible (headed mode)
npx playwright test tests/e2e --headed

# Run specific test file
npx playwright test tests/e2e/playground-simple.spec.ts

# Run in debug mode (step through tests)
npx playwright test tests/e2e --debug

# Run specific browser
npx playwright test --project=e2e-chromium
```

### **CI/CD Mode**

Tests run automatically in GitHub Actions:

- On pull requests
- Manual trigger via workflow_dispatch

## 📊 Test Results

### **View Reports**

```bash
# Generate HTML report
npx playwright show-report

# View last test run
npx playwright show-report playwright-report
```

### **Artifacts**

- **Screenshots**: Captured on test failure
- **Videos**: Recorded for failed tests
- **Traces**: Available for debugging (on first retry)

## 🏗️ Configuration

### **Playwright Config** (`playwright.config.ts`)

Key settings:

- **baseURL**: `http://127.0.0.1:3001`
- **timeout**: 60 seconds per test
- **workers**: 2 locally, 1 in CI
- **webServer**: Automatically starts server if not running

### **Environment Variables**

```bash
SERVE_STATIC=1    # Serve built frontend
PORT=3001         # Server port
NODE_ENV=test     # Test environment
CI=true           # CI mode (set automatically in GitHub Actions)
```

## 🐛 Common Issues

### **Issue: "Process from config.webServer was not able to start"**

**Cause**: Port 3001 is already in use or wasn't released yet

**Solution**:

```powershell
# Kill all Node processes
taskkill /F /IM node.exe

# Wait for port to be released
Start-Sleep -Seconds 10

# Start server manually first
npm run start:server

# Then run tests in another terminal
npm run e2e
```

### **Issue: Tests pass locally but fail in CI**

**Cause**: Environment differences (timing, resources, etc.)

**Solution**:

- Check CI logs for specific errors
- Increase timeouts if needed
- Ensure all dependencies are installed
- Verify build artifacts are correct

### **Issue: Flaky tests (sometimes pass, sometimes fail)**

**Cause**: Race conditions, timing issues, or network delays

**Solution**:

- Add explicit waits for elements
- Use `waitForLoadState('networkidle')`
- Increase timeout for specific tests
- Check for proper test isolation

## 📝 Best Practices

### **1. Always Build Before Testing**

```bash
npm run build
npm run e2e
```

### **2. Use Manual Server Start for Development**

Gives you better control and avoids port conflicts:

```bash
# Terminal 1
npm run start:server

# Terminal 2
npm run e2e
```

### **3. Clean Up Between Test Runs**

```powershell
# Kill processes
taskkill /F /IM node.exe

# Wait for port release
Start-Sleep -Seconds 10
```

### **4. Check Server Health First**

Before running tests:

```bash
# Open in browser
http://localhost:3001/health

# Should return: ok
```

## 🚀 Quick Reference

### **Full Test Workflow**

```bash
# 1. Build the application
npm run build

# 2. Start the server (Terminal 1)
npm run start:server

# 3. Run E2E tests (Terminal 2)
npm run e2e

# 4. View results
npx playwright show-report
```

### **Cleanup After Testing**

```powershell
# Stop server (Ctrl+C in Terminal 1)

# Kill any remaining processes
taskkill /F /IM node.exe

# Wait for port release
Start-Sleep -Seconds 10
```

---

## ✅ Success Checklist

Before running E2E tests, verify:

- [ ] Application built (`npm run build` completed)
- [ ] No Node processes running on port 3001
- [ ] Server starts successfully (`npm run start:server`)
- [ ] Health endpoint responds (`http://localhost:3001/health`)
- [ ] Playwright browsers installed (`npx playwright install`)

---

**For more details, see:**

- `docs/testing/e2e-testing.md` - Comprehensive E2E testing guide
- `docs/testing/playwright-configuration.md` - Configuration details
- `playwright.config.ts` - Playwright configuration file
