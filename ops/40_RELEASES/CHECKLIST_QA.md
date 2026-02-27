# QA Checklist — v1.3.0

> Run every checkbox on a real device before submitting to the App Store.
> Every checkbox must pass or have an accepted exception documented below.
> Tester should use a standard member account unless noted otherwise.

---

## A. Mobile App — Authentication (Existing, Regression Check)

### Sign In
- [ ] Sign in with existing account → lands on Dashboard tab
- [ ] Invalid credentials → shows clear error message (Clerk `longMessage`)
- [ ] Sign in button shows "Signing in..." while loading and is disabled
- [ ] Kill app and reopen → stays signed in (Clerk token persistence)

### Sign Up
- [ ] Sign up with new email → enters verification code phase
- [ ] Verification code succeeds → lands on Dashboard tab
- [ ] Existing email → Alert offers "Go to Sign In"
- [ ] App backgrounded during verification → offers "Go to Sign In" recovery

### Sign Out
- [ ] Sign out from Profile → double-Alert confirmation required
- [ ] After sign out → returns to sign-in screen
- [ ] After sign out → cannot navigate back to tabs

---

## B. Mobile App — Dashboard (MOB-007)

### Data Loading
- [ ] Welcome greeting shows correct first name from `auth.me`
- [ ] Next Session card shows upcoming session (from `schedules.upcoming`) or is absent if none
- [ ] Attendance stats card shows Sessions / Present / Rate / Late (from `attendance.getMyStats`)
- [ ] Stats card hidden when `total === 0` (new user)
- [ ] Upcoming Payment card shows next renewal date (from `payment.mySubscriptions`) or is absent if no active subscription
- [ ] Announcements feed loads (from `announcements.list`) or shows "No announcements right now."
- [ ] All 5 queries refresh on pull-to-refresh

### Quick Actions
- [ ] 4-button grid visible: Schedule, Chat, Programs, Shop
- [ ] Tap Schedule → navigates to Schedule tab
- [ ] Tap Chat → navigates to Chat tab
- [ ] Tap Programs → navigates to Programs tab
- [ ] Tap Shop → navigates to `/shop` screen

### Navigation
- [ ] "View Details" on stats card → navigates to `/attendance`
- [ ] Tap announcement card → fires `dashboard_content_tapped` event
- [ ] Tap Next Payment card → navigates to `/payments`

### Loading States
- [ ] `StatsSkeleton` (4-column grey blocks) shown while stats load
- [ ] Announcement skeleton (2 card outlines) shown while announcements load

### Analytics
- [ ] `dashboard_quick_action_tapped` fires with `{ action }` on each quick action tap
- [ ] `dashboard_content_tapped` fires with `{ content_type: 'announcement', content_id }` on announcement tap

### Accessibility
- [ ] All quick action buttons have accessible labels
- [ ] Admin badge announced correctly by VoiceOver
- [ ] All tap targets ≥ 44pt

---

## C. Mobile App — Programs (MOB-004)

### Program List
- [ ] Programs load from `programs.list` API (not hardcoded)
- [ ] Each program shows name, description, pricing
- [ ] Performance Lab programs show price + "/mo" + cohort info
- [ ] Membership programs show price + "/mo"
- [ ] Individual programs show flat price
- [ ] CTA labels correct: "Sign Up" (default), "Apply" (performance), "Inquire" (individual)

### Stripe Checkout Flow
- [ ] Tap "Sign Up" → per-button loading spinner replaces CTA text
- [ ] Stripe checkout opens in-app (expo-web-browser, full screen, NOT external Safari)
- [ ] Checkout shows correct program and pricing
- [ ] Complete test payment → browser dismisses → returns to app
- [ ] Cancel checkout → `payment_checkout_cancelled` event fires → returns gracefully
- [ ] Slow network → loading state visible, no crash or timeout

### Loading State
- [ ] `ProgramsSkeleton` (3 card placeholders) shown during initial load

### Error State
- [ ] Full-screen error: alert-circle icon + "Could not load programs" + "Retry" button
- [ ] Retry button calls `programs.refetch()` and recovers

### Empty State
- [ ] fitness-outline icon + "No programs available" + "Check back soon for new offerings"

### Analytics
- [ ] `payment_checkout_started` fires with `{ program_name, program_slug, price }`
- [ ] `payment_checkout_completed` fires with `{ program_name }` on successful dismiss
- [ ] `payment_checkout_cancelled` fires with `{ program_name }` on cancel
- [ ] `payment_checkout_failed` fires with `{ error_type }` on error

### Accessibility
- [ ] Program cards readable by VoiceOver
- [ ] CTA buttons have accessible labels
- [ ] Loading spinner has accessible label

---

## D. Mobile App — Group Chat (MOB-002 + MOB-010)

### Channel List
- [ ] Chat tab shows 4 rooms: General, Coaches, Parents, Announcements
- [ ] Each room has distinct icon and description
- [ ] Announcements room visually distinct (gold icon)
- [ ] Tap any room → navigates to `/chat/{room}`
- [ ] `chat_room_opened` event fires with `{ room, room_name }`

### Chat Room — Messages
- [ ] Message history loads (REST `/api/chat/history/{room}?limit=50`)
- [ ] Own messages: dark navy bubble, white text (right-aligned)
- [ ] Other messages: light grey bubble, dark text (left-aligned)
- [ ] Sender name shown above non-own messages
- [ ] Timestamps display correctly
- [ ] Empty room: "Welcome to #Channel / Be the first to send a message!"

### Chat Room — Real-time
- [ ] Connection status indicator (red/green dot) in header
- [ ] Send text message → appears immediately in chat
- [ ] Receive message from another user → appears in real-time (Ably)
- [ ] Message deduplication works (no duplicate bubbles)

### Chat Room — Image Upload (MOB-010)
- [ ] Image picker icon visible in ChatInput bar
- [ ] Tap image icon → Alert prompts "Camera" or "Photo Library"
- [ ] Camera option → requests camera permission → launches camera
- [ ] Photo Library option → requests photo library permission → opens library
- [ ] Selected image appears as preview thumbnail in input bar
- [ ] Image > 5MB → haptic error + Alert "Image Too Large" → no upload started
- [ ] Tap send with preview → upload starts → progress bar overlay on preview
- [ ] Progress percentage text updates during upload
- [ ] Upload succeeds → image appears in chat as `MessageBubble` with image
- [ ] Image in bubble: skeleton placeholder while loading → reveals image on load
- [ ] Image load failure → "Image failed to load" error state in bubble
- [ ] Tap image in bubble → full-screen `ImageViewer` modal opens
- [ ] ImageViewer: close button (top-right X) works
- [ ] ImageViewer: tapping backdrop closes modal
- [ ] Upload fails (network) → Alert with Cancel/Retry options
- [ ] Retry on failure → re-attempts upload
- [ ] Haptic light impact on successful image selection

### Chat Room — Image Upload Analytics
- [ ] `chat_image_upload_success` fires with `{ room, source }` (source: camera/library)
- [ ] `chat_image_upload_failed` fires with `{ room, reason }` (reason: size_limit/network/server_error)

### Chat Room — Loading State
- [ ] Full-screen ActivityIndicator while history loads

### Accessibility
- [ ] Send button has accessible label
- [ ] Image picker button has accessible label
- [ ] All tap targets ≥ 44pt

---

## E. Mobile App — Direct Messages

### Conversation List
- [ ] DM conversation list loads from `dm.getConversations`
- [ ] Each card shows: avatar letter, participant name, last message preview, timestamp
- [ ] Unread conversations: gold left border + gold badge with count
- [ ] Unread badge clears when conversation opened (`dm.markAsRead` fires)
- [ ] "New Conversation" button at top of list
- [ ] Tap "New Conversation" → Alert shows available users (from `dm.getAvailableUsers`)
- [ ] Select user → conversation created (`dm.startConversation`) → navigates to `/dm/{id}`

### DM Conversation — Messages
- [ ] Messages load from `dm.getMessages` (limit: 50)
- [ ] Own messages: dark navy bubble (right-aligned)
- [ ] Other messages: light grey bubble (left-aligned)
- [ ] Empty conversation: "Send a message to start the conversation"

### DM Conversation — Real-time
- [ ] Send text message → appears immediately
- [ ] Receive message → appears via Ably real-time subscription
- [ ] Mark as read fires on mount and on each incoming message

### DM Conversation — Image Upload (MOB-010)
- [ ] Image picker icon visible in DM ChatInput
- [ ] Same camera/library picker flow as group chat
- [ ] 5MB validation works
- [ ] Upload progress shows on preview
- [ ] Image sent as `[image]{url}` content prefix (DM workaround)
- [ ] Image renders correctly in DM message bubble (client extracts URL from `[image]` prefix)
- [ ] Tap image → full-screen ImageViewer opens
- [ ] `chat_image_upload_success` fires with `{ room: 'dm', source }`
- [ ] `chat_image_upload_failed` fires with `{ room: 'dm', reason }`

### Loading State
- [ ] `<Loading />` spinner while conversations load
- [ ] Full-screen ActivityIndicator while DM messages load

### Empty State
- [ ] Conversation list: chatbubble-ellipses icon + "No Conversations" + "Start a conversation with a coach or parent"

### Accessibility
- [ ] Unread badge conveyed to VoiceOver
- [ ] All tap targets ≥ 44pt

---

## F. Mobile App — Profile (MOB-003)

### Profile Header
- [ ] Gold avatar circle with first letter of name
- [ ] Full name displayed correctly
- [ ] Email displayed correctly
- [ ] Role badge visible (Member/Coach/Admin)

### Coach Contacts
- [ ] Coaches load from `coaches.list` API (with known-coach bridge fallback)
- [ ] Each coach shows name and phone number
- [ ] Tap coach row → opens phone dialer with correct number
- [ ] Tap chatbox icon → opens SMS with correct number
- [ ] `coach_contact_call` event fires on call tap
- [ ] `coach_contact_text` event fires on text tap

### Coach Contacts — Error/Empty States
- [ ] API failure → alert icon + "Could not load coaches" + Retry button
- [ ] Retry recovers after network restored
- [ ] Empty API + no bridge data → people-outline icon + "No coaches available"

### Account Section
- [ ] "Payments" link → navigates to `/payments`
- [ ] "Shop" link → navigates to `/shop`
- [ ] "Notification Settings" link → navigates to `/notifications-settings`

### Resources Section
- [ ] "Website" link → opens `academytn.com` in browser
- [ ] "Privacy Policy" link → opens privacy policy URL

### Sign Out
- [ ] Sign Out button (red) → double-Alert confirmation
- [ ] Confirm → signs out, returns to sign-in screen

### Delete Account
- [ ] Delete Account button (grey) → double-nested Alert confirmation
- [ ] Confirm both → account deleted + signed out

### Footer
- [ ] Version shows "v1.3.0" (from `Constants.expoConfig.version`, NOT hardcoded)
- [ ] "Gallatin, Tennessee" text visible

### Loading State
- [ ] `<Loading />` while `auth.me` loads

### Accessibility
- [ ] Call and text buttons have accessible labels
- [ ] Role badge announced by VoiceOver
- [ ] All tap targets ≥ 44pt

---

## G. Mobile App — Payments (MOB-005)

### Subscriptions
- [ ] Active subscriptions load from `payment.mySubscriptions`
- [ ] Subscription card shows: status dot (green=active, orange=past_due, red=canceled), renewal date
- [ ] "Manage Subscription" button opens web portal in in-app browser
- [ ] `subscription_manage_opened` event fires on button tap

### Payment History
- [ ] Payment history loads from `payment.myPayments`
- [ ] Each payment shows: description, date, amount (formatted currency), status dot
- [ ] Status colors: succeeded=green, pending=orange, failed=red

### Loading State
- [ ] `PaymentsSkeleton`: section headers + 2 subscription card outlines + 3 payment card outlines

### Error State
- [ ] Full-screen icon + "Could not load payments" + Retry button
- [ ] Retry recovers

### Empty State
- [ ] receipt-outline icon + "No payments yet" + "Your payment history will appear here after your first purchase"

### Analytics
- [ ] `payment_history_viewed` fires once on mount

### Accessibility
- [ ] Status dots have accessible color-blind-friendly labels
- [ ] All tap targets ≥ 44pt

---

## H. Mobile App — Shop (MOB-006)

### Product Listing
- [ ] Products load from `shop.products` API (limit: 50)
- [ ] Only active, in-stock products shown (client-side filter)
- [ ] Product card shows: image (via expo-image), category badge, name, description, price
- [ ] Image fallback: grey placeholder with image-outline icon
- [ ] Low stock (≤ 5): red "Only N left" label visible
- [ ] Sold out products hidden (filtered out)

### Checkout Flow
- [ ] Tap "Buy" → checkout loading state on that button
- [ ] Stripe checkout opens in-app browser (full screen)
- [ ] Complete payment → browser dismissed → products refetch
- [ ] Cancel checkout → returns gracefully
- [ ] Error → Alert shown

### Loading State
- [ ] `ShopSkeleton`: 4 cards with 160px image placeholder + text blocks

### Error State
- [ ] Full-screen icon + "Could not load products" + Retry button

### Empty State
- [ ] bag-outline icon + "No products available" + "Check back soon for new merchandise"

### Analytics
- [ ] `shop_viewed` fires once on mount
- [ ] `shop_product_viewed` fires on product card tap
- [ ] `shop_checkout_started` fires with `{ product_id, product_name, price }`
- [ ] `shop_checkout_completed` fires on browser dismiss
- [ ] `shop_checkout_cancelled` fires on browser cancel
- [ ] `shop_checkout_failed` fires with `{ error_type }` on error

### Accessibility
- [ ] Product images have alt text or accessible labels
- [ ] Buy buttons have accessible labels
- [ ] All tap targets ≥ 44pt

---

## I. Mobile App — Attendance (MOB-008)

### Calendar View
- [ ] Calendar renders for current month
- [ ] 7-column grid with correct day-of-week alignment
- [ ] Attended days: colored circle (present=green, absent=red, excused=orange, late=dark-orange)
- [ ] Today (no record): gold border circle
- [ ] Legend row beneath calendar shows all status colors

### Month Navigation
- [ ] Previous month chevron navigates back
- [ ] Next month chevron navigates forward
- [ ] Month/year label updates correctly
- [ ] Records list filters to match selected month

### Stats
- [ ] Stats summary shows: total sessions, present, absent, late, attendance rate
- [ ] New user with no records → stats show zeros (not null/crash)

### Records List
- [ ] Filtered records for selected month shown as cards
- [ ] Each card shows date + status badge
- [ ] No records in month → calendar-outline icon + "No records this month"

### Loading State
- [ ] `AttendanceSkeleton`: stats grid + 35 circle placeholders + 3 record card outlines

### Error State
- [ ] Full-screen icon + "Could not load attendance" + Retry button

### Analytics
- [ ] `attendance_viewed` fires once on mount
- [ ] `attendance_date_filtered` fires on month navigation with `{ month: 'yyyy-MM' }`

### Accessibility
- [ ] Calendar days announce status to VoiceOver
- [ ] Month navigation buttons have accessible labels
- [ ] All tap targets ≥ 44pt

---

## J. Mobile App — Notification Settings (MOB-009)

### Toggle Switches
- [ ] Push Notifications toggle loads from API (`pushEnabled`)
- [ ] Email Fallback toggle loads (`emailFallback`)
- [ ] Direct Messages toggle loads (`dmNotifications`)
- [ ] Group Chat toggle loads (`channelNotifications`)
- [ ] @Mentions toggle loads (`mentionNotifications`)
- [ ] Announcements toggle loads (`announcementNotifications`)
- [ ] All toggles use gold track color when active

### Toggle Behavior
- [ ] Toggle any switch → `updateSettings` mutation fires immediately (optimistic)
- [ ] Settings persist after navigating away and returning
- [ ] Settings persist after killing and reopening app
- [ ] Update failure → Alert "Could not update setting" + value reverts

### Quiet Hours
- [ ] Quiet Hours toggle visible (`quietHoursEnabled`)
- [ ] Enable Quiet Hours → time picker for start/end appears
- [ ] Select start time → `quietHoursStart` saved as "HH:00"
- [ ] Select end time → `quietHoursEnd` saved as "HH:00"
- [ ] Time picker shows 24-hour grid of options

### Loading State
- [ ] `SettingsSkeleton`: section label + 5 rows with switch outlines

### Error State
- [ ] Full-screen icon + "Could not load settings" + Retry button

### Analytics
- [ ] `notification_settings_viewed` fires once on mount
- [ ] `notification_settings_changed` fires on every toggle with `{ setting, new_value }`

### Accessibility
- [ ] All switches have accessible labels
- [ ] All tap targets ≥ 44pt

---

## K. Mobile App — Schedule (Existing, Regression Check)

- [ ] Sessions list loads from `schedules.upcoming`
- [ ] Each session shows: date column (month/day/weekday), title, time, location, type badge, spot count
- [ ] "Register" button on unregistered sessions
- [ ] Register → `registration_started` event → success → "Registered" green badge
- [ ] Already-registered sessions show "Registered" badge
- [ ] Session full → specific Alert message
- [ ] Already registered → specific Alert message

### Loading State
- [ ] `<Loading />` spinner while sessions load

### Empty State
- [ ] "No upcoming sessions." centered text

### Analytics
- [ ] `session_list_viewed` fires once on mount
- [ ] `registration_started` fires on register tap
- [ ] `registration_completed` fires on success

---

## L. Mobile App — Push Notifications (Regression Check)

- [ ] Push token registered on sign-in (`pushNotifications.registerExpoToken`)
- [ ] Notification received when app is backgrounded
- [ ] Tap chat notification → deep links to correct `/chat/{room}`
- [ ] Tap DM notification → deep links to correct `/dm/{conversationId}`
- [ ] Foreground notification displays correctly

---

## M. Mobile App — General Quality

### Stability
- [ ] No crash on any screen transition (navigate through all tabs + sub-screens)
- [ ] No console errors on any screen
- [ ] Memory usage stable after 5 minutes of navigation (no leaks)
- [ ] App works on airplane mode → shows error states (not crash)

### Screen Tracking
- [ ] PostHog `$screen` event fires on every navigation (via ScreenTracker)
- [ ] `identifyUser` called on sign-in
- [ ] `resetUser` called on sign-out

### Design Consistency
- [ ] Academy Gold `#CFB87C` used for active states and accents across all screens
- [ ] Navy `#1a1a2e` used for headers and dark backgrounds
- [ ] Card radius consistent (12-16px) across all screens
- [ ] System fonts used (no missing/wrong fonts)
- [ ] Ionicons from `@expo/vector-icons` used consistently

### Pull-to-Refresh
- [ ] Dashboard: pull-to-refresh reloads all 5 queries
- [ ] Programs: can retry via error state button
- [ ] Chat: messages reload on entering room
- [ ] Schedule: can retry via loading state
- [ ] Payments: can retry via error state button

---

## N. Web Portal — v1.3.0 Fixes

### WEB-003-FIX: Orders Route
- [ ] Navigate to `/orders` → page loads (not 404)
- [ ] Authenticated user with orders → order cards displayed with status badge and total
- [ ] Authenticated user with no orders → `Package` icon + "No orders yet" + link to `/shop`
- [ ] Unauthenticated → redirect to sign-in

### WEB-004-FIX: CoachDashboard Role Guard
- [ ] Navigate to `/coach-dashboard` as admin → page loads with booking management
- [ ] Navigate to `/coach-dashboard` as regular member → redirected to `/` (not accessible)
- [ ] Coach filter tabs work (All / Coach Mac / Coach O)
- [ ] Status filter tabs work (pending / confirmed / completed / cancelled)

### WEB-007-FIX: Shop Fetches from API
- [ ] Navigate to `/shop` → products load from `trpc.shop.products` (not hardcoded)
- [ ] Loading: 6 skeleton cards visible during fetch
- [ ] Error: AlertCircle icon + "Unable to load products" + "Try Again" button
- [ ] Empty: "Coming Soon" badge + "No products available yet"
- [ ] Product grid shows images, categories, names, descriptions, prices

### WEB-008-FIX: Schedule Fetches from API
- [ ] Navigate to `/schedule` as authenticated user → sessions load from `trpc.schedules.upcoming`
- [ ] Sessions grouped by date
- [ ] Loading: 3 skeleton cards visible during fetch
- [ ] Error: AlertCircle icon + "Unable to load schedule" + "Try Again" button
- [ ] Empty: "No upcoming sessions scheduled. Check back soon!"
- [ ] Static availability overview visible to all visitors (auth not required)

### WEB-009-FIX: Gallery Fetches from API
- [ ] Navigate to `/gallery` → photos load from `trpc.gallery.list` (not hardcoded)
- [ ] Category filter buttons work (All / Training / Highlights) — client-side filtering
- [ ] Loading: 6 photo skeletons visible during fetch
- [ ] Error: AlertCircle icon + "Unable to load gallery" + "Try Again" button
- [ ] Empty: "No photos in the gallery yet."
- [ ] Lightbox opens on photo click with prev/next navigation

### WEB-010-FIX: Newly Routed Pages Load
- [ ] `/blog` → Blog page loads
- [ ] `/blog/:slug` → Blog post page loads (test with a valid slug)
- [ ] `/videos` → Videos page loads with embed modal
- [ ] `/gallery` → Gallery page loads (covered above)
- [ ] `/about` → About page loads with locations from `trpc.locations.list`
- [ ] `/contact` → Contact page loads, both forms submit via `trpc.contact.submit`
- [ ] `/faqs` → FAQs page loads with accordion
- [ ] `/home` → Home page loads with animations
- [ ] `/orders` → Orders page loads (covered above)

### WEB-011-FIX: SignUp Fetches Catalog from API
- [ ] Navigate to `/sign-up` → products load from `trpc.payment.catalog`
- [ ] Products categorized: Memberships, Individual Sessions, Special Programs
- [ ] Loading: 2 animated skeleton cards
- [ ] Error: destructive border card + "Failed to load programs" + Retry
- [ ] Empty: "No programs are currently available"
- [ ] Add to cart → Stripe checkout flow works (guest or authenticated)

### WEB-012-FIX: PrivateSessionBooking Fetches Coaches
- [ ] Navigate to `/private-session-booking` → coaches load from `trpc.coaches.list`
- [ ] Coach cards show name, bio, specialties (from API with JOIN)
- [ ] Loading: 2 animated skeleton placeholders
- [ ] Error: "Failed to load coaches" + Retry button
- [ ] Empty: "No coaches are currently available"
- [ ] Select coach → complete booking form → submits successfully

### WEB-013-FIX: Pagination on List Routes
Test each route with `?limit=2` in the browser dev tools network tab (or via tRPC playground):
- [ ] `gallery.list` accepts and respects `limit`/`offset`
- [ ] `gallery.byCategory` accepts and respects `limit`/`offset`
- [ ] `coaches.list` accepts and respects `limit`/`offset`
- [ ] `locations.list` accepts and respects `limit`/`offset`
- [ ] `shop.products` accepts and respects `limit`/`offset`
- [ ] `payment.myPayments` accepts and respects `limit`/`offset`
- [ ] `payment.mySubscriptions` accepts and respects `limit`/`offset`
- [ ] `attendance.getMyAttendance` accepts and respects `limit`/`offset`
- [ ] `videos.list` accepts and respects `limit`/`offset`
- [ ] `videos.byCategory` accepts and respects `limit`/`offset`
- [ ] `dm.searchMessages` accepts and respects `limit`/`offset` (default 20, max 100)
- [ ] `blog.list` accepts and respects `limit`/`offset` (DB query actually uses params)

### Portal General
- [ ] `pnpm build` succeeds (Vite + esbuild server + esbuild serverless)
- [ ] `pnpm check` passes (or only pre-existing dompurify type warning)
- [ ] No console errors on critical flows (login → dashboard → schedule → chat → payments)
- [ ] Mobile responsive on 375px viewport for all new pages

---

## O. Known Issues Shipping with v1.3.0

These are documented and accepted:

| Issue | Severity | Workaround | Fix Target |
|-------|----------|------------|------------|
| DM image messages use `[image]<url>` content prefix instead of first-class `imageUrl` field | LOW | Client-side decode works reliably; only affects DMs | v1.4.0 — add `imageUrl` to `dm.sendMessage` schema |
| Coach phone numbers use bridge pattern (hardcoded map for known coach IDs) | LOW | Bridge map ensures contacts always shown; API provides name/email | v1.4.0 — extend coaches/users schema with phone field |
| Payments "Manage Subscription" opens generic web portal URL instead of Stripe Billing Portal session | LOW | `payment.createPortalSession` route exists on server but mobile not yet wired | v1.3.1 OTA update |
| No Sentry/crash reporting | MEDIUM | Manual QA + TestFlight feedback | v1.4.0 |
| Testimonials exist in two places (config.ts + StructuredData.tsx) | MEDIUM | Both currently in sync | Consolidation ticket exists |

---

## P. Test Environment Requirements

- **Real iOS device** (not simulator) for: push notifications, camera, haptics, Stripe checkout
- **Stripe test mode** credentials configured (test card: 4242 4242 4242 4242)
- **Network conditions**: test on Wi-Fi and cellular; test with airplane mode for offline states
- **User accounts needed**: 1 standard member, 1 admin (for CoachDashboard test), 1 fresh account (for empty states)
- **PostHog access**: verify events in PostHog dashboard after testing analytics checkboxes
