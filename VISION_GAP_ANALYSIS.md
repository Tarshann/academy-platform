# Vision Gap Analysis
## The Academy Platform

**Analysis Date:** December 2024  
**Analyst:** System Architecture Diagnostic AI

---

<current_state_summary>

## Current State Summary

### System Overview
The Academy Platform is a **full-stack web application** designed to support a youth sports training organization. The system serves three primary user roles: public visitors, authenticated members, and administrators.

### Architecture

**Technology Stack:**
- **Frontend**: React 19 with TypeScript, Vite build system, Tailwind CSS for styling
- **Backend**: Express.js server with tRPC for type-safe API communication
- **Database**: PostgreSQL (via Drizzle ORM)
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
  - Hero section with mission statement
  - Program listings with pricing and sport filters
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
  - Dashboard with announcements and schedules grouped by day
  - Location filtering and directions links for upcoming sessions
  - Session registration functionality with capacity enforcement
  - Attendance stats and history for members
  - Real-time chat with online status indicators
  - Notification preferences management

**3. Admin Management System**
- **Pages**: Admin Dashboard
- **Purpose**: Content and program management
- **Features**:
  - Program CRUD operations (create, edit, toggle visibility)
  - Schedule management (create, edit, delete sessions)
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
- Programs (group, individual, shooting, league, camp, membership categories, multi-sport)
- Schedules (linked to programs, with time/location, day-of-week, session type)
- Session Registrations (user → schedule relationships)
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
- Locations (structured facilities)
- Coaches (staff records and assignments)
- Notification Preferences (per-user email preferences)

### Current Feature Completeness
This section reflects **reported** implementation status from documentation and requires validation against code and tests.

**Reported as Implemented (verification required):**
- Public website with all core pages
- Program management and display (including sport filtering)
- Payment processing (programs and shop)
- Member dashboard with schedules and attendance
- Admin dashboard with CRUD operations
- Gallery and video library
- E-commerce shop
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

**Partially Implemented (verification required):**
- Multi-sport content alignment (data/content still needs consistent tagging and narrative emphasis)
- Location-based filtering and mapping in member-facing views

**Not Implemented (or not yet verified):**
- Parent dashboard for attendance viewing
- Parent/guardian account linkage
- Location maps/directions on public pages

</current_state_summary>

---

<vision_gap_analysis>

## Vision Gap Analysis

### 1. Multi-Sport Vision vs. Content Alignment

**Vision Intent:**
The platform is intended to serve **basketball, football, and soccer athletes** with a focus on **SAQ (Speed, Agility, Quickness) training** and **strength conditioning** that translates across all sports.

**Current Reality:**
- The system supports sport tagging and filtering for programs.
- The platform can represent multi-sport programs in the data model.
- Some program content may still emphasize basketball-specific outcomes more than multi-sport SAQ/strength messaging.

**Gap:** Content and program descriptions need to consistently reflect the multi-sport/SAQ positioning to match the stated vision.

---

### 2. Location Experience for Families

**Vision Intent:**
The Academy operates at **three locations** and should provide location-based scheduling and directions.

**Current Reality:**
- Locations exist as structured entities with admin management.
- Member schedules include location filters and directions links.
- Public-facing pages surface location cards with directions links.

**Gap:** Location details are available, but embedded maps and route previews are not yet part of the public experience.
- Member schedules show location text but do not provide map links or directions.
- Public pages do not surface location maps or route guidance.

**Gap:** Location-aware member filtering and public maps/directions are not surfaced in the UI.

---

### 3. Parent/Guardian Attendance Access

**Vision Intent:**
Parents should be able to view attendance history and receive updates for their athletes.

**Current Reality:**
- Attendance tracking exists for coaches and members.
- Notification preferences are available for signed-in users.
- There is no parent/guardian dashboard or child linkage model.

**Gap:** Parent-facing attendance views and account linkage are missing, limiting visibility for guardians.

---

### 4. Program Messaging Consistency

**Vision Intent:**
Programs should consistently reinforce fundamentals, long-term growth, and confidence-building across sports.

**Current Reality:**
- Homepage philosophy aligns with this narrative.
- Program-level copy and FAQs may still include legacy basketball-centric language.

**Gap:** Program and FAQ copy needs consistent alignment with the platform philosophy across all sports.

</vision_gap_analysis>
