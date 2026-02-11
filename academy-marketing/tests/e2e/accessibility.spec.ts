import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("all images have alt attributes", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const results = await page.evaluate(() =>
      Array.from(document.querySelectorAll("img")).map((img) => ({
        src: img.getAttribute("src"),
        alt: img.getAttribute("alt"),
      }))
    );
    for (const img of results) {
      expect(img.alt, `Image missing alt: ${img.src}`).toBeTruthy();
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
    await page.goto("/faq", { waitUntil: "networkidle" });
    const firstQuestion = page.locator("button[aria-expanded]").first();
    await expect(firstQuestion).toBeVisible();
    await firstQuestion.focus();
    await page.keyboard.press("Enter");
    // Should expand the answer
    await expect(firstQuestion).toHaveAttribute("aria-expanded", "true");
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
