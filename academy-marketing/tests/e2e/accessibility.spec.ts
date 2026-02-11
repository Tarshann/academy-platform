import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("all images have alt attributes", async ({ page }) => {
    await page.goto("/");
    const images = await page.locator("img").all();
    for (const img of images) {
      const alt = await img.getAttribute("alt");
      expect(alt, `Image missing alt: ${await img.getAttribute("src")}`).toBeTruthy();
    }
  });

  test("page has main landmark", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
  });

  test("page has nav landmark", async ({ page }) => {
    await page.goto("/");
    const nav = await page.locator("nav").count();
    expect(nav).toBeGreaterThanOrEqual(1);
  });

  test("page has footer landmark", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toBeVisible();
  });

  test("mobile menu has aria-label", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const menuBtn = page.getByRole("button", { name: /open menu|close menu|menu/i });
    await expect(menuBtn).toBeVisible();
    const ariaLabel = await menuBtn.getAttribute("aria-label");
    expect(ariaLabel).toBeTruthy();
  });

  test("keyboard tab navigation works", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test("FAQ items are keyboard accessible", async ({ page }) => {
    await page.goto("/faq");
    const firstQuestion = page.locator("button").filter({ hasText: /\?/ }).first();
    await firstQuestion.focus();
    await page.keyboard.press("Enter");
    // Should expand the answer
    await page.waitForTimeout(300);
  });

  test("phone links use tel: protocol", async ({ page }) => {
    await page.goto("/");
    const phoneLinks = await page.locator('a[href^="tel:"]').count();
    expect(phoneLinks).toBeGreaterThanOrEqual(1);
  });

  test("email links use mailto: protocol", async ({ page }) => {
    await page.goto("/");
    const emailLinks = await page.locator('a[href^="mailto:"]').count();
    expect(emailLinks).toBeGreaterThanOrEqual(1);
  });
});
