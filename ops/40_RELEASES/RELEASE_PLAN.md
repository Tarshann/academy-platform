# Release Plan — v1.3.0

> Mobile App release plan. Web portal and marketing site deploy continuously via Vercel.

---

## Version Targets

| App | Current | Target | Notes |
|-----|---------|--------|-------|
| Mobile App | 1.2.0 (build 16) | 1.3.0 (build 17) | Requires App Store review |
| Web Portal | continuous | continuous | Auto-deploy on push to main |
| Marketing Site | continuous | continuous | Auto-deploy on push to main |

---

## Mobile v1.3.0 Release Milestones

### Milestone 1: Foundation ✦ Unblocks everything
- [ ] MOB-001: Version bump + dependency foundation
- [ ] MOB-002: All 4 chat rooms enabled
- [ ] MOB-003: Coach contact from API
- **Ship criteria**: `npx expo start` clean, all existing features work
- **Target**: Complete before any other mobile work begins

### Milestone 2: Revenue ✦ Highest business value
- [ ] MOB-004: In-app program enrollment (Stripe)
- [ ] MOB-005: Subscription management
- [ ] MOB-006: Merchandise shop
- **Ship criteria**: Payment flows work end-to-end on real device
- **Target**: First TestFlight build after this milestone

### Milestone 3: Engagement ✦ Daily usage drivers
- [ ] MOB-007: Enhanced dashboard
- [ ] MOB-008: Attendance tracking
- [ ] MOB-009: Notification preferences
- **Ship criteria**: Dashboard loads in < 2 seconds, all new screens have 3 states
- **Target**: Second TestFlight build

### Milestone 4: Video & Clips ✦ Differentiator
- **Backend prerequisite**: WEB-020, WEB-021, WEB-022 must be deployed first (Portal Agent)
- [ ] MOB-030: Clips tab + feed screen
- [ ] MOB-031: Clip upload flow
- [ ] MOB-032: Video in chat + DMs
- [ ] MOB-033: Clips deep links + sharing
- **Ship criteria**: Feed loads, upload works, clips playable, sharing generates valid deep links
- **Target**: Third TestFlight build

### Milestone 5: Content + Chat ✦ Feature depth
- [ ] MOB-010: Chat image upload
- [ ] MOB-020: Content hub (gallery, videos, blog, coaches)
- **Ship criteria**: All content loads, images upload reliably
- **Target**: Release candidate

### Milestone 6: Polish + Submit ✦ App Store ready
- [ ] MOB-019: Skeleton loading screens
- [ ] MOB-028: Haptic feedback
- [ ] MOB-027: App Store rating prompt
- [ ] Full QA checklist pass (CHECKLIST_QA.md)
- [ ] App Store checklist pass (CHECKLIST_APP_STORE.md)
- **Ship criteria**: No critical/high bugs, all checklists green
- **Target**: App Store submission

---

## Release Cadence

### Mobile
- **TestFlight builds**: After each milestone (internal testing)
- **App Store submission**: After Milestone 5 QA pass
- **Submit early in week** (Mon-Tue) to avoid weekend review delays
- **OTA updates**: After EAS Update channel is configured (MOB-001), JS-only changes can ship without App Store review

### Web Portal
- **Deploy**: Auto on push to main via Vercel
- **No formal release process** — but QA checklist should be run for significant changes

### Marketing Site
- **Deploy**: Auto on push to main via Vercel
- **Validate before push**: `npm run build && npm run validate`

---

## Pre-Submit Checklist Summary

Before submitting v1.3.0 to App Store:

1. [ ] All Milestone 1-6 tickets complete
2. [ ] CHECKLIST_QA.md fully passed
3. [ ] CHECKLIST_APP_STORE.md fully passed
4. [ ] Version is 1.3.0, buildNumber is 17+ in app.json
5. [ ] Release notes written in RELEASE_NOTES.md
6. [ ] No CRITICAL or HIGH items open in STATUS.md
7. [ ] PostHog events verified for all new features
