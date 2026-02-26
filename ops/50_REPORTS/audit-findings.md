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

## SEO Audit (MKT-001)

*(To be populated by Marketing/SEO Agent)*

### Page-by-Page Results
*(Use the audit template from marketing-site.md workstream file)*

### Summary of Issues
*(Categorized findings)*

---

## Core Web Vitals Baseline (SEO-001)

*(To be populated by Marketing/SEO Agent)*

| Page | LCP | CLS | INP | FCP | TTFB | Score |
|------|-----|-----|-----|-----|------|-------|
| Homepage | — | — | — | — | — | — |
| Programs | — | — | — | — | — | — |
| About | — | — | — | — | — | — |
| Contact | — | — | — | — | — | — |
| Blog Index | — | — | — | — | — | — |

### Top Bottlenecks
1. *(TBD)*
2. *(TBD)*
3. *(TBD)*
