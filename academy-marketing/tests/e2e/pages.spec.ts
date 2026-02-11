import { test, expect } from "@playwright/test";

const PAGES = [
  { path: "/", name: "Homepage" },
  { path: "/programs", name: "Programs" },
  { path: "/programs/performance-lab", name: "Performance Lab" },
  { path: "/programs/skills-lab", name: "Skills Lab" },
  { path: "/programs/private-training", name: "Private Training" },
  { path: "/coaches", name: "Coaches" },
  { path: "/faq", name: "FAQ" },
  { path: "/get-started", name: "Get Started" },
  { path: "/blog", name: "Blog" },
  { path: "/events", name: "Events" },
  {
    path: "/youth-athletic-training-gallatin-tn",
    name: "Local Landing",
  },
  { path: "/privacy", name: "Privacy" },
  { path: "/terms", name: "Terms" },
];

for (const page of PAGES) {
  test(`${page.name} (${page.path}) returns 200`, async ({ page: p }) => {
    const response = await p.goto(page.path);
    expect(response?.status()).toBe(200);
  });

  test(`${page.name} has visible H1`, async ({ page: p }) => {
    await p.goto(page.path);
    const h1 = p.locator("h1").first();
    await expect(h1).toBeVisible();
  });

  test(`${page.name} renders substantial text`, async ({ page: p }) => {
    await p.goto(page.path);
    const text = await p.textContent("body");
    expect(text?.length).toBeGreaterThan(200);
  });

  test(`${page.name} has no console errors`, async ({ page: p }) => {
    const errors: string[] = [];
    p.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await p.goto(page.path);
    // Allow hydration warnings but no real errors
    const realErrors = errors.filter(
      (e) => !e.includes("hydrat") && !e.includes("Warning:")
    );
    expect(realErrors).toHaveLength(0);
  });
}

test("404 page handles unknown routes", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist-12345");
  expect(response?.status()).toBe(404);
});
