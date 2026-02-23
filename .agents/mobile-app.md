# Workstream: Mobile App v1.3 (academy-app/)

> Agent: Mobile App Agent
> Scope: `academy-app/` directory ONLY
> Package Manager: npm (NOT pnpm)

---

## Current State (v1.2.0, Build 16)

### Implemented
- Auth (Clerk): sign-in, sign-up, email verification
- Dashboard: welcome, next session, announcements, pull-to-refresh
- Schedule: session list, registration, type badges, capacity
- Programs: browse, pricing, categories (links to website for signup)
- Group Chat: 2 rooms (General, Coaches), Ably real-time, history via REST
- Direct Messages: conversation list, unread badges, Ably real-time
- Push Notifications: token registration, deep linking, foreground display
- Analytics: PostHog screen tracking, event tracking, identity sync
- Profile: user info, role badge, coach contact, sign out, account deletion

### Known Issues / Tech Debt
1. Profile shows hardcoded "v1.1" — should be dynamic from app.json
2. Only 2 of 4 chat rooms shown (missing Parents, Announcements)
3. No image upload in chat (server supports it)
4. No @mention support (server supports it)
5. Programs redirect to website instead of in-app enrollment
6. No notification preferences UI
7. No attendance tracking (API available)
8. New Architecture disabled (newArchEnabled: false)
9. EAS Update channel not configured
10. No offline support
11. No skeleton loading screens
12. Coach contact hardcoded in profile.tsx

### API Routes Available but NOT Used (47 endpoints)
```
attendance.getMyAttendance    attendance.getMyStats
shop.products                 shop.createCheckout
payment.createCheckout        payment.myPayments        payment.mySubscriptions
gallery.list                  gallery.byCategory
videos.list                   videos.byCategory
blog.list                     blog.getBySlug
coaches.list                  locations.list
dm.searchMessages             dm.blockUser              dm.unblockUser
dm.muteConversation           dm.unmute                 dm.archiveConversation
pushNotifications.getSettings pushNotifications.updateSettings
payment.submitPrivateSessionBooking
contact.submit
```

---

## v1.3 Task Breakdown

### Phase 1: Foundation (Do First)
- [ ] Bump version to 1.3.0 in app.json, buildNumber to 17
- [ ] Configure EAS Update channel in eas.json
- [ ] Add new dependencies (reanimated, image-picker, bottom-sheet, etc.)
- [ ] Fix hardcoded version in profile.tsx (read from app.json/Constants)
- [ ] Fix coach contact to pull from API (coaches.list)
- [ ] Enable all 4 chat rooms (add Parents, Announcements)

### Phase 2: Revenue Features (P1)
- [ ] In-app program enrollment (Stripe checkout via payment.createCheckout)
- [ ] Subscription management screen (payment.mySubscriptions)
- [ ] Payment history (payment.myPayments)
- [ ] Merchandise shop (shop.products + shop.createCheckout)
- [ ] Private session booking (payment.submitPrivateSessionBooking)

### Phase 3: Engagement Features (P2)
- [ ] Enhanced dashboard — attendance stats card, quick actions grid, upcoming payments, content feed
- [ ] Attendance tracking screen — calendar/list view (attendance.getMyAttendance + getMyStats)
- [ ] Notification preferences — full settings screen with toggles and quiet hours
- [ ] Content hub — gallery (gallery.list), videos (videos.list), blog (blog.list), coaches (coaches.list)

### Phase 4: Chat Enhancements (P3)
- [ ] Image upload in chat (POST /api/chat/upload-image)
- [ ] @mention support with user autocomplete
- [ ] Message reactions (emoji)
- [ ] Typing indicators
- [ ] Link previews
- [ ] DM read receipts
- [ ] DM search (dm.searchMessages)
- [ ] Mute/archive conversations (dm.muteConversation, dm.archiveConversation)
- [ ] Block users (dm.blockUser)

### Phase 5: Polish (P4)
- [ ] Onboarding flow — 3-4 animated walkthrough screens on first launch
- [ ] Skeleton loading screens (replace spinners)
- [ ] Haptic feedback (expo-haptics)
- [ ] Pull-to-refresh animations
- [ ] Smooth page transitions (Reanimated)
- [ ] Dark mode support
- [ ] App Store rating prompt (expo-store-review)
- [ ] Dynamic font sizing / accessibility

### Phase 6: Infrastructure
- [ ] Enable New Architecture (newArchEnabled: true) — test thoroughly
- [ ] Offline caching strategy (MMKV or expo-file-system)
- [ ] Message queue for offline sends
- [ ] Calendar integration (expo-calendar)
- [ ] Location/directions screen (react-native-maps)

---

## Dependencies to Add
```json
{
  "react-native-reanimated": "~3.x",
  "expo-image-picker": "latest",
  "@shopify/flash-list": "latest",
  "expo-haptics": "latest",
  "expo-store-review": "latest",
  "@gorhom/bottom-sheet": "latest",
  "date-fns": "latest",
  "expo-image": "latest"
}
```

Later phases:
```json
{
  "react-native-maps": "latest",
  "expo-calendar": "latest",
  "react-native-mmkv": "latest",
  "expo-av": "latest"
}
```

---

## Design Tokens
| Token | Value |
|-------|-------|
| Academy Gold | `#CFB87C` |
| Navy / Dark | `#1a1a2e` |
| Background | `#f5f5f5` |
| Card BG | `#fff` |
| Fonts | System default (no custom fonts) |
| Icons | `@expo/vector-icons` (Ionicons) |
| Card radius | 12-16px |
| Input radius | 20px |

---

## Decisions Made
*(Document architectural/design choices here as you make them)*

| Date | Decision | Rationale |
|------|----------|-----------|
| — | — | — |

---

## Files Modified
*(Track every file you change for review)*

| Date | File | Change |
|------|------|--------|
| — | — | — |
