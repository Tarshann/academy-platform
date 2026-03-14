# Academy Platform — Agent Reference (v3)

> Single source of truth for any AI agent working in this repo.
> Read this completely before making changes.

---

## Mission & Business Context

**The Academy** is a youth athletic training facility in **Gallatin, Tennessee**. This platform is its digital ecosystem: a marketing site to attract families, a member portal for managing enrollment/payments/scheduling, and a native mobile app for daily member engagement.

**Problem domain**: Youth sports training businesses rely on fragmented tools (paper sign-ups, separate payment systems, generic scheduling apps). This platform unifies the entire member lifecycle — discovery → enrollment → payment → scheduling → communication — into one cohesive experience.

**Current release**: v1.4 (mobile app v1.4.0, build 21). Previous v1.3 delivered: in-app payments, attendance tracking, chat enhancements, push notifications.

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
│   ├── routers.ts           #   All tRPC routes (~2,200 lines)
│   ├── db.ts                #   Drizzle ORM connection + all DB functions (~1,900 lines)
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
│   ├── performance-lab-apply.ts  # REST endpoint: Performance Lab applications
│   ├── skills-lab-register.ts    # REST endpoint: Skills Lab registrations
│   └── *.test.ts            #   Vitest unit tests (co-located with source)
│
├── server/_core/            # Server infrastructure modules
│   ├── index.ts             #   Express app setup, middleware, Vite dev integration
│   ├── env.ts               #   Environment variable loading with fallbacks
│   ├── context.ts           #   tRPC context (req, res, user) + auth resolution
│   ├── trpc.ts              #   tRPC initialization + procedure definitions
│   ├── clerk.ts             #   Clerk JWT, user sync, admin role detection
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
│   ├── systemRouter.ts      #   System-level tRPC routes (health, version)
│   └── types/               #   TypeScript type definitions
│
├── academy-app/             # Mobile app (Expo + React Native)
│   ├── app/                 #   Expo Router file-based routes
│   │   ├── _layout.tsx      #   Root layout: Clerk + AuthGuard + PushRegistration + PostHog
│   │   ├── (tabs)/          #   Tab-based navigation (dashboard, chat, programs, profile)
│   │   └── (auth)/          #   Auth screens (sign-in, sign-up)
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
│   ├── schema.ts            #   Full PostgreSQL schema (30+ tables, enums, relations)
│   └── 0001-0012_*.sql      #   Sequential migrations (latest: Skills Lab dedup)
│
├── api/                     # Vercel serverless function entry points (thin wrappers)
│   ├── [...path].ts         #   → dist/serverless.js (tRPC + chat + registrations)
│   └── stripe/webhook.ts    #   → dist/serverless-stripe.js (Stripe webhooks)
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

### tRPC Router Structure

```
appRouter
├── system.*          # Health, version
├── auth.*            # Login, logout, session
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
└── pushNotifications.* # Push notification settings
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
| `server/routers.ts` | ~2,200 | All tRPC routes (programs, shop, admin, chat, etc.) |
| `server/db.ts` | ~1,900 | Drizzle connection + all DB query functions |
| `drizzle/schema.ts` | ~800 | Full database schema (30+ tables) |
| `server/chat-sse.ts` | ~365 | SSE real-time chat system |
| `server/_core/index.ts` | ~130 | Express app setup + middleware + Vite dev integration |
| `client/src/App.tsx` | ~210 | wouter SPA routing (~40+ routes, all lazy-loaded) |
| `client/src/main.tsx` | ~175 | React entry: providers, auth, service worker, analytics |
| `client/src/index.css` | — | Portal theme (oklch colors) |
| `client/src/contexts/ClerkStateContext.tsx` | — | Clerk auth state wrapper with fallback provider |

### Client Routing

The portal uses **wouter** for client-side routing with lazy-loaded pages:
- Root `/` redirects to `/member` (auth wall)
- ~40+ routes including: `/admin`, `/coach-dashboard`, `/chat`, `/shop`, `/programs`, `/blog`, `/blog/:slug`, `/gallery`, `/videos`, `/orders`, `/about`, `/contact`, `/faqs`, `/schedule`, `/signup`
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

- **Framework**: React Native 0.81 + Expo 54 (New Architecture disabled)
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

- **Version**: 1.4.0 / **Build**: 21 (iOS + Android synchronized)

### Key Features

- Dashboard with quick stats and upcoming sessions
- In-app program enrollment (Stripe checkout via expo-web-browser)
- Attendance tracking with stats
- All 4 chat rooms (General, Coaches, Parents, Announcements) + DMs
- Chat image upload (camera + library, 5MB limit)
- Merchandise shop
- Coach contact cards (API-driven, not hardcoded)
- Push notification preferences
- Payment history

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
| `assets/` | App icon (`icon.png`), splash screen (`splash-icon.png`), adaptive icon |

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
- React Native StyleSheet
- Academy Gold `#CFB87C`, Navy `#1a1a2e`
- System fonts (no custom fonts loaded)
- Ionicons via `@expo/vector-icons`
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

- React 19.2.1 / React Native 0.81
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

No CI/CD pipelines (GitHub Actions). Deployment is Vercel auto-deploy on push for web apps, manual EAS for mobile.

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
- Ably connection memory leak fixed (`closeAbly()` called on unmount)
- Auth guard race condition fixed (login screen shake — commit `a2a2285`)
- Backend-only devDependencies removed from `academy-app/package.json`
- `package.json` version synced to 1.4.0 (matches `app.json`)
- Missing `EXPO_PUBLIC_API_URL` surfaced as Alert in dev mode

**Stripe webhook expanded:**
- `charge.refunded` handler added (logs refund, can trigger notifications)
- `invoice.payment_failed` handler added (logs failure for follow-up)

---

## Known Improvement Opportunities (Not Yet Implemented)

- **CI/CD enforcement** — Quality gates exist but are manually run; no GitHub Actions blocking merges
- **Router/DB monolith split** — `server/routers.ts` (~2,200 lines) and `server/db.ts` (~1,900 lines) could be split into domain modules
- **Structured data consolidation** — Single canonical testimonials source instead of two
- **Observability** — No Sentry/error reporting or request log correlation IDs yet
- **Service layer** — Business logic is mixed into tRPC procedures; no dedicated service layer
- **Caching** — Every request hits the database; no caching layer
- **API versioning** — All routes in single appRouter; no versioning strategy

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
