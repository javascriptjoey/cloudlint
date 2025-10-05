/**
 * Consent Banner E2E Tests
 *
 * End-to-end tests for consent banner functionality.
 *
 * Test Coverage:
 * - Opt-in/opt-out flows
 * - Consent persistence across sessions
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Visual appearance
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Consent Banner E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test.describe("Visibility and Appearance", () => {
    test("should show consent banner on first visit", async ({ page }) => {
      await page.goto("/");

      // Wait for banner to appear (1 second delay)
      await page.waitForTimeout(1100);

      const banner = page.getByRole("dialog", {
        name: /privacy-friendly analytics/i,
      });
      await expect(banner).toBeVisible();
    });

    test("should not show banner if consent already exists", async ({
      page,
    }) => {
      // Set consent in localStorage
      await page.goto("/");
      await page.evaluate(() => {
        localStorage.setItem(
          "analytics_consent",
          JSON.stringify({ analytics: true, timestamp: Date.now() }),
        );
      });

      // Reload page
      await page.reload();
      await page.waitForTimeout(1100);

      const banner = page.getByRole("dialog", {
        name: /privacy-friendly analytics/i,
      });
      await expect(banner).not.toBeVisible();
    });

    test("should have backdrop overlay", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1100);

      // Check for backdrop
      const backdrop = page.locator(".fixed.inset-0.bg-black\\/50");
      await expect(backdrop).toBeVisible();
    });

    test("should display all required elements", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1100);

      // Check for title
      await expect(page.getByText(/privacy-friendly analytics/i)).toBeVisible();

      // Check for description
      await expect(
        page.getByText(/we use privacy-respecting analytics/i),
      ).toBeVisible();

      // Check for buttons
      await expect(
        page.getByRole("button", { name: /accept analytics/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /decline/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /learn more/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /close and decline/i }),
      ).toBeVisible();
    });
  });

  test.describe("Opt-in Flow", () => {
    test("should accept analytics and hide banner", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1100);

      const acceptButton = page.getByRole("button", {
        name: /accept analytics/i,
      });
      await acceptButton.click();

      // Banner should disappear
      const banner = page.getByRole("dialog", {
        name: /privacy-friendly analytics/i,
      });
      await expect(banner).not.toBeVisible();
    });

    test("should save consent to localStorage when accepting", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForTimeout(1100);

      const acceptButton = page.getByRole("button", {
        name: /accept analytics/i,
      });
      await acceptButton.click();

      // Check localStorage
      const consent = await page.evaluate(() =>
        localStorage.getItem("analytics_consent"),
      );
      expect(consent).toBeTruthy();

      const parsed = JSON.parse(consent!);
      expect(parsed.analytics).toBe(true);
      expect(parsed.timestamp).toBeGreaterThan(0);
    });

    test("should persist consent across page reloads", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1100);

      // Accept analytics
      await page.getByRole("button", { name: /accept analytics/i }).click();

      // Reload page
      await page.reload();
      await page.waitForTimeout(1100);

      // Banner should not appear
      const banner = page.getByRole("dialog", {
        name: /privacy-friendly analytics/i,
      });
      await expect(banner).not.toBeVisible();

      // Verify consent is still in localStorage
      const consent = await page.evaluate(() =>
        localStorage.getItem("analytics_consent"),
      );
      const parsed = JSON.parse(consent!);
      expect(parsed.analytics).toBe(true);
    });
  });

  test.describe("Opt-out Flow", () => {
    test("should decline analytics and hide banner", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1100);

      const declineButton = page.getByRole("button", { name: /decline/i });
      await declineButton.click();

      // Banner should disappear
      const banner = page.getByRole("dialog", {
        name: /privacy-friendly analytics/i,
      });
      await expect(banner).not.toBeVisible();
    });

    test("should save declined consent to localStorage", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1100);

      const declineButton = page.getByRole("button", { name: /decline/i });
      await declineButton.click();

      // Check localStorage
      const consent = await page.evaluate(() =>
        localStorage.getItem("analytics_consent"),
      );
      expect(consent).toBeTruthy();

      const parsed = JSON.parse(consent!);
      expect(parsed.analytics).toBe(false);
    });

    test("should close banner with X button", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1100);

      const closeButton = page.getByRole("button", {
        name: /close and decline/i,
      });
      await closeButton.click();

      // Banner should disappear
      const banner = page.getByRole("dialog", {
        name: /privacy-friendly analytics/i,
      });
      await expect(banner).not.toBeVisible();

      // Should save as declined
      const consent = await page.evaluate(() =>
        localStorage.getItem("analytics_consent"),
      );
      const parsed = JSON.parse(consent!);
      expect(parsed.analytics).toBe(false);
    });
  });

  test.describe("Details Toggle", () => {
    test("should show privacy details when learn more is clicked", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForTimeout(1100);

      const learnMoreButton = page.getByRole("button", {
        name: /learn more/i,
      });
      await learnMoreButton.click();

      // Details should be visible
      await expect(page.getByText(/what we collect/i)).toBeVisible();
      await expect(page.getByText(/what we don't collect/i)).toBeVisible();
      await expect(
        page.getByRole("region", { name: /privacy details/i }),
      ).toBeVisible();
    });

    test("should hide details when hide details is clicked", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForTimeout(1100);

      // Show details
      const learnMoreButton = page.getByRole("button", {
        name: /learn more/i,
      });
      await learnMoreButton.click();
      await expect(page.getByText(/what we collect/i)).toBeVisible();

      // Hide details
      const hideButton = page.getByRole("button", { name: /hide details/i });
      await hideButton.click();

      // Details should be hidden
      await expect(page.getByText(/what we collect/i)).not.toBeVisible();
    });

    test("should update aria-expanded attribute", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1100);

      const learnMoreButton = page.getByRole("button", {
        name: /learn more/i,
      });

      // Initially collapsed
      await expect(learnMoreButton).toHaveAttribute("aria-expanded", "false");

      // Expand
      await learnMoreButton.click();
      await expect(learnMoreButton).toHaveAttribute("aria-expanded", "true");

      // Collapse
      await learnMoreButton.click();
      await expect(learnMoreButton).toHaveAttribute("aria-expanded", "false");
    });
  });

  test.describe("Keyboard Navigation", () => {
    test("should focus first button when banner appears", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1200); // Wait for banner + focus delay

      const acceptButton = page.getByRole("button", {
        name: /accept analytics/i,
      });
      await expect(acceptButton).toBeFocused();
    });

    test("should navigate through buttons with Tab key", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1200);

      const acceptButton = page.getByRole("button", {
        name: /accept analytics/i,
      });
      const declineButton = page.getByRole("button", { name: /decline/i });
      const learnMoreButton = page.getByRole("button", {
        name: /learn more/i,
      });
      const closeButton = page.getByRole("button", {
        name: /close and decline/i,
      });

      // Accept button should be focused initially
      await expect(acceptButton).toBeFocused();

      // Tab to decline button
      await page.keyboard.press("Tab");
      await expect(declineButton).toBeFocused();

      // Tab to learn more button
      await page.keyboard.press("Tab");
      await expect(learnMoreButton).toBeFocused();

      // Tab to close button
      await page.keyboard.press("Tab");
      await expect(closeButton).toBeFocused();

      // Tab should cycle back to accept button
      await page.keyboard.press("Tab");
      await expect(acceptButton).toBeFocused();
    });

    test("should navigate backward with Shift+Tab", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1200);

      const acceptButton = page.getByRole("button", {
        name: /accept analytics/i,
      });
      const closeButton = page.getByRole("button", {
        name: /close and decline/i,
      });

      // Accept button should be focused initially
      await expect(acceptButton).toBeFocused();

      // Shift+Tab should cycle to last button
      await page.keyboard.press("Shift+Tab");
      await expect(closeButton).toBeFocused();
    });

    test("should close banner with Escape key", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1100);

      const banner = page.getByRole("dialog", {
        name: /privacy-friendly analytics/i,
      });
      await expect(banner).toBeVisible();

      // Press Escape
      await page.keyboard.press("Escape");

      // Banner should disappear
      await expect(banner).not.toBeVisible();

      // Should save as declined
      const consent = await page.evaluate(() =>
        localStorage.getItem("analytics_consent"),
      );
      const parsed = JSON.parse(consent!);
      expect(parsed.analytics).toBe(false);
    });

    test("should activate accept button with Enter key", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1200);

      const acceptButton = page.getByRole("button", {
        name: /accept analytics/i,
      });
      await expect(acceptButton).toBeFocused();

      // Press Enter
      await page.keyboard.press("Enter");

      // Banner should disappear
      const banner = page.getByRole("dialog", {
        name: /privacy-friendly analytics/i,
      });
      await expect(banner).not.toBeVisible();

      // Should save as accepted
      const consent = await page.evaluate(() =>
        localStorage.getItem("analytics_consent"),
      );
      const parsed = JSON.parse(consent!);
      expect(parsed.analytics).toBe(true);
    });

    test("should activate decline button with Space key", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1200);

      // Tab to decline button
      await page.keyboard.press("Tab");

      const declineButton = page.getByRole("button", { name: /decline/i });
      await expect(declineButton).toBeFocused();

      // Press Space
      await page.keyboard.press("Space");

      // Banner should disappear
      const banner = page.getByRole("dialog", {
        name: /privacy-friendly analytics/i,
      });
      await expect(banner).not.toBeVisible();
    });
  });

  test.describe("Accessibility Compliance", () => {
    test("should have no accessibility violations", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1100);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test("should have proper ARIA attributes", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1100);

      const dialog = page.getByRole("dialog");

      // Check dialog attributes
      await expect(dialog).toHaveAttribute("aria-modal", "true");
      await expect(dialog).toHaveAttribute(
        "aria-labelledby",
        "consent-banner-title",
      );
      await expect(dialog).toHaveAttribute(
        "aria-describedby",
        "consent-banner-description",
      );
    });

    test("should have screen reader announcement region", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1100);

      const announcer = page.locator("#consent-banner-announcements");
      await expect(announcer).toHaveAttribute("role", "status");
      await expect(announcer).toHaveAttribute("aria-live", "polite");
      await expect(announcer).toHaveAttribute("aria-atomic", "true");
    });

    test("should have visible focus indicators", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1200);

      const acceptButton = page.getByRole("button", {
        name: /accept analytics/i,
      });

      // Check for focus ring (outline)
      const focusStyles = await acceptButton.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
        };
      });

      // Should have some form of outline when focused
      expect(
        focusStyles.outline !== "none" ||
          focusStyles.outlineWidth !== "0px" ||
          focusStyles.outlineStyle !== "none",
      ).toBeTruthy();
    });
  });

  test.describe("Responsive Design", () => {
    test("should display correctly on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto("/");
      await page.waitForTimeout(1100);

      const banner = page.getByRole("dialog", {
        name: /privacy-friendly analytics/i,
      });
      await expect(banner).toBeVisible();

      // Check that buttons stack vertically on mobile
      const acceptButton = page.getByRole("button", {
        name: /accept analytics/i,
      });
      const declineButton = page.getByRole("button", { name: /decline/i });

      const acceptBox = await acceptButton.boundingBox();
      const declineBox = await declineButton.boundingBox();

      // Buttons should be stacked (accept above decline)
      expect(acceptBox!.y).toBeLessThan(declineBox!.y);
    });

    test("should display correctly on tablet", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.goto("/");
      await page.waitForTimeout(1100);

      const banner = page.getByRole("dialog", {
        name: /privacy-friendly analytics/i,
      });
      await expect(banner).toBeVisible();
    });

    test("should display correctly on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
      await page.goto("/");
      await page.waitForTimeout(1100);

      const banner = page.getByRole("dialog", {
        name: /privacy-friendly analytics/i,
      });
      await expect(banner).toBeVisible();

      // Banner should be centered and not full width
      const bannerBox = await banner.boundingBox();
      expect(bannerBox!.width).toBeLessThan(1920);
    });
  });
});
