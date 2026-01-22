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
- **Database**: PostgreSQL (via Drizzle ORM) - Note: README mentions MySQL but schema uses PostgreSQL
- **Authentication**: Dual system - Clerk (primary) with OAuth fallback
- **Real-time**: Socket.IO for chat functionality
- **Payments**: Stripe integration for programs and merchandise
- **Storage**: AWS S3 via Forge API for images and media
- **Email**: Resend for transactional emails

### Major Systems

**1. Public-Facing System**
- **Pages**: Home, Programs, About, Contact, FAQs, Gallery, Videos, Shop
- **Purpose**: Marketing, program discovery, content consumption
- **Features**: 
  - Hero section with mission statement
  - Program listings with pricing
  - Photo gallery with categories
  - Video library with embedded players
  - E-commerce shop with cart and checkout
  - Contact forms (general and volunteer)
  - Search functionality across content

**2. Member Portal System**
- **Pages**: Member Dashboard, Chat
- **Purpose**: Authenticated member experience
- **Features**:
  - Dashboard with announcements and schedules
  - Session registration functionality
  - Real-time chat with online status indicators
  - View registered sessions
  - Access to member-only content

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
  - Blog post management (backend only, no frontend)

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
- Programs (group, individual, shooting, league, camp, membership categories)
- Schedules (linked to programs, with time/location)
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
- Blog Posts (content management - backend only)

### System Boundaries

**Clear Boundaries:**
- **Frontend/Backend**: Separated with tRPC API layer
- **Authentication**: Handled at middleware level with role-based access
- **Payment Processing**: Externalized to Stripe (webhook-based)
- **File Storage**: Externalized to AWS S3 via Forge API
- **Email Delivery**: Externalized to Resend service

**Integration Points:**
- OAuth provider (authentication)
- Stripe (payments)
- Forge API (file storage)
- Resend (email delivery)
- Socket.IO (real-time communication)

### Current Feature Completeness

**Fully Implemented:**
- Public website with all core pages
- Program management and display
- Payment processing (programs and shop)
- Member dashboard with schedules/announcements
- Admin dashboard with CRUD operations
- Gallery and video library
- E-commerce shop
- Real-time chat
- Search functionality
- PWA features (service worker, manifest)
- Rate limiting
- SEO optimization
- Accessibility features

**Partially Implemented:**
- Attendance tracking (backend complete, frontend coach interface missing)
- Blog/News system (backend complete, frontend missing)
- Multi-sport content (mentioned but not fully integrated)

**Not Implemented:**
- Coach/staff management system
- Parent dashboard for attendance viewing
- Location maps and directions
- Email notification preferences
- Registration capacity limits tracking
- Attendance notifications to parents

</current_state_summary>

---

<vision_gap_analysis>

## Vision Gap Analysis

### 1. Multi-Sport Vision vs. Basketball-Focused Implementation

**Vision Intent:**
The platform is intended to serve **basketball, football, and soccer athletes** with a focus on **SAQ (Speed, Agility, Quickness) training** and **strength conditioning** that translates across all sports.

**Current Reality:**
- **Content Alignment**: About page correctly states multi-sport mission and SAQ focus
- **Program Implementation**: Programs are primarily **basketball-focused**
  - All program descriptions emphasize "basketball fundamentals," "basketball drills," "basketball IQ"
  - Program categories don't distinguish between sports
  - No sport-specific program filtering or organization
- **Homepage**: Mentions all three sports in hero text but programs section is basketball-only
- **Gap**: System architecture supports multi-sport (program categories are generic), but content and program structure are basketball-centric

**Impact**: The platform's data model can support multi-sport, but the user-facing content and program organization don't reflect the multi-sport vision. Users would not understand that the platform serves football and soccer athletes based on current program descriptions.

---

### 2. SAQ & Strength Training Emphasis

**Vision Intent:**
Programs should emphasize **SAQ training** and **strength conditioning** as foundational athletic qualities that translate across sports.

**Current Reality:**
- **About Page**: Correctly describes SAQ and strength focus
- **Programs Page**: Programs focus on sport-specific skills (basketball fundamentals, shooting mechanics) rather than SAQ/strength
- **Program Categories**: Include "group," "individual," "shooting," but no SAQ-specific or strength-specific categories
- **Gap**: The vision emphasizes cross-sport athletic development, but programs are presented as sport-specific skill training

**Impact**: The platform's messaging is split - About page describes SAQ/strength focus, but Programs page presents basketball skill development. This creates confusion about the platform's core value proposition.

---

### 3. Multi-Location Support

**Vision Intent:**
The Academy operates at **three locations**: Sumner Academy, Unlimited Potential (Gallatin, TN), and RT Fisher. The system should support location-based scheduling and provide maps/directions.

**Current Reality:**
- **About Page**: Lists all three locations with descriptions
- **Schedule System**: Has `location` field in schedules table, but:
  - No location management interface in admin
  - No location filtering for members
  - No maps or directions integration
  - Location is just a text field, not a structured entity
- **Gap**: Locations are mentioned in content but not integrated into the functional system architecture

**Impact**: Admins cannot manage locations as entities, members cannot filter by location, and users cannot get directions. The system treats locations as free-form text rather than structured data.

---

### 4. Schedule Structure & Display

**Vision Intent:**
Schedules should reflect the **Tuesday/Thursday/Sunday structure** with clear indication of:
- Open Gym sessions on Sundays (game-like experience)
- Seasonal schedule flexibility
- Regular training sessions on Tuesday/Thursday

**Current Reality:**
- **Schedule System**: Generic schedule table with startTime/endTime
- **Display**: Schedules shown as list/calendar without day-of-week emphasis
- **No Special Handling**: Open Gym, seasonal schedules not distinguished
- **Gap**: Schedule system is generic and doesn't reflect the intended structure or special session types

**Impact**: The system doesn't communicate the intended schedule rhythm or help users understand the different session types (regular training vs. Open Gym).

---

### 5. Blog/News Content System

**Vision Intent:**
A complete blog/news system for:
- Training tips
- Athlete spotlights
- News and events
- Content marketing and SEO

**Current Reality:**
- **Backend**: Complete blog system implemented
  - Database schema with categories, tags, featured images
  - Admin CRUD operations via tRPC
  - Publishing workflow
- **Frontend**: **Completely missing**
  - No blog listing page
  - No individual blog post pages
  - No admin blog editor UI
  - No public-facing blog routes
- **Gap**: Backend infrastructure exists but is unused - no way for admins to create content or users to consume it

**Impact**: Content marketing capability is built but inaccessible. Admins cannot publish blog posts, and users cannot read them. The feature is architecturally complete but functionally absent.

---

### 6. Attendance Tracking System

**Vision Intent:**
Complete attendance system with:
- Coach interface for marking attendance
- Parent dashboard for viewing attendance history
- Attendance reports and statistics
- Notifications to parents

**Current Reality:**
- **Backend**: Fully implemented
  - Database schema with status tracking (present, absent, excused, late)
  - Admin APIs for marking/updating attendance
  - Member APIs for viewing own attendance
  - Statistics and reporting functions
- **Frontend**: **Partially missing**
  - No coach interface in admin dashboard for marking attendance
  - No parent dashboard for viewing child's attendance
  - No attendance integration in schedule views
  - Backend APIs exist but are not exposed in UI
- **Gap**: Backend is production-ready, but the user-facing interfaces are missing

**Impact**: Attendance data can be tracked programmatically but not through the UI. Coaches cannot mark attendance, and parents cannot view it. The feature is architecturally sound but unusable.

---

### 7. Coach/Staff Management

**Vision Intent:**
System should support coach and staff management for:
- Assigning coaches to programs/sessions
- Managing coach profiles
- Coach-specific interfaces

**Current Reality:**
- **No Implementation**: No coach/staff management system exists
- **No Database Schema**: No tables for coaches, staff, or assignments
- **No Interfaces**: No admin UI for managing coaches
- **Gap**: Complete feature missing from architecture

**Impact**: The system cannot track or manage coaching staff. Coaches are not represented as entities in the system, limiting future features like coach-specific dashboards or assignment tracking.

---

### 8. Content Philosophy Alignment

**Vision Intent:**
Content should emphasize:
- Fundamentals, confidence, basketball IQ
- Long-term growth over trophies
- Safe environment to fail and learn
- Strong coach-to-player ratios
- Community and mentorship

**Current Reality:**
- **Homepage**: Philosophy section implemented with all intended values ✅
- **Programs Page**: Still emphasizes basketball-specific skills rather than cross-sport fundamentals
- **FAQs**: May not reflect multi-sport training information (per todo.md)
- **Gap**: Philosophy is well-communicated on homepage, but program descriptions don't align with the philosophy messaging

**Impact**: Mixed messaging - homepage presents the philosophy correctly, but program pages focus on sport-specific skills rather than the cross-sport athletic development philosophy.

---

### 9. Registration Capacity Management

**Vision Intent:**
System should track and enforce registration capacity limits for sessions.

**Current Reality:**
- **Database**: Schedules table has no `maxParticipants` field (only programs table has it)
- **Admin UI**: Admin can set `maxParticipants` when creating schedules, but it's stored as a string and not validated
- **Registration Flow**: `schedules.register` mutation does not check current registration count against capacity
- **No Enforcement**: Registration proceeds regardless of how many users are already registered
- **Gap**: Capacity limits can be set in admin UI but are not enforced in the registration process

**Impact**: Sessions could be overbooked. The system doesn't prevent registrations when capacity is reached, leading to potential operational issues.

---

### 10. Email Notification Preferences

**Vision Intent:**
Users should be able to configure email notification preferences.

**Current Reality:**
- **Email System**: Functional for sending notifications
- **User Preferences**: No database schema for notification preferences
- **No UI**: No interface for users to manage preferences
- **Gap**: Emails are sent but users cannot control what they receive

**Impact**: Users receive all notifications without control, potentially leading to email fatigue or missed important communications.

---

### 11. Database Technology Mismatch

**Vision Intent:**
README states MySQL as the database technology.

**Current Reality:**
- **Schema Definition**: Uses `pgTable`, `pgEnum` from `drizzle-orm/pg-core` (PostgreSQL)
- **Connection**: Uses `postgres` client library
- **Mismatch**: Documentation says MySQL, implementation uses PostgreSQL

**Impact**: Setup confusion and potential deployment issues. Developers following README would expect MySQL but code requires PostgreSQL.

---

## Summary of Gaps

### Critical Architectural Gaps
1. **Multi-sport support**: Data model supports it, but content and program structure are basketball-only
2. **Blog system**: Backend complete, frontend completely missing
3. **Attendance system**: Backend complete, frontend interfaces missing
4. **Database mismatch**: Documentation vs. implementation inconsistency

### Functional Gaps
1. **Coach/staff management**: Not implemented at all
2. **Location management**: Locations are text fields, not structured entities
3. **Schedule structure**: Generic system doesn't reflect intended Tuesday/Thursday/Sunday rhythm
4. **Registration capacity**: Defined but not enforced
5. **Email preferences**: No user control mechanism

### Content Alignment Gaps
1. **SAQ emphasis**: Mentioned in About but not reflected in Programs
2. **Multi-sport messaging**: Split between About (correct) and Programs (basketball-only)
3. **Philosophy alignment**: Homepage aligns, Programs page doesn't

### System Boundaries
- **Clear boundaries**: Payment, storage, email properly externalized
- **Unclear boundaries**: Location management, coach management not clearly defined
- **Missing boundaries**: No separation between sport-specific and cross-sport programs

</vision_gap_analysis>
