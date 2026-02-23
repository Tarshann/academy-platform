# The Academy — Mobile App Investor Review (v1.2)

**Date**: February 2026
**Platform**: iOS (App Store)
**Bundle ID**: com.academytn.app

---

## Executive Summary

The Academy mobile app is a member companion for a youth athletic training facility based in Gallatin, Tennessee. Version 1.2 delivers a functional member experience covering authentication, scheduling, real-time messaging, and push notifications. The app connects to a production-grade backend shared with the web portal at `app.academytn.com`.

The current version is a **solid foundation** with room for significant feature expansion. The backend already supports the majority of features planned for v1.3, meaning new mobile capabilities can be shipped rapidly without backend engineering effort.

---

## What's Built

### Core Functionality

| Feature | Description |
|---------|-------------|
| **Authentication** | Email/password sign-in and sign-up via Clerk. Email verification code flow. Secure token caching via device keychain. |
| **Member Dashboard** | Personalized welcome, next upcoming session card, announcements feed. Pull-to-refresh. |
| **Schedule & Registration** | Browse all upcoming training sessions. One-tap registration with capacity checks and confirmation. Session type badges (regular, open gym, special). |
| **Program Browser** | View all active programs with pricing, age ranges, sport categories. Per-session and monthly pricing display. |
| **Real-Time Group Chat** | Two channels (General, Coaches). Message history with real-time updates via Ably. Sender identification, timestamps, image support. Connection status indicator. |
| **Direct Messaging** | Private 1-on-1 conversations. Unread count badges. Start new conversations with available users. Real-time delivery via Ably. Mark-as-read on open. |
| **Push Notifications** | Automatic push token registration. Notification tap deep links into chat rooms and DM conversations. Foreground notification display. |
| **User Profile** | Display name, email, role badge (Member/Coach/Admin). Coach contact with call and text shortcuts. Resource links. Sign out and account deletion. |
| **Analytics** | PostHog integration for screen views, registration events, and messaging activity. User identity sync with Clerk. |

### Technical Infrastructure

| Component | Implementation |
|-----------|---------------|
| **Framework** | React Native 0.81 + Expo 54 |
| **Routing** | Expo Router (file-based, 14 route files) |
| **API** | tRPC v11 with end-to-end TypeScript types |
| **Auth** | Clerk Expo SDK with JWT-based API auth |
| **Real-Time** | Ably for chat and DM message delivery |
| **Push** | Expo Push Notifications with per-device token registration |
| **Analytics** | PostHog React Native SDK |
| **Storage** | SecureStore for tokens and device ID |
| **Error Handling** | React ErrorBoundary with retry, config validation screen |

---

## Platform Maturity Assessment

### Strengths

1. **End-to-end type safety** — The tRPC architecture means zero API contract drift between mobile and backend. Type errors are caught at compile time, not in production.

2. **Backend leverage** — The backend is mature (~4,000 lines of API routes + database functions, 42 database tables). Approximately 70% of planned v1.3 features require zero backend work — the mobile app simply needs to consume existing endpoints.

3. **Real-time foundation** — Ably-based messaging works in production today. Both group chat and direct messages deliver in real-time with deduplication and connection state handling.

4. **Production-grade auth** — Clerk handles the complexity of session management, token refresh, email verification, and secure storage. Account deletion is properly implemented (Apple App Store requirement).

5. **Analytics from day one** — PostHog captures screen views, registration events, and messaging metrics. User identity is synced with Clerk. This provides immediate visibility into user behavior and retention.

6. **Clean codebase** — ~2,200 lines of app code across 14 routes and 5 components. Well-structured with clear separation between screens, components, and library utilities. No tech debt accumulation yet.

### Areas for Improvement

1. **Feature surface** — The app covers ~30% of the backend's available API surface. Major modules (payments, attendance, content, shop, notifications settings) are not yet exposed to mobile users.

2. **No in-app payments** — Program enrollment and merchandise purchases redirect to the website. Stripe checkout is fully supported server-side but not integrated in the mobile flow.

3. **Limited content** — No gallery, video, or blog features despite the backend having full CRUD support for all three.

4. **No offline support** — Every screen requires network connectivity. No caching or offline queue.

5. **Basic UI polish** — Functional but utilitarian. No animations, skeleton screens, or haptic feedback. Loading states use generic spinners.

6. **iOS only** — Android build configuration exists but no Google Play submission has been made.

---

## Backend Capability vs. Mobile Utilization

This chart shows how much of the existing backend the mobile app currently consumes:

```
Backend Domain         API Routes    Mobile Uses    Gap
─────────────────────  ──────────    ───────────    ────
Auth                   4             3              1 (logout unused)
Programs               2             1              1
Schedules              2             2              0 — COMPLETE
Announcements          1             1              0 — COMPLETE
Chat (REST)            5             2              3 (upload, online, users)
DM                     12            4              8 (search, block, mute, archive)
Push Notifications     6             1              5 (settings, unsubscribe)
Attendance             5             0              5
Shop                   5             0              5
Payments               7             0              7
Gallery                3             0              3
Videos                 4             0              4
Blog                   2             0              2
Coaches                1             0              1
Locations              1             0              1
Contact                1             0              1
                       ──            ──             ──
TOTAL                  61            14             47 routes untapped
```

**The mobile app currently uses 23% of available API surface.** This means the vast majority of v1.3 features are backend-ready and can ship as mobile-only development.

---

## User Flow Analysis

### Current User Journey

```
Install → Sign In → Dashboard → View Schedule → Register for Session
                  ↘ Chat → Send Message
                  ↘ Messages → DM Coach
                  ↘ Programs → View Details → [Redirected to Website]
                  ↘ Profile → Contact Coach → Call/Text
```

### Key Drop-off Points

1. **Program enrollment** — User sees pricing and taps "Sign Up" but is redirected to the website in an external browser. This creates friction and likely abandonment.

2. **Limited retention hooks** — After initial schedule check and registration, there's limited reason to return to the app beyond chat. No content feed, no attendance tracking, no achievement system.

3. **No payment management** — Members cannot view their subscription status, payment history, or manage billing from the app.

---

## Competitive Positioning

### What Top Youth Sports Apps Offer

| Feature | TeamSnap | SportsEngine | GameChanger | Academy v1.2 |
|---------|----------|--------------|-------------|---------------|
| Schedule & Calendar | Yes | Yes | Yes | Partial (list only) |
| In-App Registration | Yes | Yes | N/A | No (website redirect) |
| In-App Payments | Yes | Yes | N/A | No |
| Real-Time Chat | Yes | Yes | Yes | Yes |
| Direct Messaging | Yes | Yes | Yes | Yes |
| Push Notifications | Yes | Yes | Yes | Yes |
| Attendance Tracking | Yes | Yes | Yes | No |
| Photo/Video Gallery | Yes | Yes | Yes | No |
| Team Roster/Profiles | Yes | Yes | Yes | No |
| Stats & Progress | Limited | Yes | Yes | No |
| Merchandise Shop | No | Yes | No | No |
| Offline Support | Partial | Partial | Yes | No |
| Dark Mode | Yes | Yes | Yes | No |

### Academy's Unique Advantages

1. **Unified platform** — Web portal + mobile app + marketing site all served by one backend. Competitors typically require separate platform integrations.

2. **Real-time messaging built-in** — Not an add-on or third-party integration. Group channels and DMs with Ably deliver sub-second latency.

3. **Full e-commerce ready** — Stripe-powered merchandise shop and program payments are already built server-side. Just needs mobile UI.

4. **Type-safe architecture** — tRPC means the mobile app gets compile-time guarantees on every API call. This is uncommon in the youth sports space and enables faster, safer iteration.

---

## Technology Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Expo SDK upgrades | Low | Expo's managed workflow handles most native module compatibility |
| Clerk dependency | Low | Industry-standard auth provider with strong React Native support |
| Ably dependency | Low | Can fall back to SSE or switch providers; abstracted behind `lib/realtime.ts` |
| React Native 0.81 | Low | Current stable release, Expo handles native bridging |
| No CI/CD | Medium | Manual builds via EAS CLI; should add GitHub Actions for automated builds |
| No error monitoring | Medium | PostHog tracks events but no crash reporting (Sentry was removed). Should add back. |
| Single developer | Medium | Clean architecture and this documentation enable additional developers to onboard quickly |

---

## Growth Metrics to Track (v1.3+)

| Metric | Tool | Purpose |
|--------|------|---------|
| DAU / MAU | PostHog | Core engagement |
| Session registrations (mobile vs web) | PostHog | Mobile adoption |
| Chat messages sent | PostHog | Community engagement |
| Push notification opt-in rate | Backend | Retention lever |
| In-app checkout conversion | Stripe + PostHog | Revenue attribution |
| App Store rating | App Store Connect | Public perception |
| Crash-free rate | Sentry (to add) | Stability |
| Time to first session registration | PostHog | Onboarding effectiveness |

---

## Revenue Impact Potential

### Current State
- App drives zero direct revenue (all payments flow through web)
- Serves as a communication and scheduling tool only

### v1.3 Potential
- **In-app program enrollment**: Removes website redirect friction, likely increases conversion
- **Merchandise shop**: Impulse purchases from push notification prompts
- **Private session booking**: High-margin 1-on-1 coaching bookable directly from app
- **Subscription management**: Reduces churn by making plan management easy

### Estimated Impact
With in-app payments enabled, the mobile app transitions from a cost center (communication tool) to a revenue channel. Youth sports apps with in-app payments typically see **15-25% of total transactions originate from mobile** within 6 months of launch.

---

## Summary

The Academy v1.2 is a **technically sound, well-architected mobile app** that delivers core member value (scheduling, chat, notifications) on a foundation that can rapidly expand. The backend is significantly ahead of the mobile frontend — 77% of API surface is untapped, meaning v1.3 can deliver major feature additions (payments, attendance, content, shop) purely through mobile development work.

The path from v1.2 to a top-tier youth sports app is clear and achievable:
1. The architecture is clean and extensible
2. The backend is already built
3. The auth and real-time infrastructure is proven in production
4. The analytics pipeline is active from day one

**Key recommendation**: Prioritize in-app payments (Tier 1) to transition the app from communication tool to revenue channel, followed by content and engagement features (Tier 2) to drive daily active usage.
