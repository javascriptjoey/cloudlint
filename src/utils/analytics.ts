/**
 * Analytics Utility
 *
 * Privacy-respecting analytics using Plausible Analytics.
 *
 * Key Features:
 * - Cookie-less tracking (GDPR-friendly by default)
 * - No personal data collection
 * - Manual event tracking for better control
 * - Respects user consent preferences
 *
 * @see https://plausible.io/docs
 */

/**
 * Plausible event properties interface
 */
export interface PlausibleEventProps {
  [key: string]: string | number | boolean;
}

/**
 * Plausible event options
 */
export interface PlausibleEventOptions {
  props?: PlausibleEventProps;
  callback?: () => void;
  revenue?: {
    currency: string;
    amount: number;
  };
}

/**
 * Analytics consent state
 */
export interface AnalyticsConsent {
  analytics: boolean;
  timestamp: number;
}

/**
 * Declare global plausible function
 */
declare global {
  interface Window {
    plausible?: (eventName: string, options?: PlausibleEventOptions) => void;
  }
}

/**
 * Check if analytics is enabled based on user consent
 */
export function isAnalyticsEnabled(): boolean {
  try {
    const consent = localStorage.getItem("analytics_consent");
    if (!consent) {
      // Default to enabled since Plausible is privacy-friendly
      return true;
    }

    const consentData: AnalyticsConsent = JSON.parse(consent);
    return consentData.analytics;
  } catch (error) {
    console.error("Error reading analytics consent:", error);
    return true; // Default to enabled on error
  }
}

/**
 * Set analytics consent
 */
export function setAnalyticsConsent(enabled: boolean): void {
  try {
    const consentData: AnalyticsConsent = {
      analytics: enabled,
      timestamp: Date.now(),
    };
    localStorage.setItem("analytics_consent", JSON.stringify(consentData));
  } catch (error) {
    console.error("Error saving analytics consent:", error);
  }
}

/**
 * Track a pageview event
 *
 * @param url - Optional custom URL (defaults to current location)
 */
export function trackPageview(url?: string): void {
  if (!isAnalyticsEnabled()) {
    return;
  }

  if (typeof window.plausible === "function") {
    const pageUrl = url || window.location.pathname + window.location.search;
    window.plausible("pageview", { props: { url: pageUrl } });
  }
}

/**
 * Track a custom event
 *
 * @param eventName - Name of the event
 * @param options - Event options including props and callback
 *
 * @example
 * trackEvent('Button Click', { props: { button: 'validate' } });
 */
export function trackEvent(
  eventName: string,
  options?: PlausibleEventOptions,
): void {
  if (!isAnalyticsEnabled()) {
    return;
  }

  if (typeof window.plausible === "function") {
    window.plausible(eventName, options);
  }
}

/**
 * Initialize Plausible analytics
 *
 * This function should be called once when the app starts.
 * It sets up the plausible function if not already defined.
 */
export function initializeAnalytics(): void {
  // Define plausible function if not already defined
  if (typeof window.plausible === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.plausible = function (...args: any[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.plausible as any).q = (window.plausible as any).q || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.plausible as any).q.push(args);
    };
  }
}

/**
 * Load Plausible script
 *
 * @param domain - Your domain for Plausible tracking
 * @param scriptSrc - Optional custom script source (for self-hosting)
 */
export function loadPlausibleScript(
  domain: string,
  scriptSrc = "https://plausible.io/js/script.manual.js",
): void {
  if (!isAnalyticsEnabled()) {
    return;
  }

  // Check if script already loaded
  if (document.querySelector(`script[data-domain="${domain}"]`)) {
    return;
  }

  const script = document.createElement("script");
  script.defer = true;
  script.dataset.domain = domain;
  script.src = scriptSrc;

  // Add error handling
  script.onerror = () => {
    console.error("Failed to load Plausible analytics script");
  };

  document.head.appendChild(script);
}
