# E2E Test Fixes Summary

## Issues Fixed

### 1. localStorage Key Mismatch

**Problem:** Tests were using `"analytics_consent"` (underscore) instead of `"analytics-consent"` (hyphen)

**Fix:** Updated all localStorage.getItem() calls to use the correct key name

### 2. localStorage Value Format

**Problem:** Tests expected JSON format but consent is stored as simple string ("granted" or "denied")

**Fix:** Removed JSON.parse() and updated expectations to match string values

### 3. Button Selector Issues

**Problem:** Tests used regex patterns that didn't match full aria-labels

**Solution:** Changed to use visible text with `getByText()` for simpler, more reliable matching:

- `page.getByText("Accept Analytics")`
- `page.getByText("Decline")`
- `page.getByText("Learn More")`

### 4. Timing Issues

**Problem:** Tests didn't wait long enough for banner to appear (1 second delay)

**Fix:**

- Replaced `waitForTimeout(1100)` with `expect().toBeVisible({ timeout: 15000 })`
- Added explicit wait for banner before interacting with elements
- Added 200ms wait after banner appears for focus to settle

### 5. Accessible Name Matching

**Problem:** Button accessible names include full aria-label text

**Fix:** Updated keyboard navigation tests to use full accessible names:

- "Accept analytics and help us improve"
- "Decline analytics and continue without tracking"
- "Show privacy details"
- "Close and decline analytics"

## Files Modified

### tests/e2e/consent-banner.spec.ts

- Fixed localStorage key from `analytics_consent` to `analytics-consent`
- Removed JSON.parse() for consent values
- Updated button selectors to use visible text
- Added proper waits with timeout for banner visibility
- Fixed keyboard navigation button selectors
- Updated responsive design test selectors

## Test Status

### Before Fixes

- 32 failing E2E tests
- Main issues: localStorage, button selectors, timing

### After Fixes

- All consent banner tests should pass
- Proper waiting for elements
- Correct localStorage assertions
- Reliable button interactions

## Testing Recommendations

### Running E2E Tests

```powershell
# Use the script that starts the server
.\scripts\run-e2e-tests.ps1
```

### Manual Testing

1. Start backend: `npm run dev:backend`
2. Start frontend: `npm run dev`
3. Run tests: `npm run e2e`

## Key Learnings

1. **Always wait for elements explicitly** - Don't rely on fixed timeouts
2. **Use visible text for buttons** - Simpler than matching aria-labels
3. **Check actual implementation** - localStorage format, button text, etc.
4. **Increase timeouts for reliability** - 15 seconds for visibility checks
5. **Test one browser first** - Fix issues in Chromium before running all browsers

## Next Steps

1. Run E2E tests with server running
2. Verify all 32 tests now pass
3. If any still fail, check:
   - Server is running on port 3001
   - Build is up to date
   - No console errors in browser

## Related Documentation

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [ConsentBanner Component](../src/components/ConsentBanner.tsx)
- [Analytics Utils](../src/utils/analytics.ts)
