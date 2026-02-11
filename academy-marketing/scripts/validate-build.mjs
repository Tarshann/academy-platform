#!/usr/bin/env node
/**
 * Build Output Validator
 * Checks the Next.js build output (.next) for required pages,
 * meta tags, structured data, and configuration.
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const BUILD_DIR = join(process.cwd(), ".next");
const SERVER_DIR = join(BUILD_DIR, "server", "app");

let passed = 0;
let failed = 0;
const errors = [];

function check(description, condition) {
  if (condition) {
    passed++;
  } else {
    failed++;
    errors.push(description);
    console.error(`  ❌ ${description}`);
  }
}

function readHtml(pagePath) {
  const htmlPath = join(SERVER_DIR, pagePath, "page.html");
  const rscPath = join(SERVER_DIR, pagePath, "page_client-reference-manifest.js");

  // Try .html first, then check for RSC files
  if (existsSync(htmlPath)) {
    return readFileSync(htmlPath, "utf-8");
  }

  // For app router, check if the route exists at all
  const routePath = join(SERVER_DIR, pagePath);
  if (existsSync(routePath)) {
    // Route exists, check for any output files
    const files = readdirSync(routePath);
    for (const file of files) {
      if (file.endsWith(".html") || file.endsWith(".rsc")) {
        return readFileSync(join(routePath, file), "utf-8");
      }
    }
    return ""; // Route exists but no HTML yet (will be rendered at runtime)
  }
  return null;
}

console.log("Build Output Validation");
console.log("=======================\n");

// 1. Build directory exists
console.log("📁 Build directory:");
check("Build directory (.next) exists", existsSync(BUILD_DIR));
check("Server app directory exists", existsSync(SERVER_DIR));

// 2. Required pages exist
console.log("\n📄 Required pages:");
const requiredPages = [
  "",                    // homepage
  "programs",
  "coaches",
  "faq",
  "get-started",
  "blog",
  "events",
  "youth-athletic-training-gallatin-tn",
  "privacy",
  "terms",
];

const programSlugs = ["performance-lab", "skills-lab", "private-training"];

for (const page of requiredPages) {
  const pageName = page || "(homepage)";
  const routeDir = join(SERVER_DIR, page);
  check(`Page /${pageName} route exists`, existsSync(routeDir));
}

for (const slug of programSlugs) {
  // Dynamic routes generate HTML files at the parent level, not subdirectories
  const htmlFile = join(SERVER_DIR, "programs", `${slug}.html`);
  const routeDir = join(SERVER_DIR, "programs", slug);
  check(
    `Page /programs/${slug} route exists`,
    existsSync(htmlFile) || existsSync(routeDir)
  );
}

// 3. Source files exist
console.log("\n📦 Source files:");
const requiredFiles = [
  "lib/config.ts",
  "lib/metadata.ts",
  "lib/structured-data.tsx",
  "components/layout/Navigation.tsx",
  "components/layout/Footer.tsx",
  "components/seo/Analytics.tsx",
  "app/layout.tsx",
  "app/page.tsx",
  "app/globals.css",
  "app/robots.ts",
  "app/sitemap.ts",
  "next.config.ts",
];

for (const file of requiredFiles) {
  check(`${file} exists`, existsSync(join(process.cwd(), file)));
}

// 4. Config completeness
console.log("\n⚙️  Config validation:");
try {
  const configContent = readFileSync(
    join(process.cwd(), "lib/config.ts"),
    "utf-8"
  );
  check("SITE config exported", configContent.includes("export const SITE"));
  check("CONTACT config exported", configContent.includes("export const CONTACT"));
  check("ADDRESS config exported", configContent.includes("export const ADDRESS"));
  check("SOCIAL config exported", configContent.includes("export const SOCIAL"));
  check("PROGRAMS config exported", configContent.includes("export const PROGRAMS"));
  check("COACHES config exported", configContent.includes("export const COACHES"));
  check("TESTIMONIALS config exported", configContent.includes("export const TESTIMONIALS"));
  check("FAQ config exported", configContent.includes("export const FAQ"));
  check("Phone number present", configContent.includes("(571) 292-0633"));
  check("Email present", configContent.includes("omarphilmore@yahoo.com"));
  check("Founded year present", configContent.includes("2021"));
  check("Performance Lab price is $245", configContent.includes('"$245"'));
  check("No $280 pricing", !configContent.includes("280"));
  check('No "ADM" in config', !configContent.includes('"ADM"'));
} catch {
  check("Config file readable", false);
}

// 5. Next.js config validation
console.log("\n🔧 Next.js config:");
try {
  const nextConfig = readFileSync(
    join(process.cwd(), "next.config.ts"),
    "utf-8"
  );
  check("Redirect: /signup → /programs", nextConfig.includes("/signup"));
  check("Redirect: /adm → /programs/performance-lab", nextConfig.includes("/adm"));
  check("Redirect: /register → /get-started", nextConfig.includes("/register"));
  check("Security header: X-Frame-Options", nextConfig.includes("X-Frame-Options"));
  check("Security header: X-Content-Type-Options", nextConfig.includes("X-Content-Type-Options"));
  check("Security header: HSTS", nextConfig.includes("Strict-Transport-Security"));
  check("Image optimization configured", nextConfig.includes("formats"));
} catch {
  check("Next.js config readable", false);
}

// 6. Structured data check
console.log("\n🏷️  Structured data:");
try {
  const sdContent = readFileSync(
    join(process.cwd(), "lib/structured-data.tsx"),
    "utf-8"
  );
  check("LocalBusiness schema", sdContent.includes("LocalBusiness"));
  check("Service schema", sdContent.includes("Service"));
  check("Breadcrumb schema", sdContent.includes("BreadcrumbList"));
  check("Rating/Review schema", sdContent.includes("Review"));
  check("AggregateRating schema", sdContent.includes("AggregateRating"));
  check("GeoCoordinates schema", sdContent.includes("GeoCoordinates"));
  check("OpeningHours schema", sdContent.includes("OpeningHoursSpecification"));
  check("foundingDate present", sdContent.includes("foundingDate"));
} catch {
  check("Structured data file readable", false);
}

// Summary
console.log("\n=======================");
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.error("\n❌ Build validation FAILED. Fix the issues above before deploying.");
  console.error("\nFailed checks:");
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
} else {
  console.log("\n✅ All build validation checks passed!");
  process.exit(0);
}
