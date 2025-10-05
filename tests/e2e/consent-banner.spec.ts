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
        localStorage.setItem("analytics-consent", "granted");
        localStorage.setItem(
          "analytics-consent-date",
          new Date().toISOString(),
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

      // Wait for banner to appear and be fully rendered
      const banner = page.getByRole("dialog", {
        name: /privacy-friendly analytics/i,
      });
      await expect(banner).toBeVisible({ timeout: 15000 });

      // Check for title
      await expect(page.getByText(/privacy-friendly analytics/i)).toBeVisible();

      // Check for description
      await expect(
        page.getByText(/we use privacy-respecting analytics/i),
      ).toBeVisible();

      // Check for buttons using getByText for visible text
      await expect(page.getByText("Accept Analytics")).toBeVisible();
      await expect(page.getByText("Decline")).toBeVisible();
      await expect(page.getByText("Learn More")).toBeVisible();
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

      // Check localStorage - consent is stored as simple string
      const consent = await page.evaluate(() =>
        localStorage.getItem("analytics-consent"),
      );
      expect(consent).toBe("granted");

      // Check consent date was also saved
      const consentDate = await page.evaluate(() =>
        localStorage.getItem("analytics-consent-date"),
      );
      expect(consentDate).toBeTruthy();
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
        localStorage.getItem("analytics-consent"),
      );
      expect(consent).toBe("granted");
    });
  });

  test.describe("Opt-out Flow", () => {
    test("should decline analytics and hide banner", async ({ page }) => {
      await page.goto("/");

      // Wait for banner to appear
      const banner = page.getByRole("dialog", {
        name: /privacy-friendly analytics/i,
      });
      await expect(banner).toBeVisible({ timeout: 15000 });

      // Click decline button using visible text
      await page.getByText("Decline").click();

      // Banner should disappear
      await expect(banner).not.toBeVisible();
    });

    test("should save declined consent to localStorage", async ({ page }) => {
      await page.goto("/");

      // Wait for banner
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15000 });

      // Click decline
      await page.getByText("Decline").click();

      // Check localStorage - consent is stored as simple string
      const consent = await page.evaluate(() =>
        localStorage.getItem("analytics-consent"),
      );
      expect(consent).toBe("denied");
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
        localStorage.getItem("analytics-consent"),
      );
      expect(consent).toBe("denied");
    });
  });

  test.describe("Details Toggle", () => {
    test("should show privacy details when learn more is clicked", async ({
      page,
    }) => {
      await page.goto("/");

      // Wait for banner
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15000 });

      // Click Learn More button using visible text
      await page.getByText("Learn More").click();

      // Details should be visible
      await expect(page.getByText(/what we collect/i)).toBeVisible();
      await expect(page.getByText(/what we don't collect/i)).toBeVisible();
    });

    test("should hide details when hide details is clicked", async ({
      page,
    }) => {
      await page.goto("/");

      // Wait for banner
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15000 });

      // Show details
      await page.getByText("Learn More").click();
      await expect(page.getByText(/what we collect/i)).toBeVisible();

      // Hide details - button text changes to "Hide Details"
      await page.getByText("Hide Details").click();

      // Details should be hidden
      await expect(page.getByText(/what we collect/i)).not.toBeVisible();
    });

    test("should update aria-expanded attribute", async ({ page }) => {
      await page.goto("/");

      // Wait for banner
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15000 });

      // Find the Learn More button using its aria-label that includes "privacy details"
      const learnMoreButton = page.getByRole("button", {
        name: /privacy details/i,
      });

      // Initially collapsed
      await expect(learnMoreButton).toHaveAttribute("aria-expanded", "false");

      // Expand
      await learnMoreButton.click();
      await page.waitForTimeout(200); // Wait for state update
      await expect(learnMoreButton).toHaveAttribute("aria-expanded", "true");

      // Collapse (button aria-label changes but we can still find it)
      await learnMoreButton.click();
      await page.waitForTimeout(200); // Wait for state update
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

      // Wait for banner and focus
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(200); // Extra wait for focus

      // Get buttons by their accessible names (full aria-label)
      const acceptButton = page.getByRole("button", {
        name: "Accept analytics and help us improve",
      });
      const declineButton = page.getByRole("button", {
        name: "Decline analytics and continue without tracking",
      });
      const learnMoreButton = page.getByRole("button", {
        name: "Show privacy details",
      });
      const closeButton = page.getByRole("button", {
        name: "Close and decline analytics",
      });

      // Accept button should be focused initially
      await expect(acceptButton).toBeFocused();

      // Tab to decline button
      await page.keyboard.press("Tab");
      await expect(declineButton).toBeFocused();

      // Tab to learn more button
      await page.keyboard.press("Tab");
      await expect(learnMoreButton).toBeFocused();

      // Tab to Privacy Center button
      await page.keyboard.press("Tab");

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
        localStorage.getItem("analytics-consent"),
      );
      expect(consent).toBe("denied");
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
        localStorage.getItem("analytics-consent"),
      );
      expect(consent).toBe("granted");
    });

    test("should activate decline button with Space key", async ({ page }) => {
      await page.goto("/");

      // Wait for banner and focus
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(200);

      // Tab to decline button
      await page.keyboard.press("Tab");

      const declineButton = page.getByRole("button", {
        name: "Decline analytics and continue without tracking",
      });
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

      // Wait for banner
      const banner = page.getByRole("dialog", {
        name: /privacy-friendly analytics/i,
      });
      await expect(banner).toBeVisible({ timeout: 15000 });

      // Check that buttons stack vertically on mobile using visible text
      const acceptButton = page.getByText("Accept Analytics");
      const declineButton = page.getByText("Decline");

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
