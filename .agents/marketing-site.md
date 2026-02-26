# Workstream: Marketing Site + SEO (academy-marketing/)

> Agent: Marketing/SEO Agent
> Scope: `academy-marketing/` directory ONLY
> Package Manager: npm (NOT pnpm)
> Domain: academytn.com

---

## Current State

### Architecture
- Framework: Next.js 15 (App Router)
- Styling: Tailwind v4 (PostCSS), Oswald + Source Sans 3
- Domain: academytn.com
- Deploy: Vercel (auto on push)

### Critical Rule
**ALL business data lives in `academy-marketing/lib/config.ts`.**
Programs, pricing, schedule, FAQs, coaches, testimonials, trust stats, service areas, contact info, hours — all in config.ts. Pages are pure renderers.

### Key Files
| File | Purpose |
|------|---------|
| `lib/config.ts` | SINGLE SOURCE OF TRUTH for all business data |
| `lib/metadata.ts` | SEO metadata generation |
| `lib/structured-data.tsx` | Auto-generated Schema.org from config |
| `scripts/validate-build.mjs` | Post-build validation (45+ checks) |
| `scripts/test-all.sh` | Full pre-deploy gate |

### Current Pages (App Router)
*(To be inventoried during audit)*

---

## Task Breakdown

### Phase 1: SEO Audit
- [ ] Inventory all pages and their current meta tags
- [ ] Check structured data completeness (JSON-LD)
- [ ] Validate sitemap.xml existence and accuracy
- [ ] Check robots.txt configuration
- [ ] Analyze Open Graph and Twitter Card tags
- [ ] Review canonical URLs
- [ ] Check for broken internal/external links
- [ ] Assess heading hierarchy (H1-H6) per page
- [ ] Review image alt text coverage
- [ ] Check mobile-friendliness

### Phase 2: SEO Improvements
- [ ] Optimize meta titles and descriptions per page
- [ ] Expand structured data (LocalBusiness, SportsActivityLocation, FAQPage, etc.)
- [ ] Add/improve sitemap.xml with proper priority and changefreq
- [ ] Implement breadcrumb structured data
- [ ] Add FAQ structured data for program pages
- [ ] Optimize image loading (next/image, WebP, lazy loading)
- [ ] Review and optimize internal linking strategy

### Phase 3: Performance (Core Web Vitals)
- [ ] Audit Largest Contentful Paint (LCP)
- [ ] Audit Cumulative Layout Shift (CLS)
- [ ] Audit Interaction to Next Paint (INP)
- [ ] Optimize font loading (Oswald + Source Sans 3)
- [ ] Review and optimize image sizes
- [ ] Check for render-blocking resources
- [ ] Implement proper preloading/prefetching

### Phase 4: Content & Conversion
- [ ] Review CTA placement and copy across all pages
- [ ] Optimize social proof (testimonials, trust stats)
- [ ] Review quiz/assessment flow for conversion
- [ ] Check contact form functionality
- [ ] Review programs pages for conversion optimization
- [ ] Add/improve blog content strategy elements
- [ ] Review mobile UX for all pages

### Phase 5: New Opportunities
- [ ] Research and recommend new landing pages
- [ ] Location-specific pages for local SEO (Gallatin, TN area)
- [ ] Sport-specific landing pages
- [ ] Age-group-specific content
- [ ] Seasonal/promotional page templates

---

## SEO Checklist per Page

Use this template when auditing each page:

```
Page: [URL path]
- [ ] Title tag (50-60 chars, keyword-rich)
- [ ] Meta description (150-160 chars, with CTA)
- [ ] H1 (single, keyword-rich)
- [ ] H2-H6 hierarchy (logical, no skips)
- [ ] Open Graph tags (og:title, og:description, og:image)
- [ ] Twitter Card tags
- [ ] Canonical URL
- [ ] Structured data (relevant type)
- [ ] Image alt text
- [ ] Internal links (to/from other pages)
- [ ] Mobile rendering
- [ ] Page speed
```

---

## Config.ts Change Protocol

When updating `config.ts`:
1. Make the change in config.ts
2. Run `npm run build` to verify
3. Run `npm run validate` (45+ checks)
4. Check if testimonial changes also need updating in portal's `StructuredData.tsx` — log in review-log.md if so

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| — | — | — |

## Files Modified

| Date | File | Change |
|------|------|--------|
| — | — | — |
