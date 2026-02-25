# Definitions

> Shared vocabulary so agents don't misinterpret scope.

---

## Ticket States

| State | Meaning |
|-------|---------|
| `BACKLOG` | Identified but not prioritized for current work |
| `NOW` | Actively being worked on this cycle |
| `NEXT` | Prioritized for the next cycle |
| `LATER` | Valuable but not time-critical |
| `IN PROGRESS` | An agent is actively working on it right now |
| `BLOCKED` | Cannot proceed — dependency or question outstanding |
| `DONE` | Meets all acceptance criteria, build passes, status updated |
| `CUT` | Explicitly removed from scope (with reason) |

## Ticket ID Prefixes

| Prefix | Workstream |
|--------|-----------|
| `MOB-` | Mobile App (academy-app/) |
| `WEB-` | Web Portal (client/ + server/) |
| `MKT-` | Marketing Site (academy-marketing/) |
| `SEO-` | SEO-specific work on marketing site |
| `RES-` | Research / Competitive Intelligence |
| `REL-` | Release / QA |
| `OPS-` | Ops system itself (this coordination layer) |

## Tier Definitions (from v1.3 Roadmap)

| Tier | Meaning | Definition of Done |
|------|---------|-------------------|
| **Tier 1: Core** | Must-have for v1.3 | Onboarding + payments + attendance + notification prefs all ship |
| **Tier 2: Engagement** | Drives retention | Content hub + chat enhancements + calendar integration ship |
| **Tier 3: Delight** | Differentiators | Polish, offline, accessibility, App Store optimization |

## Agent Roles

| Role | Owns | Boundary |
|------|------|----------|
| **Mobile Agent** | `academy-app/**` features, UI, polish, offline, push settings | Cannot change server routes or marketing site |
| **Portal Agent** | `client/**`, `server/**`, `shared/**`, `drizzle/**`, `api/**` | Cannot change marketing site or mobile app. Must check mobile impact before changing API routes |
| **Marketing/SEO Agent** | `academy-marketing/**` content, SEO, CWV, conversion | Cannot change portal or mobile. All business data goes through config.ts |
| **Competitor Intel Agent** | Research only | Produces recommendations and tickets, never changes code |
| **QA/Release Agent** | Testing, release notes, checklists | Read-only on code. Produces go/no-go decisions |

## Key Terms

| Term | Meaning |
|------|---------|
| **Config-driven** | Data comes from `academy-marketing/lib/config.ts`, not hardcoded in components |
| **tRPC contract** | The typed API interface between client ↔ server. Changes require coordination |
| **EAS** | Expo Application Services — cloud build + submit for mobile |
| **OTA update** | Over-the-air update via EAS Update — JS changes without App Store review |
| **CWV** | Core Web Vitals — Google's page experience metrics (LCP, CLS, INP) |
| **ADR** | Architecture Decision Record — documented reasoning for technical choices |
| **Smoke test** | Quick manual test of critical user flows to catch obvious breaks |
| **Skeleton screen** | Placeholder UI that mimics content layout during loading (not a spinner) |
