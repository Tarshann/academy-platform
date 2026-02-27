# Agent Operating Rules

> Non-negotiable. Every agent follows these. No exceptions.

---

## Read Order (Every Session)

1. `ops/00_READ_FIRST/VISION.md` — understand the mission
2. `ops/00_READ_FIRST/RULES.md` — understand how we work (this file)
3. `ops/00_READ_FIRST/QUALITY_BAR.md` — understand what "done" means
4. `ops/10_BACKLOG/NOW.md` — see what's currently in flight
5. Your workstream file in `ops/20_WORKSTREAMS/` — see your specific tasks and context
6. `ops/50_REPORTS/STATUS.md` — check for blockers, recent completions, cross-cutting issues

---

## Ownership Rules

1. **One owner per workstream.** No shared ownership. If two agents need to touch the same area, one leads and the other files a ticket.
2. **Stay in your lane.** Only modify files within your assigned directories. If you find an issue outside your scope, log it — don't fix it.
3. **No drive-by refactors.** Every code change must trace back to a ticket in the backlog. "While I was in here, I also..." is how regressions happen.

## Ticket Rules

1. **Every piece of work has a ticket.** No ticket = no work.
2. **Tickets live in `NOW.md`, `NEXT.md`, or `LATER.md`.** Move them as they progress.
3. **Use the ticket template.** Every ticket has: ID, goal, scope, non-goals, acceptance criteria, touched files, test plan, and telemetry.
4. **One agent per ticket.** Assign yourself by adding your workstream name to the Owner field.
5. **Small scope.** Each ticket should be completable in a single session. If it's too big, split it.

## Code Rules

1. **Correct package manager.** Root = pnpm. Marketing = npm. Mobile = npm. Get this wrong and you break lockfiles.
2. **Build before declaring done.** Run the build command for your app. If it fails, you're not done.
3. **No regressions.** Existing features must keep working. If you break something, fix it before moving on.
4. **Backwards compatibility on API routes.** Mobile consumes server routes. Changing a route signature without a coordinated ticket breaks the app in production.
5. **Config is the source of truth.** Marketing business data lives in `academy-marketing/lib/config.ts`. Pages are renderers. Never hardcode business data in components.

## Completion & Verification Rules

1. **No ticket is DONE without a commit reference.** Every ticket moved to the DONE section must include the commit SHA or PR number that delivered the work. If the work is observation-only (audits, research), include the commit that recorded the findings. No exceptions.
2. **Git is the source of truth.** Agent session summaries are claims. The repo is evidence. If a summary says "15 tickets done" but git shows no new files, the tickets are not done.
3. **Verify before marking DONE.** Before moving a ticket to DONE, confirm the acceptance criteria are met by checking the actual repo state — not by trusting your own session memory.

## Status Updates

1. **Update `STATUS.md` at the start of every session** — log what you're working on.
2. **Update `STATUS.md` at the end of every session** — log what you completed, what's blocked, what you learned.
3. **Move tickets** — when you finish a ticket, move it from `NOW.md` to the completed section. When you start one, mark it `IN PROGRESS`.
4. **Log decisions** — if you make an architectural or design choice, create an ADR in `ops/30_DECISIONS/`.
5. **Log cross-cutting issues** — if you find something that affects another workstream, add it to `STATUS.md` under Cross-Cutting Issues.

## UI & Design Rules

1. **Each app has its own design system.** Never mix them.
2. **Design tokens are centralized per app.** Don't invent new colors, spacing, or typography. Use what exists.
3. **New components need a reuse plan.** Before creating a component, check if one already exists. If you must create one, make it reusable.
4. **Skeleton screens, not spinners** for mobile (v1.3 quality bar).
5. **Every screen needs three states:** loading, error, and empty. No blank screens.

## Telemetry Rules

1. **Every user-facing feature adds/updates PostHog events.** No exceptions.
2. **Name events consistently:** `{domain}_{action}` (e.g., `chat_image_upload_success`, `payment_checkout_started`).
3. **Track failures too**, not just successes. Failed payments, failed registrations, failed sends — all tracked.

## Business Impact Tags (Required)

Every ticket in NOW.md and NEXT.md must carry a business impact tag. This prevents scope creep and keeps work tied to outcomes.

**Tags:**
- `[REVENUE]` — Directly increases revenue (payments, checkout, subscriptions)
- `[RETENTION]` — Keeps members coming back (attendance, notifications, dashboard)
- `[UX]` — Improves user experience (onboarding, skeletons, loading states)
- `[STABILITY]` — Reduces crashes, bugs, regressions (error handling, crash reporting)
- `[INFRA]` — Supports future features (schema, storage, CI, version bumps)
- `[ENGAGEMENT]` — Drives daily usage and sharing (clips, content, social features)
- `[DIFFERENTIATION]` — Separates us from competitors (unique features)
- `[SEO]` — Improves search visibility
- `[RESEARCH]` — Informs future decisions

**Rule:** Nothing moves from NOW → DONE without a tag. If a ticket doesn't clearly map to one of these, question whether it belongs in the current release.

## New Architecture Isolation Rule

React Native New Architecture (`newArchEnabled: true`) is **an isolated infrastructure change**, not a feature.

1. **Separate branch.** New Architecture work lives on its own branch. It does not ride along with feature work.
2. **No feature bundling.** Do not enable New Architecture in the same PR/session as any MOB feature ticket.
3. **Dedicated ticket.** MOB-029 is the only ticket that touches `newArchEnabled`. No other ticket enables it.
4. **Rollback plan required.** Before merging, document how to revert if New Architecture causes runtime issues.
5. **Performance comparison.** Measure cold start, navigation, and scroll performance before and after. Log results in STATUS.md.

## Release Rules

1. **No release without QA checklist completion** (see `ops/40_RELEASES/CHECKLIST_QA.md`).
2. **Bump version numbers before building.** Mobile: `app.json` version + buildNumber. Web: no versioning (auto-deploy).
3. **Release notes are mandatory** (see `ops/40_RELEASES/RELEASE_NOTES.md`).
4. **iOS App Store submissions go out early in the week** to avoid weekend review delays.
5. **One App Store submission per version.** Do not plan "polish releases" (v1.3.1) as separate submissions. Polish work belongs in the Definition of Done for the current version.

---

## Directory Ownership Map

| Agent | Owns | Can Touch | Cannot Touch |
|-------|------|-----------|-------------|
| Mobile Agent | `academy-app/**` | — | `client/`, `server/`, `academy-marketing/` |
| Portal Agent | `client/**`, `server/**`, `shared/**`, `drizzle/**`, `api/**`, `e2e/` | — | `academy-marketing/`, `academy-app/` |
| Marketing/SEO Agent | `academy-marketing/**` | — | `client/`, `server/`, `academy-app/` |
| Competitor Intel Agent | `ops/20_WORKSTREAMS/competitor-intel.md`, `ops/50_REPORTS/` | — | All application code |
| QA/Release Agent | `ops/40_RELEASES/**`, `ops/50_REPORTS/` | Read-only on all app code | No code changes |
