# Workstream: Web Portal (client/ + server/)

> Agent: Portal Agent
> Scope: `client/`, `server/`, `shared/`, `drizzle/`, `api/`, `e2e/`
> Package Manager: pnpm
> Domain: app.academytn.com

---

## Current State

### Architecture
- Frontend: React 19 SPA (Vite 7), wouter routing, shadcn/ui components
- Backend: Express.js + tRPC v11 (~2,100 lines in routers.ts)
- Database: PostgreSQL (Neon) via Drizzle ORM (~1,900 lines in db.ts, 42 tables)
- Auth: Clerk primary + OAuth fallback
- Real-time: SSE (chat-sse.ts) + Socket.IO (opt-in)
- Payments: Stripe (isolated webhook handler)
- Email: Resend

### Key Files
| File | Lines | Purpose |
|------|-------|---------|
| `server/routers.ts` | ~2,100 | All tRPC routes |
| `server/db.ts` | ~1,900 | All DB functions |
| `drizzle/schema.ts` | ~800 | Database schema (42 tables) |
| `server/chat-sse.ts` | ~365 | SSE real-time chat |
| `client/src/index.css` | — | Portal theme (oklch) |
| `server/_core/index.ts` | — | Server bootstrap |

### Known Architectural Debt
1. `routers.ts` is a ~2,100 line monolith — could be split into domain modules
2. `db.ts` is a ~1,900 line monolith — same
3. No Sentry/error reporting
4. No request log correlation IDs
5. Testimonials hardcoded in `client/src/components/StructuredData.tsx` (drifts from marketing config)

---

## Task Breakdown

### Phase 1: Audit & Review
- [ ] Full UX walkthrough of every portal page — document issues
- [ ] Functionality review — identify broken or degraded features
- [ ] Performance audit — load times, bundle size, unnecessary re-renders
- [ ] Accessibility check — keyboard nav, screen readers, contrast
- [ ] Security review — exposed routes, auth checks, input validation

### Phase 2: Quick Fixes
- [ ] Fix any bugs found during audit
- [ ] Fix testimonial drift (StructuredData.tsx vs marketing config)
- [ ] UX friction points — loading states, error messages, empty states
- [ ] Mobile responsiveness issues in the portal

### Phase 3: Feature Enhancements
- [ ] Subscription management improvements
- [ ] Payment history / receipt access
- [ ] Admin dashboard enhancements (based on audit)
- [ ] Coach tools improvements (based on audit)
- [ ] Shop/merch management improvements

### Phase 4: Infrastructure
- [ ] Consider splitting routers.ts into domain modules
- [ ] Consider splitting db.ts into domain modules
- [ ] Add error monitoring (Sentry or equivalent)
- [ ] Add request correlation IDs
- [ ] Performance optimization (lazy loading, code splitting)

---

## API Impact on Mobile

The portal backend serves the mobile app. Before changing any tRPC route:
1. Check if the mobile app uses it (see mobile-app.md API usage list)
2. Maintain backward compatibility
3. Log any breaking changes in review-log.md

### Routes Mobile Currently Uses
```
auth.chatToken
programs.list (partially)
sessions.upcoming, sessions.register
announcements.list
dm.conversations, dm.messages, dm.send, dm.markRead
pushNotifications.register
```

### Routes Mobile Will Soon Use (v1.3)
```
attendance.getMyAttendance, attendance.getMyStats
shop.products, shop.createCheckout
payment.createCheckout, payment.myPayments, payment.mySubscriptions
gallery.list, gallery.byCategory
videos.list, videos.byCategory
blog.list, blog.getBySlug
coaches.list, locations.list
pushNotifications.getSettings, pushNotifications.updateSettings
dm.searchMessages, dm.blockUser, dm.unblockUser
dm.muteConversation, dm.unmute, dm.archiveConversation
payment.submitPrivateSessionBooking
```

**Do NOT change the signatures of these routes without coordinating.**

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| — | — | — |

## Files Modified

| Date | File | Change |
|------|------|--------|
| — | — | — |
