import { expect, test, type Page } from "@playwright/test";

const publicRoutes = [
  "/",
  "/programs",
  "/signup",
  "/about",
  "/gallery",
  "/videos",
  "/shop",
  "/blog",
  "/faqs",
  "/contact",
];

const assertMainContentVisible = async (pageUrl: string, page: Page) => {
  await page.goto(pageUrl);
  await expect(page.locator("main").first()).toBeVisible();
};

test.describe("gatekeeper smoke tests", () => {
  test("public routes render main content", async ({ page }) => {
    for (const route of publicRoutes) {
      await assertMainContentVisible(route, page);
    }
  });

  test("header and footer links resolve", async ({ page }) => {
    await page.goto("/");

    const internalLinks = await page.$$eval("nav a, footer a", (links) =>
      Array.from(links)
        .map((link) => link.getAttribute("href"))
        .filter((href): href is string => Boolean(href))
        .filter((href) => href.startsWith("/") && !href.startsWith("//"))
    );

    const uniqueLinks = Array.from(new Set(internalLinks));

    for (const link of uniqueLinks) {
      await assertMainContentVisible(link, page);
    }
  });

  test("signup remains public", async ({ page }) => {
    await page.goto("/signup");
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByRole("heading", { name: /registration/i })).toBeVisible();
  });

  test("member dashboard redirects or shows configured messaging", async ({ page }) => {
    await page.goto("/member");

    const bodyText = (await page.textContent("body")) ?? "";

    if (bodyText.includes("Authentication Not Configured")) {
      await expect(page.getByText("Authentication Not Configured")).toBeVisible();
      return;
    }

    if (bodyText.includes("Redirecting to sign in")) {
      await expect(page.getByText("Redirecting to sign in")).toBeVisible();
      return;
    }

    await expect(page).not.toHaveURL(/\/member/);
  });

  test("deep links land on matching anchors when data exists", async ({ page }) => {
    await page.goto("/programs");
    const programAnchor = page.locator('[id^="program-"]').first();
    if ((await programAnchor.count()) > 0) {
      const programId = await programAnchor.getAttribute("id");
      if (programId) {
        await page.goto(`/programs#${programId}`);
        await expect(page.locator(`#${programId}`)).toBeVisible();
      }
    } else {
      test.info().annotations.push({ type: "note", description: "No programs found for anchor validation." });
    }

    await page.goto("/shop");
    const productAnchor = page.locator('[id^="product-"]').first();
    if ((await productAnchor.count()) > 0) {
      const productId = await productAnchor.getAttribute("id");
      if (productId) {
        await page.goto(`/shop#${productId}`);
        await expect(page.locator(`#${productId}`)).toBeVisible();
      }
    } else {
      test.info().annotations.push({ type: "note", description: "No products found for anchor validation." });
    }

    await page.goto("/gallery");
    const photoAnchor = page.locator('[id^="photo-"]').first();
    if ((await photoAnchor.count()) > 0) {
      const photoId = await photoAnchor.getAttribute("id");
      if (photoId) {
        await page.goto(`/gallery#${photoId}`);
        await expect(page.locator(`#${photoId}`)).toBeVisible();
      }
    } else {
      test.info().annotations.push({ type: "note", description: "No photos found for anchor validation." });
    }

    await page.goto("/videos");
    const videoAnchor = page.locator('[id^="video-"]').first();
    if ((await videoAnchor.count()) > 0) {
      const videoId = await videoAnchor.getAttribute("id");
      if (videoId) {
        await page.goto(`/videos#${videoId}`);
        await expect(page.locator(`#${videoId}`)).toBeVisible();
      }
    } else {
      test.info().annotations.push({ type: "note", description: "No videos found for anchor validation." });
    }
  });

  test("404 route renders not found", async ({ page }) => {
    await page.goto("/not-a-real-route");
    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible();
  });
});
