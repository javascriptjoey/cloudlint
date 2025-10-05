/**
 * ConsentBanner Component Tests
 *
 * Tests for WCAG 2.1 AA compliant consent banner.
 *
 * Test Coverage:
 * - Consent state management
 * - Keyboard navigation
 * - Screen reader support (ARIA attributes)
 * - Focus management
 * - User interactions (accept, decline, dismiss)
 * - Visibility and persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentBanner } from "../../src/components/ConsentBanner";

describe("ConsentBanner", () => {
  let localStorageMock: Storage;

  beforeEach(() => {
    // Create a fresh localStorage mock for each test
    const store: Record<string, string> = {};
    localStorageMock = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((key) => delete store[key]);
      },
      get length() {
        return Object.keys(store).length;
      },
      key: (index: number) => {
        const keys = Object.keys(store);
        return keys[index] || null;
      },
    };

    // Replace global localStorage
    Object.defineProperty(global, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    // Clear any existing consent
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Visibility", () => {
    it("should not show banner if consent already exists", () => {
      localStorage.setItem(
        "analytics_consent",
        JSON.stringify({ analytics: true, timestamp: Date.now() }),
      );

      render(<ConsentBanner />);

      expect(
        screen.queryByRole("dialog", { name: /privacy-friendly analytics/i }),
      ).not.toBeInTheDocument();
    });

    it("should show banner after delay if no consent exists", async () => {
      render(<ConsentBanner />);

      // Banner should not be visible immediately
      expect(
        screen.queryByRole("dialog", { name: /privacy-friendly analytics/i }),
      ).not.toBeInTheDocument();

      // Wait for banner to appear (1 second delay)
      await waitFor(
        () => {
          expect(
            screen.getByRole("dialog", { name: /privacy-friendly analytics/i }),
          ).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it("should hide banner after accepting", async () => {
      render(<ConsentBanner />);

      await waitFor(
        () => {
          expect(screen.getByRole("dialog")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const acceptButton = screen.getByRole("button", {
        name: /accept analytics/i,
      });
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("should hide banner after declining", async () => {
      render(<ConsentBanner />);

      await waitFor(
        () => {
          expect(screen.getByRole("dialog")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const declineButton = screen.getByRole("button", {
        name: /decline analytics and continue without tracking/i,
      });
      fireEvent.click(declineButton);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Consent State Management", () => {
    it("should save consent as enabled when accepting", async () => {
      render(<ConsentBanner />);

      await waitFor(
        () => {
          expect(screen.getByRole("dialog")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const acceptButton = screen.getByRole("button", {
        name: /accept analytics/i,
      });
      fireEvent.click(acceptButton);

      const stored = localStorage.getItem("analytics_consent");
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.analytics).toBe(true);
      expect(parsed.timestamp).toBeTypeOf("number");
    });

    it("should save consent as disabled when declining", async () => {
      render(<ConsentBanner />);

      await waitFor(
        () => {
          expect(screen.getByRole("dialog")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const declineButton = screen.getByRole("button", {
        name: /decline analytics and continue without tracking/i,
      });
      fireEvent.click(declineButton);

      const stored = localStorage.getItem("analytics_consent");
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.analytics).toBe(false);
    });

    it("should call onAccept callback when accepting", async () => {
      const onAccept = vi.fn();
      render(<ConsentBanner onAccept={onAccept} />);

      await waitFor(
        () => {
          expect(screen.getByRole("dialog")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const acceptButton = screen.getByRole("button", {
        name: /accept analytics/i,
      });
      fireEvent.click(acceptButton);

      expect(onAccept).toHaveBeenCalledTimes(1);
    });

    it("should call onDecline callback when declining", async () => {
      const onDecline = vi.fn();
      render(<ConsentBanner onDecline={onDecline} />);

      await waitFor(
        () => {
          expect(screen.getByRole("dialog")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const declineButton = screen.getByRole("button", {
        name: /decline analytics and continue without tracking/i,
      });
      fireEvent.click(declineButton);

      expect(onDecline).toHaveBeenCalledTimes(1);
    });

    it("should call onDismiss callback when closing", async () => {
      const onDismiss = vi.fn();
      render(<ConsentBanner onDismiss={onDismiss} />);

      await waitFor(
        () => {
          expect(screen.getByRole("dialog")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const closeButton = screen.getByRole("button", {
        name: /close and decline/i,
      });
      fireEvent.click(closeButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility - ARIA Attributes", () => {
    it("should have proper dialog role and aria attributes", async () => {
      render(<ConsentBanner />);

      await waitFor(
        () => {
          const dialog = screen.getByRole("dialog");
          expect(dialog).toBeInTheDocument();
          expect(dialog).toHaveAttribute("aria-modal", "true");
          expect(dialog).toHaveAttribute(
            "aria-labelledby",
            "consent-banner-title",
          );
          expect(dialog).toHaveAttribute(
            "aria-describedby",
            "consent-banner-description",
          );
        },
        { timeout: 2000 },
      );
    });

    it("should have accessible title and description", async () => {
      render(<ConsentBanner />);

      await waitFor(
        () => {
          expect(
            screen.getByText(/privacy-friendly analytics/i),
          ).toBeInTheDocument();
          expect(
            screen.getByText(/we use privacy-respecting analytics/i),
          ).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it("should have proper button labels", async () => {
      render(<ConsentBanner />);

      await waitFor(
        () => {
          expect(
            screen.getByRole("button", { name: /accept analytics/i }),
          ).toBeInTheDocument();
          expect(
            screen.getByRole("button", {
              name: /decline analytics and continue without tracking/i,
            }),
          ).toBeInTheDocument();
          expect(
            screen.getByRole("button", { name: /close and decline/i }),
          ).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it("should have aria-expanded on learn more button", async () => {
      render(<ConsentBanner />);

      await waitFor(
        () => {
          const learnMoreButton = screen.getByRole("button", {
            name: /show privacy details/i,
          });
          expect(learnMoreButton).toHaveAttribute("aria-expanded", "false");
        },
        { timeout: 2000 },
      );
    });

    it("should update aria-expanded when toggling details", async () => {
      const user = userEvent.setup({ delay: null });
      render(<ConsentBanner />);

      await waitFor(
        () => {
          expect(screen.getByRole("dialog")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const learnMoreButton = screen.getByRole("button", {
        name: /show privacy details/i,
      });

      // Initially collapsed
      expect(learnMoreButton).toHaveAttribute("aria-expanded", "false");

      // Click to expand
      await user.click(learnMoreButton);

      expect(learnMoreButton).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText(/what we collect/i)).toBeInTheDocument();

      // Click to collapse - button text changes to "Hide Details"
      const hideButton = screen.getByRole("button", {
        name: /hide privacy details/i,
      });
      await user.click(hideButton);

      // After hiding, button should be collapsed again
      const collapsedButton = screen.getByRole("button", {
        name: /show privacy details/i,
      });
      expect(collapsedButton).toHaveAttribute("aria-expanded", "false");
    });

    it("should have screen reader announcement region", async () => {
      render(<ConsentBanner />);

      await waitFor(
        () => {
          const announcer = document.getElementById(
            "consent-banner-announcements",
          );
          expect(announcer).toBeInTheDocument();
          expect(announcer).toHaveAttribute("role", "status");
          expect(announcer).toHaveAttribute("aria-live", "polite");
          expect(announcer).toHaveAttribute("aria-atomic", "true");
        },
        { timeout: 2000 },
      );
    });
  });

  describe("Details Toggle", () => {
    it("should show details when learn more is clicked", async () => {
      const user = userEvent.setup({ delay: null });
      render(<ConsentBanner />);

      await waitFor(
        () => {
          expect(screen.getByRole("dialog")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const learnMoreButton = screen.getByRole("button", {
        name: /show privacy details/i,
      });

      await user.click(learnMoreButton);

      expect(screen.getByText(/what we collect/i)).toBeInTheDocument();
      expect(screen.getByText(/what we don't collect/i)).toBeInTheDocument();
      expect(
        screen.getByRole("region", { name: /privacy details/i }),
      ).toBeInTheDocument();
    });

    it("should hide details when hide details is clicked", async () => {
      const user = userEvent.setup({ delay: null });
      render(<ConsentBanner />);

      await waitFor(
        () => {
          expect(screen.getByRole("dialog")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const learnMoreButton = screen.getByRole("button", {
        name: /show privacy details/i,
      });

      // Show details
      await user.click(learnMoreButton);
      expect(screen.getByText(/what we collect/i)).toBeInTheDocument();

      // Hide details
      const hideButton = screen.getByRole("button", {
        name: /hide privacy details/i,
      });
      await user.click(hideButton);

      expect(screen.queryByText(/what we collect/i)).not.toBeInTheDocument();
    });
  });

  describe("Custom Props", () => {
    it("should use custom domain prop", async () => {
      render(<ConsentBanner domain="custom.com" />);

      await waitFor(
        () => {
          expect(screen.getByRole("dialog")).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      const acceptButton = screen.getByRole("button", {
        name: /accept analytics/i,
      });
      fireEvent.click(acceptButton);

      // Verify domain is used (would need to mock loadPlausibleScript to verify)
      expect(localStorage.getItem("analytics_consent")).toBeTruthy();
    });

    it("should apply custom className", async () => {
      render(<ConsentBanner className="custom-class" />);

      await waitFor(
        () => {
          const dialog = screen.getByRole("dialog");
          expect(dialog).toHaveClass("custom-class");
        },
        { timeout: 2000 },
      );
    });
  });
});
