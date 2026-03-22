# Academy Platform — Agent Reference (v3)

> Single source of truth for any AI agent working in this repo.
> Read this completely before making changes.

---

## Mission & Business Context

**The Academy** is a youth athletic training facility in **Gallatin, Tennessee**. This platform is its digital ecosystem: a marketing site to attract families, a member portal for managing enrollment/payments/scheduling, and a native mobile app for daily member engagement.

**Problem domain**: Youth sports training businesses rely on fragmented tools (paper sign-ups, separate payment systems, generic scheduling apps). This platform unifies the entire member lifecycle — discovery → enrollment → payment → scheduling → communication — into one cohesive experience.

**Current release**: v1.8.3 (mobile app v1.8.3, build 36). Previous v1.6 delivered: athlete metrics, showcases, games hub, social gallery, merch drops, video in chat. v1.7 adds: shared theme system, reusable animated components, platform-wide security hardening. Post-v1.7: strategic audit implementation — family accounts, waitlist, referrals, onboarding, RBAC, billing reminders, schedule templates, AI progress reports, Sentry, CI/CD. v1.7.1 adds: app store badges, calendar sync, athlete progress dashboard card, feed query optimization. v1.8.0 adds: automation layer (9 Vercel Cron Jobs), AI content engine (session recaps, parent digests, progress reports), content queue admin workflow. v1.8.1 adds: App Store compliance fixes (iOS permission purpose strings for camera, photo library, calendar, microphone), expo-image-picker and expo-calendar plugin configurations. v1.8.2–v1.8.3 adds: AI Vision Capture (voice/photo metric extraction with PR detection), gallery video support (mediaType column), 14 performance indexes, governance evidence persistence. Post-v1.8.0: Strix governance SDK integration — 104 capabilities (75 tRPC mutations + 16 cron jobs + 13 AI agent actions) with risk classification (12 critical, 37 high, 49 medium, 6 low), approval workflows, and evidence trail. Autonomous AI content engine (7 AI cron jobs) with full governance evidence recording. Mobile governance dashboard (build 36).

---

## Platform Overview

This monorepo contains **three independent applications** that deploy separately but serve one unified product ecosystem:

| App | Directory | Stack | Domain / Target | Purpose |
|-----|-----------|-------|-----------------|---------|
| **Marketing Site** | `academy-marketing/` | Next.js 15 (App Router) | `academytn.com` | Public-facing marketing, SEO, programs, coaches, blog, quiz |
| **Member Portal** | `client/` + `server/` + `api/` | React 19 SPA (Vite) + Express/tRPC | `app.academytn.com` | Authenticated dashboard, admin, coach tools, chat, shop, payments |
| **Mobile App** | `academy-app/` | React Native (Expo + EAS) | iOS / Android | Native member experience + push notifications |

These apps:

- Deploy independently
- Have separate build pipelines
- Have separate runtime environments
- Use different styling systems
- Do NOT share UI code

However:

- `client/` and `server/` share types via `shared/`
- `academy-marketing/` shares nothing with the portal at build time
- `academy-app/` uses tRPC client + Clerk to connect to the same portal backend

---

## Architectural Style

**Hybrid monorepo with independent deployments.** Not a monolith, not microservices — three separate apps in one repo for coordination convenience. The portal backend is a single Express + tRPC server (monolithic API) serving both the web SPA and mobile app.

Key patterns:
- **tRPC end-to-end typing** — Types flow from Drizzle schema → server procedures → client/mobile. No REST contract drift.
- **Config-driven content** — Marketing business data lives in one config file; pages are pure renderers.
- **Auth-graceful degradation** — Clerk is primary auth, but the system works with OAuth fallback if Clerk keys aren't configured.
- **Isolated security boundaries** — Stripe webhook has its own serverless bundle, separate from main API.
- **Governance-aware mutations** — Admin mutations use `governedProcedure()` which wraps `adminProcedure` with an embedded governance kernel. Evidence is always persisted locally to the `governance_evidence` table (with SHA-256 hashing). Local policy evaluation provides deterministic enforcement (critical → owner-only, high → soft escalate). External Strix SDK consulted when `STRIX_GOVERNANCE_ENABLED=true`.

---

## Directory Map

```
academy-platform/
├── academy-marketing/       # Public marketing site (Next.js 15)
│   ├── app/                 #   App Router pages (page.tsx, layout.tsx)
│   ├── components/          #   UI components (Navigation, Footer, StickyCTA, etc.)
│   ├── lib/                 #   config.ts (SINGLE SOURCE OF TRUTH for business data),
│   │                        #   metadata.ts, structured-data.tsx
│   ├── public/              #   Static assets (images, logo)
│   ├── scripts/             #   validate-build.mjs, test-all.sh
│   ├── tests/               #   Playwright E2E tests
│   ├── vercel.json          #   { "framework": "nextjs" }
│   └── package.json         #   Uses npm (has package-lock.json), NOT pnpm
│
├── client/                  # Member portal frontend (React 19 + Vite)
│   └── src/
│       ├── components/      #   shadcn/ui components + custom pages
│       ├── pages/           #   Route-level page components (Home, Dashboard, Admin, etc.)
│       ├── hooks/           #   Custom React hooks
│       ├── contexts/        #   React contexts (ClerkStateContext for auth state)
│       ├── lib/             #   Utilities (trpc client, utils)
│       └── index.css        #   Tailwind v4 theme (oklch colors, Inter font)
│
├── server/                  # Portal backend (Express + tRPC v11)
│   ├── _core/               #   Server infrastructure (see detailed breakdown below)
│   ├── cron/                #   Scheduled automation functions (16 cron jobs: 9 operational + 7 AI autonomous + tests)
│   ├── routers.ts           #   All tRPC routes (~4,067 lines)
│   ├── db.ts                #   Drizzle ORM connection + all DB functions (~3,371 lines)
│   ├── serverless.ts        #   Vercel serverless entry point
│   ├── serverless-stripe.ts #   Isolated Stripe webhook handler
│   ├── chat-sse.ts          #   SSE-based real-time chat (primary)
│   ├── chat.ts              #   Socket.IO chat (optional fallback)
│   ├── ably.ts              #   Ably real-time integration (mobile)
│   ├── email.ts             #   Transactional email via Resend
│   ├── nurture.ts           #   Email nurture/drip campaigns
│   ├── push.ts              #   Web Push notifications (VAPID)
│   ├── products.ts          #   Product catalog logic
│   ├── storage.ts           #   File storage (S3/Forge CDN)
│   ├── stripe-webhook.ts    #   Stripe event processing logic
│   ├── milestones.ts        #   PR detection + milestone celebration pipeline
│   ├── milestone-card.ts    #   SVG→PNG celebration card generator (sharp)
│   ├── governance-router.ts #   Strix governance admin API (stats, evidence trail, capabilities)
│   ├── performance-lab-apply.ts  # REST endpoint: Performance Lab applications
│   ├── skills-lab-register.ts    # REST endpoint: Skills Lab registrations
│   └── *.test.ts            #   Vitest unit tests (co-located with source)
│
├── server/_core/            # Server infrastructure modules
│   ├── index.ts             #   Express app setup, middleware, Vite dev integration
│   ├── env.ts               #   Environment variable loading with fallbacks
│   ├── context.ts           #   tRPC context (req, res, user) + auth resolution
│   ├── trpc.ts              #   tRPC initialization + procedure definitions
│   ├── clerk.ts             #   Clerk JWT, user sync (auto-fills missing name from Clerk), admin role detection
│   ├── clerk-oauth.ts       #   Clerk OAuth flow helpers
│   ├── oauth.ts             #   OAuth fallback (non-Clerk auth)
│   ├── checkout.ts          #   Stripe checkout session creation
│   ├── rateLimiter.ts       #   Rate limiting middleware
│   ├── health.ts            #   GET /api/health endpoint
│   ├── logger.ts            #   Logging utilities
│   ├── errorHandler.ts      #   Global error handling middleware
│   ├── cookies.ts           #   Cookie management
│   ├── validateEnv.ts       #   Env var validation on startup
│   ├── vite.ts              #   Vite dev server integration (HMR)
│   ├── llm.ts               #   LLM/AI integration
│   ├── imageGeneration.ts   #   AI image generation
│   ├── voiceTranscription.ts #  Voice transcription service
│   ├── notification.ts      #   Notification dispatch
│   ├── dataApi.ts           #   External data API client
│   ├── map.ts               #   Map/geocoding utilities
│   ├── sdk.ts               #   SDK authentication helpers
│   ├── sentry.ts            #   Sentry error monitoring (optional, activated via SENTRY_DSN)
│   ├── strix.ts             #   Strix governance SDK client (lazy singleton, circuit breaker, 3s timeout)
│   ├── strix-capabilities.ts #  104 capability definitions (75 mutations + 16 crons + 13 AI actions)
│   ├── governed-procedure.ts #  governedProcedure() embedded kernel — local evidence, policy eval, optional Strix SDK
│   ├── systemRouter.ts      #   System-level tRPC routes (health, version)
│   └── types/               #   TypeScript type definitions
│
├── academy-app/             # Mobile app (Expo + React Native)
│   ├── app/                 #   Expo Router file-based routes
│   │   ├── _layout.tsx      #   Root layout: Clerk + AuthGuard + PushRegistration + PostHog
│   │   ├── (tabs)/          #   Tab-based navigation (dashboard, chat, media, programs, profile)
│   │   │                    #   Hidden tabs: games, messages, schedule (href: null)
│   │   ├── (auth)/          #   Auth screens (sign-in, sign-up)
│   │   └── *.tsx            #   Stack screens: admin, admin-governance, metrics, showcase, drops, gallery,
│   │                        #   attendance, shop, payments, notifications-settings, chat/[room], dm/[id]
│   ├── components/          #   React Native UI components
│   ├── lib/                 #   tRPC client, Clerk auth, utilities
│   ├── assets/              #   App icon, splash screen, adaptive icon
│   ├── app.json             #   Expo config (bundle ID: com.academytn.app)
│   ├── eas.json             #   EAS build profiles (dev/preview/production)
│   └── package.json         #   Uses npm (has package-lock.json)
│
├── shared/                  # Shared types/constants between client & server
│   ├── types.ts             #   Re-exports Drizzle schema types
│   ├── const.ts             #   Session cookie name, timeout values, error messages
│   ├── money.ts             #   Currency formatting (toCents, formatUsd, normalizeAmount)
│   └── _core/errors.ts      #   HttpError hierarchy with domain-specific subclasses
│
├── drizzle/                 # Database schema + SQL migrations
│   ├── schema.ts            #   Full PostgreSQL schema (57 tables, enums, relations)
│   └── 0000-0023_*.sql      #   Sequential migrations (latest: gallery media type + performance indexes)
│
├── api/                     # Vercel serverless function entry points (thin wrappers)
│   ├── [...path].ts         #   → dist/serverless.js (tRPC + chat + registrations)
│   ├── stripe/webhook.ts    #   → dist/serverless-stripe.js (Stripe webhooks)
│   └── cron/                #   16 Vercel Cron Job entry points (CRON_SECRET auth)
│
├── ops/                     # Agent coordination & project management system
│   ├── 00_READ_FIRST/       #   Vision, rules, definitions, quality bar
│   ├── 10_BACKLOG/          #   NOW.md, NEXT.md, LATER.md (ticket tracking)
│   ├── 20_WORKSTREAMS/      #   Per-agent workstream files (mobile, portal, marketing, etc.)
│   ├── 30_DECISIONS/        #   Architecture Decision Records (ADRs)
│   ├── 40_RELEASES/         #   QA checklists, release plans, App Store checklist
│   ├── 50_REPORTS/          #   Status reports, audit findings, competitor snapshots
│   └── 60_AGENT_PROMPTS/    #   Specialized agent prompt templates
│
├── .github/workflows/       # CI/CD pipeline (GitHub Actions)
│   └── ci.yml               #   3 jobs: portal (build+test), marketing (build+validate), mobile (typecheck)
├── .agents/                 # Legacy agent planning files (MASTER_PLAN, per-agent plans)
├── docs/                    # Strategy docs, ship-readiness checklists, investor materials
├── dist/                    # Build output (compiled server + SPA)
├── e2e/                     # Playwright E2E tests for member portal
├── patches/                 # pnpm patched dependencies (wouter@3.7.1)
├── vite.config.ts           # Vite config for client build (path aliases: @ → client/src)
├── vitest.config.ts         # Vitest config for server unit tests
├── drizzle.config.ts        # Drizzle Kit config (migrations, schema push)
├── playwright.config.ts     # Playwright config for portal E2E tests
├── tsconfig.json            # Root TypeScript config
└── vercel.json              # Portal Vercel config (API rewrites + SPA fallback)
```

---

## System Data Flow

### Authentication Flow
```
User → Clerk (JWT) → Express middleware → tRPC context → procedure
                    ↘ OAuth fallback if Clerk unavailable
```

### API Request Flow
```
Client/Mobile → tRPC httpBatchLink → Express → tRPC middleware → procedure → db.ts → PostgreSQL (Neon)
                                                    ↓
                                              Auth check (Clerk/OAuth)
                                              Rate limiting
                                              Input validation (Zod)
```

### Real-time Flow
```
Web Portal:  SSE (chat-sse.ts) ← primary
             Socket.IO (chat.ts) ← opt-in fallback
Mobile App:  Ably (ably.ts) ← managed service for persistent connections
```

### Payment Flow
```
Client/Mobile → payment.createCheckout (tRPC) → Stripe Checkout Session → redirect to Stripe
                                                                            ↓
Stripe → webhook POST → api/stripe/webhook.ts → serverless-stripe.js → stripe-webhook.ts → db update
```

### Client Auth Initialization
```
main.tsx → Clerk key valid? → TrpcProviderWithClerk (token in headers)
                            → TrpcProviderWithoutClerk (fallback)
         → 401 response? → auto-redirect to /login
         → Service Worker registration (PWA)
         → Umami analytics injection
```

---

## App 1 — Marketing Site (`academy-marketing/`)

### Stack & Domain

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind v4 (PostCSS), Oswald + Source Sans 3
- **Package Manager**: npm (NOT pnpm)
- **Domain**: `academytn.com`

### Critical Rule

ALL business data lives in one file:

```
academy-marketing/lib/config.ts
```

This includes: programs (pricing, schedule, FAQs), coaches, testimonials, trust stats, service areas, contact info, and hours.

**Pages are pure renderers of config.** Never hardcode business data in page components.

### Structured Data

Auto-generated from config.ts via:

```
academy-marketing/lib/structured-data.tsx
```

If testimonials change → update config only. Structured data regenerates automatically.

### Build Commands

```bash
cd academy-marketing
npm install           # Uses npm, NOT pnpm
npm run build         # next build
npm run dev           # next dev
npm run typecheck     # tsc --noEmit (expect pre-existing module resolution errors)
npm run validate      # Custom build validation script (45+ checks)
npm test              # Playwright E2E tests (tests/e2e/)
```

**Important**: `typecheck` will show errors about missing `next/server`, `next/link` etc. when run from the monorepo root. These are pre-existing module resolution issues and do NOT affect the actual Next.js build or deployment.

### Quality Gates

- `scripts/validate-build.mjs` — Post-build validation: config correctness, page existence, structured data presence
- `scripts/test-all.sh` — Full pre-deploy gate: typecheck → build → validate → Playwright E2E

---

## App 2 — Member Portal (`client/` + `server/` + `api/`)

### Architecture

| Layer | Location | Tech |
|-------|----------|------|
| Frontend | `client/` | React 19 SPA (Vite 7), wouter, shadcn/ui |
| Backend | `server/` | Express.js + tRPC v11 |
| Serverless | `api/` | Vercel function entry points |
| Database | `drizzle/` | PostgreSQL (Neon) via Drizzle ORM |
| Shared | `shared/` | Types, constants, error classes |

### Domain

`app.academytn.com`

### Key Architectural Decisions

1. **tRPC end-to-end typing** — Client imports `AppRouter` type from server. No REST layer. No contract drift.
2. **Clerk primary auth + OAuth fallback** — Auth gracefully degrades if Clerk keys are not configured. Both client and server handle this.
3. **Isolated Stripe webhook** — Separate esbuild bundle (`dist/serverless-stripe.js`), separate Vercel function. Cannot be affected by main API failures.
4. **SSE-first real-time** — Primary system is SSE (`chat-sse.ts`). Socket.IO kept as opt-in for persistent-connection environments.
5. **REST endpoints coexist with tRPC** — `performance-lab-apply.ts` and `skills-lab-register.ts` are Express REST handlers (not tRPC). Registered directly on the Express app before the tRPC middleware. Both have input validation (HTML escaping, length limits, email format) and rate limiting.
6. **Stripe webhook registered before body parsing** — The webhook route is mounted BEFORE `express.json()` middleware so it receives the raw body for Stripe signature verification.
7. **PWA support** — Client registers a service worker; the portal can be installed as a Progressive Web App.
8. **Web Push notifications** — VAPID keys configured for browser push notifications (`server/push.ts`).
9. **Input sanitization** — REST endpoints sanitize user inputs to prevent HTML injection in email templates. Chat history limits are capped (1-200) to prevent abuse.
10. **Strix governance layer** — All 75 admin tRPC mutations use `governedProcedure()` instead of raw `adminProcedure`. Embedded kernel always records evidence locally to `governance_evidence` table (SHA-256 hashed). Local policy evaluation enforces risk-based rules (critical capabilities require owner). When `STRIX_GOVERNANCE_ENABLED=true`, also consults external Strix SDK for policy decisions. 16 cron jobs governed (auto-approve with evidence recording). 13 AI agent actions governed with actor `system:ai` and source `ai`. Fails open on SDK/write errors, fails closed on deny. Circuit breaker (5 failures → 5min cooldown) and 3s fetch timeout prevent SDK outages from degrading API latency. 104 total capabilities: 75 mutations + 16 crons + 13 AI actions.
11. **Autonomous AI content engine** — 7 AI cron jobs generate content, manage gallery, create showcases, draft announcements/blogs, fill feed gaps, and send personalized notifications. All AI actions flow through governance with evidence recording. High-visibility content (blogs, announcements) always saved as drafts for admin review. Feed engagement content auto-publishes only when organic content is slow.

### Server Module Breakdown

The `server/` directory follows a flat structure (no domain modules yet):

| Module | Responsibility |
|--------|---------------|
| `routers.ts` | All tRPC procedures organized into nested sub-routers (auth, programs, shop, admin, chat, blog, videos, etc.) |
| `db.ts` | All database queries via Drizzle ORM — no repository pattern, all functions exported flat |
| `email.ts` | Transactional emails via Resend (registration confirmations, receipts, etc.) |
| `nurture.ts` | Email drip/nurture campaign logic |
| `push.ts` | Web Push notification dispatch (VAPID) |
| `ably.ts` | Ably real-time channel management (mobile real-time) |
| `products.ts` | Product catalog and pricing logic |
| `storage.ts` | File upload/storage via S3/Forge CDN |
| `stripe-webhook.ts` | Stripe event processing: checkout, subscription, invoice, refund, payment failure |
| `chat-sse.ts` | SSE real-time chat: room management, broadcast, active connection tracking |
| `chat.ts` | Socket.IO chat (optional, for persistent-connection environments) |
| `cron/` | 16 automation functions: 9 operational (nurture, generate-sessions, session-reminders, merch-drops, metrics-prompt, progress-reports, reengagement, parent-digest, post-session-content) + 7 AI autonomous (ai-smart-notifications, ai-gallery-capture, ai-showcase-generator, ai-content-autopublish, ai-announcement-drafter, ai-blog-generator, ai-feed-engagement) |
| `governance-router.ts` | Strix governance admin API: stats, evidence trail, capability registry — all feature-flagged |

### tRPC Router Structure

```
appRouter
├── system.*          # Health, version
├── auth.*            # Login, logout, session, updateProfile (name/picture), updateProfile
├── programs.*        # Program listings, details
├── announcements.*   # Facility announcements
├── schedules.*       # Session schedules
├── shop.*            # Merchandise store
├── admin.*           # Admin-only operations
├── chat.*            # Chat rooms, messages
├── blog.*            # Blog posts
├── videos.*          # Video content
├── gallery.*         # Photo gallery
├── coaches.*         # Coach profiles (includes name/email via JOIN)
├── attendance.*      # Attendance tracking
├── payment.*         # Stripe checkout, payment history
├── dm.*              # Direct messages
├── feed.*            # Unified media feed (videos + gallery, paginated)
├── metrics.*         # Athlete performance metrics (admin-recorded)
├── showcases.*       # Weekly athlete spotlight
├── merchDrops.*      # Scheduled merch/content drop alerts
├── games.*           # Engagement games (spin wheel, trivia, scratch & win)
├── socialPosts.*     # Social media post aggregation
├── pushNotifications.* # Push notification settings
├── family.*          # Household accounts, add/remove children, child metrics/attendance
├── waitlist.*        # Capacity waitlists, auto-notify, admin enrollment
├── referrals.*       # Referral codes, invite by email, conversion tracking
├── scheduleTemplates.* # Recurring weekly schedule templates, auto-generate sessions
├── onboarding.*      # 4-step guided first-login flow (role → sport → goals → complete)
├── progressReports.* # AI-generated weekly athlete progress reports (LLM via Gemini)
├── milestones.*      # Personal record detection, celebration cards, feed integration
├── visionCapture.*   # AI-powered metric extraction from voice/photo (admin-only)
└── governance.*      # Strix governance dashboard (stats, evidence trail, capability registry)
```

Procedures use three auth levels (all defined in `server/_core/trpc.ts`):
- `publicProcedure` — No auth required (public mutations have in-memory rate limiting)
- `protectedProcedure` — Requires authenticated user
- `adminProcedure` — Requires admin role (checked via `CLERK_ADMIN_EMAIL` or `OWNER_OPEN_ID`)

### Build Commands (from repo root)

```bash
pnpm install          # Install all dependencies
pnpm build            # Runs 3 steps in sequence:
                      #   1. vite build          → dist/public/ (SPA)
                      #   2. esbuild server      → dist/index.js (full server)
                      #   3. esbuild serverless  → dist/serverless.js + dist/serverless-stripe.js
pnpm dev              # tsx watch server/_core/index.ts (serves SPA + API)
pnpm check            # tsc --noEmit
pnpm test             # vitest run
pnpm test:e2e         # playwright (e2e/ directory)
```

### Important Portal Files

| File | Lines | Purpose |
|------|-------|---------|
| `server/routers.ts` | ~4,067 | All tRPC routes (programs, shop, admin, chat, metrics, games, family, waitlist, referrals, milestones, visionCapture, etc.) |
| `server/db.ts` | ~3,371 | Drizzle connection + all DB query functions |
| `drizzle/schema.ts` | ~1,313 | Full database schema (57 tables) |
| `server/chat-sse.ts` | ~416 | SSE real-time chat system |
| `server/_core/index.ts` | ~218 | Express app setup + middleware + Vite dev integration |
| `client/src/App.tsx` | ~222 | wouter SPA routing (~40+ routes, all lazy-loaded) |
| `client/src/main.tsx` | ~212 | React entry: providers, auth, service worker, analytics |
| `client/src/index.css` | — | Portal theme (oklch colors) |
| `client/src/contexts/ClerkStateContext.tsx` | — | Clerk auth state wrapper with fallback provider |

### Admin Manager Components

The admin dashboard (`client/src/pages/AdminDashboard.tsx`) uses a grouped sidebar navigation with 19 manager panels in `client/src/components/admin/managers/`:

| Group | Managers |
|-------|---------|
| **Operations** | Schedules, Attendance, Locations |
| **People** | Members, Coaches, Contacts |
| **Content** | Announcements, Blog, Videos, Gallery, Social, Content Queue |
| **Programs & Athletes** | Programs, Quick Capture (Vision), Metrics, Showcases |
| **Engagement** | Merch Drops |
| **Platform** | Governance |

Desktop: persistent sidebar. Mobile: Sheet overlay.

### Client Routing

The portal uses **wouter** for client-side routing with lazy-loaded pages:
- Root `/` redirects to `/member` (auth wall)
- ~45+ routes including: `/admin`, `/coach-dashboard`, `/chat`, `/shop`, `/programs`, `/blog`, `/blog/:slug`, `/gallery`, `/videos`, `/orders`, `/about`, `/contact`, `/faqs`, `/schedule`, `/signup`, `/family`, `/onboarding`, `/referrals`
- All pages wrapped in `Suspense` + `ErrorBoundary`
- `ThemeProvider` + `TooltipProvider` at root

### Structured Data Drift Warning

Testimonials currently exist in **both**:
- `academy-marketing/lib/config.ts` (auto-generates structured data)
- `client/src/components/StructuredData.tsx` (hardcoded)

These can drift. Update both when testimonials change.

---

## App 3 — Mobile App (`academy-app/`)

### Stack

- **Framework**: React Native 0.81 + Expo 54 (New Architecture enabled)
- **Routing**: Expo Router (file-based, stack navigation)
- **Auth**: `@clerk/clerk-expo` with token cache
- **API**: tRPC client connecting to the portal backend
- **Real-time**: Ably (managed service)
- **Push**: `expo-notifications` + APNs
- **Analytics**: PostHog
- **Package Manager**: npm

### Identifiers

- **Bundle ID**: `com.academytn.app`
- **Scheme**: `academy`
- **Platforms**: iOS, Android (iPad disabled)

### Mobile App Architecture

The root layout (`app/_layout.tsx`) sets up:
1. **Clerk authentication** with secure token cache
2. **AuthGuard** — redirects unauthenticated users to `/(auth)/sign-in`, redirects authenticated users away from auth screens
3. **PushRegistration** — registers Expo push tokens on login
4. **NotificationHandler** — handles push notification deep links (chat, DM)
5. **PostHog analytics** — telemetry for all user actions
6. **IdentitySync** — syncs Clerk user identity to PostHog

### Current Version

- **Version**: 1.8.3 / **Build**: 36 (iOS + Android synchronized)

### Key Features

- Dashboard with quick stats, upcoming sessions, Media quick action, and athlete progress card
- Calendar sync via `expo-calendar` (session reminders with 1hr + 15min alarms)
- Unified Media Feed tab (videos + gallery photos, category filtering, pagination)
- In-app program enrollment (Stripe checkout via expo-web-browser)
- Attendance tracking with stats
- All 4 chat rooms (General, Coaches, Parents, Announcements) + DMs
- DM conversations with 10-second polling and cache invalidation for reliability
- Chat image and video upload (camera + library, 5MB images / 50MB video 60s max)
- Merchandise shop
- Profile editing: name (via Clerk `user.update()`) and picture (via Clerk `user.setProfileImage()` with base64 from expo-file-system) — no backend deployment required
- Coach contact cards (API-driven, not hardcoded)
- Push notification preferences
- Payment history
- Athlete Metrics — admin-recorded performance data (vertical jump, speed, agility, 12 presets + custom), trend visualization
- Athlete Showcase — weekly spotlight with achievements, stats, sport badges
- Games Hub — Gold Rush, Academy Trivia, Scratch & Win (daily limits, points, streaks, leaderboard). Tab currently hidden pending optimization.
- Social Gallery — aggregated social media posts (Instagram, TikTok, Twitter, Facebook, YouTube)
- Merch Drops — scheduled drop alerts with countdown timers
- Governance dashboard — admin-only view of governance stats, capability registry, and evidence trail (via `/admin-governance` stack screen)

### Local Development

```bash
cd academy-app
npm install
npx expo start
```

### Production Builds

```bash
eas build --platform ios
eas build --platform android
eas submit --platform ios
eas submit --platform android
```

### Key Files

| File | Purpose |
|------|---------|
| `app.json` | Expo config: name, slug, icon, splash, bundle ID, plugins |
| `eas.json` | Build profiles: development, preview, production (with EAS Update channels) |
| `app/_layout.tsx` | Root layout: auth + push + analytics + notification handling |
| `app/(tabs)/_layout.tsx` | Tab config: 5 visible tabs (Dashboard, Chat, Media, Programs, Profile), 3 hidden (games, messages, schedule) |
| `lib/theme.ts` | Centralized design tokens: colors, spacing, radius, shadows, typography |
| `assets/` | App icon (`icon.png`), splash screen (`splash-icon.png`), adaptive icon, Bebas Neue font |

### Release Checklist

1. Increment `version` and `buildNumber` in `app.json`
2. Confirm icons/splash render correctly
3. Confirm push notification credentials are valid
4. Run smoke test: login → core navigation → notifications opt-in
5. Rebuild with EAS after any asset changes (icons won't update in existing binary)
6. Complete QA checklist in `ops/40_RELEASES/CHECKLIST_QA.md`

---

## Styling Systems (Do NOT Mix)

### Marketing — Athletic / Bold
- **Fonts**: Oswald (display, uppercase), Source Sans 3 (body)
- **Colors**: Gold `#d4a843`, Black `#0a0a0a`, White `#fafafa`
- **Classes**: `.btn-primary`, `.btn-secondary`, `.section-dark`, `.section-light`
- **Properties**: `--color-brand-gold`, `--color-brand-dark`, `--color-brand-orange`

### Portal — Clean SaaS
- **Fonts**: Inter (body), Bebas Neue + DM Sans (display)
- **Colors**: Championship gold `#C9A24D` (oklch), warm whites, deep charcoal
- **System**: shadcn/ui "new-york" style with CSS variables
- **Animation**: Framer Motion

### Mobile — Native
- React Native StyleSheet + centralized theme (`academy-app/lib/theme.ts`)
- Academy Gold `#CFB87C`, Navy `#1a1a2e` (full token system: colors, spacing, radius, shadows, typography)
- Bebas Neue (display) + system fonts (body) via `expo-font`
- Ionicons via `@expo/vector-icons`
- Reusable components (15): AnimatedCard, AnimatedCounter, ChatInput, EmptyState, ErrorBoundary, FilterChips, GradientCard, ImageViewer, Loading, MessageBubble, PressableScale, Screen, SectionHeader, Skeleton, TypingIndicator
- Minimum 44px tap targets

Each app has its own design language. They should never be mixed.

---

## Tech Stack Summary

| Layer | Marketing Site | Member Portal | Mobile App |
|-------|---------------|---------------|------------|
| **Frontend** | Next.js 15 App Router | React 19 SPA (Vite 7) | React Native (Expo 54) |
| **Routing** | Next.js file-based | wouter (client-side) | Expo Router (file-based) |
| **Styling** | Tailwind v4, Oswald | Tailwind v4, shadcn/ui, Inter | RN StyleSheet |
| **API** | — | tRPC v11 + Express | tRPC client → portal |
| **Auth** | — | Clerk (+ OAuth fallback) | Clerk Expo |
| **Database** | — | PostgreSQL (Neon) via Drizzle | — (uses portal API) |
| **Payments** | — | Stripe | — (via portal API + expo-web-browser) |
| **Email** | — | Resend | — |
| **Real-time** | — | SSE + Socket.IO (opt-in) | Ably |
| **Push** | — | Web Push (VAPID) | expo-notifications + APNs |
| **Analytics** | — | Umami | PostHog |
| **Storage** | — | AWS S3 / Forge CDN | — |
| **AI/LLM** | — | LLM, image gen, voice transcription | — |
| **Icons** | lucide-react | lucide-react | @expo/vector-icons (Ionicons) |
| **Package Manager** | npm | pnpm 10.4.1 | npm |

### Key Dependency Versions

- React 19.2.1 / React Native 0.81.5
- Express 4.21.2
- tRPC 11.6.0
- Drizzle ORM 0.44.5
- Vite 7.1.7
- Stripe 20.2.0
- Tailwind CSS 4.1.14

---

## Ops System (`ops/`)

The `ops/` directory is a structured project management system for multi-agent coordination. It is NOT application code — it is the coordination layer.

### Read Order for Agents

1. `ops/00_READ_FIRST/VISION.md` — Mission and north star
2. `ops/00_READ_FIRST/RULES.md` — Operating rules (non-negotiable)
3. `ops/00_READ_FIRST/QUALITY_BAR.md` — What "ship-ready" means
4. `ops/00_READ_FIRST/DEFINITIONS.md` — Shared vocabulary and ticket states
5. `ops/10_BACKLOG/NOW.md` — Active tickets
6. Your workstream file in `ops/20_WORKSTREAMS/`
7. `ops/50_REPORTS/STATUS.md` — Cross-cutting issues and blockers

### Ticket ID Prefixes

| Prefix | Workstream |
|--------|-----------|
| `MOB-` | Mobile App (`academy-app/`) |
| `WEB-` | Web Portal (`client/` + `server/`) |
| `MKT-` | Marketing Site (`academy-marketing/`) |
| `SEO-` | SEO work on marketing site |
| `RES-` | Research / Competitive Intelligence |
| `REL-` | Release / QA |
| `OPS-` | Ops system itself |

### Directory Ownership

| Agent | Owns | Cannot Touch |
|-------|------|-------------|
| Mobile Agent | `academy-app/**` | `client/`, `server/`, `academy-marketing/` |
| Portal Agent | `client/**`, `server/**`, `shared/**`, `drizzle/**`, `api/**`, `e2e/` | `academy-marketing/`, `academy-app/` |
| Marketing/SEO Agent | `academy-marketing/**` | `client/`, `server/`, `academy-app/` |
| Competitor Intel Agent | Research only (reports) | All application code |
| QA/Release Agent | `ops/40_RELEASES/**`, `ops/50_REPORTS/` | No code changes (read-only) |

---

## Deployment

### Marketing Site
- **Platform**: Vercel
- **Config**: `academy-marketing/vercel.json` → `{ "framework": "nextjs" }`
- **Trigger**: Auto-deploy on push

### Member Portal
- **Platform**: Vercel
- **Config**: Root `vercel.json` with custom rewrites
  - `/api/trpc/*` → serverless tRPC handler
  - `/api/chat/*` → serverless chat handler
  - `/api/stripe/*` → isolated Stripe webhook
  - `/api/cron/*` → 9 scheduled cron functions (CRON_SECRET auth)
  - `/*` → `index.html` (SPA fallback)
- **Security headers**: HSTS (2yr), CSP, X-Frame-Options, X-Content-Type-Options
- **CORS**: Restricted to `https://app.academytn.com` (GET, POST, OPTIONS only)
- **Caching**: `/assets/*` immutable with 1yr max-age
- **Health check**: `GET /api/health`
- **Trigger**: Auto-deploy on push

### Mobile App
- **Platform**: EAS Cloud Build → App Store Connect / Google Play
- **Build profiles**: `development` (internal), `preview` (internal), `production`
- **OTA updates**: EAS Update channels configured per build profile
- **Trigger**: Manual (`eas build` + `eas submit`)

**CI/CD**: GitHub Actions pipeline (`.github/workflows/ci.yml`) runs on push/PR with 3 jobs: portal (install, typecheck, test, build), marketing (install, build, validate), mobile (install, typecheck). Deployment is Vercel auto-deploy on push for web apps, manual EAS for mobile.

---

## Environment Variables

See `.env.example` for the full list. Key groups:

- **Database**: `DATABASE_URL` (Neon PostgreSQL)
- **Auth**: `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` (also accepts `CLERK_*`, `NEXT_PUBLIC_CLERK_*` prefixes)
- **Payments**: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Email**: `RESEND_API_KEY`
- **Storage**: `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY`
- **Real-time**: Ably API keys (optional, for mobile real-time)
- **Push**: VAPID keys (for Web Push notifications)
- **AI**: LLM API keys (for AI-powered features)
- **Admin**: `ADMIN_NOTIFY_EMAILS` (comma-separated admin notification recipients)
- **Error Monitoring**: `SENTRY_DSN` (optional, activates Sentry error tracking)
- **Automation**: `CRON_SECRET` (shared secret for Vercel Cron Job auth)
- **Governance**: `STRIX_GOVERNANCE_ENABLED` (feature flag, default false), `STRIX_API_KEY`, `STRIX_TENANT_ID`, `STRIX_API_URL` (defaults to `https://api.strix.dev/v1`)

- **Analytics**: `VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID` (Umami)
- **Socket.IO**: `ENABLE_SOCKET_IO` (toggle, disabled by default)
- **Server**: `SITE_URL` (server-side URL fallback)
- **Testing**: `E2E_BASE_URL` (defaults to `http://localhost:5173`)

The marketing site now has its own `academy-marketing/.env.example` with:
- `PLATFORM_API_URL` (portal backend proxy)
- `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL` (lead notifications)
- `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_META_PIXEL_ID` (analytics)

The mobile app uses Expo config + push notification credentials (managed via EAS).

---

## Development & Testing Workflow

### Portal (from repo root)
```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (Express + Vite HMR)
pnpm check            # TypeScript check
pnpm test             # Vitest unit tests (server/*.test.ts)
pnpm test:e2e         # Playwright E2E tests (e2e/)
pnpm build            # Full production build
```

### Marketing Site
```bash
cd academy-marketing
npm install
npm run dev           # Next.js dev server
npm run build         # Production build
npm run validate      # Post-build validation (45+ checks)
npm test              # Playwright E2E tests
```

### Mobile App
```bash
cd academy-app
npm install
npx expo start        # Dev server with Expo Go
```

### Pre-Push Checklist
1. Identify which app(s) your changes affect
2. Run the build for affected app(s)
3. Run tests for affected app(s)
4. If server API routes changed, check mobile app impact

---

## Common Pitfalls for Agents

1. **Wrong app!** The live site at `academytn.com` is `academy-marketing/`, NOT `client/`. If you change `client/src/pages/Home.tsx` thinking it affects the public site, it won't — that only affects `app.academytn.com`.

2. **Wrong package manager.** Root uses `pnpm`. Marketing and mobile use `npm`. Don't mix them.

3. **Typecheck false alarms.** Running `tsc --noEmit` in `academy-marketing/` from the monorepo context shows module resolution errors. These don't affect builds.

4. **Config is the source of truth.** Business data (programs, prices, testimonials, coaches) lives in `academy-marketing/lib/config.ts`. Pages read from it. Change config, not individual pages.

5. **Structured data lives in two places.** Both `academy-marketing/lib/structured-data.tsx` (reads from config automatically) AND `client/src/components/StructuredData.tsx` (hardcoded) contain Schema.org review data. Update both when testimonials change.

6. **No workspace linking.** `shared/` is imported by `client/` and `server/` via tsconfig path aliases (`@shared`), but `academy-marketing/` and `academy-app/` have zero access to it.

7. **Serverless builds are separate.** The esbuild step produces `dist/serverless.js` (main API) and `dist/serverless-stripe.js` (Stripe webhook). The `api/` directory contains thin wrappers that import these bundles.

8. **Mobile build numbers.** Always increment `version` and `buildNumber` in `academy-app/app.json` before submitting to App Store / Google Play. Icons won't update without a full EAS rebuild.

9. **REST endpoints exist alongside tRPC.** `performance-lab-apply.ts` and `skills-lab-register.ts` are REST handlers, NOT tRPC routes. Don't look for them in `routers.ts`.

10. **API route changes affect mobile.** The mobile app consumes the same tRPC backend. Changing a route signature without coordination breaks the mobile app in production.

11. **Three real-time systems.** SSE (web primary), Socket.IO (web optional), Ably (mobile). They serve different clients — don't consolidate without understanding the architecture.

12. **Root-level markdown clutter.** Many `.md` files at the repo root are one-off documents (blog drafts, audit reports, setup guides). The canonical project management system is in `ops/`.

---

## Architecture Principles

1. Marketing is content-first and config-driven.
2. Portal is type-safe and API-centric (tRPC end-to-end).
3. Stripe webhook is an isolated security boundary.
4. Mobile is an independent release train.
5. No API contract drift — types flow from schema to client.
6. Deployments must remain independent.
7. Auth degrades gracefully when Clerk is not configured.
8. Every screen needs three states: loading, error, empty.
9. Telemetry on every user-facing feature (PostHog for mobile, Umami for web).
10. No drive-by refactors — every change traces to a ticket.

---

## Platform Audit & Fixes Applied

A comprehensive audit is documented in `docs/FULL_PLATFORM_AUDIT.md`. All 8 high-priority and 11 medium-priority issues have been fixed (commit `3b42b3e`):

**Security fixes applied:**
- HTML injection in lead email templates — escaped
- `updateBookingStatus` restricted to `adminProcedure`; `getCoachBookings` scoped to own user
- Rate limiting on `leads.submit` and `submitPrivateSessionBooking` (in-memory, 5 per 15min window)
- `.max()` length limits on all lead/contact string inputs
- LIKE wildcard escaping in DM search queries
- `innerHTML` replaced with `textContent` in SignUp.tsx debug overlay

**Architecture fixes applied:**
- Duplicate `adminProcedure` removed from `routers.ts` — now imported from `_core/trpc.ts`
- `console.error` replaced with `logger.error` throughout `routers.ts`
- `logout` changed from `publicProcedure` to `protectedProcedure`
- Hardcoded admin emails moved to `ADMIN_NOTIFY_EMAILS` env var
- DM `getAvailableUsers` now throws `TRPCError` instead of swallowing errors

**Mobile fixes applied:**
- Ably lifecycle fixed: DM screens no longer destroy the global Ably singleton on unmount (was breaking chat tab + other DMs)
- Auth guard race condition fixed (login screen shake — commit `a2a2285`)
- Backend-only devDependencies removed from `academy-app/package.json`
- `package.json` version synced to 1.4.0 (matches `app.json`)
- Missing `EXPO_PUBLIC_API_URL` surfaced as Alert in dev mode

**Stripe webhook expanded:**
- `charge.refunded` handler added (logs refund, can trigger notifications)
- `invoice.payment_failed` handler added (logs failure for follow-up)

**Recent feature additions (post-audit):**
- **Profile editing** — Mobile uses Clerk SDK directly (`user.update()` for name, `user.setProfileImage()` for picture via base64). Backend `auth.updateProfile` tRPC route and `profilePictureUrl` schema column also exist for web portal use. Dependency: `expo-file-system@~19.x` (imported from `expo-file-system/legacy` for SDK 54 compatibility).
- **DM reliability** — Fixed messages disappearing on re-entry by switching from `refetch()` to `utils.dm.getMessages.invalidate()` (persists across component unmounts). Conversation list polls every 10 seconds. Clerk auto-syncs missing user names to fix 'Unknown' display.
- **DM performance** (commit `c30a4ff`) — Replaced `getUserConversations()` (N+1 queries) with lightweight `isConversationParticipant()` (single query) for auth checks in `getMessages` and `sendMessage`. Ably `publishDmMessage` now fire-and-forget (DB write returns immediately, real-time delivery non-blocking). Mobile no longer destroys global Ably singleton on DM screen unmount. User-facing Alert on send failure.
- **Media Feed** (v1.5.0) — New `feed.list` tRPC endpoint merges published videos + visible gallery photos into a single date-sorted, paginated feed with category filtering (all/training/highlights). New Media tab in mobile bottom navigation with card-based scrollable feed, platform badges, video play overlay, category filter chips, skeleton loading, error state with retry, and empty states. Media quick action added to dashboard.
- **New Architecture enabled** — `newArchEnabled: true` in `app.json` + `expo-build-properties` plugin to propagate `RCT_NEW_ARCH_ENABLED=1` during EAS pod install. Reanimated pinned to `3.19.5` (bundles its own worklets runtime — no separate `react-native-worklets` dependency needed). `expo-file-system` pinned to `~19.x` with `expo-file-system/legacy` import path for SDK 54 compatibility.
- **v1.6 features** (6 new features, 7 new DB tables, 40+ tRPC routes, migration 0013):
  - **Athlete Metrics** — Admin records vertical jump, speed, agility (12 presets + custom). Trend visualization with mini bar charts. Auth-scoped: only athlete or admin can read.
  - **Athlete Showcase** — Weekly spotlight on dashboard. Full showcase page with hero section, achievements, sport badges.
  - **Games Hub** (new tab) — Gold Rush (3/day), Academy Trivia (5 rounds/day), Scratch & Win (3/day). Atomic game entry limits, points system with atomic SQL increments, streaks, leaderboard with user JOINs. Trivia answer deduplication prevents point farming.
  - **Social Gallery** — Browse social media posts from 5 platforms, filterable, 2-column grid.
  - **Merch Drops** — Scheduled drop alerts with countdown timers, admin creation, send-now capability.
  - **Video in Chat/DMs** — Video recording + library selection (60s max, 50MB limit), upload with progress tracking.
- **Security hardening** (commit `f8ef06c`) — Removed unused mysql2/AWS SDK dependencies, added `.max()` limits on DM search/block reason, stopped leaking internal errors in Stripe webhook responses, removed hardcoded admin email fallbacks, replaced `console.error` with `logger.error` across server modules, added try-catch around localStorage for private browsing compatibility.
- **TestFlight fixes** (v1.6.1) — Added Stack screens for Shop/Payments with back button navigation, fixed chat room history to use chat token (not Clerk JWT), disabled Vercel body parser in API entry points for multer multipart compatibility, added `/api/chat/upload-image` endpoint to serverless.ts (was only in dev server).
- **P0/P1 review fixes** (build 26, migration 0014) — Fixed dashboard crash (showcases query ordering), added `.catch()` on `Linking.openURL` in social gallery, added `.max()` limits on socialPosts input fields, replaced push subscription read-then-write with atomic `ON CONFLICT` upsert + unique index on `(userId, deviceId)`, increased spin button tap target to 56px, disabled spin button when no spins remaining.
- **v1.7 platform hardening** (build 27) — 12 targeted fixes: rate limiter periodic cleanup (unbounded memory), DM error masking, Ably/push error logging, multer error sanitization, `Linking.openURL` crash guards, debounce timer leak fix, push notification deep link param validation, SMS link URL encoding. New shared theme system (`academy-app/lib/theme.ts`) with centralized color/spacing/typography tokens. 7 new reusable components (AnimatedCard, AnimatedCounter, GradientCard, PressableScale, FilterChips, SectionHeader, EmptyState). Bebas Neue font added via `expo-font`.
- **Admin content management** — Three new admin manager panels in web portal: SocialPostsManager (CRUD, platform filtering, visibility toggle, arrow-based reordering), MerchDropsManager (create/schedule drops, send notifications, countdown timers, status filtering, engagement tracking with view/click counts), MetricsManager (record athlete metrics with 12 preset templates, category/athlete filtering, trend visualization bar charts with improvement calculations). ShowcasesManager added for athlete spotlight CRUD (sport selection, achievements, stats, featured dates). All managers have inline edit dialogs. Backend update routes added for merch drops and social posts. Migration 0015 adds socialPosts.sortOrder and merchDrops view/click counts. AdminDashboard restructured: portal uses grouped sidebar navigation (Operations, People, Content, Programs) with desktop persistent sidebar and mobile Sheet overlay; mobile has dedicated admin hub screen with quick stats, organized sections, and sub-screens for Members, Contacts, Announcements, Schedules.
- **Post-review hardening** — Replaced mock toast (console.log/alert) with sonner in all 4 new admin managers. Fixed social posts reorder bug (now uses post ID instead of filtered-list index). Added error states with retry buttons to all mobile admin screens. Logout no longer re-throws on backend 500. Field whitelisting on `updateMerchDrop` and `updateSocialPost` prevents accidental overwrites of createdBy/createdAt/counters. Sign-up button disabled when password < 8 chars. Mobile admin mutations have onError handlers.
- **Strategic audit implementation** (migration 0016, 12 features) — Family/household accounts with parent dashboard page (`/family`) viewing child metrics/attendance/schedules. Waitlist & capacity management with auto-notify when spots open. Onboarding flow (`/onboarding`) — 4-step guided first-login (role → sport → goals → complete). Automated billing & dunning via Stripe webhook (`invoice.payment_failed` triggers email + reminder record). Referral program (`/referrals`) — invite by email, referral codes, 100-point rewards, conversion tracking. RBAC with 7 roles (owner, admin, head_coach, assistant_coach, front_desk, parent, athlete) — `extendedRole` column on users table. Recurring schedule templates — admin creates weekly templates, auto-generates sessions. AI weekly progress reports — LLM-generated via Gemini, emailed to parents. Sibling/family discounts — auto 10%/15% based on enrolled children count. CI/CD pipeline (`.github/workflows/ci.yml`) with 3 jobs (portal build+test, marketing build+validate, mobile typecheck). Sentry error monitoring (`server/_core/sentry.ts`) — optional activation via `SENTRY_DSN` env var, integrated into Express error handler. All changes purely additive — no existing routes or signatures modified.
- **v1.7.1 enhancements** (build 29) — Marketing: App Store/Google Play download badges on homepage hero, footer, and dedicated "Get the App" section; Performance Lab cohort urgency messaging with pulsing enrollment badges. Mobile: app name updated for ASO ("The Academy - Youth Sports"); calendar sync via `expo-calendar` with 1hr + 15min reminder alarms on schedule screen; athlete progress card on dashboard showing recent metrics. Server: feed query optimized to raw SQL `UNION ALL` for better performance.
- **v1.8.0 automation + AI content engine** (migration 0019, 6 new tables) — 9 Vercel Cron Jobs: nurture campaigns, auto-generate sessions from templates, session reminders, merch drop notifications, metrics prompts, bi-weekly AI progress reports, reengagement campaigns, parent weekly digests, post-session AI content generation. AI content engine uses Gemini 2.5 Flash to auto-generate session recaps, social captions, and parent push notifications. Content queue admin manager with approve/reject/edit workflow. Feed extended with session recap type. `api/cron/` entry points with `CRON_SECRET` auth. `server/cron/` orchestration functions with unit tests. Dedup indexes prevent notification spam.
- **Milestone celebration engine** — Direction-aware personal record detection in `metrics.record` mutation. Celebration pipeline: milestone DB record → SVG→PNG card generation (via `sharp`) → parent push notification → feed post. New `milestones` tRPC router and `milestones` table (migration 0019 extended). MetricsManager confetti dialog on PR detection. Feed `UNION ALL` extended with milestone type.
- **Strix governance integration (v4 → embedded kernel)** — Feature-flagged governance layer wrapping all 75 admin tRPC mutations and 16 cron jobs + 13 AI agent actions (104 total capabilities). Risk classification: 12 critical, 37 high, 49 medium, 6 low. `governedProcedure()` replaces `adminProcedure` in `routers.ts`. Upgraded from SDK-only to embedded kernel: local evidence persistence to `governance_evidence` table (PostgreSQL/Neon) for every governed action regardless of Strix SDK availability. Local policy evaluation with risk-based rules (critical → owner-only deny, high → soft escalate, medium/low → allow). SHA-256 evidence hashing for tamper detection. When `STRIX_GOVERNANCE_ENABLED=true` AND Strix SDK configured, also consults external SDK for policy decisions with external decision IDs recorded locally. Fail-open on SDK errors, fail-closed on deny. New schema: `governance_evidence` table (migration), `insertGovernanceEvidence()` in db.ts, `getCapability()` in strix-capabilities.ts. New files: `server/_core/strix.ts` (SDK client), `server/_core/strix-capabilities.ts` (104 capability definitions + lookup), `server/_core/governed-procedure.ts` (embedded kernel middleware), `server/governance-router.ts` (admin API). Admin GovernanceManager panel with stats dashboard, capability registry browser, and evidence trail viewer. Cutover checklist in `docs/STRIX_GOVERNANCE_CUTOVER.md`. Admin sidebar restructured with new "Platform" group. Zero governance bypasses: 0 raw `adminProcedure.mutation` calls remain.
- **v1.8.1 App Store compliance** (build 32) — iOS permission purpose strings added to `infoPlist` for camera, photo library, calendar, and microphone (App Store review guideline 5.1.1). `expo-image-picker` and `expo-calendar` plugin configurations added with descriptive permission strings. Build number incremented to 32 (iOS + Android).
- **Governance panel fix** — Fixed GovernanceManager importing from non-existent `@/_core/trpc-client` (corrected to `@/lib/trpc` matching all other admin managers). Fixed TypeScript errors in `governance-router.ts` where `.optional()` on the `evidenceTrail` input schema caused property access on `{}` type — removed outer `.optional()` since all fields already have individual defaults.
- **AI Vision Capture** (v1.8.2–v1.8.3, build 35, migration 0020) — Admin tool for AI-powered metric extraction from voice memos and photos during training sessions. New `visionCapture` tRPC router with 3 admin procedures: `extract` (sends media to AI for athlete/metric extraction), `confirm` (creates athleteMetrics records with PR detection + milestone celebration), `listRecent` (paginated capture history). New `visionCaptures` table tracks capture lifecycle (processing → ready → confirmed/failed) with extraction JSON, athlete/metric counts, processing time, and AI observations. Admin "Quick Capture" panel added to "Programs & Athletes" group in AdminDashboard. Supports image (jpeg/png/webp) and audio (mp4/wav/mpeg/webm/m4a) media types. Confidence-colored metric review UI with bulk confirm.
- **Gallery video support** (migration 0023) — Added `mediaType` column (varchar(20), default 'image') to `galleryPhotos` table, enabling video content alongside photos in the gallery.
- **Performance indexes** (migration 0022) — 14 database indexes added across high-query tables: chatMessages, dmMessages, attendanceRecords, athleteMetrics, sessionRegistrations, notificationLogs, leads, pushSubscriptions, gameEntries. Improves query performance for paginated lookups and user-scoped data retrieval.
- **Mobile governance screen** (build 36) — New `admin-governance.tsx` stack screen accessible from the mobile admin hub. Displays governance stats (total decisions, allow/deny/escalate counts), searchable capability registry with risk-level badges, and evidence trail with action/decision visualization. AI actions distinguished with sparkle badges. Uses raw SQL queries in `governance-router.ts` to bypass Drizzle schema dependencies for the `governance_evidence` table. Linked from admin hub under "Platform" section.
- **Governance resilience hardening** — Strix SDK client (`strix.ts`) upgraded with circuit breaker pattern (5 consecutive failures → 5-minute cooldown, half-open recovery) and 3-second `AbortController` fetch timeout. `governed-procedure.ts` checks `isStrixCircuitOpen()` before attempting SDK calls, eliminating log spam during outages. OAuth service (`sdk.ts`) now logs status only once per cold start to reduce noise when Clerk is primary auth.
- **AI governance layer** — 13 AI agent capabilities registered in `strix-capabilities.ts` across the `ai` domain: `ai.generateNotification`, `ai.sendBulkNotifications` (critical), `ai.publishContent` (high), `ai.classifyMedia`, `ai.generateShowcase`, `ai.generateAnnouncement`, `ai.generateBlogPost`, `ai.generateFeedContent`, plus 5 pre-registered for future wiring: `ai.generateSessionRecap`, `ai.generateSocialCaption`, `ai.generateProgressInsight`, `ai.personalizeRecommendation`, `ai.flagMetricAnomaly`. All AI actions use actor `system:ai` with role `ai_agent` and source `ai` for evidence recording.
- **Autonomous AI content engine** (7 cron jobs) — `ai-smart-notifications` (daily 10 PM CT): detects 5 behavior signals (streaks, gaps, improvements, upcoming sessions, new members), generates personalized push via LLM, 24h dedup. `ai-gallery-capture` (daily 9 PM CT): scans chat images, AI classifies gallery-worthiness, auto-publishes approved photos. `ai-showcase-generator` (weekly Monday 7 PM CT): scores athletes on attendance (40%), PRs (35%), game points (25%), AI generates spotlight content, 21-day cooldown. `ai-content-autopublish` (daily 9 AM CT): auto-approves AI-generated content_queue drafts aged 24h+ — never auto-approves human content. `ai-announcement-drafter` (daily 8 AM CT): detects platform events (new programs, milestones, membership milestones), drafts announcements for admin review. `ai-blog-generator` (weekly Saturday 10 AM CT): generates blog from training data, rotates 4 topic types, always unpublished draft. `ai-feed-engagement` (twice daily 7 AM/3 PM CT): detects 8h feed gaps, generates training tips/motivation, skips when organic content active (≥2 items in 8h). All 7 crons governed via `evaluateCronGovernance()` + per-action `recordAIEvidence()`. 7 new `api/cron/ai-*.ts` Vercel entry points. 16 total cron schedules in `vercel.json`.
- **Governance test suite** — 103 assertions across 6 test files: `strix-capabilities.test.ts` (23 tests: registry integrity, risk distribution, unique IDs), `structural-invariants.test.ts` (11 tests: zero governance bypasses, cron coverage), `governed-procedure.test.ts` (35 tests: middleware behavior), `strix.test.ts` (14 tests: SDK client), `governance-router.test.ts` (4 tests: API endpoints), `cron.test.ts` (16 tests: all 16 cron jobs export `run()`). All passing.

---

## Known Improvement Opportunities (Not Yet Implemented)

- **Router/DB monolith split** — `server/routers.ts` (~4,067 lines) and `server/db.ts` (~3,371 lines) could be split into domain modules
- **Structured data consolidation** — Single canonical testimonials source instead of two
- **Observability gaps** — Sentry is wired but no request log correlation IDs yet
- **Service layer** — Business logic is mixed into tRPC procedures; no dedicated service layer
- **Caching** — Every request hits the database; no caching layer (Redis planned Q3 2026)
- **API versioning** — All routes in single appRouter; no versioning strategy
- **Offline mobile support** — No offline capability in the native app
- **Accessibility audit** — No WCAG compliance testing or a11y tooling configured
- **5 orphaned AI capabilities** — `ai.generateSessionRecap`, `ai.generateSocialCaption`, `ai.generateProgressInsight`, `ai.personalizeRecommendation`, `ai.flagMetricAnomaly` are registered in the capability registry but not yet wired to any cron job or mutation code

---

## Git

- **Default branch**: `main` (on origin)
- **Development branch pattern**: `claude/<feature>-<session-id>`
- **PR template**: `.github/PULL_REQUEST_TEMPLATE.md`

---

## Rules AI Agents Must Follow

1. **Read the ops system first** if working on a ticketed task — start with `ops/00_READ_FIRST/VISION.md`.
2. **Identify which app** you are modifying before writing any code.
3. **Use the correct package manager** — pnpm for root, npm for marketing and mobile.
4. **Never change tRPC route signatures** without checking mobile app impact.
5. **Never hardcode business data** in marketing page components — use `config.ts`.
6. **Never mix styling systems** across apps.
7. **Run the build** for your app before declaring work complete.
8. **Update `ops/50_REPORTS/STATUS.md`** at session start and end if working within the ops system.
9. **Stay in your lane** — only modify files within your assigned directories per the ownership map.
10. **Every feature needs loading, error, and empty states** — no blank screens.

---

## Summary for Agents

This repo is a **marketing engine** + a **SaaS-style member platform** + a **native mobile application** for a youth athletic training facility. All three are production systems.

Before changing anything:

1. **Identify which app** you are modifying
2. **Confirm correct package manager** (pnpm for portal root, npm for marketing and mobile)
3. **Confirm correct deployment target**
4. **Run the build locally** before pushing
5. **Avoid cross-app assumptions** — they share no UI code
6. **Check the ops system** (`ops/10_BACKLOG/NOW.md`) for active work and ownership
