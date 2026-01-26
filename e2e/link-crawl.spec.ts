import { expect, test } from "@playwright/test";
import fs from "fs";
import path from "path";

const outputDir = path.resolve(process.cwd(), "docs/SHIP_READINESS");
const outputJson = path.join(outputDir, "link-crawl.json");
const outputSummary = path.join(outputDir, "link-crawl-summary.md");

const seedRoutes = [
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
  "/member",
  "/chat",
];

test.describe("link crawl", () => {
  test("crawl internal links and capture errors", async ({ page, baseURL }) => {
    const queue: string[] = [...seedRoutes];
    const visited = new Set<string>();
    const pagesVisited: Array<{
      url: string;
      status?: number;
      title?: string;
    }> = [];
    const brokenLinks: Array<{ url: string; status?: number }> = [];
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    const ctaClicks: Array<{ label: string; url: string }> = [];

    page.on("console", msg => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("requestfailed", request => {
      failedRequests.push(
        `${request.url()} :: ${request.failure()?.errorText ?? "failed"}`
      );
    });

    while (queue.length > 0) {
      const route = queue.shift();
      if (!route || visited.has(route)) continue;
      visited.add(route);

      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });
      const status = response?.status();
      const title = await page.title();

      pagesVisited.push({ url: route, status, title });

      if (!response || (status && status >= 400)) {
        brokenLinks.push({ url: route, status });
        continue;
      }

      await expect(page.locator("main").first()).toBeVisible();

      const links = await page.$$eval("a[href]", anchors =>
        anchors
          .map(anchor => anchor.getAttribute("href"))
          .filter((href): href is string => Boolean(href))
          .filter(href => href.startsWith("/"))
          .filter(href => !href.startsWith("//"))
      );

      const ctas = await page.$$eval("main a[href]", anchors =>
        anchors
          .map(anchor => ({
            href: anchor.getAttribute("href"),
            label: anchor.textContent?.trim() ?? "",
          }))
          .filter(cta => Boolean(cta.href))
      );

      for (const cta of ctas) {
        if (!cta.href) continue;
        ctaClicks.push({ label: cta.label || "(no label)", url: cta.href });
      }

      for (const link of links) {
        if (!visited.has(link)) {
          queue.push(link);
        }
      }
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const payload = {
      status: brokenLinks.length === 0 ? "pass" : "fail",
      generatedAt: new Date().toISOString(),
      baseUrl: baseURL ?? null,
      pagesVisited,
      ctaClicks,
      brokenLinks,
      consoleErrors,
      failedRequests,
    };

    fs.writeFileSync(outputJson, JSON.stringify(payload, null, 2));

    const summary =
      `# Link Crawl Summary\n\n` +
      `## Summary\n` +
      `- Date: ${payload.generatedAt}\n` +
      `- Base URL: ${payload.baseUrl ?? "(not set)"}\n` +
      `- Total pages visited: ${pagesVisited.length}\n` +
      `- Total CTAs captured: ${ctaClicks.length}\n` +
      `- Broken links: ${brokenLinks.length}\n` +
      `- Console errors: ${consoleErrors.length}\n` +
      `- Failed network requests: ${failedRequests.length}\n\n` +
      `## Notes\n` +
      `${brokenLinks.length === 0 ? "- No broken links detected." : "- Broken links detected. See link-crawl.json for details."}\n`;

    fs.writeFileSync(outputSummary, summary);

    expect(brokenLinks, "No broken links should be present").toHaveLength(0);
    expect(consoleErrors, "No console errors should be present").toHaveLength(
      0
    );
    expect(
      failedRequests,
      "No failed network requests should be present"
    ).toHaveLength(0);
  });
});
