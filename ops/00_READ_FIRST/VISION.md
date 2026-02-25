# Academy Platform — Vision & North Star

> Every agent reads this first. This is why we're building.

---

## What Academy Is

The Academy is a youth athletic training facility in Gallatin, Tennessee. The platform is three apps serving one ecosystem:

| App | Domain | Purpose |
|-----|--------|---------|
| Marketing Site | `academytn.com` | Attract → Convert → Enroll |
| Member Portal | `app.academytn.com` | Manage membership, schedule, pay, admin |
| Mobile App | iOS / Android | Daily member companion — schedule, chat, pay, track |

## What Winning Looks Like (v1.3 Release Goals)

### Revenue Metrics
- In-app program enrollment live (eliminates website redirect friction)
- Mobile checkout conversion rate > web checkout (target: 15-25% of transactions from mobile within 6 months)
- Merchandise shop accessible from mobile
- Private session booking available in-app

### Engagement Metrics
- Session registrations initiated on mobile: target 40%+ of total
- Push notification opt-in rate: target 75%+
- Daily active users: establish baseline, grow 10% month-over-month
- Chat messages sent per week: establish baseline

### Quality Metrics
- App Store rating: maintain 4.5+
- Crash-free rate: 99.5%+ (requires adding Sentry)
- Time to first session registration (new user): under 3 minutes
- Zero broken flows in portal or marketing site

### SEO Metrics
- Core Web Vitals: all green (LCP < 2.5s, CLS < 0.1, INP < 200ms)
- Local SEO: rank top 3 for "youth athletic training Gallatin TN" and variants
- Structured data: 100% coverage on programs, coaches, reviews, FAQ, locations

---

## Platform Architecture (Quick Reference)

```
academy-platform/
├── academy-marketing/     Next.js 15 │ npm   │ academytn.com         │ Vercel auto-deploy
├── client/ + server/      React 19 + Express │ pnpm │ app.academytn.com │ Vercel auto-deploy
├── academy-app/           Expo 54 + RN 0.81 │ npm  │ iOS App Store       │ Manual EAS
├── shared/                Types shared between client ↔ server only
├── drizzle/               PostgreSQL schema + migrations
└── ops/                   ← YOU ARE HERE: agent coordination system
```

**These apps share NO UI code. They have separate styling, separate builds, separate deploys.**

---

## Dependency Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Stripe checkout in mobile (WebView vs native) | Payment flow could break or feel janky | Prototype early, test on real device, have web fallback |
| `newArchEnabled: true` | Could break existing RN modules | Test in isolation branch first, keep false as fallback |
| EAS Update channel config | OTA updates won't work without it | Configure before first v1.3 build, test update flow |
| No CI/CD | Regressions can ship undetected | Manual QA checklists are mandatory until CI is added |
| Single developer | Bus factor of 1 | This ops system + clean architecture enables onboarding |
| No Sentry/error reporting | Crashes go undetected | Add crash reporting as Phase 1 task |

---

## What We Don't Do

- We don't mix styling systems across apps
- We don't change tRPC route signatures without a ticket and mobile impact check
- We don't hardcode business data in page components (config.ts is the source of truth for marketing)
- We don't ship features without analytics events
- We don't skip QA checklists for releases
- We don't make "drive-by refactors" without tickets
