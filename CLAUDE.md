# Academy Platform — Agent Reference

> Single source of truth for any AI agent working in this repo.
> Read this FIRST before making changes.

---

## Two Separate Apps, One Repo

This repo contains **two independent applications** that deploy to different domains:

| App | Directory | Framework | Domain | Purpose |
|-----|-----------|-----------|--------|---------|
| **Marketing Site** | `academy-marketing/` | Next.js 15 (App Router) | `academytn.com` | Public-facing marketing, programs, coaches, blog, FAQ, get-started quiz |
| **Member Portal** | `client/` + `server/` + `api/` | React 19 SPA (Vite) + Express/tRPC | `app.academytn.com` | Authenticated portal — dashboard, admin, coach view, chat, shop, payments |

**They share no source code.** They are NOT workspace-linked. They have separate `package.json` files, separate build commands, separate Vercel deployments, and separate styling systems.

---

## Directory Map

```
academy-platform/
├── academy-marketing/       # Next.js 15 marketing site (academytn.com)
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
├── client/                  # React 19 SPA (Vite) — member portal frontend
│   └── src/
│       ├── components/      #   shadcn/ui components + custom pages
│       ├── pages/           #   Route-level page components (Home, Dashboard, Admin, etc.)
│       ├── hooks/           #   Custom React hooks
│       ├── lib/             #   Utilities (trpc client, utils)
│       └── index.css        #   Tailwind v4 theme (oklch colors, Inter font)
│
├── server/                  # Express.js + tRPC v11 backend
│   ├── _core/               #   Server infrastructure (index.ts, env.ts, context.ts, trpc.ts,
│   │                        #   clerk.ts, oauth.ts, checkout.ts, rateLimiter.ts, etc.)
│   ├── routers.ts           #   All tRPC routes (67KB — programs, shop, admin, etc.)
│   ├── db.ts                #   Drizzle ORM database connection
│   ├── serverless.ts        #   Vercel serverless entry point
│   ├── serverless-stripe.ts #   Isolated Stripe webhook handler
│   ├── chat-sse.ts          #   SSE-based real-time chat
│   └── chat.ts              #   Socket.IO chat (optional)
│
├── shared/                  # Shared types/constants between client & server
├── drizzle/                 # Database schema (schema.ts) + SQL migrations
├── api/                     # Vercel serverless function entry points
│   ├── [...path].ts         #   -> dist/serverless.js (tRPC + chat + registrations)
│   └── stripe/webhook.ts    #   -> dist/serverless-stripe.js (Stripe webhooks)
├── dist/                    # Build output (compiled server + SPA)
├── e2e/                     # Playwright E2E tests for member portal
├── docs/                    # Strategy docs, ship-readiness checklists
└── patches/                 # pnpm patched dependencies (wouter)
```

---

## Build Commands

### Member Portal (root)

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

### Marketing Site (academy-marketing/)

```bash
cd academy-marketing
npm install           # ⚠️ Uses npm, NOT pnpm
npm run build         # next build
npm run dev           # next dev
npm run typecheck     # tsc --noEmit (expect pre-existing module resolution errors in monorepo)
npm run validate      # Custom build validation script
npm test              # Playwright (tests/e2e/)
```

**Important**: The marketing site `typecheck` will show errors about missing `next/server`, `next/link` etc. when run from the monorepo root. These are pre-existing module resolution issues and do NOT affect the actual Next.js build or deployment.

---

## Deployment

Both apps deploy to **Vercel** independently:

- **Marketing** (`academy-marketing/vercel.json`): Standard Next.js framework detection
- **Portal** (root `vercel.json`): Custom build with SPA fallback rewrites
  - `/api/trpc/*` → serverless tRPC handler
  - `/api/stripe/*` → isolated Stripe webhook
  - `/*` → `index.html` (SPA fallback)

No CI/CD pipelines (GitHub Actions). Deployment is Vercel auto-deploy on push.

---

## Tech Stack Summary

| Layer | Marketing Site | Member Portal |
|-------|---------------|---------------|
| **Frontend** | Next.js 15 App Router | React 19 SPA (Vite 7) |
| **Routing** | Next.js file-based | wouter (client-side) |
| **Styling** | Tailwind v4 (PostCSS), Oswald + Source Sans 3 | Tailwind v4 (Vite plugin), shadcn/ui, Inter |
| **API** | — | tRPC v11 + Express |
| **Auth** | — | Clerk (+ legacy OAuth fallback) |
| **Database** | — | PostgreSQL (Neon) via Drizzle ORM |
| **Payments** | — | Stripe (checkout, webhooks, subscriptions) |
| **Email** | — | Resend |
| **Real-time** | — | SSE + Socket.IO chat |
| **Storage** | — | AWS S3 / Forge CDN |
| **Icons** | lucide-react | lucide-react |
| **Package Manager** | npm | pnpm 10.4.1 |

---

## Key Source-of-Truth Files

### Marketing Site

- **`academy-marketing/lib/config.ts`** — ALL business data: site info, contact, programs (with prices, schedules, FAQs), coaches, founders, testimonials, trust stats, service areas, schools, FAQ, hours
- **`academy-marketing/lib/metadata.ts`** — SEO metadata generator
- **`academy-marketing/lib/structured-data.tsx`** — Schema.org JSON-LD (reads from config.ts)
- **`academy-marketing/app/globals.css`** — Brand design tokens (CSS custom properties)

### Member Portal

- **`drizzle/schema.ts`** — Database schema (users, programs, orders, products, chat, etc.)
- **`server/routers.ts`** — All API routes
- **`client/src/index.css`** — Portal theme (oklch colors)
- **`client/src/components/StructuredData.tsx`** — Portal structured data (also has testimonials)

---

## Styling Systems (Different Per App!)

### Marketing: Athletic / Bold
- Fonts: **Oswald** (display, uppercase), **Source Sans 3** (body)
- Colors: Gold `#d4a843`, Black `#0a0a0a`, White `#fafafa`
- Custom CSS classes: `.btn-primary`, `.btn-secondary`, `.section-dark`, `.section-light`
- CSS custom properties: `--color-brand-gold`, `--color-brand-dark`, `--color-brand-orange`

### Portal: Clean SaaS
- Fonts: **Inter** (body), **Bebas Neue** + **DM Sans** (display)
- Colors: Championship gold `#C9A24D` (oklch), warm whites, deep charcoal
- shadcn/ui "new-york" style with CSS variables
- Framer Motion animations

---

## Common Pitfalls for Agents

1. **Wrong app!** The live site at `academytn.com` is `academy-marketing/`, NOT `client/`. If you change `client/src/pages/Home.tsx` thinking it affects the public site, it won't — that only affects `app.academytn.com`.

2. **Wrong package manager.** Root uses `pnpm`. Marketing uses `npm`. Don't mix them.

3. **Typecheck false alarms.** Running `tsc --noEmit` in `academy-marketing/` from the monorepo context shows module resolution errors. These don't affect builds.

4. **Config is the source of truth.** Business data (programs, prices, testimonials, coaches) lives in `academy-marketing/lib/config.ts`. Pages read from it. Change config, not individual pages.

5. **Structured data lives in two places.** Both `academy-marketing/lib/structured-data.tsx` (reads from config automatically) AND `client/src/components/StructuredData.tsx` (hardcoded) contain Schema.org review data. Update both when testimonials change.

6. **No workspace linking.** `shared/` is imported by `client/` and `server/` via tsconfig path aliases, but `academy-marketing/` has zero access to it.

7. **Serverless builds are separate.** The esbuild step produces `dist/serverless.js` (main API) and `dist/serverless-stripe.js` (Stripe webhook). The `api/` directory contains thin wrappers that import these bundles.

---

## Environment Variables

See `.env.example` for the full list. Key groups:
- **Database**: `DATABASE_URL` (Neon PostgreSQL)
- **Auth**: `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`
- **Payments**: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Email**: `RESEND_API_KEY`
- **Storage**: `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY`

The marketing site has NO server-side env vars (it's a static/SSR content site with no backend).

---

## Git

- **Default branch**: `main` (on origin)
- **Development branch pattern**: `claude/<feature>-<session-id>`
- **PR template**: `.github/PULL_REQUEST_TEMPLATE.md`
