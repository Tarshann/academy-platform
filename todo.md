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
- [ ] Create gallery database schema
- [ ] Build photo upload interface for admins
- [ ] Implement S3 storage for photos
- [ ] Create photo categorization (training, teams, events)
- [ ] Build public gallery page with categories
- [ ] Add photo captions and descriptions
- [ ] Implement responsive image grid layout

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
- [ ] Set up Socket.IO for realtime communication
- [ ] Create chat messages database schema
- [ ] Build chat interface for members
- [ ] Implement message sending and receiving
- [ ] Add online status indicators
- [ ] Create chat rooms (general, announcements)
- [ ] Add message history and persistence
- [ ] Implement typing indicators

## Visual Adjustments
- [x] Apply Colorado Buffaloes color scheme (black, gold, silver)
