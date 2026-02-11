import { test, expect } from "@playwright/test";

const PAGES = [
  "/",
  "/programs",
  "/programs/performance-lab",
  "/programs/skills-lab",
  "/programs/private-training",
  "/coaches",
  "/faq",
  "/get-started",
  "/blog",
  "/events",
  "/youth-athletic-training-gallatin-tn",
  "/privacy",
  "/terms",
];

for (const path of PAGES) {
  test.describe(`SEO: ${path}`, () => {
    test("has unique title", async ({ page }) => {
      await page.goto(path);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(10);
    });

    test("has meta description ≤160 chars", async ({ page }) => {
      await page.goto(path);
      const desc = await page
        .locator('meta[name="description"]')
        .getAttribute("content");
      expect(desc).toBeTruthy();
      expect(desc!.length).toBeLessThanOrEqual(160);
    });

    test("has OG tags", async ({ page }) => {
      await page.goto(path);
      const ogTitle = await page
        .locator('meta[property="og:title"]')
        .getAttribute("content");
      const ogDesc = await page
        .locator('meta[property="og:description"]')
        .getAttribute("content");
      expect(ogTitle).toBeTruthy();
      expect(ogDesc).toBeTruthy();
    });

    test("has twitter:card", async ({ page }) => {
      await page.goto(path);
      const card = await page
        .locator('meta[name="twitter:card"]')
        .getAttribute("content");
      expect(card).toBe("summary_large_image");
    });

    test("has exactly 1 H1", async ({ page }) => {
      await page.goto(path);
      const h1s = await page.locator("h1").count();
      expect(h1s).toBe(1);
    });

    test("has JSON-LD script", async ({ page }) => {
      await page.goto(path);
      const jsonLd = await page.locator('script[type="application/ld+json"]').count();
      expect(jsonLd).toBeGreaterThanOrEqual(1);
    });
  });
}

test("program pages have Service JSON-LD", async ({ page }) => {
  for (const slug of ["performance-lab", "skills-lab", "private-training"]) {
    await page.goto(`/programs/${slug}`);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const hasService = scripts.some((s) => s.includes('"Service"'));
    expect(hasService).toBeTruthy();
  }
});

test("robots.txt is valid", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain("User-Agent");
  expect(text).toContain("Sitemap");
});

test("sitemap.xml contains all URLs", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain("<url>");
  expect(text).toContain("/programs");
  expect(text).toContain("/coaches");
  expect(text).toContain("/faq");
});

test("page titles are unique across site", async ({ page }) => {
  const titles: string[] = [];
  for (const path of PAGES) {
    await page.goto(path);
    titles.push(await page.title());
  }
  const uniqueTitles = new Set(titles);
  expect(uniqueTitles.size).toBe(titles.length);
});
