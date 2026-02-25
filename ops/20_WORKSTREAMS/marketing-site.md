# Workstream: Marketing Site + SEO (academy-marketing/)

> **Owner**: Marketing/SEO Agent
> **Scope**: `academy-marketing/` directory ONLY
> **Package Manager**: npm
> **Domain**: academytn.com

---

## Context

The marketing site is a Next.js 15 App Router site that serves as the public face of The Academy. It's config-driven — all business data lives in `lib/config.ts` and pages are pure renderers.

### Key Files
| File | Purpose | Change Frequency |
|------|---------|-----------------|
| `lib/config.ts` | ALL business data (programs, pricing, coaches, testimonials, etc.) | Medium |
| `lib/metadata.ts` | SEO metadata generation | Low |
| `lib/structured-data.tsx` | Auto-generated Schema.org JSON-LD from config | Low |
| `scripts/validate-build.mjs` | Post-build validation (45+ checks) | Rarely |
| `app/` | All App Router pages | Medium |
| `components/` | UI components (Navigation, Footer, StickyCTA, etc.) | Low |

### Active Tickets
See `ops/10_BACKLOG/NOW.md` for `MKT-*` and `SEO-*` tickets.

---

## Config.ts Change Protocol

1. All business data changes go through `lib/config.ts`
2. Never hardcode programs, pricing, coaches, testimonials, or contact info in page components
3. After changing config.ts:
   - Run `npm run build`
   - Run `npm run validate`
   - Check if testimonial changes also need updating in portal's `StructuredData.tsx` (log in review-log if so)
4. Structured data in `lib/structured-data.tsx` regenerates automatically from config

---

## SEO Page Audit Template

Use this for each page during MKT-001 audit:

```
## [Page Name] — /[path]
- Title: [current title] — [OK/NEEDS FIX: reason]
- Description: [current desc] — [OK/NEEDS FIX: reason]
- H1: [current H1] — [OK/NEEDS FIX: reason]
- Heading hierarchy: [OK/SKIP/NEEDS FIX]
- OG tags: [present/missing]
- Twitter Card: [present/missing]
- Canonical: [set/missing]
- Structured data: [type if present / missing]
- Images: [alt text coverage %]
- Internal links: [count, any missing opportunities]
- Mobile rendering: [OK/issues]
- CWV notes: [any visible issues]
```

---

## Cross-App Concern: Testimonials

Testimonials exist in two places:
1. `academy-marketing/lib/config.ts` → auto-generates structured data ✅
2. `client/src/components/StructuredData.tsx` → hardcoded ❌

Any testimonial changes must be flagged for the Portal agent to update `StructuredData.tsx`. Log this in `ops/50_REPORTS/STATUS.md` under Cross-Cutting Issues.

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| — | — | — |

## Files Modified Log

| Date | File | Change | Ticket |
|------|------|--------|--------|
| — | — | — | — |
