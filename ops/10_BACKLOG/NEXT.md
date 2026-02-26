# NEXT — Queued for Next Cycle

> These tickets are ready to pull when NOW items complete.
> Ordered by priority within each workstream.
> Every ticket carries a business impact tag per RULES.md.

---

## Mobile App (v1.3.0 — Phases A/B/C)

### MOB-005: Subscription Management `[REVENUE]`
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Phase**: A (Revenue Infrastructure)
- **Goal**: Members can view active subscriptions, payment history, and manage billing from the app
- **Scope**:
  - New "Payments" section accessible from dashboard or profile
  - View active subscriptions via `payment.mySubscriptions`
  - View payment history via `payment.myPayments` (paginated)
  - Subscription details: plan name, price, renewal date
  - Deep link to Stripe customer portal for cancellation/upgrade
- **Non-goals**:
  - In-app subscription modification (use Stripe portal)
  - Receipt PDF generation
- **Acceptance Criteria**:
  - [ ] Payments screen shows active subscriptions with renewal dates
  - [ ] Payment history loads with pagination (10 per page)
  - [ ] Empty state for users with no payments
  - [ ] Skeleton loading while fetching
  - [ ] Error state with retry
  - [ ] "Manage Subscription" opens Stripe portal in-app browser
- **Telemetry**: `payment_history_viewed`, `subscription_manage_opened`
- **Release**: v1.3.0

### MOB-006: Merchandise Shop `[REVENUE]`
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Phase**: A (Revenue Infrastructure)
- **Goal**: Browse and purchase Academy merchandise from the app
- **Scope**:
  - New Shop tab or section (evaluate placement)
  - Product listing via `shop.products`
  - Product detail view with images, pricing, variants
  - Checkout via `shop.createCheckout` → Stripe
  - Order confirmation
- **Non-goals**:
  - Order tracking (server doesn't support yet)
  - Cart persistence across sessions
  - Inventory management
- **Acceptance Criteria**:
  - [ ] Products load from API with images and pricing
  - [ ] Product detail view with size/variant selection
  - [ ] Checkout opens Stripe in-app
  - [ ] Success/cancel handled gracefully
  - [ ] Empty state if no products available
  - [ ] Skeleton loading for product grid
- **Telemetry**: `shop_product_viewed`, `shop_checkout_started`, `shop_checkout_completed`
- **Release**: v1.3.0

### MOB-007: Enhanced Dashboard `[RETENTION]`
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Phase**: B (Retention Infrastructure)
- **Goal**: Transform dashboard from simple welcome screen into an engagement hub
- **Scope**:
  - Attendance stats card (sessions attended, rate, streak) via `attendance.getMyStats`
  - Quick actions grid: Book Session, View Schedule, Open Chat, Contact Coach
  - Upcoming payment card (next renewal date/amount)
  - Content feed: latest blog posts, video highlights
- **Non-goals**:
  - Weather widget (low value, API cost)
  - Full content browsing (separate content hub)
- **Acceptance Criteria**:
  - [ ] Attendance stats card shows real data from API
  - [ ] Quick actions grid with 4 buttons that navigate correctly
  - [ ] Upcoming payment shows next renewal (or "No active subscriptions")
  - [ ] Content feed shows 3 most recent items
  - [ ] All sections have skeleton loading
  - [ ] Pull-to-refresh works on entire dashboard
- **Telemetry**: `dashboard_quick_action_tapped` (action name), `dashboard_content_tapped`
- **Release**: v1.3.0

### MOB-008: Attendance Tracking Screen `[RETENTION]`
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Phase**: B (Retention Infrastructure)
- **Goal**: Members can view their attendance history and stats
- **Scope**:
  - New Attendance screen (from dashboard quick action or profile)
  - Calendar view showing attended dates
  - Stats summary: total sessions, attendance rate, current streak, longest streak
  - List view of recent attendance records
  - Date range filtering
- **Non-goals**:
  - QR code check-in (needs backend work)
  - Attendance trend charts (v1.4)
- **Acceptance Criteria**:
  - [ ] Calendar view highlights attended dates
  - [ ] Stats card shows totals, rate, streak
  - [ ] List view shows last 20 sessions with date/type
  - [ ] Handles new users with zero attendance
  - [ ] Skeleton loading
  - [ ] Pull-to-refresh
- **Telemetry**: `attendance_viewed`, `attendance_date_filtered`
- **Release**: v1.3.0

### MOB-009: Notification Preferences `[RETENTION]`
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Phase**: B (Retention Infrastructure)
- **Goal**: Members can control which notifications they receive and set quiet hours
- **Scope**:
  - New settings screen accessible from Profile
  - Toggle switches: DM notifications, Channel chat, Announcements, @mentions
  - Quiet hours: start time and end time pickers
  - Per-conversation mute via `dm.muteConversation`
  - Uses `pushNotifications.getSettings` and `pushNotifications.updateSettings`
- **Non-goals**:
  - Email notification settings
  - Notification frequency controls
- **Acceptance Criteria**:
  - [ ] Settings screen loads current preferences from API
  - [ ] Each toggle updates server immediately with optimistic UI
  - [ ] Quiet hours time pickers work correctly
  - [ ] Per-conversation mute accessible from DM thread
  - [ ] Changes persist across app restarts
  - [ ] Error handling if settings update fails (revert toggle)
- **Telemetry**: `notification_settings_changed` (setting name, new value)
- **Release**: v1.3.0

### MOB-010: Chat Image Upload `[ENGAGEMENT]`
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Phase**: C (Experience Upgrade)
- **Goal**: Send images in group chat and DMs
- **Scope**:
  - Camera and photo library picker (expo-image-picker)
  - Upload to `/api/chat/upload-image` (S3, 5MB limit)
  - Upload progress indicator
  - Image renders in message bubble with tap-to-fullscreen
  - Graceful handling of oversized images
  - Retry on upload failure
- **Non-goals**:
  - Video upload (v1.4 Clips)
  - Multiple image selection
  - Image editing/cropping before send
- **Acceptance Criteria**:
  - [ ] Camera and library picker both work
  - [ ] Images under 5MB upload successfully
  - [ ] Images over 5MB show clear size limit message
  - [ ] Upload progress visible during send
  - [ ] Sent image appears in chat bubble
  - [ ] Tap image opens fullscreen viewer
  - [ ] Failed upload shows retry button
  - [ ] Works in both group chat and DMs
- **Telemetry**: `chat_image_upload_success`, `chat_image_upload_failed` (reason)
- **Release**: v1.3.0

---

## Web Portal

*(Generated from WEB-001 UX Audit + WEB-002 API Assessment — 2026-02-26)*

### WEB-003-FIX: Add /orders Route to App.tsx (CRITICAL)
- **Workstream**: Portal
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Goal**: Orders page exists (`Orders.tsx`) but is unreachable — no route in App.tsx
- **Scope**: Add `<Route path="/orders">` to App.tsx, link from Shop or Dashboard navigation
- **Acceptance Criteria**:
  - [ ] `/orders` route renders Orders page
  - [ ] Navigation includes link to orders for authenticated users
  - [ ] `pnpm build` passes
- **Telemetry**: No new events
- **Release**: Next web deploy

### WEB-004-FIX: Add Auth Role Guard to CoachDashboard (CRITICAL)
- **Workstream**: Portal
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Goal**: Any authenticated user can currently access `/coach-dashboard` — should be restricted to coach/admin roles
- **Scope**: Add role check (coach or admin) to CoachDashboard, redirect unauthorized users
- **Acceptance Criteria**:
  - [ ] Non-coach users see access denied or redirect when visiting `/coach-dashboard`
  - [ ] Coach and admin users see dashboard normally
  - [ ] `pnpm build` passes
- **Telemetry**: No new events
- **Release**: Next web deploy

### WEB-005-FIX: Wire Up SkillsLab Registration Form (CRITICAL)
- **Workstream**: Portal
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Goal**: SkillsLabRegisterPage has form UI but no submit handler — form does nothing
- **Scope**: Connect form to `leads.create` or a new registration mutation, show success/error state
- **Acceptance Criteria**:
  - [ ] Form submission sends data to backend
  - [ ] Success state shown after submission
  - [ ] Error state shown on failure
  - [ ] `pnpm build` passes
- **Telemetry**: `skills_lab_registration_submitted`, `skills_lab_registration_failed`
- **Release**: Next web deploy

### WEB-006-FIX: Wire Up PerformanceLab Application Form (CRITICAL)
- **Workstream**: Portal
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Goal**: PerformanceLabApplyPage has form UI but no submit handler — form does nothing
- **Scope**: Connect form to `leads.create` or a new application mutation, show success/error state
- **Acceptance Criteria**:
  - [ ] Form submission sends data to backend
  - [ ] Success state shown after submission
  - [ ] Error state shown on failure
  - [ ] `pnpm build` passes
- **Telemetry**: `performance_lab_application_submitted`, `performance_lab_application_failed`
- **Release**: Next web deploy

### WEB-007-FIX: Shop Page — Fetch Products from API (HIGH)
- **Workstream**: Portal
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Goal**: Shop page uses hardcoded products — should fetch from `shop.products` tRPC route
- **Scope**: Replace hardcoded product data with `trpc.shop.products.useQuery()`, add loading/error/empty states
- **Acceptance Criteria**:
  - [ ] Products come from API, not hardcoded data
  - [ ] Admin product changes in dashboard appear on Shop page
  - [ ] Loading skeleton while fetching
  - [ ] Empty state if no products
  - [ ] Error state with retry
  - [ ] `pnpm build` passes
- **Telemetry**: No new events
- **Release**: Next web deploy

### WEB-008-FIX: Schedule Page — Fetch from API (HIGH)
- **Workstream**: Portal
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Goal**: Schedule page uses hardcoded `SCHEDULE_DATA` — should fetch from `schedules.upcoming` tRPC route
- **Scope**: Replace hardcoded schedule with API data, add loading/error/empty states
- **Acceptance Criteria**:
  - [ ] Schedule data comes from API
  - [ ] Admin schedule changes appear on page
  - [ ] Loading, error, and empty states present
  - [ ] `pnpm build` passes
- **Telemetry**: No new events
- **Release**: Next web deploy

### WEB-009-FIX: Gallery Page — Fetch from API (HIGH)
- **Workstream**: Portal
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Goal**: Gallery page uses hardcoded photos — should fetch from `gallery.list` tRPC route
- **Scope**: Replace hardcoded gallery data with API call, add loading/error/empty states
- **Acceptance Criteria**:
  - [ ] Gallery photos come from API
  - [ ] Admin gallery uploads appear on page
  - [ ] Loading, error, and empty states present
  - [ ] `pnpm build` passes
- **Telemetry**: No new events
- **Release**: Next web deploy

### WEB-010-FIX: Route Unrouted Pages (HIGH)
- **Workstream**: Portal
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Goal**: Blog, BlogPost, Videos, Gallery, About, Contact, FAQs, Home pages exist but have no routes in App.tsx
- **Scope**: Add routes for all existing pages. Determine which belong in portal vs marketing site. Remove any that are duplicates of marketing pages.
- **Acceptance Criteria**:
  - [ ] All content pages reachable via URL
  - [ ] Navigation links updated to include new routes
  - [ ] `pnpm build` passes
- **Telemetry**: No new events
- **Release**: Next web deploy

### WEB-013-FIX: Add Pagination to List API Routes (HIGH — mobile blocker)
- **Workstream**: Portal
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Goal**: 10+ list routes lack pagination. Mobile v1.3 requires paginated responses for performance.
- **Scope**: Add `limit`/`offset` (or cursor) pagination to: `payment.myPayments`, `payment.mySubscriptions`, `attendance.getMyAttendance`, `gallery.list`, `gallery.byCategory`, `videos.list`, `videos.byCategory`, `dm.searchMessages`, `blog.list` (fix ignored params), `coaches.list`, `locations.list`, `shop.products`
- **Non-goals**: Breaking existing web portal consumers (pagination must be optional with sensible defaults)
- **Acceptance Criteria**:
  - [ ] All listed routes accept optional `limit` and `offset`/`cursor` params
  - [ ] Default limit (e.g. 50) when no params provided — backwards compatible
  - [ ] `blog.list` actually uses its limit/offset params in the DB query
  - [ ] `dm.searchMessages` has max result limit (100)
  - [ ] Existing web portal calls still work without params
  - [ ] `pnpm build` and `pnpm check` pass
- **Telemetry**: No new events
- **Release**: Before mobile v1.3

---

### WEB-003: Testimonial Source Consolidation `[STABILITY]`
- **Workstream**: Portal
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Goal**: Eliminate testimonial drift between marketing config and portal StructuredData
- **Scope**:
  - Determine single canonical source for testimonials
  - Update `client/src/components/StructuredData.tsx` to read from canonical source
  - Or create shared testimonial data file that both apps import
- **Non-goals**:
  - Changing the marketing site structured data system
- **Acceptance Criteria**:
  - [ ] Single source of truth for testimonials
  - [ ] Both apps generate correct structured data
  - [ ] Build passes for both apps
- **Telemetry**: No new events
- **Release**: Next web deploy

---

## Marketing / SEO

*(Tickets will be generated from MKT-001 and SEO-001 audit findings)*

### SEO-002: Structured Data Expansion `[SEO]`
- **Workstream**: SEO
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Goal**: Add comprehensive Schema.org markup beyond current coverage
- **Scope**:
  - LocalBusiness with geo coordinates
  - SportsActivityLocation
  - FAQPage on program pages
  - BreadcrumbList on all pages
  - Review/AggregateRating
  - Event markup for sessions/camps
- **Non-goals**:
  - Content changes
  - Visual design changes
- **Acceptance Criteria**:
  - [ ] Each program page has FAQPage structured data
  - [ ] Homepage has LocalBusiness + SportsActivityLocation
  - [ ] All pages have BreadcrumbList
  - [ ] Structured data validates in Google Rich Results Test
  - [ ] `npm run validate` passes
- **Telemetry**: No new events
- **Release**: Next marketing deploy

---

## Research

### RES-002: Local Competitor Analysis (Gallatin, TN) `[RESEARCH]`
- **Workstream**: Research
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Goal**: Identify local competitors and their online presence to inform local SEO strategy
- **Scope**:
  - Find youth sports training facilities within 25 miles of Gallatin, TN
  - Document their websites, Google Business profiles, review counts
  - Identify keyword opportunities they're not targeting
  - Recommend local SEO tactics
- **Acceptance Criteria**:
  - [ ] 5+ local competitors documented
  - [ ] Keyword gap analysis complete
  - [ ] 3+ local SEO tactics recommended
  - [ ] Report in `ops/50_REPORTS/competitor-snapshots.md`

### RES-003: SEO Keyword Competitive Analysis `[RESEARCH]`
- **Workstream**: Research
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Goal**: Identify keyword opportunities by analyzing what competitors rank for
- **Acceptance Criteria**:
  - [ ] Top 20 relevant keywords identified
  - [ ] Current Academy ranking vs. competitors documented
  - [ ] Content gap recommendations produced
  - [ ] Report in `ops/50_REPORTS/competitor-snapshots.md`

---

## Video & Clips (v1.4.0 — Cross-Stack, Starts AFTER v1.3.0 Ships)

> **PREREQUISITE**: v1.3.0 must be live in the App Store before ANY Clips work begins.
> **Sequencing**: WEB-020 → WEB-021 + WEB-022 (parallel) → WEB-023 + WEB-024 + WEB-025 + WEB-026 → deploy + 48hr stabilization → MOB-030 → MOB-031 → MOB-032 + MOB-033 (parallel)
> Backend must deploy and stabilize BEFORE mobile can start.

### WEB-020: Video/Clips Database Schema + Migration `[INFRA]`
- **Workstream**: Portal
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Goal**: Create database tables and schema changes to support video/clip sharing
- **Scope**:
  - New `videos` table (id, uploaderId FK→users, title, description, videoUrl, videoKey, thumbnailUrl, thumbnailKey, externalUrl nullable, durationMs, sizeBytes, mimeType, visibility enum, status enum, viewCount, timestamps)
  - New `videoLikes` table (id, videoId FK→videos, userId FK→users, unique on videoId+userId, createdAt)
  - Alter `chatMessages`: add videoId FK→videos nullable
  - Alter `dmMessages`: add imageUrl, imageKey, videoId (all nullable)
  - Drizzle migration
- **Non-goals**: No tRPC routes (WEB-021), no storage logic (WEB-022)
- **Acceptance Criteria**:
  - [ ] All tables/columns created with proper FK constraints
  - [ ] Migration runs cleanly on dev database
  - [ ] Existing chat/DM queries unaffected
  - [ ] `pnpm build` and `pnpm check` pass
- **Touched Files**: `drizzle/schema.ts`, `drizzle/migrations/` (new)
- **Release**: v1.4.0 backend phase

### WEB-021: Video tRPC Router `[INFRA]`
- **Workstream**: Portal
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Depends on**: WEB-020
- **Goal**: Video CRUD + feed + like/share via tRPC for mobile
- **Scope**:
  - `video.upload` — create record, return upload key
  - `video.confirmUpload` — validate storage, set status ready
  - `video.getFeed` — cursor pagination, newest-first, include uploader + like state
  - `video.getById` — single clip details
  - `video.like` — toggle (idempotent)
  - `video.delete` — soft delete (uploader/admin)
  - DB functions for all video operations
- **Non-goals**: Transcoding, streaming optimization, comments
- **Acceptance Criteria**:
  - [ ] All 6 core video routes functional
  - [ ] Upload → confirm transitions status to ready
  - [ ] Feed paginated with like counts
  - [ ] Existing chat/DM without video unchanged
  - [ ] `pnpm build` and `pnpm check` pass
- **Touched Files**: `server/routers.ts`, `server/db.ts`
- **Release**: v1.4.0 backend phase

### WEB-022: Video Storage Upload Strategy `[INFRA]`
- **Workstream**: Portal
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Depends on**: WEB-020
- **Goal**: Video file upload via existing Forge CDN storage
- **Scope**:
  - Path pattern: `videos/{userId}/{timestamp}-{hash}.mp4`, thumbnails: `thumb-{timestamp}-{hash}.jpg`
  - Max 100MB (configurable via `MAX_VIDEO_SIZE_BYTES` env)
  - Accepted: mp4, mov, webm
  - Use existing `storagePut()`/`storageGet()`
- **Non-goals**: Transcoding, server-side thumbnail generation
- **Acceptance Criteria**:
  - [ ] Video upload works for mp4, mov, webm
  - [ ] Files over 100MB rejected clearly
  - [ ] URLs accessible after upload
  - [ ] New env var documented in .env.example
  - [ ] `pnpm build` passes
- **Touched Files**: `server/storage.ts` or new file, `.env.example`
- **Release**: v1.4.0 backend phase

### WEB-023: External Video Links + oEmbed `[ENGAGEMENT]`
- **Workstream**: Portal
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Depends on**: WEB-021
- **Goal**: Support sharing external video links (YouTube, TikTok, Instagram) with rich previews
- **Scope**:
  - `video.addExternal` — accept URL, fetch oEmbed metadata (title, thumbnail, provider)
  - oEmbed domain allowlist: youtube.com, tiktok.com, instagram.com
  - 5-second timeout on oEmbed fetch with graceful fallback (store URL without preview)
  - Store external URL in videos table with source metadata
- **Non-goals**: Hosting/transcoding external videos, embedding players server-side
- **Acceptance Criteria**:
  - [ ] YouTube links return oEmbed metadata (title, thumbnail)
  - [ ] TikTok links return oEmbed metadata
  - [ ] Instagram links return oEmbed metadata
  - [ ] Non-allowlisted domains rejected with clear error
  - [ ] oEmbed timeout falls back to URL-only record
  - [ ] `pnpm build` and `pnpm check` pass
- **Touched Files**: `server/routers.ts`, `server/db.ts` (or new `server/oembed.ts`)
- **Release**: v1.4.0 backend phase

### WEB-024: Chat/DM Video Integration `[ENGAGEMENT]`
- **Workstream**: Portal
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Depends on**: WEB-021
- **Goal**: Wire videoId into existing chat and DM message routes
- **Scope**:
  - Modify `chat.send` to accept optional videoId
  - Modify `dm.sendMessage` to accept optional videoId
  - Modify `chat.history` to include video payload when videoId present
  - Modify `dm.getMessages` to include video payload when videoId present
  - Text-only messages completely unaffected (videoId is nullable)
- **Non-goals**: New chat UI (mobile-side work), video player embedding
- **Acceptance Criteria**:
  - [ ] chat.send accepts videoId, message stored correctly
  - [ ] dm.sendMessage accepts videoId, message stored correctly
  - [ ] chat.history returns video payload for video messages
  - [ ] dm.getMessages returns video payload for video messages
  - [ ] Existing text-only messages unchanged in response shape
  - [ ] Ably payloads include videoId when present
  - [ ] `pnpm build` and `pnpm check` pass
- **Touched Files**: `server/routers.ts`, `server/db.ts`, `server/chat-sse.ts`
- **Release**: v1.4.0 backend phase

### WEB-025: Share Link Generation `[ENGAGEMENT]`
- **Workstream**: Portal
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Depends on**: WEB-021
- **Goal**: Generate shareable deep link URLs for clips
- **Scope**:
  - `video.share` route returns deep link URL (`academy://clips/{videoId}`)
  - Also returns universal link URL (`https://app.academytn.com/clips/{videoId}`)
  - Include basic OG meta tags for link previews (title, thumbnail, description)
- **Non-goals**: Universal link verification (WEB-026), social card rendering
- **Acceptance Criteria**:
  - [ ] video.share returns both deep link and universal link URLs
  - [ ] URLs include correct videoId
  - [ ] OG meta endpoint serves title + thumbnail for link previews
  - [ ] `pnpm build` and `pnpm check` pass
- **Touched Files**: `server/routers.ts`
- **Release**: v1.4.0 backend phase

### WEB-026: Universal Link Infrastructure `[INFRA]`
- **Workstream**: Portal
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Depends on**: WEB-025
- **Goal**: Configure server + app association for universal links
- **Scope**:
  - Vercel rewrite: `/clips/:id` → SPA (or app redirect)
  - Apple App Site Association (AASA) file at `/.well-known/apple-app-site-association`
  - Android assetlinks.json at `/.well-known/assetlinks.json`
  - Document Team ID + bundle ID requirements
- **Non-goals**: Full universal link testing (requires App Store build)
- **Acceptance Criteria**:
  - [ ] AASA file served at correct path with correct bundle ID
  - [ ] assetlinks.json served at correct path
  - [ ] Vercel rewrite handles `/clips/:id` path
  - [ ] Documentation added for Team ID configuration
  - [ ] `pnpm build` passes
- **Touched Files**: `vercel.json`, `api/` (new), `.well-known/` files
- **Release**: v1.4.0 backend phase

### MOB-030: Clips Tab + Feed Screen `[ENGAGEMENT]`
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Depends on**: WEB-021 deployed + 48hr stabilization
- **Goal**: Add Clips tab with scrollable video feed
- **Scope**:
  - New "Clips" tab between Chat and Messages
  - Feed screen using video.getFeed with cursor pagination
  - VideoCard component (thumbnail, title, uploader, likes, share)
  - Like/unlike via video.like (optimistic UI)
  - Clip detail screen `app/clips/[id].tsx` with full-screen playback
  - VideoPlayer component wrapping expo-av
  - External links open in-app browser
- **Non-goals**: Upload (MOB-031), chat integration (MOB-032), deep links (MOB-033)
- **Acceptance Criteria**:
  - [ ] Clips tab visible with icon
  - [ ] Feed loads with pagination
  - [ ] Like toggles with optimistic UI
  - [ ] Tap card opens player
  - [ ] External clips open in-app browser
  - [ ] Skeleton loading, empty state, error state with retry
  - [ ] Pull-to-refresh
- **Telemetry**: `clips_feed_viewed`, `clip_opened`, `clip_liked`
- **Release**: v1.4.0

### MOB-031: Clip Upload Flow `[ENGAGEMENT]`
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Depends on**: WEB-021, WEB-022, WEB-023, MOB-030
- **Goal**: Upload video clips or share external video links
- **Scope**:
  - Bottom sheet: "Record Video", "Choose from Library", "Paste Link"
  - Video picker via expo-image-picker, thumbnail via expo-video-thumbnails
  - Upload progress indicator, size validation (100MB), type validation
  - External link: paste URL → video.addExternal → card in feed
- **Acceptance Criteria**:
  - [ ] Three upload options in bottom sheet
  - [ ] Video under 100MB uploads with progress
  - [ ] Oversize videos show clear error
  - [ ] Thumbnail auto-generated
  - [ ] External links create feed cards
  - [ ] Failed uploads show retry
- **Telemetry**: `clip_upload_started`, `clip_upload_completed`, `clip_upload_failed`, `clip_external_added`
- **Release**: v1.4.0

### MOB-032: Video in Chat + DMs `[ENGAGEMENT]`
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Depends on**: WEB-024, MOB-030, MOB-031
- **Goal**: Send/receive video clips in chat and DMs
- **Scope**:
  - Attachment button in ChatInput with video option
  - MessageBubble renders inline video preview for messages with videoId
  - Works in group chat and DMs
  - DMs also gain image support (new columns)
- **Acceptance Criteria**:
  - [ ] Video picker accessible from chat input
  - [ ] Video messages render with thumbnail + play icon
  - [ ] Tap opens player
  - [ ] Works in group chat AND DMs
  - [ ] Ably delivers video messages correctly
  - [ ] Text-only messages unaffected
- **Telemetry**: `chat_video_sent`, `dm_video_sent`
- **Release**: v1.4.0

### MOB-033: Clips Deep Links + Sharing `[DIFFERENTIATION]`
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Depends on**: WEB-025, WEB-026, MOB-030
- **Goal**: Share clips via deep links, handle incoming links
- **Scope**:
  - Native share sheet via Share API
  - Deep link: `academy://clips/{videoId}` → `app/clips/[id].tsx`
  - Universal links attempt (`https://app.academytn.com/clips/{id}`), document follow-up if blocked
- **Acceptance Criteria**:
  - [ ] Share button opens native share sheet
  - [ ] Deep links open correct clip
  - [ ] Universal links work OR follow-up ticket created
- **Telemetry**: `clip_shared`
- **Release**: v1.4.0

---

## DONE

*(Move completed tickets here with completion date)*
