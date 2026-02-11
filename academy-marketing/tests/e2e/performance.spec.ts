import { test, expect } from "@playwright/test";

test.describe("Performance", () => {
  test("homepage loads in under 3 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(3000);
  });

  test("no blocking resources over 500KB", async ({ page }) => {
    const largeResources: string[] = [];

    page.on("response", (response) => {
      const headers = response.headers();
      const contentLength = parseInt(headers["content-length"] || "0");
      if (contentLength > 500000 && response.request().resourceType() === "script") {
        largeResources.push(
          `${response.url()} (${(contentLength / 1024).toFixed(0)}KB)`
        );
      }
    });

    await page.goto("/");
    expect(
      largeResources,
      `Large blocking resources found: ${largeResources.join(", ")}`
    ).toHaveLength(0);
  });

  test("total JS under 300KB", async ({ page }) => {
    let totalJS = 0;

    page.on("response", (response) => {
      if (response.request().resourceType() === "script") {
        const contentLength = parseInt(
          response.headers()["content-length"] || "0"
        );
        totalJS += contentLength;
      }
    });

    await page.goto("/");
    expect(totalJS).toBeLessThan(300 * 1024);
  });

  test("no duplicate script tags", async ({ page }) => {
    await page.goto("/");
    const scripts = await page.locator("script[src]").all();
    const srcs: string[] = [];
    for (const script of scripts) {
      const src = await script.getAttribute("src");
      if (src) srcs.push(src);
    }
    const uniqueSrcs = new Set(srcs);
    expect(srcs.length).toBe(uniqueSrcs.size);
  });

  test("security headers in response", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() || {};
    expect(headers["x-frame-options"]).toBeTruthy();
    expect(headers["x-content-type-options"]).toBeTruthy();
  });
});
