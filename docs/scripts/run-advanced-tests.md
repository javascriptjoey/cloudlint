# Run Advanced Tests Script

**Script Location:** `scripts/run-advanced-tests.ps1`

## Purpose

This script runs the comprehensive advanced functional test suite for Cloudlint, including performance, contract, visual, mobile, accessibility, security, and edge case testing. It fully automates the server lifecycle management for testing.

## What It Does

1. **Cleanup**: Stops all running Node processes and clears port 3001
2. **Build**: Compiles the application for production
3. **Server Start**: Launches the Express server with static file serving on port 3001
4. **Health Check**: Waits for server to be ready (up to 40 attempts)
5. **Test Execution**: Runs the advanced E2E test suite via Playwright
6. **Cleanup**: Stops the server and cleans up processes
7. **Reporting**: Provides test results and report viewing instructions

## Usage

```powershell
.\scripts\run-advanced-tests.ps1
```

## Prerequisites

- PowerShell 5.1 or higher
- Node.js and npm installed
- Playwright browsers installed (`npx playwright install`)
- Port 3001 available
- Application must build successfully

## Test Coverage

The advanced test suite includes:

- **Performance Tests**: Load times, response times, resource optimization
- **Contract Tests**: API contract validation
- **Visual Tests**: Screenshot comparison, UI regression
- **Mobile Tests**: Responsive design, touch interactions
- **Accessibility Tests**: WCAG compliance, screen reader support
- **Security Tests**: XSS prevention, CSRF protection, input validation
- **Edge Cases**: Boundary conditions, error handling, unusual inputs

## Configuration

The script sets these environment variables:

```powershell
$env:SERVE_STATIC = "1"  # Enable static file serving
$env:PORT = "3001"        # Server port
```

## Output

The script provides:

- Step-by-step progress with color-coded status
- Build output (suppressed for cleaner display)
- Server startup confirmation
- Real-time test execution output
- Final success/failure summary
- Instructions for viewing detailed reports

## Example Output

```
==========================================
 Cloudlint Advanced Functional Tests
==========================================

[1/5] Stopping any running servers...
      [OK] Servers stopped and port cleaned

[2/5] Building application...
      [OK] Build complete

[3/5] Starting server with static files...
      Waiting for server to start...
      [OK] Server ready at http://localhost:3001

[4/5] Running Advanced Functional Tests...
      This includes: Performance, Contract, Visual, Mobile, Accessibility, Security, Edge Cases

Running 45 tests using 3 workers
  ✓ [chromium] › performance.spec.ts:5:1 › Performance Tests › page load time
  ✓ [chromium] › accessibility.spec.ts:8:1 › Accessibility Tests › WCAG compliance
  ...

[5/5] Cleaning up...
      [OK] Cleanup complete

==========================================
[SUCCESS] All advanced tests passed!

View detailed report: npx playwright show-report
```

## Exit Codes

- `0`: All tests passed
- `1`: Build failed or server failed to start
- Non-zero: Test failures (Playwright exit code)

## When to Use

- Before merging major features
- As part of pre-release validation
- After significant refactoring
- When validating performance improvements
- Before production deployments
- During comprehensive QA cycles

## Troubleshooting

**Issue**: Server fails to start

- **Solution**: Check if port 3001 is in use, run `restart-clean.ps1` first

**Issue**: Build fails

- **Solution**: Run `npm run build` separately to see detailed errors

**Issue**: Tests timeout

- **Solution**: Increase `$maxAttempts` in the script or check server logs

**Issue**: Visual tests fail

- **Solution**: Update baseline screenshots with `npm run e2e:advanced -- --update-snapshots`

## Integration

This script is part of the complete test suite:

- `run-all-tests.ps1`: Runs unit tests, build, type-check, and lint
- `run-e2e-tests.ps1`: Runs basic E2E tests
- `run-advanced-tests.ps1`: Runs comprehensive advanced tests (this script)

## Performance

- Typical execution time: 5-15 minutes
- Depends on test count and system performance
- Runs tests in parallel using Playwright workers
- Server startup adds ~10 seconds overhead

## Notes

- Automatically manages server lifecycle (no manual intervention needed)
- Safe to run multiple times
- Cleans up even if tests fail
- Generates HTML report for detailed analysis
- Uses production build for realistic testing
