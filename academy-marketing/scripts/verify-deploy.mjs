#!/usr/bin/env node
/**
 * Post-Deploy Verification
 * Run: node scripts/verify-deploy.mjs https://academytn.com
 */

const BASE_URL = process.argv[2];

if (!BASE_URL) {
  console.error("Usage: node scripts/verify-deploy.mjs <url>");
  console.error("Example: node scripts/verify-deploy.mjs https://academytn.com");
  process.exit(1);
}

let passed = 0;
let failed = 0;

function check(desc, ok) {
  if (ok) {
    passed++;
    console.log(`  ✅ ${desc}`);
  } else {
    failed++;
    console.error(`  ❌ ${desc}`);
  }
}

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

const REDIRECTS = [
  { from: "/signup", to: "/programs" },
  { from: "/adm", to: "/programs/performance-lab" },
  { from: "/register", to: "/get-started" },
  { from: "/group-training", to: "/programs/skills-lab" },
  { from: "/shooting-lab", to: "/programs" },
];

async function run() {
  console.log(`\nVerifying deployment: ${BASE_URL}\n`);

  // 1. Page accessibility
  console.log("📄 Page accessibility:");
  for (const page of PAGES) {
    try {
      const res = await fetch(`${BASE_URL}${page}`);
      check(`${page} returns ${res.status}`, res.status === 200);
    } catch (e) {
      check(`${page} reachable`, false);
    }
  }

  // 2. SSR check — real content in HTML
  console.log("\n🖥️  Server-side rendering:");
  try {
    const res = await fetch(BASE_URL);
    const html = await res.text();
    check("Homepage has <title>", html.includes("<title>"));
    check("Homepage has content (not empty shell)", html.length > 5000);
    check("Homepage has meta description", html.includes('name="description"'));
    check("Homepage has og:title", html.includes('og:title'));
    check("Homepage has JSON-LD", html.includes("application/ld+json"));
  } catch (e) {
    check("Homepage fetchable", false);
  }

  // 3. Redirects
  console.log("\n🔀 Redirects:");
  for (const r of REDIRECTS) {
    try {
      const res = await fetch(`${BASE_URL}${r.from}`, { redirect: "manual" });
      const location = res.headers.get("location") || "";
      check(
        `${r.from} → ${r.to} (${res.status})`,
        res.status === 301 || res.status === 308
      );
    } catch (e) {
      check(`${r.from} redirect`, false);
    }
  }

  // 4. Sitemap & robots
  console.log("\n🗺️  Sitemap & robots:");
  try {
    const sitemap = await fetch(`${BASE_URL}/sitemap.xml`);
    check("sitemap.xml returns 200", sitemap.status === 200);
    const sitemapText = await sitemap.text();
    check("sitemap.xml contains URLs", sitemapText.includes("<url>"));
  } catch {
    check("sitemap.xml reachable", false);
  }
  try {
    const robots = await fetch(`${BASE_URL}/robots.txt`);
    check("robots.txt returns 200", robots.status === 200);
  } catch {
    check("robots.txt reachable", false);
  }

  // 5. Security headers
  console.log("\n🔒 Security headers:");
  try {
    const res = await fetch(BASE_URL);
    const headers = res.headers;
    check("X-Frame-Options present", !!headers.get("x-frame-options"));
    check("X-Content-Type-Options present", !!headers.get("x-content-type-options"));
  } catch {
    check("Headers check", false);
  }

  // 6. 404 handling
  console.log("\n🚫 404 handling:");
  try {
    const res = await fetch(`${BASE_URL}/this-page-does-not-exist-12345`);
    check("Unknown page returns 404", res.status === 404);
  } catch {
    check("404 reachable", false);
  }

  // Summary
  console.log("\n=======================");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error("\n❌ Deploy verification FAILED.");
    process.exit(1);
  } else {
    console.log("\n✅ Deploy verification passed!");
  }
}

run();
