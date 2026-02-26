# Release Plan

> Mobile App release plan. Web portal and marketing site deploy continuously via Vercel.

---

## Version Targets

| App | Current | v1.3.0 Target | v1.4.0 Target | Notes |
|-----|---------|---------------|---------------|-------|
| Mobile App | 1.2.0 (build 16) | 1.3.0 (build 17) | 1.4.0 (build 18+) | Each requires App Store review |
| Web Portal | continuous | continuous | Clips backend must deploy before v1.4 mobile | Auto-deploy on push |
| Marketing Site | continuous | continuous | — | Auto-deploy on push |

---

## v1.3.0 — Revenue + Retention (Single App Store Submission)

**Principle**: v1.3.0 ships ONLY features that consume existing backend routes. Zero new DB tables, zero new tRPC routes, zero backend risk. This is a mobile-only release.

### What Is NOT in v1.3.0

Explicitly excluded to protect velocity and reduce risk:

- **Video & Clips** — Cross-stack feature requiring new schema, tRPC router, storage workflow, oEmbed integration, deep link infrastructure. Ships in v1.4.0.
- **New Architecture** — `newArchEnabled: true` is isolated infrastructure work (MOB-029). Separate branch, separate timeline. See RULES.md.
- **Any new backend routes** — v1.3.0 consumes the existing 47 untapped API routes. If a route is missing or broken, the Portal Agent fixes it via WEB-002.

### Internal Execution Phases (Single Release, Internal Gating)

v1.3.0 is one App Store submission. These phases are internal sequencing only — not separate releases.

---

#### Phase A — Revenue Infrastructure `[REVENUE]`

**Tickets**: MOB-001, MOB-002, MOB-003, MOB-004, MOB-005, MOB-006

| Ticket | Feature | Impact |
|--------|---------|--------|
| MOB-001 | Version bump + dependency foundation | `[INFRA]` |
| MOB-002 | All 4 chat rooms enabled | `[RETENTION]` |
| MOB-003 | Coach contact from API | `[UX]` |
| MOB-004 | In-app program enrollment (Stripe) | `[REVENUE]` |
| MOB-005 | Subscription management | `[REVENUE]` |
| MOB-006 | Merchandise shop | `[REVENUE]` |

**Gate**:
- [ ] `npx expo start` clean, all existing features work
- [ ] Payment flows work end-to-end on real device (Stripe test mode)
- [ ] QA checklist Section A passed
- [ ] First TestFlight build

---

#### Phase B — Retention Infrastructure `[RETENTION]`

**Tickets**: MOB-007, MOB-008, MOB-009

| Ticket | Feature | Impact |
|--------|---------|--------|
| MOB-007 | Enhanced dashboard (stats, quick actions, content feed, payments) | `[RETENTION]` |
| MOB-008 | Attendance tracking (history + stats + calendar) | `[RETENTION]` |
| MOB-009 | Notification preferences (toggles + quiet hours + per-convo mute) | `[RETENTION]` |

**Gate**:
- [ ] API responses verified (no null crashes)
- [ ] Dashboard loads in < 2 seconds
- [ ] All new screens have 3 states (loading, error, empty)
- [ ] Analytics events firing for all new features
- [ ] Second TestFlight build

---

#### Phase C — Experience Upgrade `[UX]`

**Tickets**: MOB-010, MOB-018, MOB-020, MOB-019, MOB-028, MOB-027

| Ticket | Feature | Impact |
|--------|---------|--------|
| MOB-010 | Chat image upload | `[ENGAGEMENT]` |
| MOB-018 | Onboarding flow (walkthrough + permissions + profile completion) | `[UX]` |
| MOB-020 | Content hub (gallery, videos, blog, coaches) | `[ENGAGEMENT]` |
| MOB-019 | Skeleton loading screens (replace all spinners) | `[UX]` |
| MOB-028 | Haptic feedback | `[UX]` |
| MOB-027 | App Store rating prompt | `[RETENTION]` |

**Gate**:
- [ ] Cold start test: login → dashboard in < 3 seconds
- [ ] Push permission flow works on fresh install
- [ ] Onboarding completes without crashes
- [ ] All content loads, images upload reliably
- [ ] No App Store guideline violations
- [ ] Full QA checklist pass (CHECKLIST_QA.md)
- [ ] App Store checklist pass (CHECKLIST_APP_STORE.md)

**→ Version bump → Build increment → Single App Store Submission**

---

## v1.4.0 — Video & Clips (New Backend + Mobile)

**Principle**: v1.4.0 is a cross-stack release. Portal Agent builds the backend (DB schema, tRPC routes, storage, oEmbed, deep links). Mobile Agent builds the UI. Backend must deploy and stabilize BEFORE mobile work begins.

**Prerequisites**: v1.3.0 must be live in App Store. No Clips work begins until v1.3.0 ships.

### Backend Phase (Portal Agent — must deploy first)

| Ticket | Feature | Impact |
|--------|---------|--------|
| WEB-020 | Video/Clips database schema + migration | `[INFRA]` |
| WEB-021 | Video tRPC router (upload, confirm, feed, like, delete, share) | `[INFRA]` |
| WEB-022 | Video storage upload strategy (Forge CDN) | `[INFRA]` |
| WEB-023 | External links (oEmbed allowlist) | `[ENGAGEMENT]` |
| WEB-024 | Chat/DM video integration (wire videoId into existing routes) | `[ENGAGEMENT]` |
| WEB-025 | Share link generation (deep link + universal link URLs) | `[ENGAGEMENT]` |
| WEB-026 | Universal link infrastructure (Vercel rewrite + AASA + assetlinks) | `[INFRA]` |

**Ship criteria**: All routes functional, `pnpm build && pnpm check` pass, existing chat/DM unaffected
**Target**: Deploy to production via Vercel, notify Mobile Agent via STATUS.md
**Stabilization**: Minimum 48 hours in production before mobile starts

### Mobile Phase (Mobile Agent — starts after backend deploys)

| Ticket | Feature | Impact |
|--------|---------|--------|
| MOB-030 | Clips tab + feed screen | `[ENGAGEMENT]` |
| MOB-031 | Clip upload flow (record/choose/paste link) | `[ENGAGEMENT]` |
| MOB-032 | Video in chat + DMs | `[ENGAGEMENT]` |
| MOB-033 | Clips deep links + sharing | `[DIFFERENTIATION]` |

**Ship criteria**: Feed loads, upload works, clips playable, sharing generates valid deep links
**Target**: TestFlight build → App Store submission

---

## Release Cadence

### Mobile
- **TestFlight builds**: After each internal phase gate (A, B, C)
- **App Store submission**: After Phase C gate passes — single submission
- **Submit early in week** (Mon-Tue) to avoid weekend review delays
- **OTA updates**: After EAS Update channel is configured (MOB-001), JS-only changes can ship without App Store review

### Web Portal
- **Deploy**: Auto on push to main via Vercel
- **QA checklist required** for significant changes (especially before v1.4 Clips backend)

### Marketing Site
- **Deploy**: Auto on push to main via Vercel
- **Validate before push**: `npm run build && npm run validate`

---

## Pre-Submit Checklist — v1.3.0

Before submitting v1.3.0 to App Store:

1. [ ] All Phase A, B, C gates passed
2. [ ] CHECKLIST_QA.md fully passed
3. [ ] CHECKLIST_APP_STORE.md fully passed
4. [ ] Version is 1.3.0, buildNumber is 17 in app.json
5. [ ] Release notes written in RELEASE_NOTES.md
6. [ ] No CRITICAL or HIGH items open in STATUS.md
7. [ ] PostHog events verified for all new features
8. [ ] Crash reporting active (Sentry or equivalent)
9. [ ] Skeleton screens on all new screens (no spinners)
10. [ ] Onboarding flow tested on fresh install

## Pre-Submit Checklist — v1.4.0

Before submitting v1.4.0 to App Store:

1. [ ] v1.3.0 live in App Store (prerequisite)
2. [ ] All WEB-020 through WEB-026 deployed and stable (min 48 hours in production)
3. [ ] All MOB-030 through MOB-033 tickets complete
4. [ ] CHECKLIST_QA.md fully passed (including new Clips section)
5. [ ] Version is 1.4.0, buildNumber is 18+ in app.json
6. [ ] Deep links verified on real device
7. [ ] Universal links verified OR follow-up ticket documented
