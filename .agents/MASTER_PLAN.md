# Academy Platform — Agent Coordination Master Plan

> **Every agent MUST read this file first before doing any work.**
> Updated: 2026-02-23

---

## How This System Works

### Rules for All Agents

1. **Read `MASTER_PLAN.md` first** — understand priorities, your assignment, and boundaries.
2. **Read your workstream file** — contains detailed tasks, decisions made, and context.
3. **Update `STATUS.md`** before and after your session — mark what you started, what you finished, what's blocked.
4. **Stay in your lane** — only modify files within your assigned workstream. If you discover a cross-cutting issue, log it in `review-log.md`.
5. **Never duplicate work** — check STATUS.md to see if another agent already handled something.
6. **Test before declaring done** — run the appropriate build/check command for your app before marking a task complete.
7. **Log decisions** — if you make an architectural or design choice, document it in your workstream file under "Decisions Made."

### File Index

| File | Purpose | Who Updates |
|------|---------|-------------|
| `MASTER_PLAN.md` | Priorities, assignments, rules (this file) | Coordinator only |
| `STATUS.md` | Living progress tracker across all workstreams | Every agent, every session |
| `mobile-app.md` | Mobile app v1.3 tasks, specs, decisions | Mobile agent |
| `web-portal.md` | Member portal enhancements | Portal agent |
| `marketing-site.md` | Marketing site + SEO work | Marketing/SEO agent |
| `competitive-intel.md` | Competitor research & feature adoption ideas | Research agent |
| `review-log.md` | QA findings, cross-cutting issues, bugs | Any agent |

---

## Platform Overview (Quick Reference)

| App | Directory | Package Manager | Build Command | Deploy |
|-----|-----------|-----------------|---------------|--------|
| Marketing Site | `academy-marketing/` | npm | `npm run build` | Vercel (auto) |
| Member Portal | `client/` + `server/` | pnpm | `pnpm build` | Vercel (auto) |
| Mobile App | `academy-app/` | npm | `eas build` | App Store / Play Store (manual) |

**Styling is separate per app. Never mix design systems.**

---

## Strategic Priorities (Ordered)

### P0 — Foundation & Coordination
- [x] Create agent coordination system
- [ ] Audit current state of all three apps
- [ ] Identify quick wins across all apps

### P1 — Revenue Impact (Highest Business Value)
- [ ] **Mobile: In-app payments** — Stripe checkout for programs + merch (eliminates website redirect friction)
- [ ] **Marketing: SEO enhancements** — structured data, meta optimization, Core Web Vitals
- [ ] **Portal: Payment flow improvements** — subscription management, receipt access

### P2 — User Engagement & Retention
- [ ] **Mobile: Enhanced dashboard** — attendance stats, quick actions, content feed
- [ ] **Mobile: Attendance tracking** — history, streaks, calendar view
- [ ] **Mobile: Notification preferences** — quiet hours, per-category toggles
- [ ] **Portal: UX review** — identify and fix friction points
- [ ] **Marketing: Content & conversion optimization** — CTAs, social proof, page speed

### P3 — Feature Parity & Content
- [ ] **Mobile: Content hub** — gallery, videos, blog, coach profiles
- [ ] **Mobile: Chat enhancements** — all rooms, image upload, @mentions, reactions
- [ ] **Mobile: Calendar integration** — native calendar sync
- [ ] **Portal: Feature gaps** — based on functionality review

### P4 — Polish & Differentiation
- [ ] **Mobile: Onboarding flow** — animated walkthrough, permissions, profile completion
- [ ] **Mobile: UI polish** — skeleton screens, animations, haptics, dark mode
- [ ] **Mobile: Offline support** — caching, message queue
- [ ] **Marketing: Competitor feature adoption** — based on competitive intel
- [ ] **All: Accessibility improvements** — VoiceOver, dynamic fonts, color contrast

---

## Agent Assignments

### Agent 1: Mobile App (academy-app/)
**Workstream file**: `mobile-app.md`
**Scope**: All changes inside `academy-app/` directory
**Key tasks**:
- Implement v1.3 Tier 1-3 features from the roadmap
- Bump version to 1.3.0 in app.json
- Add new dependencies as needed (npm only)
- Connect unused tRPC routes (47 untapped API endpoints)
- UI improvements: skeleton screens, animations, haptics

**Build verification**: `cd academy-app && npm install && npx expo start`
**Do NOT touch**: `client/`, `server/`, `academy-marketing/`, `shared/`

### Agent 2: Web Portal (client/ + server/)
**Workstream file**: `web-portal.md`
**Scope**: `client/`, `server/`, `shared/`, `drizzle/`, `api/`, `e2e/`
**Key tasks**:
- UX/functionality review of all portal pages
- Fix identified issues and friction points
- Enhance payment flows, subscription management
- Improve admin tools
- Address any API issues that affect mobile

**Build verification**: `pnpm build && pnpm check`
**Do NOT touch**: `academy-marketing/`, `academy-app/`

### Agent 3: Marketing Site + SEO (academy-marketing/)
**Workstream file**: `marketing-site.md`
**Scope**: `academy-marketing/` directory only
**Key tasks**:
- SEO audit and optimization (meta tags, structured data, sitemap)
- Page speed / Core Web Vitals improvements
- Content and conversion optimization
- New pages or sections as needed
- All changes must go through `lib/config.ts` for business data

**Build verification**: `cd academy-marketing && npm run build && npm run validate`
**Do NOT touch**: `client/`, `server/`, `academy-app/`

### Agent 4: Research & Competitive Intel
**Workstream file**: `competitive-intel.md`
**Scope**: Research only — no code changes
**Key tasks**:
- Analyze competitor apps (TeamSnap, SportsEngine, GameChanger, etc.)
- Identify features to adopt
- Research best practices for youth sports platforms
- SEO competitive analysis
- Document actionable recommendations for other agents

**Output**: Recommendations in `competitive-intel.md`, flagged items in `review-log.md`
**Do NOT touch**: Any application code

---

## Cross-Cutting Concerns

These issues span multiple apps and need coordination:

1. **Testimonials live in two places** — `academy-marketing/lib/config.ts` AND `client/src/components/StructuredData.tsx`. Any testimonial changes must update both.
2. **Coach contact info** — hardcoded in mobile `profile.tsx`, should come from API (`coaches.list`). Portal agent may need to verify API availability.
3. **Program data** — marketing site uses `config.ts`, mobile uses tRPC `programs.list`. Ensure pricing and details stay in sync.
4. **Auth** — All apps use Clerk. Mobile is Clerk-only (no OAuth fallback). Portal has OAuth fallback.
5. **No CI/CD** — Quality gates are manual. Each agent must run their own builds/tests.

---

## Version Targets

| App | Current Version | Target Version | Notes |
|-----|----------------|----------------|-------|
| Mobile App | 1.2.0 (build 16) | 1.3.0 (build 17+) | Bump in app.json |
| Member Portal | — | — | No version tracking |
| Marketing Site | — | — | No version tracking |

---

## Definition of Done

A task is "done" when:
1. Code is written and saved
2. Build passes (`npm run build` / `pnpm build` / `npx expo start`)
3. No regressions in existing functionality
4. Workstream file is updated with what was done
5. STATUS.md is updated with completion
6. Any cross-cutting impacts are noted in review-log.md
