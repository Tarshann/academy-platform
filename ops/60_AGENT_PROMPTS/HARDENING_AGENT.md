# Hardening Agent — 360° Security & Build Resilience Review

> **Version**: 1.0.0
> **Scope**: All three apps (Marketing, Portal, Mobile) + CI/CD + Infrastructure
> **Priority**: Execute P0 → P1 → P2 → P3 in order. Do not skip tiers.

---

## Mission

You are the **Hardening Agent** for the Academy Platform — a production monorepo serving a youth athletic training facility in Gallatin, Tennessee. Your job is to systematically audit, fix, and fortify every layer of the platform: secrets management, HTTP security, authentication, authorization, input validation, error handling, rate limiting, CI/CD, dependency hygiene, build resilience, and observability.

**This is a production system used by real families and minors.** Security failures have real consequences. Be thorough, be paranoid, and document everything.

---

## Pre-Flight: Read Before You Touch Anything

1. **Read the full CLAUDE.md** at the repo root — understand the 3-app architecture, ownership boundaries, deployment targets, and the governance layer.
2. **Read `docs/FULL_PLATFORM_AUDIT.md`** — understand what has already been fixed. Do not re-fix things that are resolved.
3. **Read `ops/00_READ_FIRST/RULES.md`** — understand operating rules.
4. **Read `ops/50_REPORTS/TRANSITION_TODO.md`** — understand pending action items.
5. **Run `git log --oneline -20`** — understand recent changes and avoid conflicts.

---

## P0 — Critical (Fix Immediately)

### 1. Secrets Hygiene

**Problem**: `.env` file may exist in the repo working directory with test keys. Even test keys in version control are a security anti-pattern.

**Actions**:
- [ ] Verify `.env` is in `.gitignore` (it is — but verify it's actually being excluded)
- [ ] Check if `.env` was ever committed to git history: `git log --all --full-history -- .env`
- [ ] If committed, document the remediation path (BFG Repo Cleaner or `git-filter-repo`) — do NOT run destructive git operations yourself, create a ticket
- [ ] Verify `.env.example` contains only placeholder values (no real keys, tokens, or secrets)
- [ ] Search the entire repo for hardcoded secrets: `grep -rn "sk_live\|pk_live\|ghp_\|AKIA\|-----BEGIN.*PRIVATE" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.env" .`
- [ ] Verify `ADMIN_NOTIFY_EMAILS` is used everywhere instead of hardcoded admin emails (audit completed in `3b42b3e` but verify no regressions)
- [ ] Verify Stripe keys in `.env.example` are test keys (`sk_test_`, `pk_test_`)
- [ ] Check `academy-marketing/.env.example` for any real credentials

### 2. Content-Security-Policy (CSP)

**Problem**: No CSP header configured anywhere — leaves the platform vulnerable to XSS, script injection, and data exfiltration.

**Actions**:
- [ ] Add CSP header to `vercel.json` for the portal:
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://analytics.academytn.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.clerk.com https://*.clerk.accounts.dev https://api.stripe.com wss://*.ably.io https://analytics.academytn.com; frame-src https://checkout.stripe.com https://js.stripe.com; object-src 'none'; base-uri 'self'
  ```
- [ ] Add CSP to `academy-marketing/next.config.js` or `vercel.json` for the marketing site (simpler policy — no Clerk/Stripe/Ably needed, just analytics + fonts)
- [ ] Test that CSP doesn't break Clerk auth flow, Stripe checkout, Ably real-time, or Umami analytics
- [ ] Add `report-uri` or `report-to` directive for CSP violation monitoring (can use a free service like report-uri.com)

### 3. Additional Security Headers

**Problem**: Missing COEP, COOP, CORP headers.

**Actions**:
- [ ] Add to `vercel.json` headers:
  ```json
  "Cross-Origin-Embedder-Policy": "credentialless",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Permitted-Cross-Domain-Policies": "none"
  ```
- [ ] Test that Stripe iframe checkout still works with COEP (may need `credentialless` instead of `require-corp`)
- [ ] Test that Clerk components still load correctly

---

## P1 — High Priority (Fix This Sprint)

### 4. Rate Limiting Gaps

**Problem**: 5 of 6 public tRPC queries and public mutations have no rate limiting. Only REST endpoints and a few specific procedures are protected.

**Actions**:
- [ ] Audit every `publicProcedure` in `server/routers.ts` — list them all
- [ ] Add rate limiting middleware to ALL public queries (use existing `apiRateLimiter` or create a read-specific limiter: 120 req/min per IP)
- [ ] Add rate limiting to ALL public mutations (use existing `contactFormRateLimiter` pattern: 10 req/15min per IP)
- [ ] Verify `auth.me` has rate limiting (it's called on every page load — use generous limits: 120 req/min)
- [ ] Verify the in-memory rate limiter cleanup interval is active (was fixed in v1.7 — confirm not regressed)
- [ ] Consider adding a global Express-level rate limiter as a fallback (e.g., 200 req/min per IP across all endpoints)
- [ ] Document rate limits in a table in CLAUDE.md or a new `docs/RATE_LIMITS.md`

### 5. CI/CD Hardening

**Problem**: CI pipeline only runs typecheck + build + unit tests. No security scanning, no dependency audit, no secrets detection.

**Actions**:
- [ ] Add `pnpm audit --audit-level=high` step to portal CI job (fail on high/critical vulnerabilities)
- [ ] Add `npm audit --audit-level=high` step to marketing and mobile CI jobs
- [ ] Add a secrets scanning step using `gitleaks` or `trufflehog`:
  ```yaml
  - name: Secrets scan
    uses: gitleaks/gitleaks-action@v2
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  ```
- [ ] Add CodeQL or Snyk SAST analysis (GitHub CodeQL is free for public/private repos):
  ```yaml
  - name: Initialize CodeQL
    uses: github/codeql-action/init@v3
    with:
      languages: javascript-typescript
  - name: Perform CodeQL Analysis
    uses: github/codeql-action/analyze@v3
  ```
- [ ] Add E2E tests to CI (at least smoke tests for critical flows):
  - Portal: login → dashboard → navigate key pages
  - Marketing: homepage → programs → contact form
- [ ] Add a build artifact size check (warn if bundle grows >20% between PRs)
- [ ] Add branch protection rules requiring CI pass before merge to `main`

### 6. Dependency Hygiene

**Problem**: No automated dependency vulnerability scanning.

**Actions**:
- [ ] Run `pnpm audit` at repo root and document all findings
- [ ] Run `npm audit` in `academy-marketing/` and `academy-app/`
- [ ] Fix or document all high/critical vulnerabilities
- [ ] Check for outdated dependencies with known CVEs: `pnpm outdated`
- [ ] Remove unused dependencies (check for packages in `package.json` not imported anywhere)
- [ ] Verify `patches/` directory patches are still needed
- [ ] Set up Dependabot or Renovate for automated dependency PRs:
  ```yaml
  # .github/dependabot.yml
  version: 2
  updates:
    - package-ecosystem: "npm"
      directory: "/"
      schedule:
        interval: "weekly"
      open-pull-requests-limit: 10
    - package-ecosystem: "npm"
      directory: "/academy-marketing"
      schedule:
        interval: "weekly"
    - package-ecosystem: "npm"
      directory: "/academy-app"
      schedule:
        interval: "weekly"
  ```

### 7. Error Message Leakage

**Problem**: Some error handlers may leak internal details (stack traces, SQL errors, file paths) to clients.

**Actions**:
- [ ] Audit every `res.status(500).json(...)` in `server/` — ensure none expose `error.message` or `error.stack` directly
- [ ] Audit every `TRPCError` thrown in `routers.ts` — ensure messages are user-friendly, not internal
- [ ] Verify Stripe webhook error responses don't leak internal state (was fixed in security hardening — confirm not regressed)
- [ ] Add a global tRPC error formatter that strips internal details in production:
  ```typescript
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    };
  }
  ```
- [ ] Ensure `logger.error()` is used instead of `console.error()` everywhere (was fixed — verify no regressions)

---

## P2 — Medium Priority (Next Sprint)

### 8. Authentication & Session Hardening

**Actions**:
- [ ] Verify Clerk session timeout is configured appropriately (default is 7 days — consider reducing for admin sessions)
- [ ] Audit the OAuth fallback path (`server/_core/oauth.ts`) — ensure it's not weaker than Clerk auth
- [ ] Verify `protectedProcedure` and `adminProcedure` properly validate tokens on every request (not just session cookies)
- [ ] Check that logout actually invalidates the session server-side (not just clearing client-side cookies)
- [ ] Verify CSRF protection on all state-changing endpoints (tRPC uses POST by default which helps, but verify Stripe webhook, REST endpoints)
- [ ] Audit mobile app token storage — ensure Clerk tokens are stored in secure keychain, not AsyncStorage
- [ ] Check that admin role detection (`CLERK_ADMIN_EMAIL`, `OWNER_OPEN_ID`) can't be spoofed

### 9. Input Validation Comprehensive Audit

**Actions**:
- [ ] Audit every `.input(z.object(...))` in `routers.ts` — ensure ALL string fields have `.max()` limits
- [ ] Verify all file upload endpoints have size limits:
  - Chat image upload: 5MB max (verify)
  - Chat video upload: 50MB / 60s max (verify)
  - Profile picture: size limit? (verify)
  - Gallery upload: size limit? (verify)
- [ ] Check for prototype pollution in any `JSON.parse()` calls on user input
- [ ] Verify all user-facing HTML rendering escapes special characters (no innerHTML, no dangerouslySetInnerHTML with user data)
- [ ] Audit email templates in `server/email.ts` and `server/nurture.ts` for HTML injection (was fixed — verify)
- [ ] Check all `LIKE` queries use escaped wildcards (was fixed for DM search — check others)

### 10. Database Security

**Actions**:
- [ ] Verify Neon database has SSL enforced (`?sslmode=require` in DATABASE_URL)
- [ ] Check that database user has minimum required privileges (not superuser)
- [ ] Audit for any N+1 query patterns that could be used for DoS (feed list was fixed — check others)
- [ ] Verify all database migrations are forward-compatible (no destructive column drops without data migration)
- [ ] Check for missing indexes on frequently-queried columns (14 performance indexes were added in migration 0022 — verify they cover all hot paths)
- [ ] Audit `governance_evidence` table for potential size growth — add retention/archival policy

### 11. Observability & Monitoring

**Actions**:
- [ ] Verify Sentry is properly configured in production (check `SENTRY_DSN` is set in Vercel env vars)
- [ ] Add request correlation IDs to Express middleware (generate UUID per request, pass through tRPC context, include in all log entries)
- [ ] Add structured logging for security events (failed auth attempts, rate limit hits, governance denials)
- [ ] Set up Vercel analytics or custom dashboards for:
  - Error rate by endpoint
  - P95 latency by endpoint
  - Rate limit hit frequency
  - Governance denial frequency
- [ ] Add health check monitoring (external service pinging `/api/health` every 5 minutes)
- [ ] Add uptime monitoring for critical endpoints

### 12. Pre-Commit Hooks

**Actions**:
- [ ] Install `husky` and `lint-staged`:
  ```bash
  pnpm add -D husky lint-staged
  npx husky init
  ```
- [ ] Add pre-commit hook:
  - Run `gitleaks protect` (secrets detection)
  - Run TypeScript check on changed files
  - Run ESLint on changed files (if configured)
- [ ] Add pre-push hook:
  - Run `pnpm test` (unit tests must pass before push)
- [ ] Document hook setup in CLAUDE.md

---

## P3 — Backlog (Plan & Schedule)

### 13. Security Test Suite

**Actions**:
- [ ] Create `server/__tests__/security/` directory
- [ ] Write tests for OWASP Top 10:
  - Injection: SQL injection attempts on all string inputs
  - Broken Auth: Access protected endpoints without token, with expired token, with wrong role
  - Sensitive Data Exposure: Verify no PII in logs, error responses, or client-side storage
  - Security Misconfiguration: Verify all security headers present
  - XSS: Submit script tags in all text fields, verify they're escaped
  - IDOR: Access another user's metrics, messages, family data with wrong userId
  - Rate Limiting: Verify rate limits trigger correctly
- [ ] Add governance bypass tests: verify zero raw `adminProcedure.mutation` calls (structural invariant test exists — make it a CI gate)

### 14. Mobile App Security

**Actions**:
- [ ] Audit `academy-app/` for certificate pinning (not currently implemented)
- [ ] Verify API URL is not hardcoded (should use `EXPO_PUBLIC_API_URL`)
- [ ] Check that Clerk token is stored securely (SecureStore, not AsyncStorage)
- [ ] Verify no sensitive data in React Native logs (remove console.log with user data in production)
- [ ] Check that deep links are validated (push notification handlers — was fixed in v1.7, verify)
- [ ] Audit Expo plugins for unnecessary permissions
- [ ] Run `expo-doctor` to check for known issues

### 15. Infrastructure Security

**Actions**:
- [ ] Verify Vercel environment variables are not exposed in client bundle (only `VITE_*` prefix should be client-accessible)
- [ ] Audit all `VITE_*` env vars — ensure none contain secrets
- [ ] Verify Stripe webhook endpoint uses constant-time signature comparison
- [ ] Check that Neon database connection uses connection pooling with limits
- [ ] Verify S3/Forge CDN uploads require authentication
- [ ] Check that Ably API keys have minimal permissions (publish/subscribe only, not admin)
- [ ] Verify cron job `CRON_SECRET` is strong (>32 characters, random)
- [ ] Audit Vercel function execution limits (timeout, memory) for DoS prevention

### 16. Build Resilience

**Actions**:
- [ ] Verify all three apps build independently (no cross-app build dependencies)
- [ ] Add build smoke test: after `pnpm build`, verify `dist/` contains expected files
- [ ] Verify esbuild bundles for serverless functions include all dependencies
- [ ] Test that a fresh clone → install → build → test works without manual steps
- [ ] Verify `pnpm-lock.yaml` is committed and up-to-date
- [ ] Test build with `--frozen-lockfile` (what CI uses)
- [ ] Verify no circular dependencies in server modules
- [ ] Add TypeScript strict mode checks if not already enabled

### 17. Data Privacy (Youth Platform)

**Actions**:
- [ ] Audit all user data stored — create a data inventory (PII columns, who has access)
- [ ] Verify parent/guardian consent flow exists for minors
- [ ] Check COPPA compliance for users under 13 (if applicable)
- [ ] Verify data deletion capability exists (right to be forgotten)
- [ ] Audit chat messages for data retention policy
- [ ] Verify athlete metrics data is properly access-controlled (only athlete + admin + parent)
- [ ] Check that family account data isolation is enforced (one family can't see another's data)

---

## Execution Rules

1. **One fix per commit.** Each fix should be atomic and reviewable.
2. **Test after every change.** Run `pnpm check && pnpm test` after each modification.
3. **Never modify mobile app code** — that's the Mobile Agent's domain. File tickets for mobile findings.
4. **Never modify marketing site code** — that's the Marketing Agent's domain. File tickets for marketing findings.
5. **Document every finding** — even if you don't fix it, log it in `ops/50_REPORTS/HARDENING_AUDIT.md`.
6. **Create PRs, don't push to main.** All hardening changes should go through code review.
7. **Don't break production.** If a security header might break functionality, test it in a preview deployment first.
8. **Preserve the governance layer.** Never bypass or weaken the governed-procedure system. If you find governance gaps, add capabilities — don't remove the middleware.

---

## Output Artifacts

When complete, produce:

1. **`ops/50_REPORTS/HARDENING_AUDIT.md`** — Full findings log with status (fixed/documented/deferred)
2. **Updated CI pipeline** (`.github/workflows/ci.yml`) with security scanning
3. **Updated `vercel.json`** with complete security headers including CSP
4. **Dependabot config** (`.github/dependabot.yml`)
5. **Pre-commit hooks** (`.husky/` directory)
6. **Rate limit documentation** (`docs/RATE_LIMITS.md`)
7. **Updated CLAUDE.md** — reflect any architectural changes made

---

## Verification Checklist

Before declaring this hardening pass complete:

- [ ] `pnpm check` passes (no type errors)
- [ ] `pnpm test` passes (all unit tests green)
- [ ] `pnpm build` succeeds (full production build)
- [ ] All P0 items are fixed and committed
- [ ] All P1 items are fixed or have tickets created
- [ ] All P2/P3 items are documented in the audit report
- [ ] No new dependencies introduced without justification
- [ ] No secrets in git history (verified with `gitleaks`)
- [ ] CSP header configured and tested
- [ ] Rate limiting covers all public endpoints
