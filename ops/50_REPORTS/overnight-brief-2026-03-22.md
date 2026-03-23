# OVERNIGHT OPERATIONS BRIEF

**Date:** Sunday, March 22, 2026
**Window:** 10:30 AM CT → 10:40 AM CT

---

## 1. EXECUTIVE SUMMARY

- **Overall system status:** WARNING
- **Key headline:** Platform is live and serving traffic, but Strix governance SDK is unreachable (fail-open) and `socialPosts.list` is returning 500 errors.
- **Most important overnight finding:** A burst of 500 errors on `showcases.active`, `metrics.getByAthlete`, `merchDrops.upcoming`, and `pushNotifications.registerExpo` occurred around 01:04–01:07 UTC — these were resolved by the "harden production queries" deploy at ~07:57 UTC. However, `socialPosts.list` continues to return 500s and needs investigation.

---

## 2. DEPLOYMENT STATUS

### Platform (academy-platform)

- **Production:** READY — latest commit: "Merge pull request #263 — docs: sync CLAUDE.md with v1.9.0 autonomous AI engine + NCAA trivia"
- **Total deploys (24h):** 20 visible (12 production, 8 preview/branch) — all READY
- **ERROR deployments:** 0

**PRs merged (last 24h):**
- PR #263: docs: sync CLAUDE.md with v1.9.0 autonomous AI engine + NCAA trivia
- PR #262: Replace discounts with free spins and add NCAA March Madness 2026 trivia
- PR #261: docs: update CLAUDE.md with governance resilience hardening

**Direct pushes to main:**
- fix: harden production queries against missing tables and unhandled errors
- docs: add transition to-do checklist for all agent deliverables
- merge: reconcile CLAUDE.md with remote governance resilience hardening

### Marketing (academy-marketing)

- **Production:** READY — latest commit mirrors platform PR #263 merge
- **Total deploys (24h):** 20 visible — all READY
- **ERROR deployments:** 0

---

## 3. SYSTEM HEALTH

- **Health endpoint:** OK (uptime: 2,385s / ~40 min since last cold start, database: ok)
- **Runtime errors (24h):** 50+ logged error-level entries (primarily governance SDK errors)
- **500 errors (24h):** 20 identified
  - `socialPosts.list` — 8 occurrences (15:11 UTC and 03:42 UTC) ⚠️ ACTIVE
  - `showcases.active` — 6 occurrences (01:04–01:07 UTC) ✅ FIXED by query hardening deploy
  - `metrics.getByAthlete` — 3 occurrences (01:05 UTC) ✅ FIXED
  - `merchDrops.upcoming` — 2 occurrences (01:07 UTC) ✅ FIXED
  - `metrics.admin.list` — 1 occurrence (01:04 UTC) ✅ FIXED
  - `pushNotifications.registerExpo` — 1 occurrence (01:05 UTC) ✅ FIXED
- **Error patterns:**
  1. **Governance SDK unreachable** — every governed action (cron + admin mutation) logs `[governance] SDK error`. Circuit breaker and fail-open working as designed. ~40+ occurrences/24h.
  2. **Governance evidence retry failures** — intermittent `[governance-evidence] Retry...` errors on evidence persistence (~8 occurrences/24h).
  3. **Feed query failures** — `[Feed] list query failed: D...` at 15:11 UTC (3 occurrences, returns 200 with fallback).
  4. **socialPosts.list 500s** — persists across two time windows, not addressed by query hardening fix.
- **Rate limiting:** 1 instance of 429 on `games.submitTrivia` (working as designed)
- **Marketing site:** Zero runtime errors in 24h

---

## 4. CRON JOB STATUS

**Today is Sunday. Expected jobs and status:**

| Cron Job | Schedule (UTC) | Evidence | Status |
|----------|---------------|----------|--------|
| merch-drops | Every 15 min | ✅ Confirmed running continuously | RUNNING |
| nurture | 14:00 daily | ✅ Confirmed at 14:00 UTC | RAN |
| session-reminders | 13:00 daily | ✅ Confirmed at 13:00 UTC | RAN |
| ai-content-autopublish | 14:00 daily | ✅ Confirmed at 14:00 UTC | RAN |
| ai-announcement-drafter | 13:00 daily | ✅ Confirmed at 13:00 UTC | RAN |
| ai-feed-engagement | 12:00 & 20:00 daily | ✅ Confirmed at 12:00 UTC | RAN (1 of 2) |
| metrics-prompt | 01:00 Tue/Thu/Sun | ⚠️ No error log evidence (may have run clean) | UNCONFIRMED |
| post-session-content | 01:00 Tue/Thu/Sun | ⚠️ No error log evidence (may have run clean) | UNCONFIRMED |
| generate-sessions | 03:00 Sundays | ⚠️ No error log evidence (may have run clean) | UNCONFIRMED |
| ai-gallery-capture | ~02:00 daily | ⚠️ No log evidence | UNCONFIRMED |
| ai-smart-notifications | ~03:00 daily | ⚠️ No log evidence | UNCONFIRMED |

**Note:** Jobs without governance SDK errors may have run successfully without logging errors, or may not have fired. Cannot distinguish without info-level logs or direct DB access.

**Confirmed: 6/11 expected** | **Unconfirmed: 5/11** (no negative evidence — likely ran clean)

---

## 5. GOVERNANCE EVENTS

- **Strix SDK status:** UNREACHABLE — all governance calls failing with SDK errors
- **Circuit breaker:** Active and working (fail-open pattern). Governed actions complete successfully despite SDK unavailability.
- **Evidence persistence:** Mostly working, with intermittent retry failures (~8 in 24h). Evidence table writes appear to recover.
- **Admin mutations:** 2 `admin.members.updateRole` calls at 06:11 UTC — governance SDK errored but mutation proceeded (fail-open).
- **Direct tRPC governance route access:** Not available to this agent (known limitation).

---

## 6. ACTIONS TAKEN

- Verified platform health via `/api/health` endpoint
- Audited all deployments across both Vercel projects (40 total, 0 errors)
- Analyzed runtime error logs for patterns and root causes
- Cross-referenced cron job schedules with execution evidence
- Identified socialPosts.list as an unresolved 500 error source
- Confirmed the query hardening deploy resolved the overnight 500 burst

---

## 7. RISKS / EXCEPTIONS

| Risk | Severity | Detail |
|------|----------|--------|
| `socialPosts.list` returning 500 | **HIGH** | 8 occurrences in 2 time windows. Not fixed by query hardening. Users hitting this endpoint see errors. Needs immediate investigation — likely missing table or schema mismatch. |
| Strix governance SDK unreachable | **MEDIUM** | All 104 governed capabilities logging SDK errors. Fail-open works, but no external policy evaluation is happening. If governance is meant to be enforced, this is a gap. |
| Governance evidence retry failures | **LOW** | Intermittent (~8/24h). Evidence persistence mostly succeeds. Monitor for escalation. |
| Feed query degradation | **LOW** | 3 failures at 15:11 UTC returning 200 with empty fallback. Users see empty feed momentarily. May be related to Drizzle query on missing tables. |
| 5 unconfirmed cron jobs | **LOW** | Cannot verify execution without info-level logs. No negative evidence of failure. |

---

## 8. RECOMMENDED PRIORITIES FOR TODAY

1. **Investigate and fix `socialPosts.list` 500 errors** — This is a user-facing bug. Likely needs the same try-catch hardening pattern applied to the showcases/metrics/merchDrops endpoints. Check if the `socialPosts` table exists and has the expected schema.
2. **Decide on Strix governance posture** — Either configure valid Strix API credentials or disable `STRIX_GOVERNANCE_ENABLED` to eliminate noisy error logs. The circuit breaker is working but the log volume is high.
3. **Verify cron job execution** — Add structured logging (info-level) to cron jobs so overnight agent can confirm execution without relying on error logs. Consider a cron execution tracking table.

---

## 9. NEEDS HUMAN ATTENTION

- **socialPosts.list 500s** — Likely requires a code fix (try-catch wrapper or missing table creation). Apply the same pattern used in the query hardening commit.
- **Strix SDK credentials** — Verify `STRIX_API_KEY`, `STRIX_TENANT_ID`, and `STRIX_API_URL` are correctly configured in Vercel environment variables, or set `STRIX_GOVERNANCE_ENABLED=false` if external governance is not yet needed.
- **Active user session observed** — A user was actively playing games (trivia, spin wheel, scratch card), browsing shop, and using chat around 15:08–15:11 UTC. The socialPosts.list 500s may have been visible to them.

---

## 10. AGENT HEALTH (meta)

- **Vercel MCP status:** Working (all calls succeeded)
- **Phases completed:** 5/5
- **Data completeness:** ~85% (error logs available; info logs not queried separately; no direct DB access for governance evidence)
- **Known limitations this run:**
  - Cannot call tRPC governance routes directly (no HTTP client for authenticated endpoints)
  - Info-level cron logs not separately queried (cron confirmation relies on error-level log presence)
  - No access to governance_evidence table for direct audit

---

## KPI TABLE

| KPI | Value |
|-----|-------|
| Runtime errors detected | 50+ (primarily governance SDK, 20 x 500s) |
| Cron jobs expected / confirmed | 6/11 confirmed, 5/11 unconfirmed |
| Deployment health (platform) | 20/20 READY |
| Deployment health (marketing) | 20/20 READY |
| Data quality flags | 1 (socialPosts.list 500s) |
| Briefing on time | Yes |
| Delivery locations | Notion + file |
| Agent phases completed | 5/5 |
| Vercel MCP reliability | 7/7 calls succeeded |
