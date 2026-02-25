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

### MOB-018: Onboarding Flow
- **Goal**: 3-4 animated walkthrough screens on first launch with permission requests
- **Effort**: Large
- **Depends on**: Reanimated for animations

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
