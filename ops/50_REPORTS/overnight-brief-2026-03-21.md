# OVERNIGHT OPERATIONS BRIEF
**Date:** Saturday, March 21, 2026
**Window:** 2:00 AM CT → 7:30 AM CT
**Agent:** Overnight Operations Agent (automated run)

---

## 1. EXECUTIVE SUMMARY

| | |
|---|---|
| **Overall system status** | ⚠️ WARNING |
| **Key headline** | Both platforms are fully deployed and serving traffic, but the Strix Governance SDK is persistently unreachable, flooding logs with 40+ errors per 24h window. |
| **Most important overnight finding** | Two hard 500 errors on `merchDrops.admin.create` at 3:35 AM UTC suggest the governance failure may not be failing open cleanly in all mutation paths — this warrants investigation before the next merch drop admin session. |

---

## 2. DEPLOYMENT STATUS

### Platform (academy-platform)
- **Production:** ✅ READY — `Merge pull request #260 — Claude/update claude md omv nl`
- **Total deploys (24h):** 20 (20 READY, 0 errors)
- **Production deploys in window:** 6 (PRs #248, #256, #257, #258, #259, #260)
- **PRs merged:**
  - #256 — Fix governance evidence trail breaking when migration 0022 not applied
  - #257 — Fix governance evidence trail: bypass Drizzle schema, use raw SQL
  - #258 — Docs: governance embedded kernel architecture
  - #259 — Docs: sync CLAUDE.md with current codebase state (v1.8.3 build 35)
  - #260 — Claude/update claude md omv nl (CLAUDE.md maintenance)

### Marketing (academy-marketing)
- **Production:** ✅ READY — same PR #260 trigger (shared monorepo)
- **Total deploys (24h):** 20 (20 READY, 0 errors)

> **Note:** Extremely high deployment velocity (40 total across both projects in 24h). All governance-focused — evidence trail debugging and CLAUDE.md documentation sync. Zero failed builds.

---

## 3. SYSTEM HEALTH

| Check | Status | Detail |
|---|---|---|
| Health endpoint | ✅ OK | `https://app.academytn.com/api/health` responded 200 |
| Database | ✅ OK | `checks.database: ok` |
| Server uptime | ⚠️ Low | 1,047 seconds (~17.5 min) — recent cold start at check time |
| Runtime errors (24h) | ⚠️ 50 | All portal; marketing has 0 errors |
| Error patterns | ⚠️ See Section 4 | Governance SDK + OAuth + 2× 500s + Feed DB errors |

**Uptime note:** The serverless function cold-started shortly before the 7:22 AM UTC health check. This is expected behavior for Vercel serverless — not an incident.

---

## 4. RUNTIME ERROR PATTERNS (24h)

### Pattern 1 — [governance] SDK error (HIGH VOLUME)
**Count:** ~35 occurrences | **Severity:** Medium (system fails open)
**Endpoints:** `/api/cron/merch-drops` (every 15 min) + admin tRPC mutations
**Affected mutations:** `admin.schedules.create`, `admin.schedules.delete`, `admin.members.updateRole`, `admin.members.assignProgram`, `merchDrops.admin.create`
**Root cause:** `STRIX_GOVERNANCE_ENABLED=true` but Strix SDK API is unreachable. The `governedProcedure()` wrapper logs the error and fails open (allows the action). Cron jobs auto-approve with evidence recording — but evidence write is also failing.
**Risk:** Low for operations (actions complete), Medium for audit trail integrity.

### Pattern 2 — [OAuth] ERROR: OAUTH_SERVER (~10 occurrences)
**Endpoints:** `/api/cron/merch-drops` (intermittent ~hourly)
**Pattern:** Appears alongside governance errors on some cron runs. May indicate OAuth token refresh failures in the serverless cron context.
**Risk:** Low — cron returns 200 despite OAuth error.

### Pattern 3 — [governance-evidence] Retry (~4 occurrences)
**Context:** Evidence persistence retry logic firing when Strix SDK unreachable.
**Risk:** Low — expected behavior when SDK is down.

### Pattern 4 — admin.members.updateRole 403 (3 occurrences)
**Time:** 3:42–3:50 AM UTC
**Note:** Active admin session at unusual hours. 3× role update attempts denied by access control. May be permission boundary testing or a user hitting the wrong endpoint. Not a system error — RBAC working as designed.

### Pattern 5 — merchDrops.admin.create 500 ⚠️
**Count:** 2 occurrences at 03:35:35 and 03:35:37 UTC
**Severity:** HIGH — actual failures, not governance noise
**Context:** During same admin session as role update denials (3:35–3:52 AM UTC). The governance SDK error is logged, but endpoint returned 500, not 200 — suggesting governance failure is NOT failing open for this mutation path.
**Action required:** Verify `governedProcedure()` fail-open logic covers `merchDrops.admin.create`. Check if error was user-triggered retry of a bad request vs. a code path bug.

### Pattern 6 — feed.list query failed (2 occurrences)
**Times:** 23:53 UTC (March 20) and 00:59 UTC (March 21)
**Message prefix:** `[Feed] list query failed: D...` (truncated — likely a Drizzle/DB error)
**Context:** The feed UNION ALL query (videos + gallery + session recaps + milestones) failing intermittently. Could be transient DB connection issue or query timeout.
**Risk:** Medium — members see empty feed when this fires.

---

## 5. CRON JOB STATUS

**Today is Saturday, March 21.** Cron schedules are in UTC.

| Job | Schedule (UTC) | Expected in Window | Confirmed | Notes |
|---|---|---|---|---|
| merch-drops | `*/15 * * * *` | ✅ Every 15 min | ✅ CONFIRMED | Consistent every-15-min pattern in logs |
| session-reminders | `0 13 * * *` | ✅ Fri Mar 20 13:00 | ⚠️ Unconfirmed | No log evidence — may have run silently (info-level) |
| nurture | `0 14 * * *` | ✅ Fri Mar 20 14:00 | ⚠️ Unconfirmed | No log evidence — may have run silently |
| parent-digest | `0 18 * * 5` | ✅ Fri Mar 20 18:00 | ⚠️ Unconfirmed | No log evidence — may have run silently |
| progress-reports | `0 23 * * 5` | ✅ Fri Mar 20 23:00 | ✅ CONFIRMED | Logged at 23:00:39, returned 200 (with OAuth error) |
| reengagement | `0 15 * * 1` | ❌ Not today | — | Mondays only |
| generate-sessions | `0 3 * * 0` | ❌ Not today | — | Sundays only (fires Mar 22) |
| metrics-prompt | `0 1 * * 2,4,0` | ❌ Not today | — | Tue/Thu/Sun only |
| post-session-content | `0 1 * * 2,4,0` | ❌ Not today | — | Tue/Thu/Sun only |

**Limitation:** Vercel log queries can only surface error-level logs via text search. Cron jobs that run successfully (info-level only) do not appear. The 3 unconfirmed jobs are unconfirmed — not confirmed failed.

---

## 6. GOVERNANCE EVENTS

Direct tRPC governance route access is not currently possible from the overnight agent (known limitation — cannot call tRPC procedures directly). Governance findings from runtime logs:

- Governance SDK is unreachable for the full 24h monitoring window
- Evidence writes failing with retry logic (governance-evidence retries visible in logs)
- Evidence trail is being written locally (raw SQL fallback — implemented in PRs #256–#257)
- ~13 rows previously noted in governance_evidence table (from yesterday's debugging sessions)
- Admin activity at 3:35–3:52 AM generated governance events on: schedules.create (×3), schedules.delete (×2), members.assignProgram (×2), members.updateRole (×4), merchDrops.admin.create (×2)

---

## 7. ACTIONS TAKEN

- ✅ Health endpoint verified (WebFetch to production URL)
- ✅ Deployment audit completed for both platform and marketing
- ✅ Runtime error logs pulled and analyzed (50 error-level entries)
- ✅ Cron execution cross-referenced against logs
- ✅ Morning Briefing assembled and delivered to Notion + local file
- No destructive or write actions taken (observation-only run)

---

## 8. RISKS / EXCEPTIONS

| Risk | Severity | Detail |
|---|---|---|
| Governance SDK persistently unreachable | **MEDIUM** | 40+ error logs/24h; evidence trail integrity degraded; audit trail may have gaps |
| `merchDrops.admin.create` returning 500 | **HIGH** | Fail-open may not be working for this mutation; 2 back-to-back failures at 3:35 AM UTC |
| Feed list query failures (2×) | **MEDIUM** | Members see empty feed on intermittent DB errors; no retry/stale-while-revalidate |
| OAuth server errors on cron | **LOW** | Intermittent; crons complete despite error; may indicate token refresh issue |
| Unconfirmed cron execution (3 jobs) | **LOW** | session-reminders, nurture, parent-digest unverifiable from error logs alone |
| Server cold start at check time | **INFO** | 17-min uptime normal for serverless; not an incident |

---

## 9. RECOMMENDED PRIORITIES FOR TODAY

1. **Investigate `merchDrops.admin.create` 500 errors** — Confirm whether `governedProcedure()` fails open correctly for this route. Check if the 3:35 AM failures were user error (bad input) or a code path that doesn't handle SDK failure. Review the governance wrapper for this specific mutation.
2. **Triage Strix SDK connectivity** — Confirm whether `STRIX_GOVERNANCE_ENABLED=true` is intentional in production. If Strix is not yet active, setting this to `false` would eliminate ~35 error logs per day and restore clean log visibility. If Strix is intended to be active, verify `STRIX_API_KEY`, `STRIX_TENANT_ID`, and `STRIX_API_URL` env vars.
3. **Investigate feed.list DB errors** — Pull full error message for `[Feed] list query failed: D...` to confirm whether this is a Drizzle timeout, missing index, or transient Neon connection blip. Consider adding a retry or error boundary on the feed UNION ALL query.
4. **Verify parent-digest and nurture ran Friday** — Confirm with Resend email logs or DB records that nurture drip emails and parent weekly digests were sent Friday. Cannot confirm from Vercel logs alone.
5. **Review unusual 3:35–3:52 AM admin session** — Active admin mutations at 3:35 AM UTC (10:35 PM CT Friday night) included merch drop creation failures and role update denials. Verify this was an authorized session.

---

## 10. NEEDS HUMAN ATTENTION

- **`merchDrops.admin.create` 500 errors** — Requires code-level investigation of `governedProcedure()` fail-open behavior
- **Strix SDK env var audit** — Is `STRIX_GOVERNANCE_ENABLED=true` in production intentional? Strix has been unreachable for the full 24h window
- **Feed list error details** — Log message truncated at `D...`; full message needed to diagnose DB issue
- **Cron verification gap** — Agent cannot confirm 3 of 5 expected daily crons without info-level log access or DB inspection
- **OAuth server errors on cron** — May need token refresh review for cron auth context

---

## 11. AGENT HEALTH (meta)

| Metric | Value |
|---|---|
| Vercel MCP status | ✅ Working (all calls succeeded) |
| Phases completed | 5/5 |
| Data completeness | ~80% (cron confirmation gap limits full confidence) |
| Known limitations | Cannot call tRPC routes directly; cron success unverifiable without error-level output; log messages truncated in table view |

---

## KPI DASHBOARD

| KPI | Value |
|---|---|
| Runtime errors detected | 50 |
| Cron jobs expected / confirmed | 5 expected / 2 confirmed (3 unverifiable) |
| Deployment health (platform) | 20/20 READY |
| Deployment health (marketing) | 20/20 READY |
| Data quality flags | 3 (governance evidence gaps, feed failures, 500 on admin create) |
| Briefing on time | Yes |
| Delivery locations | Notion + local file |
| Agent phases completed | 5/5 |
| Vercel MCP reliability | 6/6 calls succeeded |
