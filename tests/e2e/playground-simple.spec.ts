import { test, expect, type Page } from "@playwright/test";

const goToPlayground = async (page: Page) => {
  // Set consent in localStorage BEFORE navigating to prevent banner from appearing
  // This prevents the consent banner from blocking clicks (it has a 1s delay)
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("analytics-consent", "declined");
    localStorage.setItem("analytics-consent-date", new Date().toISOString());
  });

  // Now navigate to playground - banner won't appear
  await page.goto("/playground", { waitUntil: "networkidle", timeout: 15000 });

  // Wait for React hydration and CodeMirror editor to load
  await page.waitForSelector("main", { timeout: 10000 });

  // Wait for CodeMirror editor to be available
  const codeMirrorEditor = page.locator(
    '[data-testid="codemirror-yaml-editor"]',
  );
  await expect(codeMirrorEditor).toBeVisible({ timeout: 10000 });

  // Wait for the hidden textarea (used for accessibility)
  const yamlTextarea = page.locator(
    '[data-testid="codemirror-yaml-editor"] textarea',
  );
  await expect(yamlTextarea).toBeVisible({ timeout: 5000 });
};

const yamlBox = (page: Page) =>
  page.locator('[data-testid="codemirror-yaml-editor"] textarea');
const validateBtn = (page: Page) =>
  page.getByRole("button", { name: /Validate/ });
const convertBtn = (page: Page) =>
  page.getByRole("button", { name: "Convert to JSON" });
const loadSampleBtn = (page: Page) =>
  page.getByRole("button", { name: "Load Sample" });
const resetBtn = (page: Page) => page.getByRole("button", { name: "Reset" });

test.describe("Playground Simple E2E Tests", () => {
  test("loads playground page successfully", async ({ page }) => {
    await goToPlayground(page);

    // Check that main elements are visible
    await expect(page.getByText("Cloudlint YAML Validator")).toBeVisible();
    await expect(validateBtn(page)).toBeVisible();
    await expect(convertBtn(page)).toBeVisible();
    await expect(loadSampleBtn(page)).toBeVisible();
    await expect(resetBtn(page)).toBeVisible();
  });

  test("load sample YAML works", async ({ page }) => {
    await goToPlayground(page);

    // Initially textarea should be empty
    await expect(yamlBox(page)).toHaveValue("");

    // Click load sample
    await loadSampleBtn(page).click();

    // Should now have sample content (CloudFormation template)
    const content = await yamlBox(page).inputValue();
    expect(content).toContain("AWSTemplateFormatVersion");
    expect(content).toContain("Resources:");
  });

  test("validate button works with YAML content", async ({ page }) => {
    await goToPlayground(page);

    // Load sample YAML
    await loadSampleBtn(page).click();

    // Wait for YAML to be loaded with actual content
    await expect(yamlBox(page)).not.toHaveValue("", { timeout: 5000 });
    const yamlContent = await yamlBox(page).inputValue();
    expect(yamlContent).toContain("AWSTemplateFormatVersion");

    // Click validate - button should be enabled
    const validateButton = validateBtn(page);
    await expect(validateButton).toBeEnabled();
    await validateButton.click();

    // Wait for validation to start (button text changes)
    await expect(validateButton).toContainText(/Validating|Validate/, {
      timeout: 3000,
    });

    // Wait for validation to complete - button returns to "Validate" text
    await expect(validateButton).toContainText("Validate", {
      timeout: 15000,
    });
    await expect(validateButton).toBeEnabled();
  });

  test("convert to JSON works", async ({ page }) => {
    await goToPlayground(page);

    // Load sample YAML
    await loadSampleBtn(page).click();

    // Wait for YAML to be loaded with actual content
    await expect(yamlBox(page)).not.toHaveValue("", { timeout: 5000 });
    const yamlContent = await yamlBox(page).inputValue();
    expect(yamlContent).toContain("AWSTemplateFormatVersion");

    // Click convert to JSON - button should be enabled
    const convertButton = convertBtn(page);
    await expect(convertButton).toBeEnabled();
    await convertButton.click();

    // Wait a moment for conversion to process
    await page.waitForTimeout(1000);

    // Switch to JSON tab to see output
    const jsonTab = page.getByRole("tab", { name: "JSON Output" });
    await jsonTab.click();

    // Wait for tab to be active
    await expect(jsonTab).toHaveAttribute("data-state", "active", {
      timeout: 5000,
    });

    // Should show JSON output - look for any JSON-like content
    const jsonContent = page.locator("pre, code, [class*='json']");
    await expect(jsonContent.first()).toBeVisible({ timeout: 10000 });
  });

  test("reset button clears content", async ({ page }) => {
    await goToPlayground(page);

    // Load sample YAML
    await loadSampleBtn(page).click();

    // Wait for YAML to be loaded with actual content
    await expect(yamlBox(page)).not.toHaveValue("", { timeout: 5000 });
    const yamlContent = await yamlBox(page).inputValue();
    expect(yamlContent).toContain("AWSTemplateFormatVersion");
    expect(yamlContent.length).toBeGreaterThan(100);

    // Click reset - button should be enabled
    const resetButton = resetBtn(page);
    await expect(resetButton).toBeEnabled();
    await resetButton.click();

    // Wait a moment for reset to process
    await page.waitForTimeout(500);

    // Should be empty now
    await expect(yamlBox(page)).toHaveValue("", { timeout: 5000 });
  });

  test("theme toggle works", async ({ page }) => {
    await goToPlayground(page);

    // Find theme toggle button
    const themeToggle = page.getByRole("button", { name: /Mode/ });
    await expect(themeToggle).toBeVisible();

    // Click to toggle theme
    await themeToggle.click();

    // Should update the theme (check for dark class on html element)
    const htmlElement = page.locator("html");
    await expect(htmlElement).toHaveClass(/dark/);
  });

  test("security checks toggle works", async ({ page }) => {
    await goToPlayground(page);

    // Find security checks toggle
    const securityToggle = page.locator("#security-toggle");
    await expect(securityToggle).toBeVisible();

    // Should be off by default
    await expect(securityToggle).not.toBeChecked();

    // Click to enable
    await securityToggle.click();

    // Should now be checked
    await expect(securityToggle).toBeChecked();
  });

  test("tabs switch correctly", async ({ page }) => {
    await goToPlayground(page);

    // Should start on Validation tab
    await expect(page.getByRole("tab", { name: "Validation" })).toHaveAttribute(
      "data-state",
      "active",
    );

    // Click JSON Output tab
    await page.getByRole("tab", { name: "JSON Output" }).click();

    // Should switch to JSON tab
    await expect(
      page.getByRole("tab", { name: "JSON Output" }),
    ).toHaveAttribute("data-state", "active");

    // Should show JSON placeholder
    await expect(
      page.getByText('Click "Convert to JSON" to see output'),
    ).toBeVisible();
  });
});
