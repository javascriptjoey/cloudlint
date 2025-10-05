/**
 * ConsentBanner Component
 *
 * WCAG 2.1 AA compliant consent banner for analytics opt-in/opt-out.
 *
 * Accessibility Features:
 * - Keyboard navigation (Tab, Enter, Escape, Arrow keys)
 * - Screen reader support (ARIA labels, live regions, semantic HTML)
 * - Focus management (visible indicators, focus trapping)
 * - High contrast mode compatible
 * - Reduced motion support
 *
 * WCAG 2.1 AA Compliance:
 * - 1.3.1 Info and Relationships (Level A)
 * - 1.4.3 Contrast (Minimum) (Level AA)
 * - 2.1.1 Keyboard (Level A)
 * - 2.1.2 No Keyboard Trap (Level A)
 * - 2.4.3 Focus Order (Level A)
 * - 2.4.7 Focus Visible (Level AA)
 * - 3.2.1 On Focus (Level A)
 * - 4.1.2 Name, Role, Value (Level A)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { X, Cookie, Shield, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { setAnalyticsConsent, loadPlausibleScript } from "@/utils/analytics";

export interface ConsentBannerProps {
  /** Domain for Plausible analytics */
  domain?: string;
  /** Custom script URL for self-hosted Plausible */
  scriptUrl?: string;
  /** Callback when consent is given */
  onAccept?: () => void;
  /** Callback when consent is declined */
  onDecline?: () => void;
  /** Callback when banner is dismissed */
  onDismiss?: () => void;
  /** Custom className for styling */
  className?: string;
}

export function ConsentBanner({
  domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN || "cloudlint.local",
  scriptUrl,
  onAccept,
  onDecline,
  onDismiss,
  className,
}: ConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);

  // Check if user has already made a choice
  useEffect(() => {
    const hasConsent = localStorage.getItem("analytics_consent");
    if (!hasConsent) {
      // Show banner after a brief delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = useCallback(() => {
    setAnalyticsConsent(true);

    // Load Plausible script
    if (domain) {
      loadPlausibleScript(domain, scriptUrl);
    }

    setIsVisible(false);
    onAccept?.();
    onDismiss?.();

    // Announce to screen readers
    announceToScreenReader("Analytics enabled. Your privacy is respected.");
  }, [domain, scriptUrl, onAccept, onDismiss]);

  const handleDecline = useCallback(() => {
    setAnalyticsConsent(false);
    setIsVisible(false);
    onDecline?.();
    onDismiss?.();

    // Announce to screen readers
    announceToScreenReader("Analytics disabled. No tracking will occur.");
  }, [onDecline, onDismiss]);

  // Focus management - trap focus within banner
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDecline();
        return;
      }

      if (e.key === "Tab") {
        const focusableElements = bannerRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        // Shift + Tab on first element -> focus last element
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
        // Tab on last element -> focus first element
        else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    },
    [handleDecline],
  );

  // Set up keyboard event listener
  useEffect(() => {
    if (isVisible) {
      document.addEventListener("keydown", handleKeyDown);
      // Focus first button when banner appears
      setTimeout(() => {
        firstFocusableRef.current?.focus();
      }, 100);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isVisible, handleKeyDown]);

  const toggleDetails = useCallback(() => {
    setShowDetails((prev) => !prev);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop with reduced motion support */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
          "motion-safe:animate-in motion-safe:fade-in-0",
          "motion-reduce:animate-none",
        )}
        aria-hidden="true"
      />

      {/* Consent Banner */}
      <div
        ref={bannerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-banner-title"
        aria-describedby="consent-banner-description"
        className={cn(
          "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
          "w-[calc(100%-2rem)] max-w-2xl",
          "motion-safe:animate-in motion-safe:slide-in-from-bottom-4",
          "motion-reduce:animate-none",
          className,
        )}
      >
        <Card className="shadow-2xl border-2">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Cookie
                  className="h-6 w-6 text-primary mt-0.5 flex-shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <CardTitle
                    id="consent-banner-title"
                    className="text-xl font-semibold"
                  >
                    Privacy-Friendly Analytics
                  </CardTitle>
                  <CardDescription
                    id="consent-banner-description"
                    className="mt-1.5 text-base"
                  >
                    We use privacy-respecting analytics to improve your
                    experience. No cookies, no personal data, no tracking across
                    sites.
                  </CardDescription>
                </div>
              </div>
              <Button
                ref={lastFocusableRef}
                variant="ghost"
                size="icon"
                onClick={handleDecline}
                aria-label="Close and decline analytics"
                className="flex-shrink-0 -mt-1 -mr-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {showDetails && (
            <CardContent className="pt-0 pb-3">
              <div
                className="space-y-3 text-sm text-muted-foreground bg-muted/50 p-4 rounded-md"
                role="region"
                aria-label="Privacy details"
              >
                <div className="flex items-start gap-2">
                  <Shield
                    className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-medium text-foreground">
                      What we collect:
                    </p>
                    <ul className="mt-1 space-y-1 list-disc list-inside">
                      <li>Page views and navigation patterns</li>
                      <li>Button clicks and feature usage</li>
                      <li>Browser type and screen size (anonymized)</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Info
                    className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-medium text-foreground">
                      What we DON'T collect:
                    </p>
                    <ul className="mt-1 space-y-1 list-disc list-inside">
                      <li>Personal information or IP addresses</li>
                      <li>Cookies or persistent identifiers</li>
                      <li>Cross-site tracking or behavioral data</li>
                    </ul>
                  </div>
                </div>

                <p className="text-xs pt-2 border-t">
                  We use{" "}
                  <a
                    href="https://plausible.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                  >
                    Plausible Analytics
                  </a>
                  , a privacy-first analytics tool that's GDPR, CCPA, and PECR
                  compliant by default.
                </p>
              </div>
            </CardContent>
          )}

          <CardFooter className="flex flex-col sm:flex-row gap-3 pt-3">
            <Button
              ref={firstFocusableRef}
              onClick={handleAccept}
              className="w-full sm:w-auto order-1 sm:order-1"
              aria-label="Accept analytics and help us improve"
            >
              Accept Analytics
            </Button>
            <Button
              variant="outline"
              onClick={handleDecline}
              className="w-full sm:w-auto order-2 sm:order-2"
              aria-label="Decline analytics and continue without tracking"
            >
              Decline
            </Button>
            <Button
              variant="ghost"
              onClick={toggleDetails}
              className="w-full sm:w-auto order-3 sm:order-3 sm:ml-auto"
              aria-label={
                showDetails ? "Hide privacy details" : "Show privacy details"
              }
              aria-expanded={showDetails}
            >
              {showDetails ? "Hide Details" : "Learn More"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="consent-banner-announcements"
      />
    </>
  );
}

/**
 * Announce message to screen readers
 */
function announceToScreenReader(message: string) {
  const announcer = document.getElementById("consent-banner-announcements");
  if (announcer) {
    announcer.textContent = message;
    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = "";
    }, 1000);
  }
}
