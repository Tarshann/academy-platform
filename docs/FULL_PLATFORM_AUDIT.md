# Academy Platform — Full Architecture Audit

> Comprehensive review across all 3 apps, server, shared code, config, and deployment.
> Audit date: 2026-03-14

---

## Executive Summary

The platform is **well-architected and production-ready** with strong type safety (tRPC end-to-end), proper auth degradation (Clerk + OAuth), and isolated security boundaries (Stripe webhook). However, audit uncovered **8 high-priority issues**, **15 medium-priority issues**, and **20+ low-priority improvements** across the 5 audit areas.

---

## HIGH PRIORITY (Fix Before Next Deploy)

### H1. Marketing: HTML Injection in Lead Email Template
- **File**: `academy-marketing/app/api/leads/route.ts:50-60`
- **Issue**: User inputs (`name`, `email`, `phone`, `goal`, `sport`) embedded directly in HTML email template without escaping
- **Risk**: If frontend validation is bypassed, attacker can inject HTML/scripts into admin notification emails
- **Fix**: Escape HTML entities before rendering in template

### H2. Marketing: Pricing Discrepancy (Bug)
- **File**: `academy-marketing/app/get-started/GetStartedQuiz.tsx:40`
- **Issue**: Performance Lab listed as "$245 per month" but `lib/config.ts:58` says "$245 per 6-week cohort"
- **Fix**: Change `unit: "per month"` to `unit: "per 6-week cohort"`

### H3. Server: `updateBookingStatus` Should Be Admin-Only
- **File**: `server/routers.ts:1417-1443`
- **Issue**: Uses `protectedProcedure` — any authenticated user can update booking statuses
- **Fix**: Change to `adminProcedure`

### H4. Server: `getCoachBookings` Missing Authorization
- **File**: `server/routers.ts:1385-1415`
- **Issue**: `protectedProcedure` with optional `coachId` — any user can query any coach's bookings
- **Fix**: Validate `ctx.user.id === coachId` or user is admin

### H5. Server: Public Mutations Without Rate Limiting
- **Files**: `server/routers.ts:314` (`leads.submit`), `server/routers.ts:1445` (`submitPrivateSessionBooking`)
- **Issue**: Public mutation endpoints with no rate limiting — vulnerable to spam/abuse
- **Fix**: Add rate limiting middleware (reference `_core/rateLimiter.ts`)

### H6. Mobile: Ably Connection Memory Leak
- **Files**: `academy-app/lib/realtime.ts:10`, `academy-app/app/chat/[room].tsx:122-132`, `academy-app/app/dm/[id].tsx:144-147`
- **Issue**: Singleton Ably client never calls `client.close()` on cleanup. `client.connection.off()` removes listeners but doesn't close connection. DM screen has no cleanup at all.
- **Fix**: Call `client.close()` on screen unmount; reset singleton on close

### H7. Mobile: Backend Dependencies in package.json
- **File**: `academy-app/package.json:48-61`
- **Issue**: `@clerk/backend`, `@clerk/express`, `drizzle-orm`, `postgres`, `stripe`, `resend` are in devDependencies — these are server-only packages that bloat the mobile app
- **Fix**: Remove all 6 packages

### H8. Mobile: Version Mismatch
- **Files**: `academy-app/package.json:3` says `1.0.0`, `academy-app/app.json:6` says `1.4.0`
- **Fix**: Sync to `1.4.0`

---

## MEDIUM PRIORITY

### M1. Marketing: No Rate Limiting on API Routes
- **Files**: `academy-marketing/app/api/leads/route.ts`, `app/api/checkout/route.ts`, `app/api/unsubscribe/route.ts`
- **Issue**: All POST API routes lack rate limiting — vulnerable to abuse

### M2. Marketing: No CSRF Protection on POST Routes
- **Files**: Same as M1
- **Issue**: No CSRF token validation on form submission endpoints

### M3. Marketing: Blog Routes Don't Exist
- **File**: `academy-marketing/app/blog/page.tsx:13-41`
- **Issue**: Blog page lists articles with slugs but no `/app/blog/[slug]/page.tsx` exists — links will 404

### M4. Server: Hardcoded Admin Email Addresses
- **File**: `server/routers.ts:73-78`
- **Issue**: `omarphilmore@yahoo.com` and `Tarshann@gmail.com` hardcoded — should be in env vars

### M5. Server: `adminProcedure` Redefined Locally
- **File**: `server/routers.ts:64-72`
- **Issue**: Redefines `adminProcedure` instead of importing from `_core/trpc.ts:30`. Two copies can drift.

### M6. Server: DM Error Handling Swallows Errors
- **File**: `server/routers.ts:1889-1896` (`dm.getAvailableUsers`)
- **Issue**: Catches error and returns empty array `[]` — client cannot distinguish between "no users" and "database error"

### M7. Server: LIKE Query Wildcard Injection
- **File**: `server/db.ts:1721`
- **Issue**: User search query wrapped with `%` for LIKE but not escaped — `%` and `_` wildcards in input affect query behavior

### M8. Server: `console.error` Instead of `logger.error`
- **Files**: `server/routers.ts:1496`, `server/routers.ts:1764-1774`
- **Issue**: Production logs not captured by structured logging

### M9. Server: Missing Stripe Event Handlers
- **File**: `server/stripe-webhook.ts:96-134`
- **Issue**: Missing handlers for `charge.refunded`, `invoice.payment_failed`, `payment_intent.amount_capturable_updated`

### M10. Server: No Input Length Limits on Lead/Contact Fields
- **Files**: `server/routers.ts:316-327` (leads), `server/routers.ts:410-420` (contact)
- **Issue**: No `.max()` on string fields — potential DoS via database bloat

### M11. Client: Unused Components (7 files)
- **Files**: `client/src/components/ActiveFilters.tsx`, `DashboardLayout.tsx`, `DashboardLayoutSkeleton.tsx`, `EmptyState.tsx`, `Map.tsx`, `SearchBar.tsx`, `AIChatBox.tsx`
- **Issue**: Exported but never imported — dead code

### M12. Client: PerformanceLabApplyPage Form Unhandled
- **File**: `client/src/pages/PerformanceLabApplyPage.tsx`
- **Issue**: Has form UI but submission is unhandled / not wired to tRPC mutation

### M13. Mobile: tRPC Client Missing Error Boundary
- **File**: `academy-app/lib/trpc.tsx:12-14`
- **Issue**: If `EXPO_PUBLIC_API_URL` is missing, only logs to console — all API calls silently fail

### M14. Mobile: Auth Guard Race Condition
- **File**: `academy-app/app/_layout.tsx:125-139`
- **Issue**: Brief flash of tab content before redirect to sign-in on unauthenticated access

### M15. CLAUDE.md: New Architecture Claim Is Wrong
- **File**: `CLAUDE.md:177`
- **Issue**: States "New Architecture enabled" but `academy-app/app.json:10` has `"newArchEnabled": false`

---

## LOW PRIORITY (Improvements)

### L1. Marketing: Quiz buttons need `role="radio"` + `aria-checked` for accessibility
### L2. Marketing: Payment success page shows confirmation without verifying Stripe session
### L3. Marketing: Recommendation logic hardcoded in quiz component instead of config
### L4. Marketing: Missing blog structured data (BlogPosting schema)
### L5. Marketing: Verbose error messages in checkout route expose infrastructure state
### L6. Server: `logout` is `publicProcedure` — should be `protectedProcedure`
### L7. Server: In-memory rate limiter doesn't work across serverless instances
### L8. Server: No order status transition enforcement (can jump pending → delivered)
### L9. Server: No inventory validation on shop orders
### L10. Server: `markAttendance` doesn't validate user is enrolled in schedule
### L11. Server: No slug uniqueness validation on blog post updates
### L12. Client: No `aria-label` attributes on interactive elements across pages
### L13. Client: Videos modal doesn't return focus to trigger button on close
### L14. Client: Inline styles with hardcoded colors in PerformanceLab/SkillsLab pages
### L15. Client: Debug `innerHTML` in SignUp.tsx should use `textContent`
### L16. Client: Structured data testimonials hardcoded (drift risk with marketing config)
### L17. Mobile: Push notification `registered` ref doesn't reset on sign-out
### L18. Mobile: No certificate pinning on API calls
### L19. Mobile: No offline queue for unsent messages
### L20. Mobile: Unused `@server/*` path alias in tsconfig.json
### L21. Mobile: Missing Universal Links (iOS) and App Links (Android) for deep linking
### L22. Cross-cutting: Lint config only covers 4 files — should expand or document why
### L23. Cross-cutting: No `.prettierrc` — relies on defaults
### L24. Cross-cutting: E2E tests have no auth flow or form submission coverage
### L25. Cross-cutting: `@assets` alias in vite.config.ts references potentially missing `attached_assets/` dir

---

## Security Posture Summary

| Area | Status | Notes |
|------|--------|-------|
| Auth (Clerk + OAuth) | Strong | Graceful degradation, proper JWT handling |
| tRPC Input Validation | Good | Zod on most inputs; missing max lengths on some strings |
| SQL Injection | Mitigated | Drizzle ORM parameterizes; minor LIKE wildcard concern |
| XSS | Good | DOMPurify on blog content; HTML injection risk in email templates |
| CSRF | Weak | No CSRF tokens on marketing API routes; portal uses httpOnly cookies |
| Rate Limiting | Partial | Applied to chat/contact/auth; missing on leads/bookings |
| Stripe Webhook | Strong | Signature verification, event deduplication, isolated bundle |
| Security Headers | Strong | HSTS, X-Frame-Options, nosniff, Permissions-Policy all set |
| CORS | Acceptable | Portal: specific origin; API routes: permissive but JSON-only |
| Cookie Security | Good | httpOnly, secure, sameSite=none |
| CSP | Missing | No Content-Security-Policy header configured |

---

## Test Coverage Summary

| Area | Coverage | Gap |
|------|----------|-----|
| Portal E2E | Partial | Public routes tested; no auth/form tests |
| Marketing E2E | Good | Playwright tests + validate-build.mjs (45+ checks) |
| Mobile E2E | None | No automated testing |
| Server Unit | Minimal | Only auth, checkout, contact, email, features, admin, shop tested |
| Client Unit | None visible | No test files found in client/src/ |

---

## Files Reference (Issues by File)

| File | Issues |
|------|--------|
| `academy-marketing/app/api/leads/route.ts` | H1, M1, M2 |
| `academy-marketing/app/get-started/GetStartedQuiz.tsx` | H2, L1, L3 |
| `server/routers.ts` | H3, H4, H5, M4, M5, M6, M8, M10, L6, L10, L11 |
| `server/db.ts` | M7 |
| `server/stripe-webhook.ts` | M9 |
| `academy-app/lib/realtime.ts` | H6 |
| `academy-app/package.json` | H7, H8 |
| `academy-app/lib/trpc.tsx` | M13 |
| `academy-app/app/_layout.tsx` | M14 |
| `client/src/components/StructuredData.tsx` | L16 |
| `CLAUDE.md` | M15 |
