# The Academy Platform - TODO

## Database & Schema
- [x] Design database schema for programs, announcements, contact submissions
- [x] Add program categories and pricing tables
- [x] Implement role-based access control (public, member, admin)

## Public Pages
- [x] Homepage with hero section showcasing mission
- [x] Programs overview section on homepage
- [x] Programs detail page with Group Sessions, Individual Workouts, Shooting Lab
- [x] About Us page with coaching philosophy and values
- [x] Contact page with inquiry form and volunteer recruitment
- [x] FAQs page with common questions

## Authentication & User Management
- [x] User authentication with role-based access (public, member, admin)
- [x] Login/logout functionality
- [x] Protected routes for member portal

## Member Portal (Foundation)
- [x] Member dashboard layout
- [x] Schedules view (placeholder)
- [x] Announcements view (placeholder)
- [x] Registration links section

## Registration & Programs
- [x] Registration/Sign Up page with all program options
- [x] Display pricing for each program
- [ ] Purchase flow integration preparation

## Admin Panel (Foundation)
- [ ] Admin dashboard layout with role checks
- [ ] Program management interface (placeholder)
- [ ] Announcement management (placeholder)
- [ ] Coach/staff management preparation

## Navigation & Layout
- [x] Responsive navigation with authentication state
- [x] Social media links (TikTok, Instagram, Facebook)
- [x] Footer with contact information

## Design System
- [x] Choose color palette and typography
- [x] Implement global theme in index.css
- [x] Create reusable components
- [x] Ensure mobile responsiveness

## Integrations
- [x] Contact form notifications to owner
- [ ] Email capture for mailing list

## Stripe Payment Integration
- [x] Add Stripe feature to project
- [x] Configure Stripe API keys
- [x] Create payment checkout flow for programs
- [x] Add payment success/cancel pages
- [x] Store payment records in database
- [x] Link payments to user accounts

## Admin Dashboard
- [ ] Create admin layout with navigation
- [x] Program management (CRUD operations)
- [x] Announcement management (create, publish, delete)
- [x] View and manage contact submissions
- [x] Schedule management interface Admin-only route protection

## Schedule Management System
- [x] Create schedule CRUD operations for admins
- [x] Build calendar view for members
- [x] Add session registration functionality
- [ ] Track registration capacity limits
- [ ] Send confirmation notifications
- [x] Display user's registered sessions

## Content Updates
- [x] Update homepage hero to reflect multi-sport focus (basketball, football, soccer)
- [x] Update About page to emphasize conditioning for all athletes
- [ ] Update Programs page to highlight SAQ and strength training
- [ ] Update FAQs to include information about multi-sport training

## Content Updates (Additional)
- [x] Update Omar Philmore's bio to include Sumner Academy coaching role

- [x] Remove specific age range (8-18) mentions across all pages

## Admin Dashboard UI
- [x] Create admin dashboard layout with navigation
- [x] Build schedule management interface (create, edit, delete sessions)
- [x] Build program management interface (create, edit, toggle visibility)
- [x] Build announcement management interface (create, publish, delete)
- [x] Build contact submissions viewer with status updates
- [x] Add page visibility controls (hide/show pages)

## Visual Updates
- [x] Switch from dark theme to light theme with better contrast

## Email Notifications
- [x] Set up transactional email service integration
- [x] Create email templates for session registration confirmations
- [x] Create email templates for payment confirmations
- [x] Send confirmation emails on successful registration
- [x] Send confirmation emails on successful payment
- [ ] Add email notification settings for users

## Photo Gallery
- [x] Create gallery database schema
- [x] Build photo upload interface for admins
- [x] Implement S3 storage for photos
- [x] Create photo categorization (training, teams, events)
- [x] Build public gallery page with categories
- [x] Add photo captions and descriptions
- [x] Implement responsive image grid layout

## Blog/News Section
- [ ] Create blog posts database schema
- [ ] Build blog post editor for admins (create, edit, publish)
- [ ] Add rich text editor for blog content
- [ ] Create blog listing page with pagination
- [ ] Build individual blog post pages
- [ ] Add categories and tags for posts
- [ ] Implement SEO metadata for blog posts
- [ ] Add featured image support

## Realtime Chat
- [x] Set up Socket.IO for realtime communication
- [x] Create chat messages database schema
- [x] Build chat interface for members
- [x] Implement message sending and receiving
- [ ] Add online status indicators
- [x] Create chat rooms (general, announcements)
- [x] Add message history and persistence
- [x] Implement typing indicators

## Visual Adjustments
- [x] Apply Colorado Buffaloes color scheme (black, gold, silver)

## Premium Visual Redesign
- [x] Redesign homepage with hero animations and dynamic elements
- [x] Add smooth scroll animations and page transitions
- [x] Implement premium typography with better hierarchy
- [x] Create engaging card designs with hover effects
- [x] Add gradient overlays and modern visual treatments
- [x] Implement parallax scrolling effects
- [ ] Add micro-interactions throughout the site
- [ ] Create custom animated SVG elements
- [x] Improve spacing, layout, and visual rhythm
- [ ] Add professional imagery placeholders and treatments

## Blog Frontend
- [ ] Create blog listing page with featured posts
- [ ] Build individual blog post pages with rich formatting
- [ ] Add rich text editor for admins (TinyMCE or similar)
- [ ] Implement blog post preview functionality
- [ ] Add social sharing buttons
- [ ] Create blog categories and filtering

## Video Integration
- [ ] Add video upload and management in admin
- [ ] Create video library page with categories
- [ ] Implement video player with controls
- [ ] Add video thumbnails and descriptions
- [ ] Create video embedding functionality

## Attendance Tracking
- [ ] Create attendance database schema
- [ ] Build coach interface for marking attendance
- [ ] Create parent dashboard for viewing attendance
- [ ] Generate attendance reports
- [ ] Add attendance statistics and insights

## Merchandise & Campaigns
- [ ] Create merchandise database schema (products, inventory, orders)
- [ ] Build merchandise shop page with product listings
- [ ] Add product detail pages with size/variant selection
- [ ] Implement shopping cart functionality
- [ ] Integrate Stripe checkout for merchandise
- [ ] Create admin interface for managing products
- [ ] Add inventory tracking and stock management
- [ ] Build campaign system for limited-time drops
- [ ] Create countdown timers for campaign launches
- [ ] Add campaign banners and promotional sections
- [ ] Implement order management and fulfillment tracking

## Video Library
- [x] Create video library database schema
- [x] Build video management backend APIs
- [x] Create admin video upload/embed interface
- [x] Add video categorization (drills, technique, conditioning, games)
- [x] Build public video library page with grid layout
- [x] Implement embedded video player (YouTube/Vimeo support)
- [x] Add video search and filtering
- [x] Create video detail pages with descriptions

## Attendance Tracking System
- [x] Create attendance database schema
- [x] Build backend APIs for attendance tracking
- [ ] Build coach interface for marking attendance
- [ ] Add attendance marking to schedule sessions
- [ ] Create parent dashboard for viewing attendance history
- [x] Generate attendance reports and statistics
- [ ] Add attendance notifications for parents

## Content & Philosophy Updates
- [ ] Update locations section with Sumner Academy, Unlimited Potential, RT Fisher
- [ ] Add maps and directions for each facility
- [ ] Update program descriptions to emphasize fundamentals, confidence, basketball IQ
- [ ] Add philosophy section highlighting long-term growth over trophies
- [ ] Emphasize safe environment to fail and learn
- [ ] Highlight strong coach-to-player ratios and mentorship
- [ ] Update schedule display to show Tuesday/Thursday/Sunday structure
- [ ] Clarify Open Gym game-like experience on Sundays
- [ ] Add note about seasonal schedule flexibility

## Initial Content Population
- [ ] Add sample products to merchandise shop
- [ ] Upload sample videos to video library
- [ ] Add sample photos to gallery
- [ ] Create sample blog posts
- [ ] Add upcoming schedules for current season

## Homepage Philosophy Section
- [x] Create dedicated philosophy and values section on homepage
- [x] Emphasize fundamentals, confidence, basketball IQ
- [x] Highlight long-term growth over trophies
- [x] Communicate safe environment to fail and learn
- [x] Showcase strong coach-to-player ratios
- [x] Feature community and mentorship messaging

## Content Updates (User Feedback)
- [x] Remove coach ratios card from homepage philosophy section
- [x] Add Academy Summer Camp pricing ($20 registration + $200 for the week) to programs

## Content Updates (Latest User Feedback)
- [x] Integrate Academy training photos into the platform
- [x] Add Academy logo to the site
- [x] Update Summer Camp details: 3rd annual camp at Sumner Academy, $200 total with $20 deposit included ($180 due after deposit)
- [x] Remove Omar's contact info from top of contact page (keep forms only)
- [x] Update Shooting Lab description to mention Dr Dish shooting machine with focus on technique and mechanics

## Gallery Content Population
- [x] Upload training photos to gallery with S3 storage

## Latest Updates
- [x] Add two new training photos to gallery
- [x] Add community chat to member dashboard page (already exists with real-time messaging)
- [x] Update Shooting Lab: $25/session, limited to 8 players, NOT included in memberships
- [x] Update Academy League: Contact us for availability and pricing
- [x] Note that Open Gyms are seasonal

## Merchandise Store
- [x] Populate store with Academy branded apparel (t-shirts, hoodies, shorts)
- [x] Add training equipment products (basketballs, water bottles, bags)

## Registration System Rebuild
- [x] Remove registration form requirements (name, phone, age)
- [x] Implement cart-based checkout system
- [x] Add guest checkout with Stripe email collection
- [x] Update Register page to display all programs with cart functionality
- [x] Add "Sign in for faster checkout" option
- [x] Implement one-time session purchases (Group, 1-on-1, Specialty, Performance, Seasonal)
- [x] Implement subscription purchases (Monthly, Quarterly memberships)
- [x] Test Stripe checkout integration


## Payment Success Page Enhancement
- [x] Create backend API to retrieve payment session and order details
- [x] Build payment success page component with personalized confirmation
- [x] Implement PDF receipt generation with order details
- [x] Add downloadable receipt functionality
- [x] Create next steps section with calendar and schedule links
- [x] Add email confirmation option
- [x] Test end-to-end payment success flow


## Private Session Booking System
- [x] Add coach information to database schema
- [x] Create private session booking request form page
- [x] Build backend API for booking requests
- [x] Update payment success page with coach booking section
- [x] Add email notifications for coach booking requests (via notifyOwner)
- [x] Test booking flow end-to-end


## Recent Updates
- [x] Added flag_football to sports enum in database schema
- [x] Added Summer Basketball Camp product ($205 total: $185 + $20 registration)


## OAuth Login Error Fix (academytn.com)
- [x] Investigate OAuth callback error on academytn.com
- [x] Add detailed error logging to OAuth callback
- [ ] User needs to publish latest checkpoint to academytn.com
- [ ] Test login flow after publishing

## Coach Dashboard
- [x] Design coach dashboard layout and features
- [x] Build backend API for viewing booking requests (getCoachBookings, updateBookingStatus)
- [x] Create coach dashboard UI with booking list
- [x] Add booking actions (confirm, complete, cancel, reopen)
- [x] Add coach filter (All, Coach Mac, Coach O)
- [x] Add status tabs (pending, confirmed, completed, cancelled)
- [x] Add route /coach-dashboard to App.tsx


## Summer Camp Pricing Correction
- [x] Fix Summer Basketball Camp pricing to $185 total ($20 registration + $165 camp fee)

## OAuth Database Error Fix
- [x] Added stripeCustomerId column to users table via SQL
- [ ] User needs to test login on cspringsacademy.com after publishing


## Weekly Schedule Feature
- [x] Update private session booking form with schedule availability information
- [x] Create schedule page showing weekly program times
- [x] Add schedule information: Sat/Sun (Private Sessions), Tue/Thu (Group Sessions, Skills Classes, SAQ Training)
- [x] Update navigation to include Schedule link (desktop and mobile)

## Critical Fix: PostgreSQL to MySQL/TiDB Database Conversion
- [ ] Convert Drizzle schema from pgTable to mysqlTable
- [ ] Convert all pgEnum to mysqlEnum
- [ ] Update db.ts to use mysql2 driver instead of postgres
- [ ] Update drizzle.config.ts dialect from postgresql to mysql2
- [ ] Test OAuth login after conversion
- [ ] Save checkpoint and deploy fix to production

## Priority: Guest Checkout Flow (Bypass Login Issue)
- [x] Verify guest checkout API endpoint works without authentication
- [x] Ensure Register page allows checkout without login
- [x] Test Stripe guest checkout with email collection
- [ ] Verify confirmation emails work for guest purchases
- [x] Deploy guest checkout fix to production (ready for publish)

## Confirmation Emails
- [x] Review Stripe webhook for payment success events
- [x] Implement email sending after successful checkout
- [x] Include purchase details in confirmation email
- [x] Test email delivery (5 tests passed)

## Stripe Live Mode Setup
- [x] Fix webhook to return valid JSON with verified: true
- [x] Ensure all webhook responses return 200 status
- [ ] Configure live Stripe keys in Settings → Payment
- [ ] Verify webhook in Stripe Dashboard

## Database Conversion: PostgreSQL to MySQL
- [x] Convert drizzle/schema.ts from PostgreSQL to MySQL syntax
- [x] Update server/db.ts to use mysql2 driver
- [x] Update drizzle.config.ts for MySQL dialect
- [x] Test database connection locally
- [ ] Test OAuth login on live site (needs publish)


## Realtime Chat Enhancement (GroupMe Replacement)
- [x] Review existing chat implementation
- [x] Add multiple chat channels/rooms (General, Announcements, Parents, Coaches)
- [x] Add user presence indicators (online/offline)
- [x] Add message timestamps and read receipts
- [x] Make chat mobile-friendly and accessible from navigation
- [x] Add unread message badges and notifications
- [ ] Test realtime messaging functionality


## Chat Bug Fix
- [x] Investigate why messages aren't sending (Socket.IO disabled in production)
- [x] Check Socket.IO server configuration
- [x] Fix chat functionality (enabled Socket.IO by default)
- [ ] Test chat messaging after publish


## Messaging Platform Enhancement
### Direct Messaging
- [ ] Create DM database schema (conversations, messages, participants)
- [ ] Implement role-based DM restrictions (coaches can DM parents, etc.)
- [ ] Add read receipts for DMs
- [ ] Implement block/mute functionality
- [ ] Add message search functionality
- [ ] Build DM UI with conversation list and chat view

### Push Notifications
- [ ] Set up Web Push API with VAPID keys
- [ ] Create notification preferences database schema
- [ ] Implement opt-in subscription flow
- [ ] Add notification triggers (DM, channel message, @mentions, announcements)
- [ ] Build notification customization settings UI
- [ ] Implement email fallback for users without push enabled

### Skill Creation
- [ ] Create messaging-platform skill with full documentation
- [ ] Include setup instructions and code templates
- [ ] Document role-based permissions system


## Bug Fixes (Reported by User)
- [x] Fix location creation database error (insert query failing) - Created missing locations table
- [x] Fix chat messaging functionality (messages not sending) - Confirmed working
- [x] Update Academy Group Membership to include Shooting Lab
- [x] Fix Summer Camp pricing ($185 total, $20 deposit, $165 due after)
- [x] Chat functionality confirmed working
- [x] Rename Academy League to Academy Offseason with summer tournament description

- [x] Remove sports filter section from Programs page


## Chat Image Sharing & Content Pages
- [x] Add image upload button to chat
- [ ] Implement S3 upload for chat images
- [ ] Display images in chat messages
- [x] Build Gallery page with photo grid (10 photos with categories and lightbox)
- [x] Build Videos page with TikTok/Instagram links (18 videos)
- [x] Build Shop page with coming soon placeholder
- [x] Build Blog page with coming soon placeholder

## SSE Chat Implementation
- [x] Replace Socket.IO with Server-Sent Events for production compatibility
- [x] Implement SSE streaming endpoint for real-time messages
- [x] Add channel-based chat (General, Announcements, Parents, Coaches)
- [x] Add online user indicators
- [x] Add @mention support
- [x] Test SSE chat on dev server


## Videos Page Enhancement
- [x] Add Load More button for paginated video browsing
- [x] Add infinite scroll to replace Load More button
- [x] Add video sorting (newest, oldest, platform, A-Z)
- [x] Add search functionality for videos

## Category Simplification
- [x] Simplify Gallery categories to Training and Highlights only
- [x] Simplify Videos categories to Training and Highlights only
- [x] Add admin video upload form for managing TikTok/Instagram links
