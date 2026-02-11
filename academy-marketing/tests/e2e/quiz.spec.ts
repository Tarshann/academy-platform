import { test, expect } from "@playwright/test";

test.describe("Get Started Quiz", () => {
  test("step 1 loads with age options", async ({ page }) => {
    await page.goto("/get-started");
    await expect(page.getByText(/how old/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /8.*10|under 8|11.*14|15/i }).first()).toBeVisible();
  });

  test("full 3-step flow produces recommendation", async ({ page }) => {
    await page.goto("/get-started", { waitUntil: "networkidle" });

    // Step 1: Age — wait for quiz to be interactive
    await expect(page.getByText(/how old/i)).toBeVisible();
    await page.locator("button").filter({ hasText: "11-14" }).click();

    // Step 2: Sport
    await expect(page.getByText(/primary sport/i)).toBeVisible();
    await page.locator("button").filter({ hasText: "Basketball" }).click();

    // Step 3: Goal
    await expect(page.getByText(/goal/i)).toBeVisible();
    await page.locator("button").filter({ hasText: "Commit to improvement" }).click();

    // Recommendation shown
    await expect(page.getByText(/we recommend/i)).toBeVisible();
  });

  test("recommendation includes CTA link", async ({ page }) => {
    await page.goto("/get-started", { waitUntil: "networkidle" });

    // Quick path through quiz
    await expect(page.getByText(/how old/i)).toBeVisible();
    await page.locator("button").filter({ hasText: "8-10" }).click();

    await expect(page.getByText(/primary sport/i)).toBeVisible();
    await page.locator("button").filter({ hasText: "Soccer" }).click();

    await expect(page.getByText(/goal/i)).toBeVisible();
    await page.locator("button").filter({ hasText: "Try it out" }).click();

    // Should see a CTA
    await expect(page.getByText(/we recommend/i)).toBeVisible();
    const cta = page.getByRole("link", { name: /drop in|apply|book/i }).first();
    await expect(cta).toBeVisible();
  });

  test("quiz is keyboard navigable", async ({ page }) => {
    await page.goto("/get-started", { waitUntil: "networkidle" });
    // Focus the first quiz button and activate it
    await page.locator("button").filter({ hasText: "Under 8" }).focus();
    await page.keyboard.press("Enter");
    // Should advance to step 2
    await expect(page.getByText(/primary sport/i)).toBeVisible({ timeout: 5000 });
  });
});
