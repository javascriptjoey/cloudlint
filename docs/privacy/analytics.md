# Analytics Implementation

## Overview

Cloudlint uses **Plausible Analytics**, a privacy-respecting, cookie-less analytics solution that complies with GDPR, CCPA, and other privacy regulations without requiring cookie consent banners.

## Why Plausible?

### Privacy-First Approach

- **No cookies** - Plausible doesn't use cookies or persistent identifiers
- **No personal data collection** - IP addresses are anonymized
- **GDPR compliant by default** - No consent banner required for basic analytics
- **Open source** - Transparent and auditable code
- **Lightweight** - < 1KB script size

### Key Features

- Real-time dashboard
- Simple, intuitive metrics
- No impact on page load performance
- Respects Do Not Track (DNT) headers
- No cross-site tracking

## Implementation

### Architecture

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         ├─ Consent Check (localStorage)
         │
         ├─ Analytics Enabled?
         │  ├─ Yes → Load Plausible Script
         │  └─ No  → Skip tracking
         │
         └─ Track Events
            ├─ Pageviews (automatic)
            └─ Custom Events (manual)
```

### Core Components

#### 1. Analytics Utility (`src/utils/analytics.ts`)

**Functions:**

- `initializeAnalytics()` - Initialize Plausible
- `loadPlausibleScript(domain)` - Load tracking script
- `trackPageview(url?)` - Track page views
- `trackEvent(name, options?)` - Track custom events
- `isAnalyticsEnabled()` - Check consent status
- `setAnalyticsConsent(enabled)` - Update consent

**Example Usage:**

```typescript
import {
  initializeAnalytics,
  loadPlausibleScript,
  trackEvent,
} from "@/utils/analytics";

// Initialize on app start
initializeAnalytics();
loadPlausibleScript("yourdomain.com");

// Track custom events
trackEvent("Button Click", {
  props: { button: "validate", action: "click" },
});
```

#### 2. Consent Management

**Storage:**

- Uses `localStorage` for consent persistence
- Key: `analytics_consent`
- Format: `{ analytics: boolean, timestamp: number }`

**Default Behavior:**

- Analytics **enabled by default** (Plausible is privacy-friendly)
- Users can opt-out via consent banner
- Consent persists across sessions

### Privacy Features

#### Cookie-less Tracking

Plausible uses a hash of:

- Page URL
- User agent
- Date
- Website domain

This creates a daily changing identifier that:

- Cannot track users across days
- Cannot track users across websites
- Cannot identify individual users

#### Data Minimization

We only track:

- Page views
- Custom events (button clicks, form submissions)
- Referrer sources
- Browser/OS (anonymized)

We **never** track:

- Personal information
- IP addresses (anonymized by Plausible)
- Cookies or persistent IDs
- Cross-site behavior

## Testing

### Unit Tests

**Location:** `tests/unit/analytics.test.ts`

**Coverage:** 27 tests covering:

- Consent management (5 tests)
- Analytics initialization (3 tests)
- Pageview tracking (5 tests)
- Event tracking (5 tests)
- Script loading (5 tests)
- Error handling (4 tests)

**Bug Fixes Documented:**

- **Issue:** localStorage in Vitest doesn't persist between function calls
- **Solution:** Implemented custom localStorage mock
- **Date:** 2025-10-04

### Running Tests

```bash
# Run analytics tests
npm run test:run -- tests/unit/analytics.test.ts

# Run all tests
npm test
```

## Configuration

### Environment Variables

```env
# Plausible domain (required)
VITE_PLAUSIBLE_DOMAIN=yourdomain.com

# Custom script URL (optional, for self-hosting)
VITE_PLAUSIBLE_SCRIPT_URL=https://plausible.io/js/script.manual.js
```

### Manual Tracking Mode

We use `script.manual.js` for better control:

- No automatic pageview tracking
- Manual event triggering
- Better integration with SPAs
- Respects user consent before tracking

## Compliance

### GDPR (EU)

✅ **Compliant** - No personal data collected, no cookies used

### CCPA (California)

✅ **Compliant** - No personal information sold or shared

### PECR (UK)

✅ **Compliant** - No cookies requiring consent

### ePrivacy Directive

✅ **Compliant** - Cookie-less tracking

## Performance

### Impact

- **Script Size:** < 1KB (gzipped)
- **Load Time:** < 50ms
- **Page Performance:** No measurable impact
- **Bandwidth:** Minimal (events are batched)

### Optimization

- Script loaded with `defer` attribute
- Events queued if script not loaded
- No blocking requests
- Respects user bandwidth

## Troubleshooting

### Analytics Not Working

**Check:**

1. Is consent enabled? `localStorage.getItem('analytics_consent')`
2. Is script loaded? Check Network tab for `script.manual.js`
3. Is domain correct? Check `data-domain` attribute
4. Are events firing? Check browser console

**Common Issues:**

- **Ad blockers** - May block Plausible (expected behavior)
- **DNT enabled** - Plausible respects Do Not Track
- **Localhost** - Use `script.local.js` for local testing

### Testing Locally

```typescript
// Use local script for development
loadPlausibleScript(
  "yourdomain.com",
  "https://plausible.io/js/script.local.manual.js",
);
```

## Future Enhancements

### Phase 2 (Planned)

- [ ] Consent banner UI component
- [ ] Accessibility testing (WCAG 2.1 AA)
- [ ] E2E tests for consent flows
- [ ] Visual regression tests

### Phase 3 (Planned)

- [ ] GDPR data export functionality
- [ ] CCPA data deletion endpoints
- [ ] Compliance documentation
- [ ] Legal review checklist

## Resources

- [Plausible Documentation](https://plausible.io/docs)
- [GDPR Compliance Guide](https://plausible.io/data-policy)
- [Privacy Policy Template](https://plausible.io/privacy)
- [Cookie-less Tracking Explained](https://plausible.io/blog/google-analytics-cookies)

## Consent Banner

### Overview

The consent banner is a WCAG 2.1 AA compliant modal dialog that appears on first visit to request analytics consent.

### Features

**User Experience:**

- Appears after 1-second delay (non-intrusive)
- Clear privacy information
- Expandable details section
- Three action options: Accept, Decline, Close
- Backdrop overlay for focus
- Smooth animations (respects reduced motion)

**Accessibility:**

- Full keyboard navigation
- Screen reader compatible
- Focus management and trapping
- High contrast mode support
- Visible focus indicators
- ARIA labels and live regions

### Keyboard Navigation

| Key         | Action                              |
| ----------- | ----------------------------------- |
| Tab         | Move focus forward through buttons  |
| Shift+Tab   | Move focus backward through buttons |
| Enter/Space | Activate focused button             |
| Escape      | Close banner and decline analytics  |

### Implementation

```typescript
import { ConsentBanner } from "@/components/ConsentBanner";

// In your App component
<ConsentBanner
  domain="yourdomain.com"
  onAccept={() => {
    // Track initial pageview
    trackPageview();
  }}
  onDecline={() => {
    // Optional: Log decline
  }}
/>
```

### Consent Storage

Consent is stored in localStorage:

```typescript
{
  "analytics": boolean,
  "timestamp": number
}
```

**Key:** `analytics_consent`

### Testing

**Unit Tests:** 19 tests covering all functionality
**E2E Tests:** Complete user workflow testing
**Accessibility Tests:** WCAG 2.1 AA compliance verified

See `tests/unit/ConsentBanner.test.tsx` and `tests/e2e/consent-banner.spec.ts`

## Changelog

### 2025-01-04 - Phase 2 Complete

- ✅ Implemented WCAG 2.1 AA compliant consent banner
- ✅ Added 19 unit tests (all passing)
- ✅ Created comprehensive E2E test suite
- ✅ Integrated into main application
- ✅ Documented accessibility features
- ✅ Verified keyboard navigation and screen reader support

### 2025-10-04 - Phase 1 Complete

- ✅ Implemented analytics utility
- ✅ Added 27 unit tests (all passing)
- ✅ Documented localStorage bug fix
- ✅ Created privacy documentation
- ✅ Followed Plausible best practices from Context7

---

**Last Updated:** 2025-01-04  
**Status:** Phase 2 Complete - Consent Banner UI ✅  
**Next:** Phase 3 - GDPR/CCPA Compliance Features
