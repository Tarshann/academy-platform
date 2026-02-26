# Workstream: Web Portal (client/ + server/)

> **Owner**: Portal Agent
> **Scope**: `client/`, `server/`, `shared/`, `drizzle/`, `api/`, `e2e/`
> **Package Manager**: pnpm
> **Domain**: app.academytn.com

---

## Context

The portal is the backend for all three apps. It serves the member SPA, handles all tRPC API routes, manages the database, and processes payments via Stripe. Changes here can impact the mobile app.

### Architecture
- Frontend: React 19 SPA (Vite 7), wouter routing, shadcn/ui
- Backend: Express.js + tRPC v11
- Database: PostgreSQL (Neon) via Drizzle ORM (42 tables)
- Auth: Clerk primary + OAuth fallback
- Real-time: SSE (primary) + Socket.IO (opt-in)
- Payments: Stripe (isolated webhook handler)

### Key Files
| File | Lines | Risk Level |
|------|-------|------------|
| `server/routers.ts` | ~2,100 | HIGH — all API routes, mobile depends on this |
| `server/db.ts` | ~1,900 | HIGH — all DB functions |
| `drizzle/schema.ts` | ~800 | HIGH — schema changes need migrations |
| `server/chat-sse.ts` | ~365 | MEDIUM — real-time chat |
| `server/_core/index.ts` | MEDIUM | Server bootstrap |
| `client/src/index.css` | LOW | Theme only |

### Active Tickets
See `ops/10_BACKLOG/NOW.md` for `WEB-*` tickets.

---

## Mobile API Dependency Map

**CRITICAL: These routes are consumed by the mobile app. Do not change their signatures without a coordinated ticket.**

### Currently Used by Mobile (v1.2)
```
auth.chatToken
programs.list
sessions.upcoming
sessions.register
announcements.list
dm.conversations
dm.messages
dm.send
dm.markRead
pushNotifications.register
```

### Will Be Used by Mobile (v1.3)
```
coaches.list
payment.createCheckout
payment.mySubscriptions
payment.myPayments
shop.products
shop.createCheckout
attendance.getMyAttendance
attendance.getMyStats
pushNotifications.getSettings
pushNotifications.updateSettings
dm.muteConversation / unmute
dm.searchMessages
dm.blockUser / unblockUser
dm.archiveConversation
gallery.list / byCategory
videos.list / byCategory
blog.list / getBySlug
locations.list
payment.submitPrivateSessionBooking
```

**Before changing ANY of these routes**: check with Mobile workstream, log in review-log.

---

## v1.4.0 Clips Backend — Ticket Map

> Portal Agent builds ALL backend infrastructure for Clips. Starts AFTER v1.3.0 mobile ships.

| Ticket | Name | Depends On | Impact | Files |
|--------|------|-----------|--------|-------|
| WEB-020 | DB schema + migration | — | `[INFRA]` | `drizzle/schema.ts`, migrations |
| WEB-021 | Video tRPC router (6 core routes) | WEB-020 | `[INFRA]` | `server/routers.ts`, `server/db.ts` |
| WEB-022 | Video storage (Forge CDN) | WEB-020 | `[INFRA]` | `server/storage.ts`, `.env.example` |
| WEB-023 | oEmbed external links | WEB-021 | `[ENGAGEMENT]` | `server/routers.ts`, new `server/oembed.ts` |
| WEB-024 | Chat/DM video integration | WEB-021 | `[ENGAGEMENT]` | `server/routers.ts`, `server/db.ts`, `server/chat-sse.ts` |
| WEB-025 | Share link generation | WEB-021 | `[ENGAGEMENT]` | `server/routers.ts` |
| WEB-026 | Universal link infrastructure | WEB-025 | `[INFRA]` | `vercel.json`, `api/`, `.well-known/` |

**Execution order**: WEB-020 → WEB-021 + WEB-022 (parallel) → WEB-023 + WEB-024 + WEB-025 (parallel) → WEB-026 → deploy → 48hr stabilization → notify Mobile Agent

---

## Known Debt

1. `routers.ts` monolith (~2,100 lines) — split into domain modules (LATER)
2. `db.ts` monolith (~1,900 lines) — split into domain modules (LATER)
3. No Sentry/error reporting — crashes go undetected
4. No request correlation IDs — hard to debug production issues
5. Testimonials hardcoded in `StructuredData.tsx` — drifts from marketing config
6. No automated tests for critical payment flows

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| — | — | — |

## Files Modified Log

| Date | File | Change | Ticket |
|------|------|--------|--------|
| — | — | — | — |
