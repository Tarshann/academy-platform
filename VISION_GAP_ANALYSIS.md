# Vision Gap Analysis
## The Academy Platform

**Analysis Date:** January 2025 (Updated)
**Last Review:** January 29, 2025
**Analyst:** System Architecture Diagnostic AI

---

## Evidence Links (Fill Before Release)

- Commit/Tag:
- Test run (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm e2e`):
- Lighthouse report:
- Link crawl report:
- Auth matrix:

<current_state_summary>

## Current State Summary

### System Overview
The Academy Platform is a **full-stack web application** designed to support a youth multi-sport training organization serving basketball, football, and soccer athletes. The system serves three primary user roles: public visitors, authenticated members, and administrators.

### Architecture

**Technology Stack:**
- **Frontend**: React 19 with TypeScript, Vite build system, Tailwind CSS for styling
- **Backend**: Express.js server with tRPC for type-safe API communication
- **Database**: PostgreSQL (via Drizzle ORM) with 20+ tables and 13 typed enums
- **Authentication**: Dual system - Clerk (primary) with OAuth fallback
- **Real-time**: Socket.IO for chat functionality
- **Payments**: Stripe integration for programs and merchandise
- **Storage**: AWS S3 via Forge API for images and media
- **Email**: Resend for transactional emails

### Major Systems

**1. Public-Facing System**
- **Pages**: Home, Programs, About, Contact, FAQs, Gallery, Videos, Shop, Blog
- **Purpose**: Marketing, program discovery, content consumption
- **Features**:
  - Hero section with mission statement emphasizing multi-sport development
  - Program listings with **dual filtering (sport + category)** and color-coded badges
  - Active filters display with result counts
  - Photo gallery with categories
  - Video library with embedded players
  - E-commerce shop with cart and checkout
  - Blog listing and individual post pages
  - Location cards with directions links
  - Contact forms (general and volunteer)
  - Search functionality across content

**2. Member Portal System**
- **Pages**: Member Dashboard, Chat, Settings
- **Purpose**: Authenticated member experience
- **Features**:
  - Dashboard with announcements and schedules grouped by day of week
  - **Open Gym badges** for Sunday sessions and Regular Training badges for Tuesday/Thursday
  - Location filtering and directions links for upcoming sessions
  - Session registration functionality with capacity enforcement
  - Attendance stats and history for members
  - Real-time chat with online status indicators
  - Notification preferences management

**3. Admin Management System**
- **Pages**: Admin Dashboard with 8 extracted manager components
- **Purpose**: Content and program management
- **Features**:
  - Program CRUD operations with sport and category fields
  - Schedule management with dayOfWeek and sessionType fields
  - Announcement management (create, publish, delete)
  - Contact submission viewer with status tracking
  - Gallery photo upload and management
  - Video library management
  - Shop product and campaign management
  - Blog post management (create, edit, publish)
  - Attendance management interface
  - Coach and location management

**4. Payment & Commerce System**
- **Integration**: Stripe Checkout
- **Features**:
  - Program purchase flow (one-time payments)
  - Membership subscriptions (recurring payments)
  - Shop checkout with shipping address
  - Payment records stored in database
  - Webhook handling for payment events
  - Order management system

**5. Communication System**
- **Real-time Chat**: Socket.IO-based chat rooms
- **Email Notifications**: Resend integration for:
  - Session registration confirmations
  - Payment confirmations
  - Contact form notifications
- **Features**:
  - Message history persistence
  - Typing indicators
  - Online user status tracking
  - Room-based messaging

### Data Model

**Core Entities:**
- Users (with roles: user, admin)
- Programs (group, individual, shooting, league, camp, membership categories + sport enum)
- Schedules (linked to programs, with time/location, dayOfWeek, sessionType)
- Session Registrations (user to schedule relationships)
- Payments & Subscriptions (Stripe integration)
- Announcements (member communications)
- Contact Submissions (inquiries and volunteer applications)
- Gallery Photos (categorized training/event photos)
- Videos (training demonstrations, categorized)
- Products & Orders (merchandise e-commerce)
- Campaigns (limited-time promotions)
- Chat Messages (real-time communication)
- Attendance Records (session attendance tracking)
- Blog Posts (content management)
- Locations (structured facilities with lat/long)
- Coaches (staff records and assignments)
- Notification Preferences (per-user email preferences)
- User Relations (parent/child linkage - schema ready)

### Current Feature Completeness
This section reflects **verified** implementation status based on code inspection.

**Verified as Implemented:**
- Public website with all core pages
- Program management and display with **dual filtering (sport + category)**
- **Color-coded sport badges** (orange=basketball, emerald=football, blue=soccer, purple=multi-sport, amber=SAQ)
- **Category badges with icons** (group, individual, shooting, league, camp, membership)
- **Active filters component** with dismiss buttons and result counts
- Payment processing (programs and shop)
- Member dashboard with schedules grouped by day of week
- **Open Gym and Regular Training visual indicators**
- Admin dashboard with CRUD operations (all 8 managers extracted)
- Gallery and video library
- E-commerce shop with skeleton loading
- Real-time chat
- Search functionality
- PWA features (service worker, manifest)
- Rate limiting
- SEO optimization
- Accessibility features
- Notification preference settings
- Attendance tracking (admin + member views)
- Blog frontend and admin management
- Location and coach management
- Directions links from member schedules

**Partially Implemented (non-blocking, post-launch enhancements):**
- Embedded maps integration (lat/long stored but no map rendering)
- Program content copy alignment (technical support exists, content review needed)

**Post-Launch Enhancements (schema ready, UI pending):**
- Parent dashboard for attendance viewing (userRelations table exists)
- Parent/guardian account linkage workflow
- Location maps/directions on public pages

</current_state_summary>

---

<vision_gap_analysis>

## Vision Gap Analysis

### Gap Status Summary

| Gap Area | Schema | API | UI | Status |
|----------|:------:|:---:|:--:|--------|
| Multi-Sport Filtering | ✅ | ✅ | ✅ | **RESOLVED** |
| Sport Visual Identity | ✅ | ✅ | ✅ | **RESOLVED** |
| Category Filtering | ✅ | ✅ | ✅ | **RESOLVED** |
| Schedule Day Grouping | ✅ | ✅ | ✅ | **RESOLVED** |
| Open Gym Indicators | ✅ | ✅ | ✅ | **RESOLVED** |
| Location Directions | ✅ | ✅ | ✅ | **RESOLVED** |
| Embedded Maps | ✅ | ✅ | ❌ | Post-launch |
| Parent Dashboard | ✅ | ❌ | ❌ | Post-launch |

---

### 1. Multi-Sport Vision vs. Content Alignment ✅ RESOLVED

**Vision Intent:**
The platform is intended to serve **basketball, football, and soccer athletes** with a focus on **SAQ (Speed, Agility, Quickness) training** and **strength conditioning** that translates across all sports.

**Current Reality:**
- ✅ Programs page now has **dual filtering** (sport + category)
- ✅ **Color-coded sport badges** visually distinguish programs by sport
- ✅ **Category badges with icons** show program types at a glance
- ✅ **Active filters component** shows applied filters with result counts
- ✅ Fallback programs display multi-sport badges and SAQ messaging

**Remaining:** Content/copy review to ensure program descriptions consistently emphasize multi-sport benefits.

---

### 2. Location Experience for Families ✅ PARTIALLY RESOLVED

**Vision Intent:**
The Academy operates at **three locations** and should provide location-based scheduling and directions.

**Current Reality:**
- ✅ Locations exist as structured entities with admin management
- ✅ Member schedules include location filters
- ✅ **Directions links** available from member schedule items
- ✅ Public-facing pages surface location cards

**Remaining Gap:** Embedded maps (Google Maps/Mapbox integration) for visual location display.

---

### 3. Parent/Guardian Attendance Access - Post-Launch

**Vision Intent:**
Parents should be able to view attendance history and receive updates for their athletes.

**Current Reality:**
- ✅ `userRelations` table exists with parentId/childId fields
- ✅ Attendance tracking exists for coaches and members
- ✅ Notification preferences include attendance updates toggle
- ❌ No parent dashboard UI
- ❌ No account linking workflow

**Gap:** Parent-facing dashboard and account linkage workflow are post-launch features. Schema is ready.

---

### 4. Program Messaging Consistency - Content Review

**Vision Intent:**
Programs should consistently reinforce fundamentals, long-term growth, and confidence-building across sports.

**Current Reality:**
- ✅ Homepage philosophy aligns with this narrative
- ✅ Programs page hero text emphasizes SAQ and multi-sport development
- ✅ Fallback program cards include multi-sport messaging
- ⚠️ Database program descriptions need content review

**Gap:** Content/editorial review of program descriptions to ensure consistent multi-sport positioning.

---

### 5. Schedule Structure Display ✅ RESOLVED

**Vision Intent:**
Training follows a Tuesday/Thursday/Sunday structure with Open Gym on Sundays.

**Current Reality:**
- ✅ `dayOfWeek` enum and field in schedules table
- ✅ Member dashboard groups schedules by day of week
- ✅ **Open Gym Day badge** displayed for Sunday
- ✅ **Regular Training badge** displayed for Tuesday/Thursday
- ✅ Session type badges (Open Gym, Special Event, Regular Training)

---

## Implementation Progress

### January 2025 Session Completed:
1. ✅ Added category filtering to Programs page
2. ✅ Created ActiveFilters component for filter pills display
3. ✅ Implemented color-coded sport badges with distinct colors per sport
4. ✅ Added category badges with icons
5. ✅ Enhanced empty state with filter-aware messaging
6. ✅ Increased skeleton count during loading for better UX
7. ✅ Updated fallback programs with multi-sport badges

### Remaining Work (Post-Launch):
1. Embedded maps integration for location display
2. Parent dashboard UI with child attendance viewing
3. Parent/guardian account linking workflow
4. Content audit for program descriptions

</vision_gap_analysis>
