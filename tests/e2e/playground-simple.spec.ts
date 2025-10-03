import { test, expect, type Page } from "@playwright/test";

const goToPlayground = async (page: Page) => {
  // Navigate to playground
  await page.goto("/playground", { waitUntil: "networkidle", timeout: 15000 });

  // Wait for React hydration and CodeMirror editor to load
  await page.waitForSelector("main", { timeout: 10000 });

  // Wait for CodeMirror editor to be available
  const codeMirrorEditor = page.locator(
    '[data-testid="codemirror-yaml-editor"]'
  );
  await expect(codeMirrorEditor).toBeVisible({ timeout: 10000 });

  // Wait for the hidden textarea (used for accessibility)
  const yamlTextarea = page.locator(
    '[data-testid="codemirror-yaml-editor"] textarea'
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

    // Should now have sample content
    const content = await yamlBox(page).inputValue();
    expect(content).toContain("name: cloudlint-example");
    expect(content).toContain("services:");
  });

  test("validate button works with YAML content", async ({ page }) => {
    await goToPlayground(page);

    // Load sample YAML
    await loadSampleBtn(page).click();

    // Click validate
    await validateBtn(page).click();

    // Should show validating state briefly
    await expect(page.getByText("Validating...")).toBeVisible();

    // Wait for validation to complete (mock takes 1 second)
    await page.waitForTimeout(1500);

    // Validate button should be enabled again (indicating validation completed)
    await expect(validateBtn(page)).toBeEnabled();
    await expect(validateBtn(page)).toContainText("Validate");
  });

  test("convert to JSON works", async ({ page }) => {
    await goToPlayground(page);

    // Load sample YAML
    await loadSampleBtn(page).click();

    // Click convert to JSON
    await convertBtn(page).click();

    // Switch to JSON tab to see output
    await page.getByRole("tab", { name: "JSON Output" }).click();

    // Should show JSON output (use heading selector to be specific)
    await expect(
      page.getByRole("heading", { name: "JSON Output" })
    ).toBeVisible();
    await expect(page.locator("pre code")).toBeVisible();
  });

  test("reset button clears content", async ({ page }) => {
    await goToPlayground(page);

    // Load sample YAML
    await loadSampleBtn(page).click();

    // Verify content is loaded
    const content = await yamlBox(page).inputValue();
    expect(content.length).toBeGreaterThan(0);

    // Click reset
    await resetBtn(page).click();

    // Should be empty now
    await expect(yamlBox(page)).toHaveValue("");
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
      "active"
    );

    // Click JSON Output tab
    await page.getByRole("tab", { name: "JSON Output" }).click();

    // Should switch to JSON tab
    await expect(
      page.getByRole("tab", { name: "JSON Output" })
    ).toHaveAttribute("data-state", "active");

    // Should show JSON placeholder
    await expect(
      page.getByText('Click "Convert to JSON" to see output')
    ).toBeVisible();
  });
});
