import { test, expect, type Page } from "@playwright/test";

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  SMALL_CONTENT: { lines: 100, maxValidationTime: 2000 }, // 100 lines, 2s
  MEDIUM_CONTENT: { lines: 500, maxValidationTime: 5000 }, // 500 lines, 5s
  LARGE_CONTENT: { lines: 1000, maxValidationTime: 10000 }, // 1000 lines, 10s
};

const goToPlayground = async (page: Page) => {
  await page.goto("/playground", { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForSelector('[data-testid="codemirror-yaml-editor"]', {
    timeout: 10000,
  });
};

const yamlBox = (page: Page) =>
  page.locator('[data-testid="codemirror-yaml-editor"] textarea');
const validateBtn = (page: Page) =>
  page.getByRole("button", { name: /Validate/ });

// Generate large YAML content for testing
function generateLargeYamlContent(lineCount: number): string {
  let yamlContent = `# Performance Test YAML - ${lineCount} lines\nmetadata:\n  name: performance-test\n  lines: ${lineCount}\n\n`;

  for (let i = 0; i < lineCount; i++) {
    yamlContent += `item_${i}:\n  name: "Performance Test Item ${i}"\n  description: "Test item for performance validation"\n  properties:\n    id: ${i}\n    active: ${i % 2 === 0}\n    tags: ["performance", "test"]\n\n`;
  }

  return yamlContent;
}

// Performance measurement utilities
async function measureValidationTime(
  page: Page,
  action: () => Promise<void>
): Promise<number> {
  const startTime = Date.now();
  await action();

  // Wait for validation to complete
  await page.waitForTimeout(2000);

  return Date.now() - startTime;
}

test.describe("Large YAML Content Performance Tests", () => {
  test.beforeEach(async ({ page }) => {
    await goToPlayground(page);
  });

  test("validates small YAML content within performance threshold", async ({
    page,
  }) => {
    const yamlContent = generateLargeYamlContent(
      PERFORMANCE_THRESHOLDS.SMALL_CONTENT.lines
    );

    // Fill the editor with content
    await yamlBox(page).fill(yamlContent);

    // Measure validation performance
    const validationTime = await measureValidationTime(page, async () => {
      await validateBtn(page).click();
    });

    // Verify performance threshold
    expect(validationTime).toBeLessThan(
      PERFORMANCE_THRESHOLDS.SMALL_CONTENT.maxValidationTime
    );

    console.log(
      `✓ Small content (${PERFORMANCE_THRESHOLDS.SMALL_CONTENT.lines} lines) validated in ${validationTime}ms`
    );
  });

  test("validates medium YAML content within performance threshold", async ({
    page,
  }) => {
    const yamlContent = generateLargeYamlContent(
      PERFORMANCE_THRESHOLDS.MEDIUM_CONTENT.lines
    );

    await yamlBox(page).fill(yamlContent);

    const validationTime = await measureValidationTime(page, async () => {
      await validateBtn(page).click();
    });

    expect(validationTime).toBeLessThan(
      PERFORMANCE_THRESHOLDS.MEDIUM_CONTENT.maxValidationTime
    );

    console.log(
      `✓ Medium content (${PERFORMANCE_THRESHOLDS.MEDIUM_CONTENT.lines} lines) validated in ${validationTime}ms`
    );
  });

  test("validates large YAML content within performance threshold", async ({
    page,
  }) => {
    const yamlContent = generateLargeYamlContent(
      PERFORMANCE_THRESHOLDS.LARGE_CONTENT.lines
    );

    await yamlBox(page).fill(yamlContent);

    const validationTime = await measureValidationTime(page, async () => {
      await validateBtn(page).click();
    });

    expect(validationTime).toBeLessThan(
      PERFORMANCE_THRESHOLDS.LARGE_CONTENT.maxValidationTime
    );

    console.log(
      `✓ Large content (${PERFORMANCE_THRESHOLDS.LARGE_CONTENT.lines} lines) validated in ${validationTime}ms`
    );
  });

  test("performance baseline measurement", async ({ page }) => {
    // Standard test content for baseline performance measurement
    const standardYaml = `apiVersion: v1
kind: ConfigMap
metadata:
  name: performance-baseline
  namespace: default
data:
  config.yaml: |
    database:
      host: localhost
      port: 5432
      name: testdb
    server:
      port: 8080
      cors: true
    features:
      auth: enabled
      logging: debug`;

    await yamlBox(page).fill(standardYaml);

    const validationTime = await measureValidationTime(page, async () => {
      await validateBtn(page).click();
    });

    // Baseline should be very fast
    expect(validationTime).toBeLessThan(1000); // 1 second

    console.log(`✓ Baseline validation completed in ${validationTime}ms`);
  });
});

test.describe("Editor Performance Tests", () => {
  test("editor handles large content input smoothly", async ({ page }) => {
    await goToPlayground(page);

    const largeContent = generateLargeYamlContent(200);

    // Measure time to fill editor
    const startTime = Date.now();
    await yamlBox(page).fill(largeContent);
    const fillTime = Date.now() - startTime;

    // Should fill content quickly
    expect(fillTime).toBeLessThan(2000); // 2 seconds

    // Verify content was filled correctly
    const editorContent = await yamlBox(page).inputValue();
    expect(editorContent).toContain("item_0:");
    expect(editorContent).toContain("item_199:");

    console.log(`✓ Editor filled with large content in ${fillTime}ms`);
  });

  test("editor typing performance with existing content", async ({ page }) => {
    await goToPlayground(page);

    // Fill with medium content first
    const existingContent = generateLargeYamlContent(100);
    await yamlBox(page).fill(existingContent);

    // Measure typing performance
    const startTime = Date.now();
    await yamlBox(page).press("End");
    await yamlBox(page).type('\nnew_item:\n  name: "Added item"\n  test: true');
    const typingTime = Date.now() - startTime;

    // Typing should be responsive even with existing content
    expect(typingTime).toBeLessThan(1000); // 1 second

    // Verify new content was added
    const finalContent = await yamlBox(page).inputValue();
    expect(finalContent).toContain("new_item:");
    expect(finalContent).toContain("Added item");

    console.log(`✓ Typing with existing content completed in ${typingTime}ms`);
  });
});
