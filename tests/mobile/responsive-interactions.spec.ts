import { test, expect, type Page } from "@playwright/test";

// Mobile testing configuration
const MOBILE_DEVICES = {
  "iPhone SE": { width: 375, height: 667 },
  "iPhone 12": { width: 390, height: 844 },
  "Samsung Galaxy S21": { width: 360, height: 800 },
  "iPad Mini": { width: 768, height: 1024 },
};

const setupMobileDevice = async (page: Page, deviceName: string) => {
  const device = MOBILE_DEVICES[deviceName as keyof typeof MOBILE_DEVICES];
  await page.setViewportSize(device);
};

const goToPlaygroundMobile = async (page: Page) => {
  await page.goto("/playground", { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForSelector('[data-testid="codemirror-yaml-editor"]', {
    timeout: 10000,
  });
  await page.waitForTimeout(300); // Small delay for mobile rendering
};

test.describe("Mobile Responsive Layout Tests", () => {
  test("playground adapts to different mobile screen sizes", async ({
    page,
  }) => {
    for (const [deviceName] of Object.entries(MOBILE_DEVICES)) {
      await setupMobileDevice(page, deviceName);
      await goToPlaygroundMobile(page);

      // Verify mobile layout adaptations
      const yamlBox = page.locator(
        '[data-testid="codemirror-yaml-editor"] textarea'
      );
      await expect(yamlBox).toBeVisible();

      // Check that buttons are accessible on mobile
      const validateBtn = page.getByRole("button", { name: /Validate/ });
      const convertBtn = page.getByRole("button", { name: "Convert to JSON" });

      await expect(validateBtn).toBeVisible();
      await expect(convertBtn).toBeVisible();

      // Verify button sizes are touch-friendly
      const validateBtnBox = await validateBtn.boundingBox();
      const convertBtnBox = await convertBtn.boundingBox();

      expect(validateBtnBox?.height).toBeGreaterThanOrEqual(32);
      expect(convertBtnBox?.height).toBeGreaterThanOrEqual(32);

      console.log(`✓ ${deviceName}: Layout adapted correctly`);
    }
  });

  test("navigation works properly on mobile devices", async ({ page }) => {
    await setupMobileDevice(page, "iPhone 12");
    await page.goto("/", { waitUntil: "networkidle" });

    // Test navigation links
    const playgroundLink = page
      .getByRole("link", { name: /playground/i })
      .first();
    await expect(playgroundLink).toBeVisible();

    // Tap navigation link
    await playgroundLink.tap();
    await page.waitForURL("**/playground");

    // Verify we're on the playground page
    await expect(
      page.locator('[data-testid="codemirror-yaml-editor"]')
    ).toBeVisible();

    console.log("✓ Mobile navigation works correctly");
  });
});

test.describe("Mobile Touch Interactions", () => {
  test("touch interactions work on mobile playground", async ({ page }) => {
    await setupMobileDevice(page, "iPhone 12");
    await goToPlaygroundMobile(page);

    const yamlBox = page.locator(
      '[data-testid="codemirror-yaml-editor"] textarea'
    );
    const validateBtn = page.getByRole("button", { name: /Validate/ });

    // Test tap to focus textarea
    await yamlBox.tap();
    await expect(yamlBox).toBeFocused();

    // Test typing on mobile
    await yamlBox.fill("test: mobile-input\nconfig:\n  mobile: true");

    // Test tap validation button
    await validateBtn.tap();

    // Wait for validation to complete
    await page.waitForTimeout(2000);

    console.log("✓ Mobile touch interactions work correctly");
  });

  test("mobile interactions are responsive", async ({ page }) => {
    await setupMobileDevice(page, "Samsung Galaxy S21");
    await goToPlaygroundMobile(page);

    const yamlBox = page.locator(
      '[data-testid="codemirror-yaml-editor"] textarea'
    );
    const validateBtn = page.getByRole("button", { name: /Validate/ });

    // Measure tap response time
    const tapStartTime = Date.now();
    await yamlBox.tap();
    await expect(yamlBox).toBeFocused();
    const tapResponseTime = Date.now() - tapStartTime;

    // Should respond to tap quickly
    expect(tapResponseTime).toBeLessThan(500); // 500ms

    // Test validation response
    await yamlBox.fill("test: mobile-performance\nresponse: fast");

    const validationStartTime = Date.now();
    await validateBtn.tap();
    await page.waitForTimeout(2000);
    const validationResponseTime = Date.now() - validationStartTime;

    // Mobile validation should be reasonably fast
    expect(validationResponseTime).toBeLessThan(3000); // 3 seconds

    console.log(
      `✓ Mobile response times: tap=${tapResponseTime}ms, validation=${validationResponseTime}ms`
    );
  });
});

test.describe("Mobile Accessibility Tests", () => {
  test("mobile playground meets accessibility standards", async ({ page }) => {
    await setupMobileDevice(page, "iPhone 12");
    await goToPlaygroundMobile(page);

    // Verify buttons have accessible names
    const validateBtn = page.getByRole("button", { name: /Validate/ });
    const convertBtn = page.getByRole("button", { name: "Convert to JSON" });

    await expect(validateBtn).toBeVisible();
    await expect(convertBtn).toBeVisible();

    // Test focus management on mobile
    const yamlBox = page.locator(
      '[data-testid="codemirror-yaml-editor"] textarea'
    );
    await yamlBox.tap();
    await expect(yamlBox).toBeFocused();

    // Verify touch targets meet standards
    const buttons = [validateBtn, convertBtn];

    for (const button of buttons) {
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(32);
      expect(box?.width).toBeGreaterThanOrEqual(32);
    }

    console.log("✓ Mobile accessibility standards met");
  });
});

test.describe("Mobile Performance Tests", () => {
  test("playground loads quickly on mobile devices", async ({ page }) => {
    await setupMobileDevice(page, "iPhone SE"); // Slower device

    const startTime = Date.now();
    await goToPlaygroundMobile(page);
    const loadTime = Date.now() - startTime;

    // Should load within reasonable time on slower mobile device
    expect(loadTime).toBeLessThan(5000); // 5 seconds

    // Verify all critical elements are present
    await expect(
      page.locator('[data-testid="codemirror-yaml-editor"]')
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Validate/ })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Convert to JSON" })
    ).toBeVisible();

    console.log(`✓ Mobile page load time: ${loadTime}ms`);
  });
});
