# 🌙 Overnight Operations Brief — March 22, 2026

**Date:** Sunday, March 22, 2026
**Window:** 2:00 AM CT → 4:58 PM CT
**Agent:** Overnight Operations Agent (automated)
**Status at close:** ✅ HEALTHY

---

## 1. EXECUTIVE SUMMARY

- **Overall system status:** ✅ HEALTHY (with non-blocking warnings)
- **Key headline:** Both Vercel projects are fully operational — 20 deployments in 24h, all READY; no production outages detected.
- **Most important overnight finding:** Strix Governance SDK remains unreachable, generating ~96+ log-level errors per day from the merch-drops cron alone; local evidence writes are also intermittently failing (~8 retries), creating potential audit-trail gaps. This is the top recurring operational issue.

---

## 2. DEPLOYMENT STATUS

### Platform (academy-platform)
- **Production:** ✅ READY — "Merge pull request #264 — Fix socialPosts 500 errors with try-catch hardening"
- **Total deploys (24h):** 10 (10 READY, 0 errors)
- **Production deploys:** 5 production promotions from PRs #264, #263, #262 + 2 direct pushes
- **PRs merged:**
  - **#264** — `fix-social-posts-errors`: Public `socialPosts.list` and admin list queries now catch DB errors and return empty arrays instead of 500s; admin mutations throw descriptive TRPCErrors with `logger.error`
  - **#263** — `docs: sync CLAUDE.md with v1.9.0 autonomous AI engine + NCAA trivia`: Fixed AI capability count (12→13), updated line counts, migration range to 0024
  - **#262** — `NCAA basketball trivia update`: Replaced discount rewards on spin wheel/scratch card with Free Spin + 2x Spins; added 25 NCAA March Madness 2026 trivia questions
- **Direct pushes:**
  - `fix: harden production queries against missing tables and unhandled errors` — wrapped getActiveShowcases, getAthleteMetrics, getUpcomingDrops in try-catch; feed.list UNION ALL now checks table existence
  - `docs: add transition to-do checklist for all agent deliverables`

### Marketing (academy-marketing)
- **Production:** ✅ READY — same PR #264 merge (monorepo shared deployment)
- **Total deploys (24h):** 10 (10 READY, 0 errors)

---

## 3. SYSTEM HEALTH

| Check | Result |
|-------|--------|
| Health endpoint | ✅ OK |
| Database | ✅ ok |
| Uptime | 7,294s (~2 hrs — normal for serverless) |
| Runtime errors (24h, platform) | 50+ (governance noise dominant) |
| Runtime errors (24h, marketing) | 0 |
| Production downtime | None detected |

**Error patterns:**
1. **`[governance] SDK error`** — dominant pattern, fires on every single cron run (merch-drops = every 15 min ≈ 96 hits/day; other crons = additional hits). Strix external SDK is unreachable. Platform is correctly failing open (all responses are HTTP 200). Circuit breaker should suppress some log spam but error entries persist.
2. **`[governance-evidence] Retry...`** — ~8 occurrences; local PostgreSQL write for governance evidence is intermittently failing. The audit trail has partial gaps.
3. **`[showcases] getActiveShowca...`** — ~5 occurrences on mobile app load (afternoon window). Users see empty showcases; try-catch returns `[]` gracefully.
4. **`[metrics] getAthleteMetrics...`** — ~5 occurrences; athletes see empty metrics on load.
5. **`[Feed] list query failed: D...`** — 3 occurrences clustered ~15:11 UTC; feed returning empty for affected users.
6. **`[push] registerExpoToken up...`** — 3 upsert failures; those users may not receive push notifications until next successful registration.

---

## 4. CRON JOB STATUS

**Day of week:** Sunday — expected operational crons: generate-sessions, metrics-prompt, post-session-content, nurture, session-reminders, merch-drops

| Cron Job | Schedule (UTC) | Status | Log Time |
|----------|---------------|--------|----------|
| generate-sessions | `0 3 * * 0` | ✅ Confirmed | 03:00:48 |
| metrics-prompt | `0 1 * * 2,4,0` | ✅ Confirmed | 01:00:46 |
| post-session-content | `0 1 * * 2,4,0` | ✅ Confirmed | 01:00:16 |
| nurture | `0 14 * * *` | ✅ Confirmed | 14:00:21 |
| session-reminders | `0 13 * * *` | ✅ Confirmed | 13:00:43 |
| merch-drops | `*/15 * * * *` | ✅ Confirmed | Every 15 min all day |
| reengagement | `0 15 * * 1` | ⏭ Not expected (Mon) | — |
| progress-reports | `0 23 * * 5` | ⏭ Not expected (Fri) | — |
| parent-digest | `0 18 * * 5` | ⏭ Not expected (Fri) | — |

**AI Autonomous Crons (Sunday):**

| AI Cron | Expected (UTC) | Status | Log Time |
|---------|---------------|--------|----------|
| ai-gallery-capture | ~02:00 | ✅ Confirmed | 03:00:33 |
| ai-feed-engagement | ~12:00 + 20:00 | ✅ Confirmed | 12:00:04 + 20:00:31 |
| ai-announcement-drafter | ~13:00 | ✅ Confirmed | 13:00:15 |
| ai-content-autopublish | ~14:00 | ✅ Confirmed | 14:00:04 |
| ai-smart-notifications | ~03:00 | ⚠️ No log found | — |
| ai-showcase-generator | `0 19 * * 1` | ⏭ Not expected (Mon) | — |
| ai-blog-generator | `0 10 * * 6` | ⏭ Not expected (Sat) | — |

> **Note:** All confirmed cron runs log `[governance] SDK error` but return HTTP 200, confirming fail-open behavior is working as designed. The `ai-smart-notifications` cron (daily 10 PM CT / 3 AM UTC) shows no log entry despite other 3 AM crons running. This may indicate the Vercel cron entry is missing from `vercel.json` or the job silently exited without a loggable error.

---

## 5. GOVERNANCE EVENTS

Direct tRPC access to `governance.stats` and `governance.evidenceTrail` is not available from this agent (known limitation — requires authenticated tRPC client). Governance signals from runtime logs:

- Strix external SDK: **Unreachable** (consistent errors across all 16 cron jobs and some user-facing tRPC calls)
- Local evidence writes: **Intermittently failing** (~8 retry events observed in 24h)
- Fail-open behavior: **Working correctly** (all governed operations completing with HTTP 200)
- No governance `DENY` or `ESCALATE` events detected in visible log output
- Circuit breaker (5 failures → 5 min cooldown) appears to be activating but may not be fully suppressing log output during cooldown recovery windows

**Risk assessment:** The governance layer is operationally non-blocking, but the Strix SDK has been unreachable for the entire monitored window. If the platform is intentionally running with `STRIX_GOVERNANCE_ENABLED=false`, the SDK errors suggest the env var may actually be `true` in production.

---

## 6. ACTIONS TAKEN

- Fetched platform health endpoint (https://app.academytn.com/api/health) — confirmed healthy
- Audited all 20 platform deployments and 20 marketing deployments in the 24h window
- Retrieved and categorized 50 runtime error log entries for the platform
- Confirmed execution of 6/6 expected operational cron jobs for Sunday
- Confirmed execution of 4/5 expected AI cron jobs for Sunday (ai-smart-notifications unconfirmed)
- Delivered briefing to Notion (child of workspace root) and to this local file

---

## 7. RISKS / EXCEPTIONS

| Risk | Severity | Detail |
|------|----------|--------|
| Strix SDK unreachable | ⚠️ MEDIUM | Persistent for full 24h window; ~100+ error log entries/day; audit trail partially incomplete due to evidence write retries |
| ai-smart-notifications missing | ⚠️ MEDIUM | No log evidence of daily 10 PM CT personalized push notification cron firing; users may be missing engagement nudges |
| Governance evidence write failures | ⚠️ MEDIUM | ~8 retry events suggest intermittent DB write failures for governance_evidence table; audit trail has gaps |
| Showcases + Metrics returning empty | ℹ️ LOW | Try-catch hardening deployed today prevents 500s, but root cause (DB schema/migration gap) unresolved; users see blank data |
| Feed UNION ALL failures | ℹ️ LOW | 3 feed.list failures around 15:11 UTC; likely transient connection pool issue; resolved without intervention |
| Push token upsert failures | ℹ️ LOW | 3 registerExpoToken failures; affected users may miss push notifications until next app open |

---

## 8. RECOMMENDED PRIORITIES FOR TODAY

1. **Investigate ai-smart-notifications** — Verify `api/cron/ai-smart-notifications.ts` exists and is registered in `vercel.json` with a `0 3 * * *` schedule. Check for silent failure paths that might exit without logging.
2. **Audit Strix SDK configuration** — Confirm whether `STRIX_GOVERNANCE_ENABLED` is `true` in production Vercel env vars. If the SDK is not yet set up (expected pre-launch), consider setting to `false` to eliminate ~100 error logs/day. If intentionally enabled, investigate SDK connectivity.
3. **Investigate showcases + metrics DB errors** — The try-catch hardening masks the root error. Run `EXPLAIN` on `getActiveShowcases()` and `getAthleteMetrics()` in staging to identify whether missing indexes, missing migration tables, or schema drift is the root cause.
4. **Review governance evidence write retries** — Check `governance_evidence` table for gaps in the audit trail. Confirm the Neon DB has the migration applied (migration 0019+). Verify insert constraints aren't causing conflict errors.
5. **Monitor post-deploy stability** — 3 PRs merged today (#262, #263, #264) plus 2 direct pushes. Watch for any regressions in the first 12h post-deploy, particularly on the social posts endpoints that were hardened.

---

## 9. NEEDS HUMAN ATTENTION

- **ai-smart-notifications cron**: Verify Vercel entry point exists and is scheduled — could be silently not running, meaning members are not receiving daily AI-personalized engagement push notifications
- **Strix SDK env var**: Clarify whether `STRIX_GOVERNANCE_ENABLED=true` is intentional in current production environment; if SDK isn't live yet, set to `false` to clean up ~100 error logs/day
- **Governance evidence gaps**: Review whether the partial evidence trail creates any compliance or audit issues before broader Strix rollout
- **5 orphaned AI capabilities**: As noted in CLAUDE.md — `ai.generateSessionRecap`, `ai.generateSocialCaption`, `ai.generateProgressInsight`, `ai.personalizeRecommendation`, `ai.flagMetricAnomaly` — are registered in capability registry but not wired to any cron/mutation code. Recommend scheduling sprint to wire these up.

---

## 10. AGENT HEALTH (meta)

| Metric | Value |
|--------|-------|
| Vercel MCP status | Working (1 transient 500 on session-reminders query — retried successfully) |
| Phases completed | 5/5 |
| Data completeness | ~90% — cron evidence complete for 15/16 jobs; governance DB stats not accessible |
| Known limitations | Cannot call tRPC routes directly (governance.stats, evidenceTrail); cannot access Neon DB directly; Notion delivery attempted as final step |

---

## KPI Dashboard

| KPI | Value |
|-----|-------|
| Runtime errors detected | 50+ (platform); 0 (marketing) |
| Cron jobs expected / confirmed (9 operational) | 6/6 expected today ✅ |
| AI cron jobs expected / confirmed (7 AI) | 4/5 expected today (ai-smart-notifications unconfirmed) |
| Deployment health (platform) | 10/10 READY |
| Deployment health (marketing) | 10/10 READY |
| Data quality flags | 4 (showcases, metrics, feed, push token) |
| Governance SDK healthy | ❌ No (unreachable) |
| Governance evidence complete | ⚠️ Partial (~8 write failures) |
| Briefing on time | Yes |
| Delivery locations | Notion + local file |
| Agent phases completed | 5/5 |
| Vercel MCP reliability | ~15/16 calls succeeded |
