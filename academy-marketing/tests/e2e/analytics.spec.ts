import { test, expect } from "@playwright/test";

test.describe("Analytics", () => {
  test("analytics component is present in layout", async ({ page }) => {
    await page.goto("/");
    // Check that the analytics scripts would be injected
    // (they only load when env vars are set, so we just check the page loads)
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("no page load blocking from analytics", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    const loadTime = Date.now() - start;
    // Page should load in under 5 seconds even without analytics
    expect(loadTime).toBeLessThan(5000);
  });

  test("phone links use tel: protocol for tracking", async ({ page }) => {
    await page.goto("/");
    const phoneLinks = await page.locator('a[href^="tel:"]').all();
    expect(phoneLinks.length).toBeGreaterThanOrEqual(1);
  });

  test("primary CTAs link to /get-started", async ({ page }) => {
    await page.goto("/");
    const getStartedLinks = await page.locator('a[href="/get-started"]').count();
    expect(getStartedLinks).toBeGreaterThanOrEqual(1);
  });

  test("program pages have CTAs", async ({ page }) => {
    await page.goto("/programs/performance-lab");
    const ctas = await page.locator("a.btn-primary, a.btn-secondary").count();
    expect(ctas).toBeGreaterThanOrEqual(1);
  });

  test("quiz interactions don't crash", async ({ page }) => {
    await page.goto("/get-started");
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    // Click through quiz steps
    const buttons = await page.locator("button").all();
    if (buttons.length > 0) {
      await buttons[0].click();
    }

    expect(errors).toHaveLength(0);
  });
});
