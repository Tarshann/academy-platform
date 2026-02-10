# Academy Marketing Site — Integration Guide
## For Claude Code / Devin / Agent-Based Integration

This is a complete Next.js 15 (App Router) marketing site scaffold for academytn.com.
It is designed to be integrated into the existing academy-platform repo that currently
runs React + Vite on Vercel.

## What This Contains

```
academy-marketing/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (nav, footer, analytics, structured data)
│   ├── page.tsx                  # Homepage
│   ├── globals.css               # Design system + Tailwind v4
│   ├── sitemap.ts                # Dynamic XML sitemap
│   ├── robots.ts                 # robots.txt config
│   ├── HomepageClient.tsx        # Client-side scroll animations
│   ├── programs/
│   │   ├── page.tsx              # Programs index
│   │   └── [slug]/page.tsx       # Dynamic program detail pages
│   ├── get-started/page.tsx      # Guided signup quiz
│   ├── coaches/page.tsx          # Coach bios
│   ├── faq/
│   │   ├── page.tsx              # FAQ page
│   │   └── FAQAccordion.tsx      # Accordion component
│   ├── blog/page.tsx             # Blog index
│   └── youth-athletic-training-gallatin-tn/
│       └── page.tsx              # Local SEO landing page
├── components/
│   ├── layout/
│   │   ├── Navigation.tsx        # Header + mobile menu
│   │   └── Footer.tsx            # Site footer
│   ├── ui/
│   │   └── StickyCTA.tsx         # Sticky mobile CTA
│   └── seo/
│       └── Analytics.tsx         # GA4 + Meta Pixel
├── lib/
│   ├── config.ts                 # All business data (SINGLE SOURCE OF TRUTH)
│   ├── metadata.ts               # Per-page metadata generator
│   ├── structured-data.tsx       # JSON-LD schema generators
│   └── useReveal.tsx             # Scroll animation hook
├── email-nurture-sequence.md     # 5-email nurture copy
├── next.config.ts                # Redirects, headers, image optimization
├── package.json
├── tsconfig.json
└── postcss.config.mjs
```

## Integration Strategy

### Option A: Replace the Vite frontend entirely (Recommended)

1. In your existing `academy-platform` repo, remove the Vite frontend build config
2. Copy this entire scaffold into the repo root (or a `marketing/` directory)
3. Update `vercel.json` to use the Next.js build instead of Vite
4. Keep the Express + tRPC backend as-is — Next.js API routes can proxy to it
5. Authenticated routes (/portal, /dashboard) become Next.js pages that import
   your existing React components and wrap them in Clerk auth

### Option B: Run marketing site as separate Vercel project

1. Deploy this as a standalone Vercel project at academytn.com
2. Keep the existing Vite app at app.academytn.com or academytn.com/portal
3. Use Vercel rewrites to route /portal/* to the existing app
4. Simpler to implement, slightly more complex to maintain long-term

### Recommended: Option A

## Critical Integration Steps

### 1. Environment Variables
These must be set in Vercel project settings:
```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX         # Google Analytics 4
NEXT_PUBLIC_META_PIXEL_ID=XXXXXXXXXX   # Meta/Facebook Pixel
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...  # Existing Clerk key
CLERK_SECRET_KEY=...                    # Existing Clerk key
```

### 2. Update lib/config.ts
The config file has placeholder values marked with `// UPDATE` comments.
These MUST be replaced with real data before launch:
- Phone number
- Email address
- Physical address + geo coordinates
- Social media URLs
- Coach names, bios, photos, certifications
- Testimonial names and quotes
- Founded year

### 3. Images Required Before Launch
Place in `public/images/`:
- `og-default.jpg` (1200×630) — default social share card
- `logo.png` — brand logo
- `coach-1.jpg` (and more) — coach headshots
- Training facility photos (outdoor field, action shots)
- Hero background image or video (`/public/videos/training-hero.mp4`)

### 4. Connect to Existing Backend
The signup quiz currently uses `mailto:` as placeholder. Wire it to:
- Your existing tRPC contact/application endpoint
- OR a Calendly embed for free assessment scheduling
- OR direct Stripe checkout for Skills Lab session purchase

### 5. Google Business Profile (Manual — not code)
- Go to business.google.com
- Claim/create profile for "The Academy" at your Gallatin address
- Add categories, services, photos, hours per the optimization plan
- Start posting weekly

### 6. Google Search Console (Manual)
- Verify ownership of academytn.com
- Submit sitemap URL: https://academytn.com/sitemap.xml
- Monitor indexing of all new pages

### 7. Domain Consolidation
- If cspringsacademy.com has any Academy content, implement 301 redirects
  to the equivalent academytn.com pages
- Update any external links/profiles pointing to old domains

## What's NOT in This Scaffold (and doesn't need to be)

- Member portal / dashboard (keep existing SPA behind Clerk auth)
- Stripe billing management (keep existing integration)
- Realtime messaging (needs third-party provider, not Vercel serverless)
- CMS for blog posts (start with static MDX, add headless CMS later if needed)

## Tech Notes

- **Tailwind v4** — uses `@import "tailwindcss"` and `@theme` blocks, not v3 config
- **App Router** — all pages are server components by default; "use client" only where needed
- **No external UI library** — all components are custom to avoid bundle bloat
- **Fonts** — Google Fonts (Oswald + Source Sans 3) loaded via `<link>` with `display=swap`
- **Structured data** — JSON-LD injected server-side in `<head>`, not client-rendered
- **Analytics** — GA4 and Meta Pixel load via `next/script` with `afterInteractive` strategy

## Validation Checklist (Post-Deploy)

- [ ] Every marketing page returns full HTML content (not empty shell)
- [ ] `curl -s https://academytn.com | grep "<h1>"` returns content
- [ ] Social share preview works: Facebook Sharing Debugger, Twitter Card Validator
- [ ] Google Search Console shows pages as indexed
- [ ] Sitemap accessible at /sitemap.xml
- [ ] Robots.txt accessible at /robots.txt
- [ ] All redirects work (/signup → /programs, etc.)
- [ ] Lighthouse mobile score > 80 for performance
- [ ] All images lazy-load below fold
- [ ] Sticky CTA appears on mobile scroll
- [ ] Quiz flow completes and recommends correct program
- [ ] All phone/email links work on mobile
