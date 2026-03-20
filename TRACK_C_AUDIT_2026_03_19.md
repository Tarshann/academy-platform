# Track C (Marketing/SEO) Audit Report — academy-marketing/
**Date**: 2026-03-19
**Branch**: main

---

## 1. SEO Meta Tags
**Status**: EXISTS (✅ Complete)

All pages under `academy-marketing/app/` export proper metadata:

| Page | File | Metadata Status | Notes |
|------|------|-----------------|-------|
| Home | `page.tsx` | ✅ EXISTS | Uses `generatePageMetadata()` with title, description, path |
| Programs (Index) | `programs/page.tsx` | ✅ EXISTS | Title, description, breadcrumb schema |
| Program Details | `programs/[slug]/page.tsx` | ✅ EXISTS | Dynamic metadata from `generateMetadata()`, includes ServiceJsonLd |
| Coaches | `coaches/page.tsx` | ✅ EXISTS | Title, description, breadcrumb schema |
| FAQ | `faq/page.tsx` | ✅ EXISTS | Title, description, FAQPageJsonLd schema |
| Blog (Index) | `blog/page.tsx` | ✅ EXISTS | Title, description, breadcrumb schema |
| Get Started | `get-started/page.tsx` | ✅ EXISTS | Title, description, breadcrumb schema |
| Events | `events/page.tsx` | ✅ EXISTS | Custom metadata with OG images, keywords, twitter card |
| Privacy | `privacy/page.tsx` | ✅ EXISTS | Title, description via `generatePageMetadata()` |
| Terms | `terms/page.tsx` | ✅ EXISTS | Title, description via `generatePageMetadata()` |
| Payment Success | `payment/success/page.tsx` | ✅ EXISTS | Custom Metadata with noindex robots |
| Local SEO | `youth-athletic-training-gallatin-tn/page.tsx` | ✅ EXISTS | Title, description, breadcrumb schema |

**Metadata Generation Helper**:
- `academy-marketing/lib/metadata.ts` — `generatePageMetadata()` function generates title, description, canonical URL, OG tags (title, description, URL, site name, image 1200x630, locale, type), and Twitter card (summary_large_image).
- `academy-marketing/app/layout.tsx` has metadataBase, default title template, keywords, OG defaults, Twitter defaults, robots, and verification hooks.

---

## 2. Structured Data
**Status**: EXISTS (✅ Complete)

`academy-marketing/lib/structured-data.tsx` includes all required schemas and reads from `config.ts`:

| Schema | Function | Reads from Config | Status |
|--------|----------|-------------------|--------|
| LocalBusiness | `LocalBusinessJsonLd()` | ✅ Yes (SITE, CONTACT, ADDRESS, OPENING_HOURS, PROGRAMS, TESTIMONIALS, SOCIAL_URLS) | ✅ EXISTS |
| Organization | `OrganizationJsonLd()` | ✅ Yes (SITE, CONTACT, ADDRESS, SOCIAL_URLS) | ✅ EXISTS |
| Service | `ServiceJsonLd()` | ✅ Parameterized (name, description, price, unit) | ✅ EXISTS |
| FAQPage | `FAQPageJsonLd()` | ✅ Parameterized (items array) | ✅ EXISTS |
| BreadcrumbList | `BreadcrumbJsonLd()` | ✅ Parameterized (items array with SITE.url) | ✅ EXISTS |

**Review/AggregateRating**: ✅ Embedded in LocalBusinessJsonLd (lines 47-62):
- Review schema for each testimonial (from TESTIMONIALS config)
- AggregateRating schema (ratingValue: 5, reviewCount: dynamic from TESTIMONIALS.length)

**Config-Driven**: All schemas pull business data from `academy-marketing/lib/config.ts`:
- SITE (name, description, URL, logo, foundingYear)
- CONTACT (phone, email)
- ADDRESS (locality, region, country, geo coordinates)
- OPENING_HOURS (mapped to OpeningHoursSpecification)
- PROGRAMS (mapped to OfferCatalog with Services)
- TESTIMONIALS (mapped to Review + AggregateRating)
- SOCIAL_URLS (sameAs)

---

## 3. Image Optimization
**Status**: INCOMPLETE (⚠️ Issues Found)

### Raw `<img>` Tags Found
All images use raw HTML `<img>` tags instead of Next.js `Image` component:

**Homepage (`academy-marketing/app/page.tsx`)**:
- Line ~117: Hero background `<img>` (training-photo-1.jpeg) — **Missing `fetchPriority="high"`** (above-fold, hero image)
- Line ~238: Differentiator section `<img>` (training-photo-2.jpeg) — Has `loading="lazy"` ✅
- Line ~356+: Coach photos — Have `loading="lazy"` ✅
- Line ~600+: App store badges (SVG) — No lazy attribute (footer, below-fold)

**Coaches page (`academy-marketing/app/coaches/page.tsx`)**:
- Coach photos `<img>` — Have `loading="lazy"` ✅

**Blog page (`academy-marketing/app/blog/page.tsx`)**:
- Article placeholder images — No `loading="lazy"` ⚠️

### Missing `fetchPriority`
Hero image (training-photo-1.jpeg) lacks `fetchPriority="high"`. This should be the highest priority as it's above-fold in a banner section.

### Next.js Image Component
**Not used anywhere** in the codebase. All images are raw HTML.

### Font Optimization
`academy-marketing/app/layout.tsx` fonts (lines 69-71):
```html
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
```
✅ **Font-display=swap** is present in Google Fonts URL (preserves text visibility during font load).

---

## 4. Blog Section
**Status**: INCOMPLETE (⚠️ Issues Found)

### Blog Index Page
✅ **Exists**: `academy-marketing/app/blog/page.tsx`
- Has metadata export (lines 6-11)
- Lists 3 blog article cards with:
  - Title, excerpt, category, read time, date
  - "Coming Soon" status for all articles (line 21: `date: "Coming Soon"`)
  - Placeholder image (gray background)

### Individual Post Pages
❌ **Missing**: No `academy-marketing/app/blog/[slug]/` directory or post detail pages
- Blog articles are hardcoded in the index page (lines 13-41: `ARTICLES` array)
- All show "Coming Soon"
- No individual post routes — clicking article cards goes nowhere (cards don't have href attributes)
- No dynamic route handler for blog posts

### Issue
Blog section is a UI shell with no actual blog post content. Article links are not wired up.

---

## 5. Core Web Vitals Optimization
**Status**: PARTIAL (⚠️ Issues Found)

| Optimization | Status | Details |
|--------------|--------|---------|
| `loading="lazy"` on below-fold images | ✅ Partial | Applied to training photos (line 241) and coach photos; missing on blog article placeholders |
| `fetchPriority="high"` on hero images | ❌ Missing | Hero image (training-photo-1.jpeg, line ~117) lacks this critical attribute |
| Font-display swap | ✅ Yes | Google Fonts URL includes `display=swap` |
| Next.js Image optimization | ❌ No | No Next.js Image component used; all raw HTML `<img>` tags |

---

## 6. Navigation
**Status**: EXISTS (✅ Complete)

`academy-marketing/components/layout/Navigation.tsx` includes blog link:

```typescript
const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Programs", href: "/programs", children: [...] },
  { label: "Coaches", href: "/coaches" },
  { label: "FAQ", href: "/faq" },
  { label: "Blog", href: "/blog" },  // ✅ Line 21
  { label: "Events", href: "/events" },
];
```

✅ **Desktop nav** (lines 56-108): Blog link included
✅ **Mobile nav drawer** (lines 120-168): Blog link included

---

## Summary Table

| Feature | Status | Notes |
|---------|--------|-------|
| **SEO Meta Tags** | ✅ EXISTS | All pages properly configured |
| **Structured Data** | ✅ EXISTS | LocalBusiness, Service, FAQPage, BreadcrumbList, Review/AggregateRating all present and config-driven |
| **Image Optimization** | ⚠️ INCOMPLETE | Raw img tags only; hero lacks `fetchPriority="high"`; blog images lack `loading="lazy"` |
| **Blog Section** | ⚠️ INCOMPLETE | Index page exists but articles are "Coming Soon" with no individual post routes |
| **Core Web Vitals** | ⚠️ PARTIAL | Font-display swap present; lazy loading partial; no Next.js Image; missing fetchPriority |
| **Navigation Blog Link** | ✅ EXISTS | Linked in desktop and mobile nav |

---

## Recommendations (Priority Order)

1. **Create blog post detail routes** (`academy-marketing/app/blog/[slug]/page.tsx`) with actual content and metadata
2. **Add `fetchPriority="high"`** to hero images (homepage `app/page.tsx` line ~117)
3. **Add `loading="lazy"`** to blog article placeholder images (`academy-marketing/app/blog/page.tsx` line ~83)
4. **Consider Next.js Image component** for better optimization (responsive srcset, modern formats, automatic sizing)
5. Update blog article cards to link to actual post routes instead of remaining "Coming Soon"
