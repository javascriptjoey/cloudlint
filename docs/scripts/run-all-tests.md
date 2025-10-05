# Run All Tests Script

**Script Location:** `scripts/run-all-tests.ps1`

## Purpose

This script runs the complete functional test suite for Cloudlint, including unit tests, build verification, type checking, and linting. It provides a comprehensive validation of code quality and functionality before commits or deployments.

## What It Does

1. **Unit Tests**: Runs all Vitest unit tests (backend, frontend, integration)
2. **Build Verification**: Compiles the application to verify no build errors
3. **Type Checking**: Runs TypeScript compiler to catch type errors
4. **Linting**: Executes ESLint to ensure code style compliance
5. **Summary**: Provides a comprehensive test results summary

## Usage

```powershell
.\scripts\run-all-tests.ps1
```

## Prerequisites

- PowerShell 5.1 or higher
- Node.js and npm installed
- All dependencies installed (`npm install`)
- TypeScript and ESLint configured

## Test Coverage

The script validates:

- **Unit Tests (87 tests)**:
  - Backend API tests
  - Frontend component tests
  - Integration tests
  - YAML validation tests
  - Security tests
  - Autofix functionality

- **Build Verification**:
  - TypeScript compilation
  - Vite bundling
  - Asset optimization

- **Type Checking**:
  - TypeScript type safety
  - Interface compliance
  - Type definitions

- **Code Quality**:
  - ESLint rules
  - Code style
  - Best practices

## Output

The script provides:

- Progress indicator for each test phase
- Pass/fail status for each category
- Comprehensive summary at the end
- Total test count
- Production readiness indicator

## Example Output

```
==========================================
 Cloudlint Complete Test Suite
==========================================

[1/4] Running Unit Tests...
      [OK] Unit Tests: PASSED

[2/4] Build Verification...
      [OK] Build: PASSED

[3/4] Type Checking...
      [OK] TypeScript: PASSED

[4/4] Linting...
      [OK] ESLint: PASSED

==========================================
 Test Summary
==========================================

  [OK] Unit Tests: PASSED (87 tests)
  [OK] Build: PASSED
  [OK] TypeScript: PASSED
  [OK] ESLint: PASSED

Total Tests Passed: 87

[SUCCESS] All functional tests passed!

Your application is production-ready!
```

## Exit Codes

- `0`: All tests passed
- `1`: One or more test categories failed

## When to Use

- Before committing code changes
- As part of pre-push hooks
- Before creating pull requests
- During CI/CD pipeline validation
- Before production deployments
- After dependency updates
- During code reviews

## Performance

- Typical execution time: 1-3 minutes
- Unit tests: ~30-60 seconds
- Build: ~30-60 seconds
- Type check: ~10-20 seconds
- Lint: ~5-10 seconds

## Integration with CI/CD

This script mirrors the CI/CD pipeline checks:

```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: npm run test:run
- name: Build
  run: npm run build
- name: Type check
  run: npm run type-check
- name: Lint
  run: npm run lint
```

## Troubleshooting

**Issue**: Unit tests fail

- **Solution**: Run `npm test` to see detailed test output

**Issue**: Build fails

- **Solution**: Run `npm run build` separately for detailed error messages

**Issue**: Type errors

- **Solution**: Run `npm run type-check` to see specific type issues

**Issue**: Lint errors

- **Solution**: Run `npm run lint` to see violations, use `npm run lint:fix` to auto-fix

## Related Scripts

- `run-e2e-tests.ps1`: Runs end-to-end browser tests
- `run-advanced-tests.ps1`: Runs comprehensive advanced test suite
- `restart-clean.ps1`: Cleans environment before testing

## Best Practices

1. Run this script before every commit
2. Fix all failures before pushing code
3. Use in combination with E2E tests for full coverage
4. Integrate into pre-commit hooks for automation
5. Run after dependency updates to catch breaking changes

## Notes

- Output is suppressed for cleaner display (use `2>&1 | Out-Null`)
- Each test category is independent
- Script continues even if one category fails
- Provides clear summary for quick assessment
- Suitable for both local development and CI/CD
