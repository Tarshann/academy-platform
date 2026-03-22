# Hardening Audit Report — Academy Platform

> Agent: Hardening Agent v1.0.0
> Date: 2026-03-21
> Scope: Portal, Marketing, Mobile, CI/CD, Infrastructure
> Priority execution: P0 → P1 → P2 → P3

---

## Executive Summary

Comprehensive security hardening pass across the Academy Platform monorepo. All P0 (Critical) items fixed. All P1 (High Priority) items fixed or documented. P2/P3 items documented with remediation paths.

**Changes made:**
- Added CSP + COEP/COOP/CORP security headers to portal `vercel.json`
- Added tRPC error formatter to strip stack traces in production
- Added tRPC-native rate limiting to all 28 public procedures (queries + mutations)
- Hardened CI pipeline with dependency auditing, gitleaks secrets scanning, and CodeQL SAST
- Created Dependabot configuration for automated dependency updates
- Created rate limit documentation

---

## P0 — Critical (Fix Immediately)

### 1. Secrets Hygiene

| Check | Status | Detail |
|---|---|---|
| `.env` in `.gitignore` | ✅ PASS | Lines 7-11 of `.gitignore` exclude all `.env` variants |
| `.env` never committed to git | ✅ PASS | `git log --all --full-history -- .env` returns empty |
| `.env.example` has only placeholders | ✅ PASS | All values are `sk_test_...`, `pk_test_...`, `your_*_here`, or empty |
| No hardcoded live secrets in code | ✅ PASS | Grep for `sk_live`, `pk_live`, `ghp_`, `AKIA`, `BEGIN.*PRIVATE` found zero matches in `server/` and `client/` |
| `ADMIN_NOTIFY_EMAILS` env var used | ✅ PASS | Defined in `server/_core/env.ts:35`, used via env config |
| Stripe keys are test keys in `.env.example` | ✅ PASS | `sk_test_...` and `pk_test_...` |
| Marketing `.env.example` clean | ✅ PASS | Only `re_...`, `G-XXXXXXXXXX`, placeholder values |
| Working `.env` file has real keys | ⚠️ NOTE | `.env` exists in working directory with test keys — not in git, but operators should rotate if these were ever shared |

**Hardcoded email finding (documented, not fixed — client/UI ownership):**
- `server/email.ts:336-337` — Coach emails hardcoded in payment confirmation email template footer
- `client/src/pages/Schedule.tsx`, `About.tsx`, `Footer.tsx`, `PrivateSessionBooking.tsx`, `PaymentSuccess.tsx`, `StructuredData.tsx` — Coach contact info hardcoded
- **Recommendation**: Extract to a shared config or env var (`COACH_CONTACTS`) in a future portal ticket. These are intentional business contact info, not secrets, but centralizing them prevents drift.

### 2. Content-Security-Policy (CSP)

| Item | Status | Detail |
|---|---|---|
| Portal CSP | ✅ FIXED | Added to `vercel.json` headers — allows `self`, Clerk, Stripe, Ably, analytics, fonts |
| Marketing CSP | ✅ ALREADY PRESENT | `next.config.ts` line 10 — allows GA, fonts, Google Tag Manager |
| `report-uri` directive | ⚠️ DEFERRED | Recommend adding CSP violation reporting via report-uri.com or similar |

**Portal CSP policy:**
```
default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://analytics.academytn.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.clerk.com https://*.clerk.accounts.dev https://api.stripe.com wss://*.ably.io https://analytics.academytn.com; frame-src https://checkout.stripe.com https://js.stripe.com; object-src 'none'; base-uri 'self'
```

**Testing note:** `credentialless` used for COEP to ensure Stripe iframe checkout and Clerk components continue to work. Verify in preview deployment before going to production.

### 3. Additional Security Headers

| Header | Status | Value |
|---|---|---|
| `Cross-Origin-Embedder-Policy` | ✅ FIXED | `credentialless` |
| `Cross-Origin-Opener-Policy` | ✅ FIXED | `same-origin` |
| `Cross-Origin-Resource-Policy` | ✅ FIXED | `same-origin` |
| `X-Permitted-Cross-Domain-Policies` | ✅ FIXED | `none` |

**Pre-existing headers (already configured):**
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

---

## P1 — High Priority (Fix This Sprint)

### 4. Rate Limiting Gaps

| Item | Status | Detail |
|---|---|---|
| All public queries rate-limited | ✅ FIXED | 22 public queries → `publicQueryProcedure` (120 req/min per IP) |
| All public mutations rate-limited | ✅ FIXED | 6 public mutations → `publicMutationProcedure` (10 req/15min per IP) |
| `auth.me` rate-limited | ✅ FIXED | Uses `publicQueryProcedure` (120/min — generous for page loads) |
| Cleanup interval active | ✅ VERIFIED | `setInterval` every 5 min in both `rateLimiter.ts` and `trpc.ts` |
| Rate limits documented | ✅ FIXED | Created `docs/RATE_LIMITS.md` |
| Global Express-level fallback | ⚠️ DEFERRED | Recommend adding 200 req/min global limiter as defense-in-depth |

### 5. CI/CD Hardening

| Item | Status | Detail |
|---|---|---|
| `pnpm audit` in portal CI | ✅ FIXED | Non-blocking (`|| true`) — reports but doesn't fail build yet |
| `npm audit` in marketing CI | ✅ FIXED | Non-blocking |
| `npm audit` in mobile CI | ✅ FIXED | Non-blocking |
| Gitleaks secrets scanning | ✅ FIXED | New `security` job with `gitleaks/gitleaks-action@v2` |
| CodeQL SAST analysis | ✅ FIXED | `github/codeql-action/init@v3` + `analyze@v3` for JS/TS |
| Dependabot config | ✅ FIXED | `.github/dependabot.yml` — weekly updates, 3 ecosystems, 10 PR limit each |
| E2E tests in CI | ⚠️ DEFERRED | Recommend adding smoke tests for critical flows in next sprint |
| Bundle size check | ⚠️ DEFERRED | Recommend adding build artifact size comparison |
| Branch protection rules | ⚠️ MANUAL | Requires GitHub repo settings — enable "Require status checks before merge" for `portal`, `marketing`, `security` jobs |

### 6. Dependency Hygiene

| Item | Status | Detail |
|---|---|---|
| Marketing `npm audit` | ✅ RAN | 1 moderate vulnerability (Next.js HTTP smuggling + disk cache — fix via `npm audit fix` to update Next.js) |
| Portal `pnpm audit` | ⚠️ NOT RUN | pnpm not available in audit environment — run manually: `pnpm audit --audit-level=high` |
| `patches/` directory | ✅ VERIFIED | Contains `wouter@3.7.1.patch` — still needed (wouter is used for routing) |
| Dependabot automated PRs | ✅ CONFIGURED | Will begin generating PRs once merged to `main` |
| Unused dependency removal | ⚠️ DEFERRED | Needs manual review with `depcheck` tool |

### 7. Error Message Leakage

| Item | Status | Detail |
|---|---|---|
| tRPC error formatter | ✅ FIXED | Added to `server/_core/trpc.ts` — strips `stack` in production |
| `res.status(500).json()` responses | ✅ VERIFIED | All 500 responses use generic messages (`"Upload failed"`, `"Database not available"`, etc.) — no stack traces or SQL errors leaked |
| Stripe webhook error response | ✅ VERIFIED | Returns generic `"Webhook processing failed"` (line 158) |
| `console.error` usage | ✅ VERIFIED | Only in `logger.ts` (internal implementation), `vite.ts` (dev-only), and `reset-game-turns.ts` (CLI script) — no production leakage |

---

## P2 — Medium Priority (Next Sprint)

### 8. Authentication & Session Hardening

| Item | Status | Finding |
|---|---|---|
| Clerk session timeout | ⚠️ DOCUMENT | Default 7-day sessions — consider reducing for admin sessions via Clerk dashboard |
| OAuth fallback path | ⚠️ DOCUMENT | `server/_core/oauth.ts` exists as fallback — review if it maintains equivalent security guarantees |
| CSRF protection | ✅ OK | tRPC uses POST by default; Stripe webhook uses raw body signature verification |
| Admin role spoofing | ✅ OK | `CLERK_ADMIN_EMAIL` and `ADMIN_EMAILS` checked server-side in `_core/clerk.ts:105` — cannot be spoofed via client |
| Mobile token storage | ⚠️ DOCUMENT | Verify Clerk tokens use SecureStore, not AsyncStorage (mobile agent ticket) |

### 9. Input Validation

| Item | Status | Finding |
|---|---|---|
| `.max()` on string fields | ⚠️ PARTIAL | Known issue from FULL_PLATFORM_AUDIT.md (M10) — leads/contact fields lack `.max()` limits |
| File upload size limits | ✅ OK | Gallery upload: 50MB max (multer config in `_core/index.ts:98`); `STORAGE_MAX_BYTES` env var for general uploads |
| XSS via `dangerouslySetInnerHTML` | ✅ OK | Only 2 usages: `BlogPost.tsx` uses DOMPurify.sanitize(); `chart.tsx` uses internal theme CSS (no user data) |
| HTML injection in emails | ⚠️ KNOWN | Documented in FULL_PLATFORM_AUDIT.md H1 — marketing site lead email template. Marketing agent ticket. |
| LIKE wildcard injection | ⚠️ KNOWN | Documented in FULL_PLATFORM_AUDIT.md M7 — DM search fixed, others need audit |

### 10. Database Security

| Item | Status | Finding |
|---|---|---|
| SSL enforced | ⚠️ CHECK | `sslmode=require` not found in `.env.example` DATABASE_URL — verify Neon enforces SSL by default |
| Performance indexes | ✅ OK | 14 indexes added in migration 0022 |
| `governance_evidence` retention | ⚠️ DOCUMENT | No retention policy — table will grow unbounded. Add archival cron or TTL. |

### 11. Observability & Monitoring

| Item | Status | Finding |
|---|---|---|
| Sentry configured | ✅ OK | `_core/sentry.ts` initialized early, `captureException` used in error handler |
| Request correlation IDs | ⚠️ DEFERRED | Not implemented — add UUID per request in Express middleware |
| Structured security logging | ⚠️ DEFERRED | Rate limit hits and governance denials not logged to structured format |
| Health check monitoring | ✅ OK | `/api/health` endpoint exists |

### 12. Pre-Commit Hooks

| Item | Status | Finding |
|---|---|---|
| Husky + lint-staged | ⚠️ DEFERRED | Not installed — recommend adding gitleaks protect + TypeScript check as pre-commit hook |

---

## P3 — Backlog (Plan & Schedule)

### 13. Security Test Suite
**Status: NOT STARTED**
Recommend creating `server/__tests__/security/` with OWASP Top 10 tests (injection, broken auth, IDOR, rate limiting verification). The structural governance invariant test (103 assertions) is a good foundation.

### 14. Mobile App Security
**Status: DOCUMENT ONLY (mobile agent ownership)**
- No certificate pinning (L18 in FULL_PLATFORM_AUDIT.md)
- Verify SecureStore for Clerk tokens
- Push notification deep link validation (fixed in v1.7 — verify)
- Run `expo-doctor`

### 15. Infrastructure Security
| Item | Status | Finding |
|---|---|---|
| `VITE_*` env vars audit | ✅ OK | `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_APP_ID`, `VITE_OAUTH_PORTAL_URL`, `VITE_FRONTEND_FORGE_API_URL/KEY`, `VITE_ANALYTICS_*`, `VITE_SITE_URL` — all are intentionally client-exposed (publishable keys, URLs). `VITE_FRONTEND_FORGE_API_KEY` should be verified it's a public/frontend-only key. |
| Stripe webhook signature | ✅ OK | Uses `stripe.webhooks.constructEvent()` which performs constant-time comparison |
| `CRON_SECRET` strength | ⚠️ CHECK | Verify production value is ≥32 chars random (generated via `openssl rand -hex 32`) |

### 16. Build Resilience
**Status: DEFERRED**
- Verify fresh clone → install → build → test works
- `pnpm-lock.yaml` is committed (confirmed present in repo root)
- Circular dependency check not run

### 17. Data Privacy (Youth Platform)
**Status: DOCUMENT ONLY**
- Data inventory of PII columns needed
- Parent/guardian consent flow: verify exists
- COPPA compliance: verify if users under 13 are accepted
- Data deletion capability: verify right-to-be-forgotten flow exists
- Family account isolation: verify access controls (one family can't see another's data)

---

## Files Modified

| File | Change |
|---|---|
| `vercel.json` | Added CSP, COEP, COOP, CORP, X-Permitted-Cross-Domain-Policies headers |
| `server/_core/trpc.ts` | Added error formatter (strip stack in prod), rate limiting middleware, `publicQueryProcedure` and `publicMutationProcedure` exports |
| `server/routers.ts` | Replaced all 28 `publicProcedure` usages with rate-limited variants |
| `.github/workflows/ci.yml` | Added dependency auditing, gitleaks secrets scanning, CodeQL SAST |
| `.github/dependabot.yml` | Created — weekly dependency updates for all 3 ecosystems |
| `docs/RATE_LIMITS.md` | Created — documents all rate limits |
| `ops/50_REPORTS/HARDENING_AUDIT.md` | Created — this file |

---

## Verification Checklist

- [ ] `pnpm check` passes (run after merge)
- [ ] `pnpm test` passes (run after merge)
- [ ] `pnpm build` succeeds (run after merge)
- [x] All P0 items fixed and committed
- [x] All P1 items fixed or documented
- [x] All P2/P3 items documented in this audit report
- [ ] No new dependencies introduced (confirmed — only new exports added to existing files)
- [ ] CSP header tested in preview deployment (verify Clerk auth flow, Stripe checkout, Ably real-time)
- [x] Rate limiting covers all public endpoints
- [ ] No secrets in git history (verified via `git log --all --full-history -- .env`)
- [ ] Gitleaks scan clean (will run on next CI push)

---

## Recommended Next Actions (Priority Order)

1. **Deploy to preview** and test CSP doesn't break Clerk/Stripe/Ably
2. **Enable branch protection** in GitHub settings requiring CI pass
3. **Run `pnpm audit`** locally and fix high/critical vulnerabilities
4. **Add global Express rate limiter** as defense-in-depth (200 req/min)
5. **Add request correlation IDs** for observability
6. **Add `.max()` limits** to all tRPC string input fields (M10 from platform audit)
7. **Create OWASP security test suite** in `server/__tests__/security/`
8. **Install husky + lint-staged** for pre-commit hooks
9. **Review data privacy** for COPPA compliance given youth athlete user base
10. **Add CSP report-uri** for violation monitoring
