import { test, expect } from "@playwright/test";

const REDIRECTS = [
  { from: "/signup", to: "/programs" },
  { from: "/group-training", to: "/programs/skills-lab" },
  { from: "/shooting-lab", to: "/programs" },
  { from: "/adm", to: "/programs/performance-lab" },
  { from: "/register", to: "/get-started" },
];

for (const redirect of REDIRECTS) {
  test(`${redirect.from} redirects to ${redirect.to}`, async ({ request }) => {
    const response = await request.get(redirect.from, {
      maxRedirects: 0,
    });
    // Next.js uses 307/308 for permanent redirects in some cases
    expect([301, 307, 308]).toContain(response.status());
    const location = response.headers()["location"];
    expect(location).toContain(redirect.to);
  });

  test(`${redirect.from} chain resolves to 200`, async ({ page }) => {
    const response = await page.goto(redirect.from);
    expect(response?.status()).toBe(200);
    expect(page.url()).toContain(redirect.to);
  });
}
