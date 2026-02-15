# The Academy — v1.0 Handoff

> Everything the next agent needs to continue development.
> Read this FIRST, then CLAUDE.md, then start coding.

---

## What Is This

The Academy is a youth athletic training business in Gallatin, TN run by two co-founders (Coach O and Coach Mac). This repo powers their entire digital platform:

1. **Marketing site** (`academytn.com`) — Next.js 15, drives parent sign-ups
2. **Member portal** (`app.academytn.com`) — React 19 SPA, where parents/coaches manage everything
3. **Mobile app** (`academy-app/`) — Expo React Native, native iOS experience for parents

All three apps share one backend (Express + tRPC + PostgreSQL).

---

## v1.0 Milestone (Tagged)

**Tag:** `v1.0` on commit `d839386`
**Date:** February 15, 2026
**Status:** Deployed and running on iPhones

### What v1.0 Includes

| Feature | Web Portal | Mobile App | Marketing Site |
|---------|-----------|------------|----------------|
| Auth (Clerk) | Yes | Yes | N/A |
| Dashboard | Yes | Yes | N/A |
| Programs list | Yes | Yes | Yes (3 programs) |
| Schedule + registration | Yes | Yes | Static page |
| Announcements | Yes | Yes | N/A |
| Attendance tracking | Yes | No | N/A |
| Group chat (4 rooms) | Yes (Ably real-time) | Yes (Ably real-time) | N/A |
| Direct messages | Yes (Ably real-time) | Yes (Ably real-time) | N/A |
| Push notifications | Web Push (VAPID) | Expo Push | N/A |
| Admin panel (11 managers) | Yes | No | N/A |
| Coach dashboard | Yes | No | N/A |
| Shop | Coming Soon page | No | N/A |
| Stripe payments | Yes | No | N/A |
| Profile | Basic | Basic | N/A |
| Blog | Coming Soon | No | Placeholder |
| Gallery/Videos | Yes (admin) | No | N/A |
| Lead capture quiz | N/A | N/A | Yes |

---

## Architecture at a Glance

```
                    academytn.com              app.academytn.com
                         │                           │
                   ┌─────┴──────┐            ┌───────┴────────┐
                   │  Next.js   │            │  React 19 SPA  │
                   │  Marketing │            │  (Vite build)  │
                   │    Site    │            │   Web Portal    │
                   └────────────┘            └───────┬────────┘
                                                     │
                    Expo Mobile App ──────────────────┤
                    (React Native)                    │
                                                     │
                                              ┌──────┴───────┐
                                              │  Express +   │
                                              │  tRPC v11    │
                                              │  (serverless)│
                                              └──────┬───────┘
                                                     │
                                    ┌────────────────┼────────────────┐
                                    │                │                │
                             ┌──────┴──────┐  ┌─────┴──────┐  ┌─────┴──────┐
                             │  PostgreSQL  │  │   Stripe   │  │   Ably     │
                             │   (Neon)     │  │  Payments  │  │  Real-time │
                             └─────────────┘  └────────────┘  └────────────┘
```

---

## Repo Structure (What Lives Where)

```
academy-platform/
├── academy-marketing/          # Next.js 15 — npm, NOT pnpm
│   ├── app/                    #   14 routes (/, /programs, /coaches, /faq, /get-started, etc.)
│   ├── components/             #   Navigation, Footer, StickyCTA, CheckoutButton, Analytics
│   ├── lib/config.ts           #   ALL business data (programs, coaches, prices, testimonials)
│   └── lib/metadata.ts         #   SEO metadata generator
│
├── client/src/                 # React 19 SPA — member portal frontend
│   ├── pages/                  #   12 routes (/member, /admin, /chat, /shop, /schedule, etc.)
│   ├── components/             #   Navigation, Footer, ErrorBoundary, SEO, 11 admin managers
│   ├── hooks/                  #   useComposition, useLocalStorageState, useMobile, usePersistFn
│   └── lib/                    #   trpc client, utils (cn), logger, errorHandler, locations
│
├── academy-app/                # Expo React Native — mobile app
│   ├── app/(auth)/             #   Sign-in, Sign-up (Clerk)
│   ├── app/(tabs)/             #   6 tabs: Dashboard, Chat, Messages, Schedule, Programs, Profile
│   ├── app/chat/[room].tsx     #   Chat room with Ably real-time
│   ├── app/dm/[id].tsx         #   DM thread with Ably real-time
│   ├── components/             #   MessageBubble, ChatInput, Loading, Screen
│   └── lib/                    #   clerk (token cache), trpc (client), notifications, realtime (Ably)
│
├── server/                     # Express + tRPC backend
│   ├── _core/                  #   index.ts, env.ts, context.ts, trpc.ts, clerk.ts, checkout.ts, rateLimiter.ts
│   ├── routers.ts              #   17 routers, 150+ procedures (2118 lines)
│   ├── db.ts                   #   100+ database functions (1928 lines)
│   ├── ably.ts                 #   Ably REST publish + token auth
│   ├── push.ts                 #   Expo + Web push with quiet hours
│   ├── chat-sse.ts             #   SSE chat (legacy, still used by serverless)
│   ├── serverless.ts           #   Vercel serverless entry (tRPC + chat + registrations)
│   └── serverless-stripe.ts    #   Isolated Stripe webhook handler
│
├── drizzle/schema.ts           # 36 tables, 20 enums (full DB schema)
├── shared/const.ts             # Shared constants (cookie name, error messages)
├── api/                        # Vercel serverless wrappers
├── docs/                       # Strategy docs, ship-readiness checklists
└── CLAUDE.md                   # Agent reference (read this too)
```

---

## Database Schema (36 Tables)

### Core
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | All accounts | openId (Clerk ID), role (user/admin), email, stripeCustomerId |
| `programs` | Training programs | name, slug, price, category, sport, ageMin/Max, maxParticipants |
| `userPrograms` | Enrollments | userId, programId, status, enrolledAt |

### Content & Scheduling
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `announcements` | Announcements | title, content, authorId, isPublished |
| `schedules` | Training sessions | programId, title, startTime/endTime, dayOfWeek, location, maxParticipants |
| `sessionRegistrations` | Session sign-ups | userId, scheduleId, status (registered/attended/canceled/no_show) |
| `attendanceRecords` | Attendance | userId, scheduleId, status (present/absent/excused/late), markedBy |
| `blogPosts` | Blog articles | title, slug, content, category, isPublished |
| `galleryPhotos` | Photo gallery | title, imageUrl, category (training/highlights) |
| `videos` | Social videos | url, platform (tiktok/instagram), category |

### Payments & Shop
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `payments` | Transactions | userId, stripePaymentIntentId, amount, status, type (one_time/recurring) |
| `subscriptions` | Recurring billing | userId, stripeSubscriptionId, status, currentPeriodStart/End |
| `stripeWebhookEvents` | Webhook dedup | eventId (unique), eventType, status |
| `products` | Shop items | name, price, category (apparel/accessories/equipment), stock |
| `orders` | Shop orders | userId, stripeCheckoutSessionId, totalAmount, status |
| `orderItems` | Order line items | orderId, productId, quantity, price |
| `campaigns` | Promotions | discountPercent, startDate/endDate, isActive |

### Chat & Messaging
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `chatMessages` | Group chat | userId, userName, message, room (general/announcements/parents/coaches) |
| `dmConversations` | DM threads | lastMessageAt |
| `dmParticipants` | DM membership | conversationId, userId, lastReadAt, isMuted, isArchived |
| `dmMessages` | DM messages | conversationId, senderId, content, isEdited, isDeleted |
| `dmReadReceipts` | Read tracking | messageId, userId, readAt |
| `userBlocks` | Block list | blockerId, blockedId |
| `userMessagingRoles` | DM permissions | messagingRole (parent/athlete/coach/staff/admin), canDmCoaches/Parents/Athletes |

### Push Notifications
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `pushSubscriptions` | Push endpoints | userId, deviceId, platform (web/ios/android), endpoint, expoPushToken |
| `notificationSettings` | User prefs | pushEnabled, quietHoursStart/End, dmNotifications, channelNotifications |
| `notificationLogs` | Delivery log | userId, type (push/email), status (pending/sent/failed/clicked) |
| `notificationPreferences` | Email prefs | sessionRegistrations, paymentConfirmations, announcements (booleans) |

> **Push device model:** Mobile tokens upsert by `(userId, deviceId)` — one row per physical device. iPhone + iPad for the same user both receive notifications. Web Push keys on `(userId, endpoint)` which is naturally per-browser. The `deviceId` is generated once per install via `expo-secure-store` and persists across app updates.

### People & Locations
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `coaches` | Coach profiles | userId, bio, specialties, certifications |
| `coachAssignments` | Coach-program links | coachId, programId, scheduleId, role |
| `locations` | Training venues | name, address, city, state, latitude/longitude |
| `userRelations` | Parent-child links | parentId, childId, relationshipType |
| `privateSessionBookings` | 1-on-1 bookings | customerEmail, coachId, preferredDates/Times, status |

### Lead Capture
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `leads` | Marketing leads | email, source, athleteAge, sport, goal, recommendedProgram, status |
| `nurtureEmailLog` | Nurture tracking | leadId, step, subject, opened, clicked |
| `contactSubmissions` | Contact form | name, email, message, type (general/volunteer), status |

---

## API Surface (tRPC Routers)

### Public (no auth)
- `auth.me` — current user (or null)
- `auth.logout` — clear session
- `programs.list` / `programs.getBySlug` — program catalog
- `leads.submit` — capture quiz lead
- `contact.submit` — contact form
- `shop.products` / `shop.campaigns` — shop catalog
- `gallery.list` / `gallery.getByCategory` — photos
- `videos.list` / `videos.getById` / `videos.getByCategory` — videos
- `blog.list` / `blog.getBySlug` — blog posts
- `pushNotifications.getVapidPublicKey` — web push key

### Protected (requires auth)
- `auth.chatToken` — JWT for SSE chat (10 min TTL)
- `auth.ablyToken` — scoped Ably token
- `announcements.list` — published announcements
- `schedules.upcoming` / `schedules.register` — sessions
- `shop.myOrders` / `shop.checkout` — shopping
- `payment.checkout` / `payment.confirmCheckout` / `payment.myPayments` / `payment.mySubscriptions` — Stripe
- `attendance.mark` / `attendance.list` / `attendance.getMyAttendance` / `attendance.getStats` — tracking
- `dm.*` — getConversations, getMessages, sendMessage, getAvailableUsers, blockUser, unblockUser, muteConversation, archiveConversation, getMyRole
- `notifications.getPreferences` / `notifications.updatePreferences` — email prefs
- `pushNotifications.getSettings` / `pushNotifications.updateSettings` / `pushNotifications.subscribe` / `pushNotifications.unsubscribe` — push prefs
- `locations.list` — training venues
- `coaches.list` — coach profiles

### Admin (requires role=admin)
- `admin.programs.*` — CRUD programs
- `admin.announcements.*` — CRUD + publish
- `admin.schedules.*` — CRUD sessions
- `admin.members.*` — list, get, update, delete, manage relations
- `admin.contacts.*` — mark read/responded
- `shop.admin.products.*` / `shop.admin.campaigns.*` — shop management
- `gallery.admin.*` — photo management
- `videos.admin.*` — video management
- `blog.admin.*` / `blogAdmin.*` — blog management
- `coaches.admin.*` — coach profiles + assignments
- `locations.admin.*` — venue management
- `dmAdmin.setUserRole` / `dmAdmin.getUsersWithRoles` — messaging roles
- `leads.list` / `leads.processNurture` — lead management

### REST Endpoints (non-tRPC)
- `GET /api/chat/history/:room` — chat message history
- `POST /api/chat/send` — send chat message (token auth)
- `GET /api/chat/users` — user list for @mentions
- `GET /api/chat/online` — online users
- `GET /api/chat/stream` — SSE connection
- `POST /api/chat/upload-image` — image upload (multer, 5MB)
- `POST /api/skills-lab-register` — Skills Lab registration
- `POST /api/performance-lab-apply` — Performance Lab application
- `GET /api/health` — health check
- `POST /api/stripe/webhook` — Stripe webhook (isolated handler)

---

## Real-Time Stack

```
Client (Web or Mobile)
    │
    ├── Ably Realtime (preferred)
    │   ├── chat:{room} channels — group chat messages
    │   ├── dm:{conversationId} channels — DM messages
    │   └── Token auth via trpc.auth.ablyToken
    │
    └── SSE Fallback (if ABLY_API_KEY not set)
        ├── GET /api/chat/stream — persistent SSE connection
        └── 30-second keepalive pings

Server publishes via:
    ├── server/ably.ts — publishChatMessage(), publishDmMessage()
    └── server/chat-sse.ts — broadcastToRoom() (SSE fallback)

Push notifications (fire-and-forget):
    ├── server/push.ts — Expo SDK for mobile, Web Push for browsers
    ├── Quiet hours enforcement (user-configurable)
    └── Per-channel notification preferences
```

---

## Environment Variables

### Required for Portal (Vercel)
```
DATABASE_URL=postgres://...          # Neon PostgreSQL
CLERK_SECRET_KEY=sk_live_...         # Clerk auth
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_ADMIN_EMAIL=admin@...          # Gets admin role
STRIPE_SECRET_KEY=sk_live_...        # Payments
STRIPE_WEBHOOK_SECRET=whsec_...      # Webhook verification
RESEND_API_KEY=re_...                # Email (registration confirmations)
VITE_SITE_URL=https://app.academytn.com
```

### Optional / Feature Flags
```
ABLY_API_KEY=...                     # Real-time (falls back to SSE polling without this)
VAPID_PUBLIC_KEY=...                 # Web Push notifications
VAPID_PRIVATE_KEY=...
VITE_FRONTEND_FORGE_API_URL=...     # CDN/storage
VITE_FRONTEND_FORGE_API_KEY=...
OWNER_OPEN_ID=...                   # Legacy admin detection
ENABLE_SOCKET_IO=true               # Socket.IO chat (default: true)
NEXT_PUBLIC_GA_ID=...               # Google Analytics (marketing site)
NEXT_PUBLIC_META_PIXEL_ID=...       # Meta Pixel (marketing site)
```

### Mobile App (academy-app/.env)
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
EXPO_PUBLIC_API_URL=https://app.academytn.com
EXPO_PUBLIC_PROJECT_ID=...           # For Expo push tokens
```

---

## Deployment

| App | Platform | Build | Domain |
|-----|----------|-------|--------|
| Marketing | Vercel | `next build` | academytn.com |
| Portal | Vercel | `pnpm build` (vite + esbuild) | app.academytn.com |
| Mobile | Expo (EAS Build) | `eas build --platform ios` | App Store / TestFlight |

Portal Vercel rewrites:
- `/api/trpc/*` → `dist/serverless.js` (tRPC)
- `/api/chat/*` → `dist/serverless.js` (SSE chat)
- `/api/stripe/*` → `dist/serverless-stripe.js` (webhook)
- `/*` → `index.html` (SPA fallback)

---

## Build & Test Commands

```bash
# Portal (from repo root)
pnpm install
pnpm build            # vite + esbuild (SPA + serverless bundles)
pnpm check            # tsc --noEmit
pnpm test             # vitest
pnpm test:e2e         # playwright

# Marketing (from academy-marketing/)
npm install            # NOT pnpm
npm run build          # next build
npm run typecheck      # expect pre-existing module resolution warnings
npm run validate       # custom build validation
npm test               # playwright
```

---

## What Works Right Now (v1.0)

### Marketing Site (academytn.com)
- Homepage with hero, trust stats, program intro, coaches, testimonials, CTA
- 3 program detail pages (Performance Lab $245/mo, Skills Lab $10/session, Private $60/session)
- Coach profiles (Coach Mac, Coach O)
- Get Started quiz (recommends programs based on age/sport/goal)
- FAQ page (8 questions)
- SEO: meta tags, OG images, Schema.org LocalBusiness JSON-LD
- Analytics: GA4 + Meta Pixel (when configured)
- Sticky mobile CTA bar (appears after 600px scroll)
- Blog/Events: placeholder pages

### Member Portal (app.academytn.com)
- Clerk auth (sign-in, sign-up, email verification)
- Member dashboard: upcoming schedule (grouped by day), announcements, attendance stats, quick actions
- Admin dashboard: 11 tabbed managers (schedules, members, programs, announcements, blog, attendance, coaches, locations, contacts, videos, gallery)
- Coach dashboard: private session booking management
- Chat: 4 rooms (General, Announcements, Parents, Coaches), Ably real-time with SSE fallback, @mentions, image upload, connection indicator
- DMs: conversation list, message threads, Ably real-time, block/mute/archive, role-based permissions
- Schedule: register for sessions, location links
- Settings: 6 notification preference toggles
- Private session booking: Coach selection, availability form
- Payment: Stripe checkout, order confirmation with PDF receipt
- Shop: "Coming Soon" preview page
- PWA service worker registered

### Mobile App (iOS)
- Clerk auth (sign-in, sign-up with email verification)
- 6-tab navigation: Dashboard, Chat, Messages, Schedule, Programs, Profile
- Dashboard: welcome greeting, admin badge, next session card, announcements
- Chat: 4 channel list → room detail with Ably real-time
- Messages: DM conversation list with unread badges → DM thread with Ably real-time
- Schedule: upcoming sessions with registration
- Programs: program list with pricing, links to web signup
- Profile: name, email, role badge, sign-out
- Push notifications: auto-registration, deep linking (tap → chat room or DM)
- Pull-to-refresh on most screens

---

## Known Limitations / Incomplete Features

### Mobile App
- No profile editing
- No message search
- No message reactions/emojis
- No file/image uploads in chat (only text)
- No typing indicators
- No offline support (no local persistence)
- No pagination (hardcoded limit=50 for chat history)
- Programs tap → opens web URL in browser (no native checkout)
- No admin panel (admin must use web)
- No attendance tracking
- No gallery/video viewing

### Web Portal
- Shop is "Coming Soon" (static preview, no cart/checkout for products)
- Blog is placeholder
- Schedule page has hardcoded data (not pulling from API)
- No typing indicators in chat
- Limited mobile responsiveness in some admin managers

### Marketing Site
- Blog has 3 placeholder articles (all "Coming Soon")
- Events page exists but minimal content
- No checkout API route implemented (`/api/checkout` referenced by CheckoutButton but not built)
- SEO landing page (`/youth-athletic-training-gallatin-tn`) exists but may need content refresh

### Backend
- Rate limiter is in-memory (resets on deploy, no Redis)
- No pagination on most list endpoints (returns all records)
- Chat image upload stores via multer but CDN integration unclear
- `ENABLE_SOCKET_IO` flag exists but Socket.IO is mostly superseded by Ably
- Lead nurture email sequences not fully built (endpoint exists but limited)

---

## v1.1 Roadmap — Suggested Priorities

### Tier 1: Activate What's Already Built
These features have backend support but need frontend wiring or final activation:

1. **Activate chat rooms for parents** — Chat infrastructure is deployed. Configure messaging roles via admin panel (`dmAdmin.setUserRole`), announce to parents, monitor
2. **Populate admin content** — Add real weekly schedules, welcome announcement, coach profiles through the admin panel at app.academytn.com/admin
3. **TestFlight distribution** — Run `eas build --platform ios --profile production` then `eas submit --platform ios` to get on TestFlight (no UDID registration needed)

### Tier 2: Mobile App Parity
4. **Mobile attendance** — Add attendance screen (API exists: `attendance.getMyAttendance`, `attendance.getMyStats`)
5. **Mobile image sharing in chat** — Add image picker + upload to chat rooms (server endpoint exists: `/api/chat/upload-image`)
6. **Mobile gallery/video viewer** — Surface gallery photos and training videos (APIs exist)
7. **Pagination** — Add infinite scroll / load-more to chat history and DM messages (currently hardcoded limit=50)

### Tier 3: Shop & Payments
8. **Shop MVP** — Wire up product catalog, cart (localStorage), Stripe checkout on web portal (APIs exist: `shop.products`, `shop.checkout`)
9. **Mobile payments** — Native Stripe checkout or in-app purchase flow for program registration
10. **Product image uploads** — Admin can already create products; add image upload via Forge CDN

### Tier 4: Engagement & Polish
11. **Typing indicators** — Ably presence API for "User is typing..." in chat and DMs
12. **Read receipts UI** — Backend has `dmReadReceipts` table; surface in DM conversations
13. **Blog launch** — Replace placeholder articles with real content; wire up blog admin manager
14. **Push notification settings UI** — Mobile app can register tokens but has no settings screen (quiet hours, per-channel toggles)
15. **Offline support** — React Query persistence + AsyncStorage for mobile app

### Tier 5: Growth
16. **Parent-child linking** — `userRelations` table exists; build UI for parents to link their athlete accounts
17. **Progress tracking** — 90-day assessment cycles referenced in marketing; build baseline testing + comparison views
18. **Email nurture automation** — `leads` and `nurtureEmailLog` tables exist; build drip email sequences via Resend
19. **Android app** — Expo supports Android; needs `eas build --platform android` and Play Store submission

---

## Critical Files to Read First

When starting any task, read these files in this order:

1. **CLAUDE.md** — Repo structure, build commands, common pitfalls
2. **This file (HANDOFF.md)** — Current state and roadmap
3. **drizzle/schema.ts** — Database schema (what data exists)
4. **server/routers.ts** — API surface (what endpoints exist)
5. **server/db.ts** — Database functions (what queries are available)

Then for the specific app you're modifying:
- Marketing: `academy-marketing/lib/config.ts` (business data source of truth)
- Portal: `client/src/App.tsx` (routes) → relevant `client/src/pages/*.tsx`
- Mobile: `academy-app/app/(tabs)/_layout.tsx` (tabs) → relevant screen files
- Backend: `server/_core/index.ts` (middleware) → `server/routers.ts` (procedures)

---

## Business Context

**The Academy** is a youth athletic training business in Gallatin, Tennessee:
- **Co-founders:** Omar Philmore (Coach O) and Tarshann Washington (Coach Mac)
- **Programs:** Performance Lab ($245/mo membership), Skills Lab ($10 drop-in), Private Training ($60/session)
- **Sports:** Basketball, flag football, football, soccer (multi-sport SAQ approach)
- **Ages:** 8-14 for Performance Lab, all ages for Skills Lab and Private
- **Schedule:** Tue & Thu 6-8 PM, Sun 11 AM-12 PM
- **Service area:** Gallatin, Hendersonville, Sumner County, and surrounding Middle TN
- **Partner schools:** Sumner Academy, Shafer Middle, Rucker Middle, Gallatin High, Liberty Creek, Station Camp, Stratford High

---

## Git Conventions

- Default branch: `main`
- Development branches: `claude/<feature>-<session-id>`
- 124 commits in history as of v1.0
- Vercel auto-deploys on push to `main`
- No CI/CD (GitHub Actions) — deployment is Vercel only
