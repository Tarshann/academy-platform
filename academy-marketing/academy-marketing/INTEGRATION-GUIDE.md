# Academy Marketing Site — Integration Guide for Claude Code / Devin

## What This Is

A complete, build-tested Next.js 15 marketing site scaffold for academytn.com. All pages, components, structured data, SEO infrastructure, and content are ready. The agent's job is to **integrate this into the existing academy-platform repo and deploy**.

**Build status:** ✅ `next build` passes with 0 errors, 18 pages statically generated.

---

## Project Structure

```
academy-marketing/
├── app/
│   ├── layout.tsx                 # Root layout: fonts, nav, footer, analytics, LocalBusiness JSON-LD
│   ├── page.tsx                   # Homepage: hero, trust bar, programs, differentiator, testimonials, CTA
│   ├── HomepageClient.tsx         # Client-side scroll animations
│   ├── globals.css                # Design system: CSS variables, Tailwind v4, btn/section utilities
│   ├── robots.ts                  # Auto-generated robots.txt
│   ├── sitemap.ts                 # Auto-generated XML sitemap
│   │
│   ├── programs/
│   │   ├── page.tsx               # Programs overview (all 3 programs)
│   │   └── [slug]/page.tsx        # Dynamic program detail pages (decision pages with outcomes, progress, schedule, coach bios, FAQ)
│   │
│   ├── coaches/page.tsx           # Coach bio page
│   ├── faq/
│   │   ├── page.tsx               # FAQ page
│   │   └── FAQAccordion.tsx       # Client-side accordion component
│   ├── get-started/
│   │   ├── page.tsx               # Guided signup quiz page
│   │   └── GetStartedQuiz.tsx     # 3-step quiz: age → sport → goal → recommendation
│   ├── blog/page.tsx              # Blog index (starter content)
│   ├── events/page.tsx            # Events page with Event JSON-LD template
│   │
│   ├── youth-athletic-training-gallatin-tn/
│   │   └── page.tsx               # Local landing page (Gallatin/Sumner County)
│   │
│   ├── privacy/page.tsx           # Privacy policy
│   └── terms/page.tsx             # Terms of service
│
├── components/
│   ├── layout/
│   │   ├── Navigation.tsx         # Responsive nav: scroll-aware, mobile drawer, programs dropdown
│   │   └── Footer.tsx             # Footer: programs, company, contact, social, legal
│   ├── seo/
│   │   └── Analytics.tsx          # GA4 + Meta Pixel with custom event tracking
│   └── ui/
│       └── StickyCTA.tsx          # Mobile sticky "Get Started" button (hides when hero CTA visible)
│
├── lib/
│   ├── config.ts                  # ⚡ SINGLE SOURCE OF TRUTH: business data, programs, coaches, testimonials, FAQ
│   ├── metadata.ts                # generatePageMetadata() — OG + Twitter card generation per page
│   ├── structured-data.tsx        # JSON-LD: LocalBusiness, Organization, Service, Event, Breadcrumb
│   └── useReveal.tsx              # Scroll-triggered reveal animations hook
│
├── next.config.ts                 # Redirects (signup→programs, etc.), security headers, CSP, image optimization
├── email-nurture-sequence.md      # 5-email nurture sequence copy (ready for Resend integration)
├── package.json                   # Next.js 15, React 19, Tailwind v4, lucide-react, Vercel Analytics
├── tsconfig.json
└── postcss.config.mjs
```

---

## Integration Strategy

### Option A: Replace the Vite SPA entirely (recommended)
If the marketing pages ARE the public site, replace the client-side React app with this Next.js app. The existing Express/tRPC backend stays as-is — wire it as API routes or external backend.

### Option B: Hybrid deployment
Deploy this as a separate Vercel project for the marketing site. Keep the SPA for authenticated surfaces (/portal, /dashboard). Use Vercel rewrites to proxy auth routes.

### Either way, the agent needs to:

1. **Copy this project into the repo** (or create a new Vercel project from it)
2. **Update `lib/config.ts`** with real business data:
   - Real phone number (currently placeholder)
   - Real street address
   - Real social media URLs
   - Real founded year
   - Real email address
3. **Add real images** to `public/images/`:
   - `og-default.jpg` (1200×630) — default social share card
   - `logo.png` — site logo
   - Training photos for hero, outdoor section, coach headshots
4. **Set environment variables** on Vercel:
   - `NEXT_PUBLIC_GA_ID` — Google Analytics 4 Measurement ID
   - `NEXT_PUBLIC_META_PIXEL_ID` — Facebook Meta Pixel ID
   - Google Search Console verification code (in `layout.tsx`)
5. **Wire Clerk** — the Navigation has a placeholder for auth state. If member portal exists, add ClerkProvider and conditional nav links.
6. **Wire Stripe** — the signup quiz ends with a CTA to "Book a Free Assessment." Connect this to the existing Stripe checkout or contact form endpoint.
7. **Deploy to Vercel** and verify:
   - All redirects work (test /signup, /group-training, /shooting-lab, /adm, /register)
   - OG tags render (Facebook Sharing Debugger)
   - Structured data validates (Google Rich Results Test)
   - Mobile responsive on real devices

---

## What's NOT in this scaffold (agent doesn't need to build)

These are content/operational items Tarshann handles:
- Real training photos and video
- Google Business Profile setup (manual in Google)
- Review generation workflow (operational process, not code)
- Google Search Console setup (manual)
- Real coach bios with headshots (placeholders show the structure)
- Real testimonials (placeholders show the format)

---

## Design System

The CSS is built on Tailwind v4 with CSS custom properties. Key tokens:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-brand-gold` | `#d4a843` | Primary accent, CTAs, highlights |
| `--color-brand-black` | `#0a0a0a` | Dark sections, text |
| `--color-brand-white` | `#fafafa` | Light text on dark backgrounds |
| `--font-display` | Oswald | Headlines, labels, navigation |
| `--font-body` | Source Sans 3 | Body text, descriptions |

Button classes: `.btn-primary` (gold bg), `.btn-secondary` (outlined)
Section classes: `.section-dark` (dark bg), `.clip-diagonal` / `.clip-diagonal-reverse` (angled sections)

---

## Redirect Map (in next.config.ts)

| From | To | Status |
|------|----|--------|
| `/signup` | `/programs` | 301 |
| `/group-training` | `/programs/skills-lab` | 301 |
| `/shooting-lab` | `/programs` | 301 |
| `/adm` | `/programs/performance-lab` | 301 |
| `/register` | `/get-started` | 301 |

**Still needed:** 301 redirects from `cspringsacademy.com` → `academytn.com` (configure at domain registrar or in Vercel project settings).

---

## SEO Checklist (verify after deploy)

- [ ] Every page returns full HTML (not empty shell) — test with `curl -s https://academytn.com | head -50`
- [ ] `<title>` and `<meta description>` unique per page
- [ ] `og:title`, `og:description`, `og:image` present in HTML source per page
- [ ] `twitter:card` = `summary_large_image` on all pages
- [ ] `<link rel="canonical">` on every page
- [ ] LocalBusiness JSON-LD on every page (check `<script type="application/ld+json">`)
- [ ] Service JSON-LD on each program detail page
- [ ] XML sitemap at `/sitemap.xml`
- [ ] robots.txt at `/robots.txt`
- [ ] All redirects return 301 (not 302)
- [ ] No mixed content warnings (all resources over HTTPS)
- [ ] Core Web Vitals passing in Vercel Analytics

---

## Analytics Events (already wired)

The `trackEvent()` function in `components/seo/Analytics.tsx` fires these GA4 events:

- `quiz_start` — user begins the Get Started quiz
- `quiz_step_complete` — each step completion (with step name)
- `quiz_complete` — quiz finished, recommendation shown (with recommended program)
- `cta_click` — any CTA button click (with destination)
- `phone_click` — phone number click-to-call

---

## Performance Notes

- First Load JS: ~102-112 kB shared (excellent for Next.js)
- All pages statically generated at build time
- Images configured for AVIF + WebP auto-conversion via `next/image`
- Security headers include CSP, X-Frame-Options, X-Content-Type-Options
- Static assets cached for 1 year (immutable)
