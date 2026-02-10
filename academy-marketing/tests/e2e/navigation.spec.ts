import { test, expect } from "@playwright/test";

test.describe("Desktop Navigation", () => {
  test("has all primary nav links", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("header nav");
    await expect(nav.getByRole("link", { name: /home/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /programs/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /coaches/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /faq/i })).toBeVisible();
  });

  test("has Get Started CTA in nav", async ({ page }) => {
    await page.goto("/");
    const cta = page.locator("header").getByRole("link", { name: /get started/i });
    await expect(cta).toBeVisible();
  });

  test("programs dropdown shows sub-links on hover", async ({ page }) => {
    await page.goto("/");
    await page.locator("header").getByRole("link", { name: /programs/i }).hover();
    await expect(
      page.getByRole("link", { name: /performance lab/i }).first()
    ).toBeVisible();
  });

  test("navigates to programs page", async ({ page }) => {
    await page.goto("/");
    await page.locator("header nav").getByRole("link", { name: /programs/i }).click();
    await expect(page).toHaveURL(/\/programs/);
  });
});

test.describe("Mobile Navigation", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("hamburger menu opens and closes", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /open menu|close menu/i });
    await toggle.click();
    await expect(page.locator("header nav")).toBeVisible();
    await toggle.click();
  });

  test("mobile menu has navigation links", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /open menu/i }).click();
    await expect(page.getByRole("link", { name: /programs/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /coaches/i }).first()).toBeVisible();
  });
});

test.describe("Footer", () => {
  test("footer is present on every page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toBeVisible();
  });

  test("footer has privacy and terms links", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: /privacy/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /terms/i })).toBeVisible();
  });

  test("footer has contact information", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByText("(571) 292-0633")).toBeVisible();
    await expect(footer.getByText("omarphilmore@yahoo.com")).toBeVisible();
  });
});
