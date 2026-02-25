# Workstream: Mobile App (academy-app/)

> **Owner**: Mobile Agent
> **Scope**: `academy-app/` directory ONLY
> **Package Manager**: npm
> **Current Version**: 1.2.0 (build 16) → Target: 1.3.0 (build 17)

---

## Context

The mobile app uses 23% of available backend API surface (14 of 61 routes). The v1.3 goal is to close this gap — most features are backend-ready and ship as mobile-only development.

### Currently Implemented
Auth (Clerk), Dashboard, Schedule + Registration, Programs (website redirect), Group Chat (2 rooms), DMs, Push Notifications, Analytics (PostHog), Profile

### Key Architecture
- Routes: Expo Router (file-based) in `app/`
- API: tRPC client → `app.academytn.com/api/trpc`
- Real-time: Ably (chat + DM channels)
- Push: expo-notifications with deep linking
- Auth: Clerk Expo SDK → JWT in tRPC headers
- State: React Query via tRPC

### Active Tickets
See `ops/10_BACKLOG/NOW.md` for `MOB-*` tickets.

---

## API Routes to Integrate (v1.3)

### Phase 1 (NOW)
| Route | Used For | Ticket |
|-------|----------|--------|
| `coaches.list` | Replace hardcoded coach contacts | MOB-003 |
| `payment.createCheckout` | In-app program enrollment | MOB-004 |

### Phase 2 (NEXT)
| Route | Used For | Ticket |
|-------|----------|--------|
| `payment.mySubscriptions` | Subscription management | MOB-005 |
| `payment.myPayments` | Payment history | MOB-005 |
| `shop.products` | Merchandise browsing | MOB-006 |
| `shop.createCheckout` | Merchandise purchase | MOB-006 |
| `attendance.getMyAttendance` | Attendance history | MOB-008 |
| `attendance.getMyStats` | Attendance stats card | MOB-007, MOB-008 |
| `pushNotifications.getSettings` | Notification preferences | MOB-009 |
| `pushNotifications.updateSettings` | Save notification prefs | MOB-009 |
| `dm.muteConversation` / `unmute` | Per-conversation mute | MOB-009 |

### Phase 3 (LATER)
| Route | Used For | Ticket |
|-------|----------|--------|
| `gallery.list` / `byCategory` | Photo gallery | MOB-020 |
| `videos.list` / `byCategory` | Video content | MOB-020 |
| `blog.list` / `getBySlug` | Blog articles | MOB-020 |
| `locations.list` | Training venues | MOB-022 |
| `dm.searchMessages` | DM search | MOB-016 |
| `dm.blockUser` / `unblockUser` | User blocking | MOB-017 |
| `dm.archiveConversation` | Archive threads | MOB-017 |
| `payment.submitPrivateSessionBooking` | 1-on-1 booking | MOB-024 |

---

## Dependencies Plan

### Add in Phase 1 (MOB-001)
```
react-native-reanimated ~3.x
expo-image-picker
@gorhom/bottom-sheet
expo-haptics
date-fns
expo-image
expo-store-review
```

### Add Later (as needed)
```
@shopify/flash-list      — when lists get long (gallery, shop)
react-native-maps        — MOB-022
expo-calendar            — MOB-021
react-native-mmkv        — MOB-025 (offline)
expo-av                  — if video playback needed
```

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| — | — | — |

## Files Modified Log

| Date | File | Change | Ticket |
|------|------|--------|--------|
| — | — | — | — |
