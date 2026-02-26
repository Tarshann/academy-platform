# NEXT — Queued for Next Cycle

> These tickets are ready to pull when NOW items complete.
> Ordered by priority within each workstream.

---

## Mobile App

### MOB-005: Subscription Management
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
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

### MOB-006: Merchandise Shop
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
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

### MOB-007: Enhanced Dashboard
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
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

### MOB-008: Attendance Tracking Screen
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
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

### MOB-009: Notification Preferences
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
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

### MOB-040: Session RSVP / Availability Tracking
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Source**: RES-001 competitor analysis (TeamSnap's #1 feature)
- **Goal**: Parents can RSVP for upcoming sessions so coaches see predicted attendance
- **Scope**:
  - RSVP buttons (Going / Maybe / Not Going) on session cards in schedule tab
  - Push notification action buttons for quick RSVP without opening app
  - RSVP summary visible on session detail (X going, Y maybe)
  - Coach/admin view: RSVP roster per session
  - Backend: new `sessionRsvp` table (userId, scheduleId, status enum, createdAt)
  - New tRPC routes: `session.rsvp` (upsert), `session.getRsvps` (list per session)
- **Non-goals**:
  - Waitlist management
  - RSVP-based capacity enforcement (informational only)
- **Acceptance Criteria**:
  - [ ] Session cards show RSVP buttons
  - [ ] One-tap RSVP without opening session detail
  - [ ] RSVP counts visible on session detail screen
  - [ ] Admin can view RSVP roster per session
  - [ ] Optimistic UI with server sync
  - [ ] Skeleton loading, error state with retry
- **Touched Files**:
  - `drizzle/schema.ts` (new table)
  - `server/routers.ts` (new routes)
  - `server/db.ts` (new functions)
  - `academy-app/app/(tabs)/schedule.tsx`
- **Test Plan**:
  - Tap Going on a session → count updates
  - Change to Not Going → count updates
  - Admin views session → sees RSVP list
  - Network error → optimistic reverts
- **Telemetry**: `session_rsvp_changed` (status, sessionId)
- **Release**: v1.3.0

### MOB-018: Guided Onboarding Flow (Promoted from LATER)
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Source**: RES-001 competitor analysis (all 3 competitors have guided onboarding)
- **Goal**: 3-4 animated walkthrough screens on first launch to reduce time-to-first-registration below 3 minutes
- **Scope**:
  - Welcome screen with Academy branding
  - "Browse Programs" screen highlighting offerings
  - "Enable Notifications" screen with permission request
  - "View Your Schedule" screen directing to first action
  - Reanimated page transitions
  - AsyncStorage flag to show only once
  - Skip button available on all screens
- **Non-goals**:
  - Account creation during onboarding (Clerk handles this)
  - Program enrollment during onboarding
- **Acceptance Criteria**:
  - [ ] 3-4 screens with smooth Reanimated transitions
  - [ ] Notification permission requested during flow
  - [ ] Onboarding shows only once (persisted flag)
  - [ ] Skip button works on all screens
  - [ ] Completes in < 60 seconds
  - [ ] Navigates to schedule/dashboard after completion
- **Touched Files**:
  - `academy-app/app/onboarding.tsx` (new)
  - `academy-app/app/_layout.tsx` (conditional routing)
- **Test Plan**:
  - Fresh install → onboarding appears
  - Complete onboarding → dashboard loads
  - Kill and reopen → onboarding does NOT appear again
  - Tap Skip → goes directly to dashboard
- **Telemetry**: `onboarding_started`, `onboarding_completed`, `onboarding_skipped` (screen number)
- **Release**: v1.3.0

### MOB-010: Chat Image Upload
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Goal**: Send images in group chat and DMs
- **Scope**:
  - Camera and photo library picker (expo-image-picker)
  - Upload to `/api/chat/upload-image` (S3, 5MB limit)
  - Upload progress indicator
  - Image renders in message bubble with tap-to-fullscreen
  - Graceful handling of oversized images
  - Retry on upload failure
- **Non-goals**:
  - Video upload
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

*(Tickets will be generated from WEB-001 audit findings)*

### WEB-030: Calendar iCal Feed Export
- **Workstream**: Portal
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Source**: RES-001 competitor analysis (TeamSnap + SportsEngine table stakes feature)
- **Goal**: Generate iCal feed per user so registered sessions appear in Google Calendar, Apple Calendar, and Outlook
- **Scope**:
  - New tRPC route `schedule.icalFeed` returning `.ics` formatted data for user's registered sessions
  - iCal events include: session title, time, location, program name
  - Feed URL accessible via portal UI ("Subscribe to Calendar" link)
  - Mobile: "Add to Calendar" button on session detail using `expo-calendar`
- **Non-goals**:
  - Two-way sync (calendar → Academy)
  - Calendar widget in the app
- **Acceptance Criteria**:
  - [ ] iCal feed URL generates valid `.ics` file
  - [ ] Events include title, time, location
  - [ ] Google Calendar subscription works
  - [ ] Apple Calendar subscription works
  - [ ] Feed updates when new sessions are registered
  - [ ] `pnpm build` passes
- **Touched Files**:
  - `server/routers.ts` (new route)
  - `server/db.ts` (query for user's sessions)
  - `client/src/pages/Schedule.tsx` (subscribe link)
- **Test Plan**:
  - Copy iCal URL → paste into Google Calendar → events appear
  - Register for new session → event appears in subscribed calendar
- **Telemetry**: `calendar_feed_subscribed`
- **Release**: Next web deploy

### WEB-003: Testimonial Source Consolidation
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

### SEO-010: Google Business Profile Activation + Review Campaign
- **Workstream**: SEO
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Source**: RES-002 local competitor analysis + RES-003 SEO keyword analysis
- **Goal**: Claim, optimize, and activate Google Business Profile to improve local pack ranking
- **Scope**:
  - Claim and verify GBP for "The Academy" in Gallatin, TN
  - Add all 3 programs as "services" in GBP
  - Upload 10-15 training session photos
  - Set correct business hours (Tue, Thu 6-8 PM, Sun 11 AM-12 PM)
  - Add Google verification code to `academy-marketing/app/layout.tsx` metadata
  - Design review generation campaign (post-cohort follow-up email/text)
  - Weekly Google Business Posts (training tips, upcoming dates, highlights)
- **Non-goals**:
  - Google Ads (separate budget decision)
  - Automated review solicitation tools
- **Acceptance Criteria**:
  - [ ] GBP claimed and verified
  - [ ] All programs listed as services
  - [ ] 10+ photos uploaded
  - [ ] Hours accurate
  - [ ] Verification code in layout.tsx
  - [ ] Review campaign plan documented
  - [ ] First Google Business Post published
- **Touched Files**:
  - `academy-marketing/app/layout.tsx` (Google verification meta tag)
- **Test Plan**: Search "youth athletic training Gallatin TN" on Google → Academy appears in local pack
- **Telemetry**: No code telemetry (external platform)
- **Release**: Immediate (no deploy needed for GBP, deploy needed for verification code)

### SEO-011: FAQPage Schema Markup
- **Workstream**: SEO
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Source**: RES-003 SEO keyword analysis (quick win for rich snippets)
- **Goal**: Add FAQPage JSON-LD structured data to FAQ page and program pages for Google rich snippets
- **Scope**:
  - New FAQPage schema component in `academy-marketing/lib/structured-data.tsx`
  - Apply to main FAQ page using existing FAQ data
  - Apply to each program page using program-specific FAQs from `config.ts`
  - Validate with Google Rich Results Test
- **Non-goals**:
  - Content changes to FAQ answers
  - Visual FAQ redesign
- **Acceptance Criteria**:
  - [ ] FAQ page has valid FAQPage JSON-LD
  - [ ] Each program page has valid FAQPage JSON-LD from its FAQ data
  - [ ] Validates in Google Rich Results Test
  - [ ] `npm run validate` passes
  - [ ] `npm run build` passes
- **Touched Files**:
  - `academy-marketing/lib/structured-data.tsx`
  - `academy-marketing/app/faq/page.tsx`
  - `academy-marketing/app/programs/[slug]/page.tsx`
- **Test Plan**: Run Rich Results Test on FAQ URL → shows FAQ rich result preview
- **Telemetry**: No new events
- **Release**: Next marketing deploy

### MKT-020: Blog Content Publishing System
- **Workstream**: Marketing
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Source**: RES-003 SEO keyword analysis (critical content gap)
- **Goal**: Create blog routing and publish first 5 blog posts targeting parent-intent keywords
- **Scope**:
  - Create dynamic blog route at `academy-marketing/app/blog/[slug]/page.tsx`
  - Add blog post data to config or markdown content directory
  - Publish 5 SEO-targeted articles:
    1. "5 Speed Drills Your Athlete Can Do at Home"
    2. "What Is SAQ Training and Why Every Young Athlete Needs It"
    3. "How to Know if Your Child is Ready for Structured Training"
    4. "How to Prepare for Middle School Basketball Tryouts in Sumner County"
    5. "Why We Train Outside: The Academy Approach"
  - Each post: unique meta tags, structured data (Article schema), internal links to programs
  - Update blog index page to show real posts instead of "Coming Soon"
- **Non-goals**:
  - CMS integration (static content is fine for now)
  - Comment system
  - Author profiles
- **Acceptance Criteria**:
  - [ ] Blog route renders individual posts
  - [ ] 5 posts published with SEO-optimized titles and descriptions
  - [ ] Blog index shows real posts, not "Coming Soon"
  - [ ] Each post has Article structured data
  - [ ] Internal links to relevant program pages
  - [ ] `npm run build` passes
  - [ ] `npm run validate` passes
- **Touched Files**:
  - `academy-marketing/app/blog/[slug]/page.tsx` (new)
  - `academy-marketing/app/blog/page.tsx` (update)
  - `academy-marketing/lib/config.ts` or new content directory
  - `academy-marketing/lib/structured-data.tsx`
- **Telemetry**: No new events
- **Release**: Next marketing deploy

### MKT-021: Sport-Specific Landing Pages
- **Workstream**: Marketing
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Source**: RES-003 SEO keyword analysis (high-impact, low-effort)
- **Goal**: Create 4 sport-specific landing pages to capture sport-targeted search queries
- **Scope**:
  - `/basketball-training-gallatin-tn` targeting youth basketball keywords
  - `/flag-football-training-gallatin-tn` targeting flag football keywords
  - `/soccer-training-gallatin-tn` targeting youth soccer keywords
  - `/speed-agility-training-gallatin-tn` targeting SAQ/speed keywords
  - Each page pulls data from `config.ts` (programs, coaches, testimonials)
  - Each page has unique H1, meta tags, structured data
  - Cross-links to relevant program pages
- **Non-goals**:
  - New content creation (reuse config data)
  - Design changes (use existing page patterns)
- **Acceptance Criteria**:
  - [ ] 4 new pages created and accessible
  - [ ] Each page has unique title, description, H1
  - [ ] Each page has structured data (SportsActivityLocation + FAQPage)
  - [ ] Internal links to program signup pages
  - [ ] `npm run build` passes
  - [ ] `npm run validate` passes
- **Touched Files**:
  - `academy-marketing/app/basketball-training-gallatin-tn/page.tsx` (new)
  - `academy-marketing/app/flag-football-training-gallatin-tn/page.tsx` (new)
  - `academy-marketing/app/soccer-training-gallatin-tn/page.tsx` (new)
  - `academy-marketing/app/speed-agility-training-gallatin-tn/page.tsx` (new)
- **Telemetry**: No new events
- **Release**: Next marketing deploy

### SEO-002: Structured Data Expansion
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

*(RES-002 and RES-003 completed 2026-02-26 — see DONE section)*

---

## Video & Clips Feature (Cross-Workstream — Portal builds backend, Mobile builds UI)

> **Sequencing**: WEB-020 → WEB-021 + WEB-022 (parallel) → deploy → MOB-030 → MOB-031 → MOB-032 + MOB-033 (parallel)
> Backend must deploy BEFORE mobile can start Milestone 3.

### WEB-020: Video/Clips Database Schema + Migration
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
- **Release**: Must deploy before mobile Milestone 3

### WEB-021: Video tRPC Router
- **Workstream**: Portal
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Depends on**: WEB-020
- **Goal**: Video CRUD + feed + like/share via tRPC for mobile
- **Scope**:
  - `video.upload` — create record, return upload key
  - `video.confirmUpload` — validate storage, set status ready
  - `video.addExternal` — oEmbed fetch for YouTube/TikTok/Instagram
  - `video.getFeed` — cursor pagination, newest-first, include uploader + like state
  - `video.getById` — single clip details
  - `video.like` — toggle (idempotent)
  - `video.delete` — soft delete (uploader/admin)
  - `video.share` — return deep link URLs
  - Wire videoId into chat.send, dm.sendMessage, chat.history, dm.getMessages
  - DB functions for all video operations
- **Non-goals**: Transcoding, streaming optimization, comments
- **Acceptance Criteria**:
  - [ ] All 8 video routes functional
  - [ ] Upload → confirm transitions status to ready
  - [ ] External link fetches oEmbed metadata with 5s timeout
  - [ ] oEmbed domain allowlist: youtube.com, tiktok.com, instagram.com
  - [ ] Feed paginated with like counts
  - [ ] Chat/DM messages with videoId include video payload
  - [ ] Existing chat/DM without video unchanged
  - [ ] `pnpm build` and `pnpm check` pass
- **Touched Files**: `server/routers.ts`, `server/db.ts`
- **Release**: Must deploy before mobile Milestone 3

### WEB-022: Video Storage Upload Strategy
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
- **Release**: Must deploy before mobile Milestone 3

### MOB-030: Clips Tab + Feed Screen
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Depends on**: WEB-021 deployed
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
- **Release**: v1.3.0 Milestone 3

### MOB-031: Clip Upload Flow
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Depends on**: WEB-021, WEB-022, MOB-030
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
- **Release**: v1.3.0 Milestone 3

### MOB-032: Video in Chat + DMs
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Depends on**: MOB-030, MOB-031
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
- **Release**: v1.3.0 Milestone 3

### MOB-033: Clips Deep Links + Sharing
- **Workstream**: Mobile
- **Owner**: Unassigned
- **Status**: BACKLOG
- **Depends on**: MOB-030
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
- **Release**: v1.3.0 Milestone 3

---

## DONE

### RES-002: Local Competitor Analysis (Gallatin, TN) — DONE 2026-02-26
- **Owner**: Competitor Intel Agent
- **Output**: 9 local competitors documented in `ops/50_REPORTS/competitor-snapshots.md`
- **Findings**: D1 Training Hendersonville is primary threat; Academy has tech platform advantage; 5 local SEO tactics recommended
- **Tickets created**: SEO-010 (GBP activation), MKT-022 (city pages) in LATER

### RES-003: SEO Keyword Competitive Analysis — DONE 2026-02-26
- **Owner**: Competitor Intel Agent
- **Output**: 20 target keywords + 5 quick wins + content gap analysis in `ops/50_REPORTS/competitor-snapshots.md`
- **Findings**: Blog content is critical gap (0 published), sport-specific pages missing, FAQ schema is easy win
- **Tickets created**: MKT-020 (blog), MKT-021 (sport pages), SEO-010 (GBP), SEO-011 (FAQ schema)
