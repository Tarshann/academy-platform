# LATER — Future Work

> Valuable but not time-critical. Promote to NEXT as capacity allows.

---

## Mobile App

### MOB-011: @Mention Support
- **Goal**: Tag users in chat with autocomplete dropdown
- **Effort**: Medium
- **Depends on**: Server already supports @mentions

### MOB-012: Message Reactions (Emoji)
- **Goal**: React to chat messages with emoji
- **Effort**: Medium
- **Depends on**: May need server support

### MOB-013: Typing Indicators
- **Goal**: Show when other users are typing in chat
- **Effort**: Small
- **Depends on**: Ably presence channel

### MOB-014: Link Previews in Chat
- **Goal**: Show URL previews when links are shared in chat
- **Effort**: Medium

### MOB-015: DM Read Receipts
- **Goal**: Show when messages have been read in DMs
- **Effort**: Small
- **Depends on**: dm.markRead already exists

### MOB-016: DM Search
- **Goal**: Full-text search across DM conversations
- **Effort**: Small
- **Depends on**: dm.searchMessages API exists

### MOB-017: Block/Archive Users in DMs
- **Goal**: Block users and archive conversations
- **Effort**: Small
- **Depends on**: dm.blockUser, dm.archiveConversation APIs exist

### MOB-018: Onboarding Flow — PROMOTED TO NEXT.md (2026-02-26)
- Moved to NEXT.md per RES-001 competitor analysis. All 3 competitors have guided onboarding.
- See NEXT.md for full ticket.

### MOB-019: Skeleton Loading Screens
- **Goal**: Replace all spinners with skeleton screens matching content layout
- **Effort**: Medium — touches every screen

### MOB-020: Content Hub (Gallery + Videos + Blog + Coaches)
- **Goal**: Browse multimedia content and coach profiles
- **Effort**: Large
- **Depends on**: gallery.list, videos.list, blog.list, coaches.list APIs

### MOB-021: Calendar Integration
- **Goal**: Sync registered sessions with native device calendar
- **Effort**: Medium
- **Depends on**: expo-calendar

### MOB-022: Locations + Directions
- **Goal**: Map view of training locations with one-tap directions
- **Effort**: Medium
- **Depends on**: locations.list API, react-native-maps

### MOB-023: Profile Photo Upload
- **Goal**: Upload/change profile photo via Clerk or custom S3
- **Effort**: Medium

### MOB-024: Private Session Booking
- **Goal**: Book 1-on-1 coaching sessions in-app
- **Effort**: Large
- **Depends on**: payment.submitPrivateSessionBooking API

### MOB-025: Offline Support
- **Goal**: Cache dashboard/schedule/chat data, queue messages when offline
- **Effort**: Large

### MOB-026: Dark Mode
- **Goal**: System-aware dark mode with manual toggle
- **Effort**: Large — touches every screen

### MOB-027: App Store Rating Prompt
- **Goal**: Prompt for rating after positive interactions (session registration, message sent)
- **Effort**: Small
- **Depends on**: expo-store-review

### MOB-028: Haptic Feedback
- **Goal**: Subtle haptics on key interactions (send message, register, toggle)
- **Effort**: Small
- **Depends on**: expo-haptics

### MOB-041: Progress/Stats Dashboard
- **Source**: RES-001 competitor analysis (GameChanger's stats are a key engagement driver)
- **Goal**: Track and display athlete progress — speed improvements, attendance streaks, skill milestones
- **Effort**: Large (new schema, new screens, data visualization)
- **Note**: No competitor does this well for training facilities. Unique differentiation opportunity.

### MOB-042: Achievement Badges / Streaks
- **Source**: RES-001 competitor analysis (Peloton/NTC aspirational patterns)
- **Goal**: Gamification layer — attendance streaks, milestone badges, session count achievements
- **Effort**: Large (new schema, design system, notification integration)
- **Note**: GameChanger relies on emotional engagement (parental pride). Gamification would add a mechanic-driven engagement layer on top of emotional hooks.

### MOB-050: Family/Multi-Child Account Management
- **Source**: RES-001 competitor analysis (TeamSnap + SportsEngine core feature)
- **Goal**: Parents manage multiple children from one account — see all kids' schedules, payments, and communications
- **Effort**: Large (cross-cutting: auth, scheduling, payments, chat)
- **Note**: TeamSnap and SportsEngine both support this. Critical for families with 2+ kids in activities. Requires new `familyMembers` table and family switcher UI.

### MOB-029: Enable New Architecture
- **Goal**: Set newArchEnabled: true and verify all modules work
- **Effort**: Medium (risk of breaking existing modules)

---

## Web Portal

### WEB-010: Router Monolith Split
- **Goal**: Split `server/routers.ts` (~2,100 lines) into domain modules
- **Effort**: Large (high risk, needs thorough testing)

### WEB-011: DB Monolith Split
- **Goal**: Split `server/db.ts` (~1,900 lines) into domain modules
- **Effort**: Large

### WEB-012: Add Sentry Error Monitoring
- **Goal**: Crash and error reporting for both client and server
- **Effort**: Medium

### WEB-013: Request Correlation IDs
- **Goal**: Add trace IDs to API requests for debugging
- **Effort**: Small

### WEB-014: Performance Optimization
- **Goal**: Lazy loading, code splitting, bundle size reduction
- **Effort**: Medium

---

## Marketing / SEO

### MKT-022: Service-Area City Landing Pages
- **Source**: RES-002 + RES-003 competitor analysis
- **Goal**: Create landing pages for Hendersonville, Sumner County, and Goodlettsville to capture adjacent-city search traffic
- **Effort**: Low (template-based, pull from config)
- **Note**: D1 Training has individual location pages ranking for each city. Academy has only 1 local page.

### MKT-023: Testimonial Expansion Campaign
- **Source**: RES-002 local competitor analysis
- **Goal**: Expand from 3 testimonials to 10+ on marketing site and generate Google Reviews
- **Effort**: Low-Medium (content collection + site updates)
- **Note**: D1 Training and local competitors have 50-200+ reviews. Academy needs volume.

### MKT-024: Video Content on Marketing Site
- **Source**: RES-003 SEO keyword analysis
- **Goal**: Add training session clips, coach intro videos, and athlete highlights to marketing site
- **Effort**: Medium (content creation + site integration)
- **Note**: Zero video content currently on academytn.com. All local competitors feature video.

### MKT-025: Results/Metrics Page
- **Source**: RES-001 + RES-003 competitor analysis
- **Goal**: Create a page showcasing measurable athlete improvements (speed gains, attendance streaks, testimonials with data)
- **Effort**: Medium (data collection + page design)
- **Note**: Academy mentions baseline testing but shows no actual results data. Local competitors publish improvement metrics.

### MKT-010: Location-Specific Landing Pages
- **Goal**: Create pages targeting "youth training [nearby city]" for local SEO
- **Effort**: Medium

### MKT-011: Sport-Specific Landing Pages
- **Goal**: Dedicated pages for each sport Academy trains (football, baseball, etc.)
- **Effort**: Medium

### MKT-012: Blog Content Strategy
- **Goal**: SEO-driven blog content plan targeting parent search queries
- **Effort**: Medium (content creation)

### MKT-013: Age-Group Content
- **Goal**: Pages targeting specific age groups (elementary, middle school, high school)
- **Effort**: Medium

---

## DONE

*(Move completed tickets here with completion date)*
