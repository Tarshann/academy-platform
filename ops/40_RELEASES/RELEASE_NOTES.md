# Release Notes

---

## v1.8.0 — Automation + AI Content Engine (Build 30)

**Date**: March 2026
**Build**: 30
**Platform**: iOS + Android

### App Store — What's New (iOS)

🤖 AI-Powered Progress Reports
Your child's training progress, summarized by AI and delivered straight to your inbox. Get bi-weekly reports covering metrics improvements, attendance trends, and coaching highlights.

🎉 Milestone Celebrations
When your athlete hits a personal record, we celebrate it! Custom celebration cards are automatically generated and shared — perfect for saving and sharing proud moments.

📊 Parent Weekly Digest
Stay in the loop with a personalized weekly summary for each child — attendance, performance metrics, showcase features, and upcoming sessions all in one place.

⏰ Smart Reminders
Never miss a session. Automatic reminders keep you and your athlete on schedule so you can focus on what matters — training.

📝 Session Recaps
After every training session, get an AI-generated recap of what was covered, making it easy to track your athlete's journey.

🛍️ Drop Alerts
Be the first to know when new merch and content drops go live with automatic notifications.

Plus: Performance improvements and bug fixes throughout the app.

### Google Play — What's New (Android)

v1.8.0 — AI + Automation

• AI progress reports delivered to parents bi-weekly
• Milestone celebrations with custom cards when athletes hit PRs
• Weekly parent digest: attendance, metrics & schedule per child
• Automatic session reminders
• AI-generated session recaps after every training
• Merch drop notifications
• Performance improvements & bug fixes

### Technical Details

**Automation Layer (9 Vercel Cron Jobs)**
- Nurture campaigns, auto-generate sessions from templates, session reminders
- Merch drop notifications, metrics prompts, bi-weekly AI progress reports
- Reengagement campaigns, parent weekly digests, post-session AI content generation

**AI Content Engine**
- Gemini 2.5 Flash generates session recaps, social captions, parent push notifications
- Content queue admin workflow: approve/reject/edit before publishing
- Feed extended with session recap type

**Milestone Celebration Engine**
- Direction-aware personal record detection in metrics.record mutation
- Celebration pipeline: milestone → SVG→PNG card (sharp) → parent push → feed post
- Confetti dialog in MetricsManager on PR detection

**Database**: Migration 0019 — 7 new tables (progress_reports, reengagement_log, session_recaps, content_queue, digest_log, reminder_log, milestones)

---

## v1.7.1 — App Store Badges + Calendar Sync (Build 29)

**Date**: March 2026
**Build**: 29
**Platform**: iOS + Android

### What's New
- App Store and Google Play download badges on marketing site
- Calendar sync via expo-calendar with 1hr + 15min reminder alarms
- Athlete progress card on dashboard showing recent metrics
- App name updated for ASO: "The Academy - Youth Sports"
- Feed query optimized to raw SQL UNION ALL
- Performance Lab cohort urgency messaging

---

## v1.7.0 — Platform Hardening + Theme System (Build 27)

**Date**: March 2026
**Build**: 27
**Platform**: iOS + Android

### What's New
- Shared theme system with centralized design tokens
- 7 new reusable animated components
- 12 security and stability fixes
- 4 new admin manager panels (Social Posts, Merch Drops, Metrics, Showcases)
- Admin dashboard restructured with grouped sidebar navigation

---

## v1.6.0 — Athlete Experience (Build 24)

**Date**: February 2026
**Build**: 24
**Platform**: iOS + Android

### What's New
- Athlete Metrics — admin-recorded performance data with trend visualization
- Athlete Showcase — weekly spotlight with achievements and sport badges
- Games Hub — Gold Rush, Academy Trivia, Scratch & Win
- Social Gallery — aggregated social media posts from 5 platforms
- Merch Drops — scheduled drop alerts with countdown timers
- Video in Chat/DMs — recording + library selection (60s max)

---

## v1.3.0 — Revenue + Retention (Build 17)

**Date**: TBD (pending QA pass + App Store submission)
**Build**: 17
**Platform**: iOS (Android TBD)

### What's New

**In-App Payments (MOB-004, MOB-005, MOB-006)**
- Enroll in training programs directly from the app with secure Stripe checkout
- Browse and purchase Academy merchandise in the new Shop screen
- View your active subscriptions and full payment history
- Manage your subscription from the Payments screen

**Enhanced Dashboard (MOB-007)**
- Attendance stats card shows your sessions, attendance rate, and streaks
- Quick actions grid for fast access to Schedule, Chat, Programs, and Shop
- Upcoming payment card shows your next renewal date
- Announcement feed with pull-to-refresh

**Attendance Tracking (MOB-008)**
- Monthly calendar view with color-coded attendance dots
- Navigate between months to see your full history
- Stats summary: total sessions, present, absent, late, rate
- Filtered attendance records list per month

**Chat Improvements (MOB-002, MOB-010)**
- All 4 chat rooms now available: General, Coaches, Parents, Announcements
- Send images in group chat and direct messages
- Camera and photo library support
- Upload progress indicator with retry on failure
- Tap any image to view it full-screen
- Image messages render with skeleton loading

**Notification Preferences (MOB-009)**
- Control push notifications, email fallback, DMs, group chat, @mentions, and announcements
- Set quiet hours with start and end times
- All preferences persist server-side

**Profile Updates (MOB-003)**
- Coach contacts now loaded from the server (no more hardcoded data)
- Direct call and text shortcuts for each coach
- Account section with links to Payments, Shop, and Notification Settings
- App version displayed dynamically

### Bug Fixes
- Version number in profile footer now reads from app config instead of hardcoded "v1.1"
- Programs page no longer redirects to website for enrollment — checkout happens in-app
- Coach phone numbers are no longer hardcoded in the app

### Known Issues
- DM image messages use a content prefix encoding (cosmetic; images display correctly)
- Coach phone numbers use a local bridge map until the server API adds a phone field
- "Manage Subscription" opens the web portal instead of Stripe Billing Portal directly
- No crash reporting (Sentry) — will be added in v1.4.0

### Portal Fixes Deployed Alongside v1.3.0
- `/orders` page now accessible (was missing route)
- Coach Dashboard restricted to admin role
- Shop, Schedule, Gallery pages fetch live data from API (no more hardcoded content)
- 9 content pages now routed: Blog, Videos, Gallery, About, Contact, FAQs, Home, Orders
- SignUp page fetches live product catalog
- Private Session Booking fetches coaches from API
- All 12 list API routes now support pagination

---

## v1.2.0 (Current — Build 16)

**Date**: February 2026
**Platform**: iOS

### Features
- Email/password authentication with Clerk
- Member dashboard with next session and announcements
- Schedule browsing and session registration
- Program browsing with pricing
- Real-time group chat (General, Coaches channels)
- Direct messaging with unread badges
- Push notifications with deep linking
- User profile with coach contact shortcuts
- PostHog analytics integration
- Account deletion support

### Known Issues
- Profile shows hardcoded "v1.1" instead of actual version → fixed in v1.3.0
- Only 2 of 4 chat rooms displayed → fixed in v1.3.0
- Programs redirect to website for enrollment → fixed in v1.3.0
- Coach phone numbers hardcoded → fixed in v1.3.0
- No notification preferences UI → fixed in v1.3.0
- No attendance tracking → fixed in v1.3.0
- No skeleton loading screens → partially fixed in v1.3.0
