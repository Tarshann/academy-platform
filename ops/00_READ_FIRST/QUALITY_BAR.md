# Quality Bar — What "Ship-Ready" Means

> A feature is not done until it meets these criteria.
> Agents: use this as your pre-flight checklist before marking any ticket complete.

---

## Mobile App (academy-app/)

### Every Screen Must Have
- [ ] **Loading state**: Skeleton screen (not a spinner) for content areas
- [ ] **Error state**: Visible, human-readable message with retry action
- [ ] **Empty state**: Meaningful message when no data exists (not a blank screen)
- [ ] **Pull-to-refresh**: Where data can change (lists, feeds, dashboards)
- [ ] **Accessibility baseline**: All interactive elements have labels, minimum 44pt tap targets
- [ ] **Analytics event**: At least one PostHog event per meaningful user action

### Every Feature Must Have
- [ ] **Works on slow network**: Test with Network Link Conditioner or equivalent
- [ ] **Handles null/empty API responses**: Doesn't crash if the server returns empty arrays or null fields
- [ ] **Handles auth expiry gracefully**: If Clerk token expires mid-flow, redirect to sign-in (not crash)
- [ ] **No hardcoded data**: All dynamic data comes from API or config, not inline strings
- [ ] **Consistent with design tokens**: Uses Academy Gold (#CFB87C), Navy (#1a1a2e), system fonts, standard radii
- [ ] **Telemetry**: Success AND failure events tracked

### Before Any Mobile Release
- [ ] `npx expo start` runs without errors
- [ ] All existing screens still work (auth, dashboard, schedule, chat, DM, programs, profile)
- [ ] Push notification deep links still work (chat + DM)
- [ ] Version bumped in `app.json` (version + buildNumber)
- [ ] QA checklist in `ops/40_RELEASES/CHECKLIST_QA.md` is completed

---

## Web Portal (client/ + server/)

### Every Page Must Have
- [ ] **Loading state**: Skeleton or shimmer (shadcn/ui patterns)
- [ ] **Error state**: User-facing error message, not raw error
- [ ] **Empty state**: Helpful message, not blank space
- [ ] **Mobile responsive**: Works on 375px viewport minimum
- [ ] **Keyboard navigable**: All interactive elements reachable via Tab
- [ ] **Consistent styling**: Uses shadcn/ui components, oklch theme tokens, Inter font

### Every Feature Must Have
- [ ] **Auth check**: Protected routes require authentication
- [ ] **Input validation**: Both client-side (Zod) and server-side
- [ ] **Error handling**: tRPC errors surfaced to user meaningfully
- [ ] **No breaking API changes**: If a route signature changes, mobile impact is checked first

### Before Any Portal Deploy
- [ ] `pnpm build` succeeds (all 3 steps: Vite, esbuild server, esbuild serverless)
- [ ] `pnpm check` passes (TypeScript)
- [ ] No console errors on critical flows (login, dashboard, schedule, chat, payments)
- [ ] Stripe webhook still works (test with Stripe CLI if payment routes changed)

---

## Marketing Site (academy-marketing/)

### Every Page Must Have
- [ ] **Title tag**: 50-60 characters, keyword-rich, unique per page
- [ ] **Meta description**: 150-160 characters, includes CTA
- [ ] **Single H1**: One per page, keyword-rich
- [ ] **Heading hierarchy**: H1 → H2 → H3, no skips
- [ ] **Open Graph tags**: og:title, og:description, og:image
- [ ] **Structured data**: Relevant JSON-LD (LocalBusiness, SportsActivityLocation, FAQ, Review, etc.)
- [ ] **Image optimization**: next/image, WebP where possible, alt text on every image
- [ ] **Mobile rendering**: Clean on 375px viewport

### Every Change Must
- [ ] **Come from config.ts** if it involves business data (prices, programs, coaches, testimonials)
- [ ] **Pass build validation**: `npm run build && npm run validate` (45+ checks)
- [ ] **Not regress Core Web Vitals**: LCP < 2.5s, CLS < 0.1, INP < 200ms

### SEO Specific
- [ ] **No broken links**: Internal or external
- [ ] **Canonical URLs set**: On every page
- [ ] **Sitemap accurate**: Reflects all public pages with correct priorities
- [ ] **robots.txt correct**: Not blocking important pages

---

## Cross-Cutting Quality Rules

### Telemetry Naming Convention
```
{domain}_{action}_{result}

Examples:
  payment_checkout_started
  payment_checkout_completed
  payment_checkout_failed
  chat_message_sent
  chat_image_upload_success
  chat_image_upload_failed
  session_registration_completed
  session_registration_failed
  push_notification_opened
  onboarding_step_completed
  onboarding_skipped
```

### API Contract Notes

These tRPC routes are safe to call on app launch (no heavy computation):
```
announcements.list          — lightweight, cached
programs.list               — lightweight
sessions.upcoming           — lightweight
dm.conversations            — lightweight with unread counts
pushNotifications.getSettings — lightweight
```

These routes require pagination or have heavy payloads:
```
attendance.getMyAttendance  — paginate by date range
gallery.list                — paginate, images are heavy
videos.list                 — paginate
blog.list                   — paginate
payment.myPayments          — paginate by date
```

Expected null/empty behaviors to handle:
```
attendance.getMyStats       — returns zeros for new users, not null
shop.products               — may return empty array if shop is disabled
coaches.list                — may return empty if no coaches published
gallery.byCategory          — returns empty array for unknown category
```

### Design Token Reference

**Mobile (React Native StyleSheet)**
| Token | Value | Usage |
|-------|-------|-------|
| Academy Gold | `#CFB87C` | Active states, accents, CTAs |
| Navy / Dark | `#1a1a2e` | Headers, backgrounds |
| Background | `#f5f5f5` | Screen backgrounds |
| Card BG | `#ffffff` | Card surfaces |
| Card Shadow | `rgba(0,0,0,0.08)` | Elevation |
| Card Radius | `12-16px` | Card corners |
| Input Radius | `20px` | Text inputs |
| Inactive Gray | `#8e8e93` | Disabled/secondary |
| Fonts | System default | No custom fonts loaded |
| Icons | Ionicons | Via `@expo/vector-icons` |
| Min Tap Target | `44px` | Accessibility requirement |

**Marketing (Tailwind CSS)**
| Token | Value | Usage |
|-------|-------|-------|
| Brand Gold | `#d4a843` | CTAs, accents |
| Brand Dark | `#0a0a0a` | Backgrounds |
| Brand White | `#fafafa` | Text on dark |
| Brand Orange | CSS var | Secondary accent |
| Display Font | Oswald (uppercase) | Headings |
| Body Font | Source Sans 3 | Paragraphs |

**Portal (shadcn/ui + oklch)**
| Token | Value | Usage |
|-------|-------|-------|
| Championship Gold | `#C9A24D` (oklch) | Primary accent |
| Display Fonts | Bebas Neue + DM Sans | Headings |
| Body Font | Inter | Body text |
| Component System | shadcn/ui "new-york" | All UI components |
| Animation | Framer Motion | Transitions |
