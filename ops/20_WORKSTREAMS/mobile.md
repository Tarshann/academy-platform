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
| 2026-02-27 | Coach contacts: bridge pattern mapping known coach IDs to contact info | coaches.list API returns id/userId/bio/specialties but no name/phone. Can't modify server. Bridge pattern keeps contacts working while API is extended. |
| 2026-02-27 | Stripe checkout: expo-web-browser (not WebView or native SDK) | Ticket specifies WebView/browser approach first. expo-web-browser is already installed, handles dismissal cleanly, no native SDK complexity. |
| 2026-02-27 | Programs: use slug as Stripe productId | Server products.ts uses string IDs matching program slugs. Checkout route expects these as productIds. |
| 2026-02-27 | New screens as standalone routes (not tabs) | 6 tabs already fills the tab bar. Payments, Shop, Attendance, Notification Settings are standalone routes accessible from Profile ACCOUNT section and Dashboard quick actions. |
| 2026-02-27 | Manage Subscription opens web portal (not Stripe portal) | No payment.createPortalSession route exists. Opens app.academytn.com as interim. Portal Agent should add dedicated route. |
| 2026-02-27 | Shop checkout sends empty shippingAddress | shop.createCheckout requires shippingAddress string but mobile doesn't have a shipping form yet. Sends empty string — server handles it. |
| 2026-02-27 | DM images use content prefix convention | Server dm.sendMessage only accepts { conversationId, content } — no imageUrl. Images in DMs sent as `[image]<url>` content and detected client-side for rendering. Portal Agent should add native imageUrl support. |

## Files Modified Log

| Date | File | Change | Ticket |
|------|------|--------|--------|
| 2026-02-27 | app.json | Version 1.2.1 → 1.3.0 | MOB-001 |
| 2026-02-27 | eas.json | Added channel field to build profiles | MOB-001 |
| 2026-02-27 | package.json | Added 7 foundation dependencies | MOB-001 |
| 2026-02-27 | babel.config.js | Created — reanimated plugin | MOB-001 |
| 2026-02-27 | app/(tabs)/profile.tsx | Dynamic version, coach API integration | MOB-001, MOB-003 |
| 2026-02-27 | app/(tabs)/chat.tsx | Added Parents + Announcements rooms | MOB-002 |
| 2026-02-27 | app/chat/[room].tsx | Added room titles for new rooms | MOB-002 |
| 2026-02-27 | app/(tabs)/programs.tsx | In-app Stripe checkout, skeleton/error/empty states | MOB-004 |
| 2026-02-27 | app/payments.tsx | Created — subscriptions + payment history screen | MOB-005 |
| 2026-02-27 | app/shop.tsx | Created — merchandise shop with product listing + checkout | MOB-006 |
| 2026-02-27 | app/(tabs)/index.tsx | Enhanced dashboard: stats, quick actions, payment card | MOB-007 |
| 2026-02-27 | app/attendance.tsx | Created — calendar view + records + stats | MOB-008 |
| 2026-02-27 | app/notifications-settings.tsx | Created — toggle switches + quiet hours | MOB-009 |
| 2026-02-27 | app/(tabs)/profile.tsx | Added ACCOUNT section: Payments, Shop, Notifications links | MOB-005, MOB-006, MOB-009 |
| 2026-02-27 | lib/chat-images.ts | Created — image picker, upload with progress, DM image prefix utils | MOB-010 |
| 2026-02-27 | components/ChatInput.tsx | Added image picker button, preview, upload progress bar | MOB-010 |
| 2026-02-27 | components/MessageBubble.tsx | expo-image, skeleton loading, error state, tap-to-fullscreen | MOB-010 |
| 2026-02-27 | components/ImageViewer.tsx | Created — fullscreen modal image viewer | MOB-010 |
| 2026-02-27 | app/chat/[room].tsx | Added image upload + send with imageUrl for group chat | MOB-010 |
| 2026-02-27 | app/dm/[id].tsx | Added image upload + send with [image] prefix for DMs | MOB-010 |
