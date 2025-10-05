# Run E2E Tests Script

**Script Location:** `scripts/run-e2e-tests.ps1`

## Purpose

This script runs the end-to-end (E2E) test suite for Cloudlint using Playwright. It automates the complete testing workflow including server lifecycle management, ensuring reliable and repeatable E2E testing.

## What It Does

1. **Cleanup**: Stops all running Node.js processes
2. **Build**: Compiles the application for production
3. **Server Start**: Launches the Express server with static file serving on port 3001
4. **Health Check**: Waits for server to be ready (up to 30 attempts)
5. **Test Execution**: Runs the E2E test suite via Playwright
6. **Cleanup**: Stops the server and cleans up all processes
7. **Reporting**: Provides test results and viewing instructions

## Usage

```powershell
.\scripts\run-e2e-tests.ps1
```

## Prerequisites

- PowerShell 5.1 or higher
- Node.js and npm installed
- Playwright browsers installed (`npx playwright install`)
- Port 3001 available
- Application must build successfully

## Environment Variables

The script sets:

- `SERVE_STATIC=1`: Enables static file serving
- `PORT=3001`: Server port
- `NODE_ENV=test`: Test environment mode

## Test Coverage

The E2E test suite validates:

- User interface interactions
- Form submissions and validation
- Navigation and routing
- API integration
- Error handling
- User workflows

## Output

The script provides:

- Step-by-step progress indicators
- Build status
- Server startup confirmation
- Real-time test execution output
- Final success/failure summary
- Instructions for viewing detailed reports

## Example Output

```
==================================
 Cloudlint E2E Testing Script
==================================

[1/5] Stopping any running servers...
      [OK] Servers stopped

[2/5] Building application...
      [OK] Build complete

[3/5] Starting server with static files...
      Waiting for server to start...
      [OK] Server ready at http://localhost:3001

[4/5] Running E2E tests...

Running 12 tests using 3 workers
  ✓ [chromium] › playground.spec.ts:5:1 › Playground › loads successfully
  ✓ [chromium] › playground.spec.ts:12:1 › Playground › validates YAML
  ...

==================================
[5/5] Cleaning up...
      [OK] Cleanup complete

[SUCCESS] All E2E tests passed!

View detailed report: npx playwright show-report
```

## Exit Codes

- `0`: All tests passed
- `1`: Build failed or server failed to start
- Non-zero: Test failures (Playwright exit code)

## When to Use

- Before committing major UI changes
- As part of pre-merge validation
- After refactoring user-facing features
- Before production deployments
- During regression testing
- After dependency updates affecting UI

## Troubleshooting

**Issue**: Server fails to start

- **Solution**: Run `restart-clean.ps1` first to clear ports

**Issue**: Build fails

- **Solution**: Run `npm run build` separately for detailed errors

**Issue**: Tests timeout waiting for server

- **Solution**: Increase `$maxAttempts` or check if port 3001 is blocked

**Issue**: Browser not found

- **Solution**: Run `npx playwright install` to install browsers

## Integration

Part of the complete test suite:

- `run-all-tests.ps1`: Unit tests, build, type-check, lint
- `run-e2e-tests.ps1`: Basic E2E tests (this script)
- `run-advanced-tests.ps1`: Comprehensive advanced tests

## Performance

- Typical execution time: 2-5 minutes
- Depends on test count and system performance
- Runs tests in parallel using Playwright workers

## Notes

- Automatically manages server lifecycle
- Safe to run multiple times
- Cleans up even if tests fail
- Generates HTML report for detailed analysis
- Uses production build for realistic testing
