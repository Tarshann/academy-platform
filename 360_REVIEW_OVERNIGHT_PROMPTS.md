# 360 Review — Overnight Optimization Prompts
## Generated March 19, 2026

Run these 4 agent prompts in parallel overnight. Each targets a specific domain from the 360 review.

---

## PROMPT 1: Mobile Agent — World-Class UX Polish

```
You are the Mobile Agent for The Academy platform (academy-app/).

## CRITICAL: GIT WORKFLOW
- Work directly on `main`. No worktrees, no feature branches.
- `git checkout main && git pull origin main` before starting.
- Commit after each ticket. Push when done: `git push origin main`

## Context
- Mobile app: academy-app/ (React Native 0.81, Expo 54+, Expo Router)
- Package manager: npm (NOT pnpm)
- Theme file: academy-app/lib/theme.ts
- Existing components: components/Skeleton.tsx, ErrorBoundary.tsx, Loading.tsx, Screen.tsx, AnimatedCard.tsx, etc.

## Tickets (Priority Order)

### 1. P0: Add Missing Error States + Retry Buttons
Files needing error state with retry:
- academy-app/app/gallery.tsx — add isError check + retry button
- academy-app/app/showcase.tsx — add error boundary with retry
- academy-app/app/drops.tsx — add error state handler
- academy-app/app/metrics.tsx — add full error state with retry

Pattern to follow (from media.tsx):
```tsx
if (isError) {
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.danger} />
        <Text style={{ color: theme.colors.text, fontSize: 16, marginTop: 12 }}>Something went wrong</Text>
        <Pressable onPress={() => refetch()} style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: theme.colors.gold, borderRadius: theme.radius.md }}>
          <Text style={{ color: theme.colors.background, fontWeight: '600' }}>Try Again</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
```
Commit: `fix(mobile): P0 add error states with retry to gallery, showcase, drops, metrics`

### 2. P0: Add Missing Empty States
Files needing empty state messages:
- academy-app/app/attendance.tsx — show "No attendance records yet" when data is empty
- academy-app/app/shop.tsx — show "No items available right now" when activeProducts is empty
- academy-app/app/chat/[room].tsx — show "Start the conversation!" when messages array is empty
- academy-app/app/dm/[id].tsx — show "Say hello!" when messages array is empty

Use the EmptyState component if it exists in components/, otherwise create inline with icon + text.
Commit: `fix(mobile): P0 add empty states to attendance, shop, chat, DM`

### 3. P1: Accessibility Labels
Add accessibilityLabel and accessibilityRole to ALL interactive elements across:
- Tab bar buttons in (tabs)/_layout.tsx
- All Pressable/TouchableOpacity buttons in every screen
- All TextInput fields
- Navigation back buttons
- Filter chips
- Chat send button
- Image upload buttons

Minimum standard: Every button must have accessibilityLabel describing its action.
Every input must have accessibilityLabel describing what to enter.
Every icon-only button must have accessibilityLabel (e.g., "Send message", "Take photo", "Go back").
Commit: `feat(mobile): P1 accessibility labels on all interactive elements`

### 4. P1: Offline Detection Banner
Install and wire up @react-native-community/netinfo:
```bash
npm install @react-native-community/netinfo
```
Create academy-app/components/OfflineBanner.tsx:
- Uses NetInfo to detect connectivity
- Shows a fixed banner at top: "You're offline. Some features may not work."
- Amber background, white text
- Auto-dismisses when connection restored

Wire into _layout.tsx so it shows on all screens.
Commit: `feat(mobile): P1 offline detection banner with NetInfo`

### 5. P1: Shimmer Animation on Skeletons
Update academy-app/components/Skeleton.tsx to add animated shimmer effect:
- Use React Native Animated API
- Linear gradient shimmer that moves left to right continuously
- Apply to all skeleton variants (SkeletonLine, SkeletonCircle, etc.)
Commit: `feat(mobile): P1 shimmer animation on skeleton loaders`

### 6. P2: Consistent Screen Headers
Create academy-app/components/ScreenHeader.tsx:
- Reusable header with back button, title, optional right action
- Consistent styling using theme tokens
- 44px minimum tap target on back button
- Use across: shop.tsx, payments.tsx, gallery.tsx, showcase.tsx, drops.tsx, metrics.tsx, attendance.tsx

Replace custom headers in these files with ScreenHeader.
Commit: `refactor(mobile): P2 consistent ScreenHeader component across all stack screens`

## Final Steps
1. `cd academy-app && npm install`
2. `npx tsc --noEmit` (warnings OK, errors not OK)
3. `git push origin main`

## Deliverable
Summary with each ticket, commit SHA, files changed.
```

---

## PROMPT 2: Server Agent — Security + Performance Hardening

```
You are the Server Agent for The Academy platform (server/, drizzle/, api/).

## CRITICAL: GIT WORKFLOW
- Work directly on `main`. No worktrees, no feature branches.
- `git checkout main && git pull origin main` before starting.
- Commit after each fix. Push when done: `git push origin main`

## Context
- Server: server/ (Express + tRPC v11)
- Database: drizzle/ (PostgreSQL via Drizzle ORM)
- Package manager: pnpm (NOT npm)

## Tickets (Priority Order)

### 1. P0: Fix getCheckoutSessionDetails Auth
File: server/routers.ts
Find `getCheckoutSessionDetails` — it's a publicProcedure but returns customer email, product details, and payment status. Change to protectedProcedure and verify the requesting user owns the session.
Commit: `fix(security): P0 restrict getCheckoutSessionDetails to authenticated users`

### 2. P0: Add Database Indexes
File: Create a new migration in drizzle/ (use the next sequential number after the latest migration).
Add these critical indexes:
```sql
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created ON "chatMessages" ("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation ON "dmMessages" ("conversationId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_dm_messages_user ON "dmMessages" ("userId");
CREATE INDEX IF NOT EXISTS idx_attendance_schedule ON "attendanceRecords" ("scheduleId");
CREATE INDEX IF NOT EXISTS idx_attendance_user ON "attendanceRecords" ("userId");
CREATE INDEX IF NOT EXISTS idx_metrics_athlete ON "athleteMetrics" ("athleteId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_session_registrations_schedule ON "sessionRegistrations" ("scheduleId");
CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON "notificationLogs" ("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON "leads" ("email");
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON "pushSubscriptions" ("userId");
CREATE INDEX IF NOT EXISTS idx_game_entries_user ON "gameEntries" ("userId", "createdAt" DESC);
```
Commit: `perf(db): P0 add indexes to high-query columns`

### 3. P0: Cron Job Idempotency
Files: server/cron/*.ts (all 9 cron jobs)
For each cron job, add a dedup check before sending notifications/emails:
- Check if a notification/email was already sent for this (userId, type, targetId) in the last 24 hours
- Use the existing `reminderLog` or `notificationLogs` table
- If already sent, skip silently
- Log skip count for monitoring

Focus on the highest-risk ones first:
1. session-reminders.ts — check reminderLog before sending
2. nurture.ts — check nurture email log before sending
3. progress-reports.ts — check if report already generated this period
4. parent-digest.ts — check if digest already sent this week
Commit: `fix(server): P0 add idempotency guards to all cron jobs`

### 4. P1: Wrap Unprotected Mutations in Try-Catch
File: server/routers.ts
Find and wrap these mutations in try-catch with proper TRPCError handling:
- members.assignProgram (~line 832)
- members.removeProgram (~line 868)
- members.updateRole (~line 886)
- contacts.markRead (~line 948)
- contacts.markResponded (~line 955)
- chatAdmin.clearAll (~line 1000)
- gallery.admin.update (~line 1054)
- gallery.admin.delete (~line 1080)

Pattern:
```typescript
try {
  // existing logic
} catch (error) {
  logger.error('[mutation.name] Error:', error);
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Operation failed' });
}
```
Commit: `fix(server): P1 add error handling to 8 unprotected mutations`

### 5. P1: Rate Limiter Memory Cap
File: server/routers.ts (or wherever the in-memory rate limiter is defined)
Add a maximum store size of 10,000 entries. When the cap is reached, evict the oldest entries.
Commit: `fix(server): P1 cap rate limiter memory at 10k entries`

### 6. P1: DM Search SQL Injection Protection
File: server/db.ts
Find `searchDmMessages` function. Ensure it:
- Uses parameterized queries (not string concatenation)
- Escapes LIKE wildcards (%, _) in user input
- Pattern: `WHERE content ILIKE '%' || $1 || '%'` with proper Drizzle parameterization
Commit: `fix(security): P1 parameterize DM search query`

## Final Steps
1. `pnpm install`
2. `pnpm check` (TypeScript)
3. `pnpm test` (Vitest)
4. `pnpm build` (must pass)
5. `git push origin main`

## Deliverable
Summary with each ticket, commit SHA, files changed.
```

---

## PROMPT 3: Marketing Agent — Image Optimization + Blog Build-Out

```
You are the Marketing Agent for The Academy platform (academy-marketing/).

## CRITICAL: GIT WORKFLOW
- Work directly on `main`. No worktrees, no feature branches.
- `git checkout main && git pull origin main` before starting.
- Commit after each ticket. Push when done: `git push origin main`

## Context
- Marketing site: academy-marketing/ (Next.js 15, App Router)
- Package manager: npm (NOT pnpm)
- Config source of truth: academy-marketing/lib/config.ts
- Structured data: academy-marketing/lib/structured-data.tsx

## Tickets (Priority Order)

### 1. P1: Replace All Raw img Tags with next/image
Find every `<img` tag across all components and pages. Replace with Next.js Image component:

```tsx
import Image from 'next/image';

// Hero images (above fold):
<Image src="/images/training-photo-1.jpeg" alt="..." width={1200} height={800} priority />

// Below-fold images:
<Image src="/images/coach-mac.jpg" alt="..." width={400} height={400} loading="lazy" />
```

Files to check:
- app/page.tsx (homepage)
- app/programs/page.tsx
- app/programs/[slug]/page.tsx
- app/coaches/page.tsx
- app/about/page.tsx
- app/blog/page.tsx
- app/events/page.tsx
- components/ (Navigation, Footer, any component with images)

Rules:
- Hero images get `priority` prop (above the fold)
- All other images get `loading="lazy"` (or omit — lazy is default in next/image)
- All images must have explicit width + height
- All images must have descriptive alt text
Commit: `perf(marketing): P1 replace all img tags with next/image`

### 2. P1: Build Dynamic Blog System
Create `academy-marketing/app/blog/[slug]/page.tsx`:
- Individual blog post pages with:
  - Metadata export (title, description, OG tags)
  - Article structured data (headline, datePublished, author, articleBody)
  - Back to blog link
  - Related posts section

Create blog data in config.ts or a separate blog-data.ts:
```typescript
export const blogPosts = [
  {
    slug: "speed-drills-at-home",
    title: "5 Speed Drills Your Athlete Can Do at Home",
    excerpt: "No equipment needed. These 5 drills will improve your athlete's speed...",
    date: "2026-03-15",
    author: "Coach Mac",
    readTime: "4 min",
    category: "Training Tips",
    body: "..." // Full article content (300+ words each)
  },
  {
    slug: "why-we-train-outside",
    title: "Why We Train Outside (On Purpose)",
    excerpt: "Rain or shine, outdoor training builds more than just speed...",
    date: "2026-03-10",
    author: "Coach O",
    readTime: "5 min",
    category: "Philosophy",
    body: "..."
  },
  {
    slug: "signs-your-child-needs-training",
    title: "How to Know if Your Child is Ready for Structured Training",
    excerpt: "Not every kid is ready at the same age. Here's how to tell...",
    date: "2026-03-05",
    author: "Coach Mac",
    readTime: "6 min",
    category: "Parents",
    body: "..."
  }
];
```

Write genuine, helpful 300-500 word articles for each. Not placeholder text.

Update app/blog/page.tsx to link to individual posts (remove "Coming Soon" badges).
Commit: `feat(marketing): P1 dynamic blog with 3 published articles`

### 3. P1: Fix Heading Hierarchy
Audit every page for proper h1 → h2 → h3 nesting:
- Each page: exactly one h1
- Major sections: h2
- Subsections: h3
- Never skip levels (no h1 → h3)

Focus on:
- Homepage sections (programs, coaches, testimonials, trust stats)
- Programs page
- Coaches page
Commit: `fix(seo): P1 proper heading hierarchy on all pages`

### 4. P2: Add Coach Person Schema
File: academy-marketing/lib/structured-data.tsx
Add Person schema for both coaches, reading data from config.ts:
```json
{
  "@type": "Person",
  "name": "Coach Mac",
  "jobTitle": "Head Coach & Co-Founder",
  "affiliation": { "@type": "Organization", "name": "The Academy" },
  "image": "/images/coach-mac.jpg"
}
```
Commit: `feat(seo): P2 add Person schema for coaches`

## Quality Gate
1. `cd academy-marketing && npm install`
2. `npm run build` — must pass
3. `npm run validate` — must pass
4. `git push origin main`

## Deliverable
Summary with each ticket, commit SHA, files changed.
```

---

## PROMPT 4: Mobile Agent — Missing Feature Screens

```
You are the Mobile Agent for The Academy platform (academy-app/).

## CRITICAL: GIT WORKFLOW
- Work directly on `main`. No worktrees, no feature branches.
- `git checkout main && git pull origin main` before starting.
- Commit after each ticket. Push when done: `git push origin main`

## Context
- Mobile app: academy-app/ (React Native 0.81, Expo 54+, Expo Router)
- Package manager: npm (NOT pnpm)
- Backend: server/routers.ts has all these features built
- Theme: academy-app/lib/theme.ts
- tRPC client: academy-app/lib/trpc.tsx

## IMPORTANT: The backend routes already exist for all of these features. You are only building the mobile UI screens that connect to them.

## Tickets

### 1. P0: Family/Household Screen
Create academy-app/app/family.tsx:
- Use `trpc.family.getFamilyMembers` to list children
- For each child, show: name, metrics summary, attendance count, upcoming sessions
- Use `trpc.family.getFamilyChildData` for detailed child view
- Add "Add Family Member" button using `trpc.family.addFamilyMember`
- Navigate from dashboard quick actions
- Include loading skeleton, error state with retry, empty state

Add to dashboard quick actions in (tabs)/index.tsx.
Commit: `feat(mobile): P0 family/household accounts screen`

### 2. P0: Onboarding Flow
Create academy-app/app/(auth)/onboarding.tsx:
- 4-step wizard: role → sport → goals → complete
- Step 1: Select role (athlete, parent, coach) — large tappable cards
- Step 2: Select sport(s) (basketball, flag football, soccer, multiple) — multi-select chips
- Step 3: Select goal (try-it-out, commit, tryout-prep) — radio-style cards
- Step 4: Success screen with "Go to Dashboard" button
- Use `trpc.onboarding.completeStep` for each step
- Use `trpc.onboarding.getProgress` to resume if partially complete
- Progress bar at top showing steps 1-4

Wire into _layout.tsx AuthGuard: check `trpc.onboarding.getProgress` — if not complete, redirect to onboarding before dashboard.
Commit: `feat(mobile): P0 4-step onboarding flow`

### 3. P0: Referral Program Screen
Create academy-app/app/referrals.tsx:
- Show user's referral code prominently (large, copyable)
- "Share" button using React Native Share API (share code + link)
- "Invite by Email" — text input + send button using `trpc.referrals.inviteByEmail`
- Referral history list showing who signed up with their code
- Points earned display
- Use `trpc.referrals.getMyReferralCode`, `trpc.referrals.getMyReferrals`

Add to dashboard quick actions and profile screen.
Commit: `feat(mobile): P0 referral program screen`

### 4. P1: AI Progress Reports Screen
Create academy-app/app/progress-reports.tsx:
- List of AI-generated progress reports using `trpc.progressReports.getMyReports` (or similar)
- Each report shows: date, summary preview, athlete name
- Tap to expand full report in a scrollable view
- Pull-to-refresh
- Empty state: "No progress reports yet. Reports are generated bi-weekly."
- Loading skeleton

Add navigation from dashboard and profile.
Commit: `feat(mobile): P1 AI progress reports screen`

### 5. P1: Waitlist View
Add waitlist indicators to existing screens:
- In academy-app/app/(tabs)/programs.tsx: If program is full, show "Join Waitlist" button instead of "Enroll"
- Use `trpc.waitlist.joinWaitlist` mutation
- Show queue position: "You're #3 on the waitlist"
- Use `trpc.waitlist.getMyWaitlistEntries` on profile or programs screen

Commit: `feat(mobile): P1 waitlist join and status indicators`

## Final Steps
1. `cd academy-app && npm install`
2. `npx tsc --noEmit`
3. `git push origin main`

## Deliverable
Summary with each ticket, commit SHA, files changed.
```
