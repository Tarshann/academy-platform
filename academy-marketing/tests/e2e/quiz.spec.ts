import { test, expect } from "@playwright/test";

test.describe("Get Started Quiz", () => {
  test("step 1 loads with age options", async ({ page }) => {
    await page.goto("/get-started");
    await expect(page.getByText(/how old/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /8.*10|under 8|11.*14|15/i }).first()).toBeVisible();
  });

  test("full 3-step flow produces recommendation", async ({ page }) => {
    await page.goto("/get-started");

    // Step 1: Age
    await page.getByRole("button", { name: /11.*14/i }).click();

    // Step 2: Sport
    await expect(page.getByText(/sport/i)).toBeVisible();
    await page.getByRole("button", { name: /basketball/i }).click();

    // Step 3: Goal
    await expect(page.getByText(/goal/i)).toBeVisible();
    await page.getByRole("button", { name: /commit/i }).click();

    // Recommendation shown
    await expect(page.getByText(/recommend/i)).toBeVisible();
  });

  test("recommendation includes CTA link", async ({ page }) => {
    await page.goto("/get-started");

    // Quick path through quiz
    await page.getByRole("button", { name: /8.*10/i }).click();
    await page.getByRole("button", { name: /soccer/i }).click();
    await page.getByRole("button", { name: /try/i }).click();

    // Should see a CTA
    const cta = page.getByRole("link", { name: /get started|learn more|apply|book|drop in/i }).first();
    await expect(cta).toBeVisible();
  });

  test("quiz is keyboard navigable", async ({ page }) => {
    await page.goto("/get-started");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    // Should advance to step 2
    await expect(page.getByText(/sport/i)).toBeVisible({ timeout: 5000 });
  });
});
