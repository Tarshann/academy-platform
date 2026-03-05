# Audit Findings

> Portal UX audit (WEB-001), API impact assessment (WEB-002), SEO audit (MKT-001), and CWV baseline (SEO-001) results.

---

## Web Portal UX Audit (WEB-001) — 2026-02-26

**Auditor**: Portal Agent
**Pages Reviewed**: 30+ pages across member, admin, coach, and public routes
**App Router**: `client/src/App.tsx` — wouter Switch with 20 routes

---

### Critical Issues
*Issues that break core functionality or prevent users from completing key flows*

| # | Page / Area | Issue | Impact | Fix Ticket |
|---|-------------|-------|--------|------------|
| C1 | **Orders** (`Orders.tsx`) | Page exists but **not routed** in App.tsx — users cannot access order history | Members who purchase from Shop have no way to view orders | WEB-003-FIX |
| C2 | **CoachDashboard** | No auth role check — any authenticated user can access `/coach-dashboard` | Security: members could view/manage booking requests meant only for coaches | WEB-004-FIX |
| C3 | **SkillsLabRegisterPage** | Registration form has UI but **no submission handler** — form submit does nothing | Users fill out form and get no response | WEB-005-FIX |
| C4 | **PerformanceLabApplyPage** | Application form has UI but **no submission handler** — form submit does nothing | Users fill out form and get no response | WEB-006-FIX |

---

### High Priority
*Issues that significantly impact UX or block important workflows*

| # | Page / Area | Issue | Impact | Fix Ticket |
|---|-------------|-------|--------|------------|
| H1 | **Shop** (`Shop.tsx`) | Products are **hardcoded** in the component, not fetched from `shop.products` API | Admin product changes in dashboard don't appear on Shop page | WEB-007-FIX |
| H2 | **Schedule** (`Schedule.tsx`) | Schedule data is **hardcoded** (`SCHEDULE_DATA` constant), not fetched from API | Admin schedule changes don't appear; schedule is always stale | WEB-008-FIX |
| H3 | **Gallery** (`Gallery.tsx`) | Photos are **hardcoded**, not fetched from `gallery.list` | Admin gallery uploads don't appear on gallery page | WEB-009-FIX |
| H4 | **Blog, BlogPost, Videos, Gallery, About, Contact, FAQs, Home** | All these page components exist but are **not routed** in App.tsx | Content pages built but unreachable — wasted work | WEB-010-FIX |
| H5 | **SignUp** (`SignUp.tsx`) | Product catalog for membership selection is **hardcoded** in the component | Pricing/membership changes require code changes, not admin updates | WEB-011-FIX |
| H6 | **PrivateSessionBooking** | Coach names/details are **hardcoded** instead of fetched from `coaches.list` | Adding/removing coaches requires code changes | WEB-012-FIX |

---

### Medium Priority
*Issues that degrade experience but have workarounds*

| # | Page / Area | Issue | Impact | Fix Ticket |
|---|-------------|-------|--------|------------|
| M1 | **StructuredData** (`StructuredData.tsx`) | Testimonials **hardcoded** — drifts from marketing site `config.ts` | SEO data inconsistency between sites | WEB-003 (NEXT.md) |
| M2 | **Settings** (`Settings.tsx`) | Uses custom Switch component instead of shadcn/ui — inconsistent styling | Minor visual inconsistency | — |
| M3 | **MemberDashboard** | Dismissed announcements stored in **localStorage**, not server-side | Clearing browser data shows old announcements again; doesn't sync across devices | — |
| M4 | **MemberDashboard** | 5 tRPC queries fired simultaneously on mount | Potential performance issue on slow connections | — |
| M5 | **SkillsLabPage, PerformanceLabPage** | Use inline styles instead of Tailwind classes | Inconsistent with portal styling system | — |
| M6 | **SignUp** has two versions | `SignUpPage.tsx` (Clerk native) and `SignUp.tsx` (membership flow) both map to `/sign-up` | Confusing: `/sign-up` renders `SignUp.tsx` while `/sign-up/*` renders `SignUpPage.tsx` | — |

---

### Low Priority
*Polish items, minor improvements*

| # | Page / Area | Issue | Impact |
|---|-------------|-------|--------|
| L1 | **PageLoader** (App.tsx) | Uses spinner instead of skeleton — doesn't match quality bar | Minor visual inconsistency |
| L2 | **RegisterRedirect** | Redirects to `academytn.com/programs` — appears to be deprecated/unused | Dead code |
| L3 | **ComponentShowcase** | Dev-only page, still routable in production | No real impact, but unnecessary in prod |
| L4 | **Font inconsistency** | Some pages use DM Sans / Bebas Neue while the system font is Inter | Minor visual inconsistency |

---

### Page-by-Page State Coverage

| Page | Loading | Error | Empty | Pull-to-Refresh | Notes |
|------|---------|-------|-------|-----------------|-------|
| MemberDashboard | ✓ Skeleton | ✓ | ✓ | N/A (web) | Good coverage |
| AdminDashboard | ✓ | ✓ | ✓ | N/A | Tab-based, 11 managers |
| CoachDashboard | ✓ | ✓ | Partial | N/A | No auth role guard |
| Chat | ✓ | ✓ | ✓ | N/A | Real-time via Ably |
| Shop | — | — | — | N/A | Hardcoded, no states needed |
| Orders | ✓ | ✓ | ✓ | N/A | Good but unreachable |
| Schedule | — | — | — | N/A | Hardcoded |
| PrivateSessionBooking | ✓ | ✓ | N/A | N/A | Coaches hardcoded |
| Programs | — | — | — | N/A | Static informational |
| Settings | ✓ | ✓ | N/A | N/A | Custom switch component |
| PaymentSuccess | ✓ | ✓ | N/A | N/A | PDF receipt generation |
| Blog | ✓ | ✓ | ✓ | N/A | Good but unrouted |
| BlogPost | ✓ | ✓ | N/A | N/A | Good but unrouted |
| Videos | ✓ | N/A | N/A | N/A | Unrouted |
| Gallery | — | — | — | N/A | Hardcoded, unrouted |
| About | ✓ | N/A | N/A | N/A | Unrouted |
| Contact | ✓ | ✓ | N/A | N/A | Good validation, unrouted |
| FAQs | N/A | N/A | N/A | N/A | Static accordion, unrouted |
| SignIn | ✓ | N/A | N/A | N/A | Clerk handles states |
| SignUp (both) | ✓ | ✓ | N/A | N/A | Two competing versions |
| SkillsLabPage | N/A | N/A | N/A | N/A | Static, inline styles |
| SkillsLabRegisterPage | ✓ | ✓ | N/A | N/A | No submit handler |
| PerformanceLabPage | N/A | N/A | N/A | N/A | Static, inline styles |
| PerformanceLabApplyPage | ✓ | ✓ | N/A | N/A | No submit handler |

---

## API Route Impact Assessment (WEB-002) — 2026-02-26

**Auditor**: Portal Agent
**Routes Tested**: All 22 routes mobile v1.3 will consume
**Result**: All routes exist. 10 need pagination added before mobile release.

### Route Audit Table

| Route | Exists | Mobile-Ready | Issues |
|-------|--------|--------------|--------|
| `coaches.list` | ✓ | Needs Work | No pagination — returns all coaches |
| `payment.createCheckout` | ✓ | **Yes** | Clean input/output |
| `payment.mySubscriptions` | ✓ | Needs Work | No pagination |
| `payment.myPayments` | ✓ | Needs Work | No pagination — could return years of data |
| `shop.products` | ✓ | Needs Work | No pagination |
| `shop.createCheckout` | ✓ | **Yes** | Well-structured |
| `attendance.getMyAttendance` | ✓ | Needs Work | No pagination, no date range filter |
| `attendance.getMyStats` | ✓ | **Yes** | Good design with optional date filters |
| `pushNotifications.getSettings` | ✓ | **Yes** | Returns single settings object |
| `pushNotifications.updateSettings` | ✓ | **Yes** | All fields optional, clean mutation |
| `dm.muteConversation` | ✓ | **Yes** | Supports optional "mute until" date |
| `dm.unmuteConversation` | ✓ | **Yes** | Simple inverse of mute |
| `dm.searchMessages` | ✓ | Needs Work | No pagination, no limit, no conversation filter |
| `dm.blockUser` | ✓ | **Yes** | Supports optional reason |
| `dm.unblockUser` | ✓ | **Yes** | Clean inverse |
| `dm.archiveConversation` | ✓ | **Yes** | Standard mutation |
| `gallery.list` | ✓ | Needs Work | No pagination |
| `gallery.byCategory` | ✓ | Needs Work | No pagination, no limit |
| `videos.list` | ✓ | Needs Work | No pagination |
| `videos.byCategory` | ✓ | Needs Work | No pagination |
| `blog.list` | ✓ | Needs Work | Accepts limit/offset params but **ignores them** in query |
| `blog.getBySlug` | ✓ | **Yes** | Single post by slug |
| `locations.list` | ✓ | Needs Work | No pagination |
| `payment.submitPrivateSessionBooking` | ✓ | **Yes** | Complete validation, returns bookingId |

### Summary

- **Mobile-Ready (12/24)**: `payment.createCheckout`, `shop.createCheckout`, `attendance.getMyStats`, `pushNotifications.getSettings`, `pushNotifications.updateSettings`, `dm.muteConversation`, `dm.unmuteConversation`, `dm.blockUser`, `dm.unblockUser`, `dm.archiveConversation`, `blog.getBySlug`, `payment.submitPrivateSessionBooking`
- **Needs Pagination (12/24)**: All list routes lack proper pagination for mobile consumption
- **Critical Bug**: `blog.list` accepts pagination params in schema but ignores them in the actual DB query

### Recommended Priority

1. **P1**: Fix `blog.list` pagination (broken contract — params accepted but ignored)
2. **P2**: Add pagination to `payment.myPayments`, `attendance.getMyAttendance` (can grow unbounded per user)
3. **P3**: Add pagination to media routes (`gallery.list`, `gallery.byCategory`, `videos.list`, `videos.byCategory`) — heavy payloads
4. **P4**: Add limits to `dm.searchMessages` (unbounded search results)
5. **P5**: Add pagination to remaining routes (`coaches.list`, `locations.list`, `shop.products`) — these are likely small datasets

---

## SEO Audit (MKT-001) — 2026-03-04

**Auditor**: Marketing/SEO Agent
**Pages Reviewed**: 12 public pages + robots.ts + sitemap.ts
**Site**: `academy-marketing/` (Next.js 15 App Router)

---

### Page-by-Page Results

#### 1. Homepage (`/`)
| Check | Status | Notes |
|-------|--------|-------|
| Title tag | PASS | "Build Complete Athletes — Multi-Sport Training in Gallatin, TN \| The Academy" |
| Meta description | PASS | Via `generatePageMetadata()` — descriptive, includes location |
| H1 | PASS | "Build Complete Athletes. Not Just Better Players." |
| Canonical URL | PASS | Auto-generated by metadata helper |
| OG / Twitter cards | PASS | Full OG + Twitter card via metadata helper |
| Structured data | PASS | `OrganizationJsonLd` + `LocalBusinessJsonLd` (SportsActivityLocation, geo, AggregateRating, reviews, offers) |
| Image alt text | FAIL | Hero `<img>` uses `alt="Academy athletes training"` — acceptable but uses native `<img>` not `next/image` |
| Internal linking | PASS | Links to /programs, /get-started, /coaches, /events, /blog, /faq |
| Breadcrumbs | N/A | Homepage is root — no breadcrumb needed |

#### 2. Programs Index (`/programs`)
| Check | Status | Notes |
|-------|--------|-------|
| Title tag | PASS | Via `generatePageMetadata()` |
| Meta description | PASS | Descriptive with location keywords |
| H1 | PASS | "Training Programs" |
| Canonical URL | PASS | Auto-generated |
| OG / Twitter cards | PASS | Via metadata helper |
| Structured data | PASS | `BreadcrumbJsonLd` (added this session) |
| Image alt text | N/A | No images on this page |
| Internal linking | PASS | Links to each program detail page + /get-started |

#### 3. Program Detail (`/programs/[slug]`) — 3 pages
| Check | Status | Notes |
|-------|--------|-------|
| Title tag | PASS | Dynamic per program via `generateMetadata()` |
| Meta description | PASS | Program-specific description |
| H1 | PASS | Program name |
| Canonical URL | PASS | Auto-generated |
| OG / Twitter cards | PASS | Via metadata helper |
| Structured data | PASS | `BreadcrumbJsonLd` (pre-existing) + `FAQPageJsonLd` (added this session) |
| Image alt text | N/A | No images |
| Internal linking | PASS | Links to /get-started, back to /programs |
| FAQs | PASS | Program-specific FAQ section with structured data |

#### 4. Coaches (`/coaches`)
| Check | Status | Notes |
|-------|--------|-------|
| Title tag | PASS | "Coaches — Meet Your Trainers" |
| Meta description | PASS | Location-relevant description |
| H1 | PASS | "Meet Your Coaches" |
| Canonical URL | PASS | Auto-generated |
| OG / Twitter cards | PASS | Via metadata helper |
| Structured data | PASS | `BreadcrumbJsonLd` (added this session) |
| Image alt text | PASS | Coach photos have descriptive alt text: `"{name} coaching athletes"` |
| Internal linking | PASS | Links to /get-started |

#### 5. FAQ (`/faq`)
| Check | Status | Notes |
|-------|--------|-------|
| Title tag | PASS | "FAQs — Common Questions" |
| Meta description | PASS | Descriptive |
| H1 | PASS | "Frequently Asked Questions" |
| Canonical URL | PASS | Auto-generated |
| OG / Twitter cards | PASS | Via metadata helper |
| Structured data | PASS | `BreadcrumbJsonLd` + `FAQPageJsonLd` (both added this session) |
| Internal linking | PASS | Links to /programs, /get-started |

#### 6. Events (`/events`)
| Check | Status | Notes |
|-------|--------|-------|
| Title tag | PASS | "Summer Camps & Events" |
| Meta description | PASS | Includes location keywords |
| H1 | PASS | "Summer Camps & Events" |
| Canonical URL | WARN | Uses inline `export const metadata` instead of `generatePageMetadata()` — works but inconsistent |
| OG / Twitter cards | PASS | Inline OG meta present |
| Structured data | PASS | 3x `SportsEvent` JSON-LD + `BreadcrumbJsonLd` (added this session) |
| Image alt text | N/A | No images |
| Internal linking | PASS | Links to /get-started |
| Data source | FAIL | Camp data HARDCODED in page component — violates config-as-source-of-truth |

#### 7. Blog (`/blog`)
| Check | Status | Notes |
|-------|--------|-------|
| Title tag | PASS | "Blog — Training Tips & Insights" |
| Meta description | PASS | Includes location keywords |
| H1 | PASS | "Training Blog" |
| Canonical URL | PASS | Auto-generated |
| OG / Twitter cards | PASS | Via metadata helper |
| Structured data | PASS | `BreadcrumbJsonLd` (added this session) |
| Image alt text | N/A | Placeholder image areas (no actual images yet) |
| Internal linking | PASS | Links to /get-started |
| Data source | FAIL | Articles HARDCODED in page component — violates config-as-source-of-truth |
| Content | WARN | All 3 articles show "Coming Soon" — no published content yet |

#### 8. Get Started (`/get-started`)
| Check | Status | Notes |
|-------|--------|-------|
| Title tag | PASS | "Get Started — Free Athletic Assessment" |
| Meta description | PASS | CTA-focused description |
| H1 | PASS | Inside quiz component |
| Canonical URL | PASS | Auto-generated |
| OG / Twitter cards | PASS | Via metadata helper |
| Structured data | PASS | `BreadcrumbJsonLd` (added this session) |
| Internal linking | PASS | Quiz links to programs |

#### 9. Local SEO Page (`/youth-athletic-training-gallatin-tn`)
| Check | Status | Notes |
|-------|--------|-------|
| Title tag | PASS | "Youth Athletic Training in Gallatin, TN — Sumner County & Middle Tennessee" |
| Meta description | PASS | Keyword-rich, location-focused |
| H1 | PASS | "Youth Athletic Training in Gallatin, TN" |
| Canonical URL | PASS | Auto-generated |
| OG / Twitter cards | PASS | Via metadata helper |
| Structured data | PASS | `BreadcrumbJsonLd` (added this session) |
| Internal linking | PASS | Links to all programs, /get-started, /coaches |
| Local SEO signals | PASS | Service areas, school names, testimonials, coach bios — strong local content |

#### 10. Privacy Policy (`/privacy`)
| Check | Status | Notes |
|-------|--------|-------|
| Title tag | PASS | Via `generatePageMetadata()` |
| H1 | PASS | "Privacy Policy" |
| Canonical URL | PASS | Auto-generated |

#### 11. Terms of Service (`/terms`)
| Check | Status | Notes |
|-------|--------|-------|
| Title tag | PASS | Via `generatePageMetadata()` |
| H1 | PASS | "Terms of Service" |
| Canonical URL | PASS | Auto-generated |

#### 12. Payment Success (`/payment/success`)
| Check | Status | Notes |
|-------|--------|-------|
| Title tag | PASS | Includes `robots: { index: false }` — correct |
| H1 | PASS | "Payment Successful" |
| noindex | PASS | Properly excluded from indexing |

#### Infrastructure: robots.ts
| Check | Status | Notes |
|-------|--------|-------|
| Allows all crawlers | PASS | `userAgent: '*', allow: '/'` |
| Sitemap reference | PASS | Points to `${SITE.url}/sitemap.xml` |

#### Infrastructure: sitemap.ts
| Check | Status | Notes |
|-------|--------|-------|
| All pages included | PASS | Static pages + dynamic program pages |
| Priority weighting | PASS | Homepage 1.0, programs 0.9, others 0.7-0.8 |
| Changefreq | PASS | Weekly for content, monthly for legal |

#### Navigation & Footer
| Check | Status | Notes |
|-------|--------|-------|
| Navigation links | PASS | All main pages linked: Home, Programs (dropdown), Coaches, Events, Blog, FAQ |
| Footer links | PASS | Programs section includes all programs + Summer Camps + Blog (fixed this session) |
| Footer internal linking | PASS | Privacy, Terms, FAQs linked |

---

### Summary of Issues by Severity

#### HIGH
| # | Issue | Affected Pages | Ticket |
|---|-------|---------------|--------|
| H1 | All images use native `<img>` instead of `next/image` — no automatic optimization, lazy loading, or WebP/AVIF | Homepage, Coaches | SEO-003 |
| H2 | Google Fonts loaded via `<link>` in layout.tsx instead of `next/font` — render-blocking, no font subsetting | All pages | SEO-004 |
| H3 | Blog articles hardcoded in page component instead of config.ts | `/blog` | SEO-005 |
| H4 | Summer camp/event data hardcoded in page component instead of config.ts | `/events` | SEO-006 |

#### MEDIUM
| # | Issue | Affected Pages | Ticket |
|---|-------|---------------|--------|
| M1 | Events page uses inline `metadata` export instead of `generatePageMetadata()` helper | `/events` | SEO-006 |
| M2 | Blog has no published content — all 3 articles show "Coming Soon" | `/blog` | SEO-007 |
| M3 | No draft blog posts found in `docs/` directory | — | SEO-007 |

#### LOW
| # | Issue | Affected Pages | Notes |
|---|-------|---------------|-------|
| L1 | Hero image on homepage lacks explicit `width`/`height` attributes | `/` | CLS concern — address with next/image migration |
| L2 | Coach photos use `loading="lazy"` on `<img>` tags — correct intent but next/image handles this better | `/coaches` | Address with next/image migration |

#### PASSING (No Issues)
- Title tags: All 12 pages have unique, descriptive titles
- Meta descriptions: All 12 pages have descriptions via helper or inline
- H1 tags: Every page has exactly one H1
- Canonical URLs: All pages have canonical URLs
- OG/Twitter cards: Full social preview on all pages
- robots.txt: Properly configured
- sitemap.xml: Complete with all pages and proper priority
- Structured data: LocalBusiness, SportsActivityLocation, AggregateRating, reviews, FAQPage, BreadcrumbList, SportsEvent — comprehensive coverage
- Internal linking: Good cross-linking between pages via nav, footer, and CTAs

---

### Structured Data Coverage (SEO-002 Results)

| Type | Location | Status |
|------|----------|--------|
| LocalBusiness + SportsActivityLocation | Root layout `<head>` | DONE (pre-existing) |
| Organization | Homepage | DONE (pre-existing) |
| AggregateRating + Review | LocalBusinessJsonLd | DONE (pre-existing, auto-generated from config) |
| FAQPage | `/faq` | DONE (added this session) |
| FAQPage | `/programs/[slug]` (3 pages) | DONE (added this session) |
| BreadcrumbList | All non-homepage pages | DONE (added this session to 8 pages; pre-existing on program detail) |
| SportsEvent | `/events` (3 events) | DONE (pre-existing) |
| Service (offers) | LocalBusinessJsonLd | DONE (pre-existing, auto-generated from config) |

---

## Core Web Vitals Baseline (SEO-001) — 2026-03-04

**Auditor**: Marketing/SEO Agent
**Method**: Source code analysis (no live Lighthouse — site not running locally this session)
**Note**: Actual LCP/CLS/INP/FCP/TTFB numbers require live measurement via Lighthouse or PageSpeed Insights. This baseline documents known issues from code review that directly impact CWV scores.

| Page | LCP Risk | CLS Risk | INP Risk | Notes |
|------|----------|----------|----------|-------|
| Homepage | HIGH | MEDIUM | LOW | Hero `<img>` is LCP element — no optimization. No width/height → CLS. |
| Programs | LOW | LOW | LOW | Text-only, no images, light page |
| Program Detail | LOW | LOW | LOW | Text + FAQ accordion, no heavy assets |
| Coaches | MEDIUM | MEDIUM | LOW | Coach photos via `<img>` — large payloads possible |
| FAQ | LOW | LOW | LOW | Text-only accordion page |
| Events | LOW | LOW | LOW | Text-only, no images |
| Blog | LOW | LOW | LOW | Placeholder image areas, no actual images loaded |
| Get Started | LOW | LOW | LOW | Quiz component, minimal assets |
| Local SEO | LOW | LOW | LOW | Text-heavy page, config-driven |

### Top Bottlenecks

#### 1. CRITICAL: No `next/image` Usage — All Pages
**Impact**: LCP, CLS, bandwidth
- Every image on the site uses native `<img>` tags
- No automatic WebP/AVIF conversion, no responsive srcset, no lazy loading optimization
- Homepage hero image and coach photos are the largest assets
- Missing `width`/`height` attributes on hero image causes layout shift (CLS)
- **Fix**: Migrate all `<img>` to `next/image` with proper sizing — Ticket SEO-003

#### 2. HIGH: Google Fonts via `<link>` — All Pages
**Impact**: FCP, LCP, render-blocking
- Oswald (display) and Source Sans 3 (body) loaded via Google Fonts `<link>` tags in `layout.tsx`
- These are render-blocking external requests to `fonts.googleapis.com` and `fonts.gstatic.com`
- `preconnect` hints are present (good) but fonts still block first paint
- **Fix**: Switch to `next/font/google` for automatic font optimization, subsetting, and self-hosting — Ticket SEO-004

#### 3. MEDIUM: No Code Splitting Signals Beyond App Router Defaults
**Impact**: FCP, TTI
- Next.js App Router provides automatic route-level code splitting (good)
- No evidence of heavy client-side JS bundles — pages are mostly static renders of config data
- `GetStartedQuiz` component is the most interactive element — could benefit from dynamic import if large
- Google Analytics/Vercel Analytics loaded via components (standard)
- **Overall**: JS bundle impact is likely LOW due to static nature of the site

### CWV Optimization Tickets Created

| Ticket | Priority | Impact | Effort |
|--------|----------|--------|--------|
| SEO-003: Migrate `<img>` to `next/image` | HIGH | LCP + CLS on homepage and coaches | Medium |
| SEO-004: Switch to `next/font` | HIGH | FCP + LCP across all pages | Small |
| SEO-005: Move blog articles to config.ts | MEDIUM | Maintainability (not direct CWV) | Small |
| SEO-006: Move event data to config.ts + use metadata helper | MEDIUM | Consistency (not direct CWV) | Small |
| SEO-007: Blog content creation (3 draft posts) | MEDIUM | SEO content coverage | Requires human input |
