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

## v1.3.0 — Revenue + Retention Release

### Release Summary

v1.3.0 is a mobile-only feature release that transforms the app from a basic dashboard/chat tool into a full member engagement platform with in-app payments, attendance tracking, image sharing, and notification controls. All 10 feature tickets (MOB-001 through MOB-010) are complete. Portal fixes (WEB-003 through WEB-013) have already been deployed via Vercel auto-deploy.

### What Ships

| Ticket | Feature | Category | Status |
|--------|---------|----------|--------|
| MOB-001 | Version bump + foundation dependencies | Infra | DONE |
| MOB-002 | All 4 chat rooms (General, Coaches, Parents, Announcements) | Retention | DONE |
| MOB-003 | Coach contacts from API (bridge pattern for phone) | UX | DONE |
| MOB-004 | In-app Stripe checkout for programs | Revenue | DONE |
| MOB-005 | Payments & subscription management screen | Revenue | DONE |
| MOB-006 | Merchandise shop with checkout | Revenue | DONE |
| MOB-007 | Enhanced dashboard (stats, quick actions, payments, feed) | Retention | DONE |
| MOB-008 | Attendance tracking with calendar view | Retention | DONE |
| MOB-009 | Notification preferences with quiet hours | Retention | DONE |
| MOB-010 | Chat image upload (group chat + DMs) | Engagement | DONE |

### Portal Fixes Already Deployed (via Vercel)

| Ticket | Fix | Status |
|--------|-----|--------|
| WEB-003-FIX | `/orders` route added | Deployed |
| WEB-004-FIX | CoachDashboard admin role guard | Deployed |
| WEB-007-FIX | Shop page fetches from API | Deployed |
| WEB-008-FIX | Schedule page fetches from API | Deployed |
| WEB-009-FIX | Gallery page fetches from API | Deployed |
| WEB-010-FIX | 9 pages routed (blog, videos, gallery, about, contact, faqs, home, orders) | Deployed |
| WEB-011-FIX | SignUp fetches product catalog from API | Deployed |
| WEB-012-FIX | PrivateSessionBooking fetches coaches from API | Deployed |
| WEB-013-FIX | Pagination on all 12 list API routes | Deployed |

---

### v1.3.0 Timeline

| Milestone | Target Date | Status | Notes |
|-----------|-------------|--------|-------|
| Feature complete (all MOB tickets) | 2026-02-27 | DONE | All 10 tickets merged to main |
| Portal fixes deployed | 2026-02-27 | DONE | All WEB fixes live on Vercel |
| QA checklists created | 2026-02-27 | DONE | CHECKLIST_QA.md + CHECKLIST_APP_STORE.md |
| QA pass (manual testing) | TBD | PENDING | Run CHECKLIST_QA.md on real device |
| EAS production build | TBD | PENDING | `eas build --platform ios --profile production` |
| TestFlight distribution | TBD | PENDING | Internal testing for 24-48 hours |
| App Store submission | TBD | PENDING | Submit early in week (Mon-Tue) |
| App Store review | TBD | PENDING | Typically 24-48 hours |
| Production release | TBD | PENDING | Manual release after approval |

**Recommended sequence:**
1. Complete QA pass on a dev build or preview build first
2. Run EAS production build
3. Distribute to TestFlight for 24-48h soak test
4. Submit to App Store on a Monday or Tuesday
5. Release manually after approval

---

### Known Issues Shipping with v1.3.0

| Issue | Severity | Impact | Workaround |
|-------|----------|--------|------------|
| DM images use `[image]<url>` content prefix | LOW | DM image display works correctly via client-side decode; no user-visible impact | Fix in v1.4.0: add `imageUrl` field to `dm.sendMessage` |
| Coach phone numbers use bridge pattern | LOW | Contacts always display correctly via hardcoded fallback map | Fix in v1.4.0: extend schema with phone field |
| Payments "Manage Subscription" opens web portal URL | LOW | Users can manage subscriptions; UX slightly less polished than Stripe portal session | Fix in v1.3.1 OTA: wire `payment.createPortalSession` |
| No crash reporting (Sentry) | MEDIUM | Crashes only discovered via user reports or manual testing | Add in v1.4.0 |
| `dompurify` type warning in `pnpm check` | LOW | Build succeeds; only TypeScript type checker shows warning | Pre-existing, tracked |

### Rollback Plan

1. **OTA hotfix** (JS-only changes): `eas update --channel production` pushes a JS bundle update without App Store review. Available for any bug that doesn't require native code changes.
2. **App Store hotfix** (native changes needed): Submit v1.3.1 with expedited review request. Previous v1.2.0 (build 16) remains installable for users who haven't updated.
3. **Server rollback**: Portal backend deployed independently via Vercel. Any server regression can be rolled back to a previous deployment in the Vercel dashboard without affecting the mobile app.

---

## v1.3.0 — Pre-Submit Checklist

Before submitting v1.3.0 to App Store:

1. [ ] All Phase A, B, C features complete (MOB-001 through MOB-010)
2. [ ] `CHECKLIST_QA.md` fully passed (sections A through M)
3. [ ] `CHECKLIST_APP_STORE.md` fully passed (sections 1 through 5)
4. [ ] Version is 1.3.0, buildNumber is 17 in `app.json`
5. [ ] Release notes written in `RELEASE_NOTES.md`
6. [ ] No CRITICAL or HIGH items open in `STATUS.md`
7. [ ] PostHog events verified for all new features
8. [ ] All screens have skeleton loading states
9. [ ] All screens have error states with retry
10. [ ] All screens have empty states with meaningful messages
11. [ ] Push notification deep links still work (chat + DM)
12. [ ] Stripe checkout works end-to-end in test mode (programs + shop)
13. [ ] TestFlight soak test completed (24-48 hours minimum)

---

## v1.4.0 — Video & Clips (Future)

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
**Stabilization**: Minimum 48 hours in production before mobile starts

### Mobile Phase (Mobile Agent — starts after backend deploys)

| Ticket | Feature | Impact |
|--------|---------|--------|
| MOB-030 | Clips tab + feed screen | `[ENGAGEMENT]` |
| MOB-031 | Clip upload flow (record/choose/paste link) | `[ENGAGEMENT]` |
| MOB-032 | Video in chat + DMs | `[ENGAGEMENT]` |
| MOB-033 | Clips deep links + sharing | `[DIFFERENTIATION]` |

**Ship criteria**: Feed loads, upload works, clips playable, sharing generates valid deep links

### v1.4.0 Also Includes (Fixes from v1.3.0 Known Issues)

| Item | Description |
|------|-------------|
| Add `imageUrl` to `dm.sendMessage` | Replace `[image]` prefix convention with first-class field |
| Add phone field to coaches/users schema | Eliminate bridge pattern for coach contacts |
| Add Sentry crash reporting | Real-time crash visibility |
| Wire `payment.createPortalSession` in mobile | Direct Stripe Billing Portal access |

---

## Release Cadence

### Mobile
- **TestFlight builds**: After each QA pass
- **App Store submission**: After full QA checklist passes — single submission per version
- **Submit early in week** (Mon-Tue) to avoid weekend review delays
- **OTA updates**: JS-only changes can ship via `eas update` without App Store review

### Web Portal
- **Deploy**: Auto on push to main via Vercel
- **QA checklist required** for significant changes

### Marketing Site
- **Deploy**: Auto on push to main via Vercel
- **Validate before push**: `npm run build && npm run validate`
