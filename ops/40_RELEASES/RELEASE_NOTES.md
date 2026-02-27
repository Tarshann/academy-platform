# Release Notes

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
