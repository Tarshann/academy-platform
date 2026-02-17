# Academy Platform — Agent Reference (v2)

> Single source of truth for any AI agent working in this repo.
> Read this completely before making changes.

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
│       ├── lib/             #   Utilities (trpc client, utils)
│       └── index.css        #   Tailwind v4 theme (oklch colors, Inter font)
│
├── server/                  # Portal backend (Express + tRPC v11)
│   ├── _core/               #   Server infrastructure (index.ts, env.ts, context.ts, trpc.ts,
│   │                        #   clerk.ts, oauth.ts, checkout.ts, rateLimiter.ts, etc.)
│   ├── routers.ts           #   All tRPC routes (~2100 lines)
│   ├── db.ts                #   Drizzle ORM connection + all DB functions (~1900 lines)
│   ├── serverless.ts        #   Vercel serverless entry point
│   ├── serverless-stripe.ts #   Isolated Stripe webhook handler
│   ├── chat-sse.ts          #   SSE-based real-time chat
│   └── chat.ts              #   Socket.IO chat (optional)
│
├── academy-app/             # Mobile app (Expo + React Native)
│   ├── app/                 #   Expo Router file-based routes
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
├── drizzle/                 # Database schema (schema.ts) + SQL migrations
├── api/                     # Vercel serverless function entry points
│   ├── [...path].ts         #   → dist/serverless.js (tRPC + chat + registrations)
│   └── stripe/webhook.ts    #   → dist/serverless-stripe.js (Stripe webhooks)
├── dist/                    # Build output (compiled server + SPA)
├── e2e/                     # Playwright E2E tests for member portal
├── docs/                    # Strategy docs, ship-readiness checklists
└── patches/                 # pnpm patched dependencies (wouter)
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
| `server/routers.ts` | ~2,100 | All tRPC routes (programs, shop, admin, chat, etc.) |
| `server/db.ts` | ~1,900 | Drizzle connection + all DB query functions |
| `drizzle/schema.ts` | ~800 | Full database schema (30+ tables) |
| `server/chat-sse.ts` | ~365 | SSE real-time chat system |
| `client/src/index.css` | — | Portal theme (oklch colors) |
| `client/src/components/StructuredData.tsx` | — | Portal JSON-LD (hardcoded testimonials) |

### Structured Data Drift Warning

Testimonials currently exist in **both**:
- `academy-marketing/lib/config.ts` (auto-generates structured data)
- `client/src/components/StructuredData.tsx` (hardcoded)

These can drift. Update both when testimonials change.

---

## App 3 — Mobile App (`academy-app/`)

### Stack

- **Framework**: React Native 0.81 + Expo 54 (New Architecture enabled)
- **Routing**: Expo Router (file-based)
- **Auth**: `@clerk/clerk-expo`
- **API**: tRPC client connecting to the portal backend
- **Real-time**: Ably
- **Push**: `expo-notifications` + APNs
- **Package Manager**: npm

### Identifiers

- **Bundle ID**: `com.academytn.app`
- **Scheme**: `academy`
- **Platforms**: iOS, Android (iPad disabled)

### Purpose

Native member experience:
- Login via Clerk
- Dashboard & scheduling
- Push notifications
- Future: in-app messaging + announcements

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
| `eas.json` | Build profiles: development, preview, production |
| `assets/` | App icon (`icon.png`), splash screen (`splash-icon.png`), adaptive icon |

### Release Checklist

1. Increment `version` in `app.json`
2. Confirm icons/splash render correctly
3. Confirm push notification credentials are valid
4. Run smoke test: login → core navigation → notifications opt-in
5. Rebuild with EAS after any asset changes (icons won't update in existing binary)

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
- Native design system

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
| **Payments** | — | Stripe | — |
| **Email** | — | Resend | — |
| **Real-time** | — | SSE + Socket.IO | Ably |
| **Storage** | — | AWS S3 / Forge CDN | — |
| **Icons** | lucide-react | lucide-react | @expo/vector-icons |
| **Package Manager** | npm | pnpm 10.4.1 | npm |

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
  - `/api/stripe/*` → isolated Stripe webhook
  - `/*` → `index.html` (SPA fallback)
- **Trigger**: Auto-deploy on push

### Mobile App
- **Platform**: EAS Cloud Build → App Store Connect / Google Play
- **Build profiles**: `development` (internal), `preview` (internal), `production`
- **Trigger**: Manual (`eas build` + `eas submit`)

No CI/CD pipelines (GitHub Actions). Deployment is Vercel auto-deploy on push for web apps, manual EAS for mobile.

---

## Environment Variables

See `.env.example` for the full list. Key groups:

- **Database**: `DATABASE_URL` (Neon PostgreSQL)
- **Auth**: `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`
- **Payments**: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Email**: `RESEND_API_KEY`
- **Storage**: `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY`

The marketing site has NO server-side env vars (it's a static/SSR content site with no backend).

The mobile app uses Expo config + push notification credentials (managed via EAS).

---

## Common Pitfalls for Agents

1. **Wrong app!** The live site at `academytn.com` is `academy-marketing/`, NOT `client/`. If you change `client/src/pages/Home.tsx` thinking it affects the public site, it won't — that only affects `app.academytn.com`.

2. **Wrong package manager.** Root uses `pnpm`. Marketing and mobile use `npm`. Don't mix them.

3. **Typecheck false alarms.** Running `tsc --noEmit` in `academy-marketing/` from the monorepo context shows module resolution errors. These don't affect builds.

4. **Config is the source of truth.** Business data (programs, prices, testimonials, coaches) lives in `academy-marketing/lib/config.ts`. Pages read from it. Change config, not individual pages.

5. **Structured data lives in two places.** Both `academy-marketing/lib/structured-data.tsx` (reads from config automatically) AND `client/src/components/StructuredData.tsx` (hardcoded) contain Schema.org review data. Update both when testimonials change.

6. **No workspace linking.** `shared/` is imported by `client/` and `server/` via tsconfig path aliases, but `academy-marketing/` and `academy-app/` have zero access to it.

7. **Serverless builds are separate.** The esbuild step produces `dist/serverless.js` (main API) and `dist/serverless-stripe.js` (Stripe webhook). The `api/` directory contains thin wrappers that import these bundles.

8. **Mobile build numbers.** Always increment `version` in `academy-app/app.json` before submitting to App Store / Google Play. Icons won't update without a full EAS rebuild.

---

## Architecture Principles

1. Marketing is content-first and config-driven.
2. Portal is type-safe and API-centric (tRPC end-to-end).
3. Stripe webhook is an isolated security boundary.
4. Mobile is an independent release train.
5. No API contract drift — types flow from schema to client.
6. Deployments must remain independent.
7. Auth degrades gracefully when Clerk is not configured.

---

## Known Improvement Opportunities (Not Yet Implemented)

- **CI/CD enforcement** — Quality gates exist but are manually run; no GitHub Actions blocking merges
- **Router/DB monolith split** — `server/routers.ts` (~2,100 lines) and `server/db.ts` (~1,900 lines) could be split into domain modules
- **Structured data consolidation** — Single canonical testimonials source instead of two
- **Observability** — No Sentry/error reporting or request log correlation IDs yet

---

## Git

- **Default branch**: `main` (on origin)
- **Development branch pattern**: `claude/<feature>-<session-id>`
- **PR template**: `.github/PULL_REQUEST_TEMPLATE.md`

---

## Summary for Agents

This repo is a **marketing engine** + a **SaaS-style member platform** + a **native mobile application**. All three are production systems.

Before changing anything:

1. **Identify which app** you are modifying
2. **Confirm correct package manager** (pnpm for portal root, npm for marketing and mobile)
3. **Confirm correct deployment target**
4. **Run the build locally** before pushing
5. **Avoid cross-app assumptions** — they share no UI code
