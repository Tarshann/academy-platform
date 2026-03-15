# PR #187 Review: 6 New Features

**Commits**: 2 | **Files**: 14 | **+4,147 / -9 lines**

Features: Athlete Metrics, Showcases, Games Hub (Spin Wheel, Trivia, Scratch Cards), Social Gallery, Merch Drops, Video Chat support

---

## P0 — Critical / Blocking

### 1. Race condition in `addUserPoints` — points can be lost

**server/db.ts `addUserPoints()`**: Reads current points, then writes `current.totalPoints + amount`. Two concurrent game completions read the same value; one update overwrites the other. Same pattern in `getOrCreateUserPoints` (two concurrent calls for a new user → duplicate insert → unique constraint crash).

**Fix**: Use atomic SQL increment:
```ts
await db.update(userPoints).set({
  totalPoints: sql`"totalPoints" + ${amount}`,
  lifetimePoints: sql`"lifetimePoints" + ${amount}`,
  updatedAt: new Date(),
}).where(eq(userPoints.userId, userId));
```

For `getOrCreateUserPoints`, use `INSERT ... ON CONFLICT (userId) DO NOTHING`.

---

### 2. Daily play limit bypass via concurrent requests

**server/routers.ts `spinWheel`, `submitTrivia`, `scratchCard`**: The daily limit check reads the count, then creates the entry in separate operations. A user can fire 10 rapid requests — all 10 read "0 plays today" before any write lands, bypassing the 3/day or 5/day limit.

**Fix**: Wrap the check + insert in a transaction with `SELECT ... FOR UPDATE`, or use an atomic conditional insert (e.g., insert only if count < limit in a single SQL statement).

---

### 3. `submitTrivia` fetches entire question bank to grade 5 answers

**server/routers.ts `submitTrivia`**: Calls `getAllTriviaAdmin()` which loads *every* trivia question (including correct answers) into memory, then filters via a Map. This is O(N) where N = total questions, for grading just 5.

**Fix**: Add a `getTriviaByIds(ids: number[])` function that does `WHERE id IN (...)`.

---

### 4. `priceSchema` used for athletic metric values — rejects valid data

**server/routers.ts `metrics.admin.record`**: The `value` field uses `priceSchema` which enforces max 2 decimal places (`/^\d+(\.\d{1,2})?$/`). A 40-yard dash time of "4.321" seconds or a vertical jump of "32.75" inches with finer precision would be rejected.

**Fix**: Create a separate `metricValueSchema` allowing more decimal places.

---

### 5. No migration file for 7 new tables

The PR adds `athleteMetrics`, `athleteShowcases`, `merchDrops`, `userPoints`, `gameEntries`, `triviaQuestions`, and `socialPosts` (plus 5 new enums) to `drizzle/schema.ts` but has no corresponding SQL migration in `drizzle/`. Deployment will fail against the existing production database.

---

## P1 — Important

### 6. `socialPosts.embedHtml` stores raw HTML — XSS risk

**drizzle/schema.ts**: `embedHtml` is a `text` column storing arbitrary HTML from admin input. No sanitization in the `socialPosts.admin.create` route. If rendered via WebView (mobile) or `dangerouslySetInnerHTML` (web), this is a stored XSS vector.

### 7. No foreign key constraints on any new table

None of the 7 new tables reference `users` via FK. `athleteMetrics.athleteId`, `userPoints.userId`, `gameEntries.userId`, etc. are bare integers. User deletion leaves orphaned rows.

### 8. Missing indexes on hot query paths

- `gameEntries (userId, gameType, playedAt)` — queried on **every** game play for daily limit check
- `athleteMetrics (athleteId, metricName)` — queried for trend data
- `socialPosts (isVisible)` — list query
- `athleteShowcases (isActive, featuredFrom)` — active showcases query
- `merchDrops (isSent, scheduledAt)` — upcoming drops query

### 9. `getActiveShowcases()` ignores `featuredUntil`

**server/db.ts**: Only checks `isActive = true AND featuredFrom <= now`. Showcases with expired `featuredUntil` continue appearing forever.

### 10. `CountdownTimer` in drops screen never updates

**academy-app/app/drops.tsx lines 31-60**: Computes `Date.now()` once at render time with no `useEffect`/`setInterval`. The countdown is static until next re-render. Users see stale values.

### 11. Programs tab hidden to make room for Games tab

**academy-app/app/(tabs)/_layout.tsx**: Sets `href: null` on the Programs tab. This is a UX regression — existing users lose tab bar access to Programs.

### 12. Leaderboard returns raw user IDs with no display names

**server/routers.ts `games.leaderboard`**: Returns `userId` and points but no JOIN to users table. Mobile shows `Player #${entry.userId}`, exposing sequential internal IDs.

### 13. `updateUserStreak` is defined but never called

**server/db.ts**: Streak tracking function exists but no game play mutation calls it. `currentStreak` and `longestStreak` will always be 0.

### 14. Discount rewards are granted but have no redemption system

Spin wheel and scratch card award "10%", "25%" discounts logged in `gameEntries` but there's no discount code table, no Stripe coupon integration, and no way for users to view or apply earned discounts. The reward is effectively a no-op.

### 15. Admin search bar in MetricsScreen is non-functional

**academy-app/app/metrics.tsx**: `searchQuery` state is captured in a TextInput but never used to filter the displayed metrics.

### 16. Video upload uses image endpoint

**academy-app/lib/chat-images.ts `uploadChatVideo()`**: Sends 50MB videos to `/api/chat/upload-image`. The server handler may not accept video MIME types or enforce the 50MB limit.

---

## P2 — Minor

### 17. `games.tsx` is 1,001 lines — should be split
Three full game UIs + hub screen + styles in a single file. Split into separate component files.

### 18. Hardcoded `paddingTop: 60` across all new screens
All 5 new screens use `paddingTop: 60` instead of `useSafeAreaInsets()`. Breaks on devices with Dynamic Island or notch.

### 19. Color constants (`ACADEMY_GOLD`, `NAVY`) duplicated in 5+ files
Should be imported from a shared constants module.

### 20. `getUpcomingDrops` returns past unsent drops
Filters `isSent = false` but doesn't filter by date. Past-due unsent drops appear as "upcoming".

### 21. No pagination on `socialPosts.list` and `showcases.active`
Both return all rows with no limit. Will degrade with growth.

### 22. `triviaQuestions.correctOption` is `varchar(1)` — should be an enum
No database-level constraint ensures only "a"/"b"/"c"/"d" values.

---

## Recommendation

**Request changes.** The race conditions (P0 #1-2) allow point farming and limit bypass. The missing migration (P0 #5) blocks deployment. The trivia performance issue (P0 #3) and invalid schema (P0 #4) will cause runtime failures.

Priority fix order:
1. Add atomic SQL for points + daily limit enforcement (P0 #1-2)
2. Add migration file (P0 #5)
3. Fix `submitTrivia` to query by ID list (P0 #3)
4. Create separate metric value schema (P0 #4)
5. Address P1 items #9 (showcases), #10 (countdown), #11 (programs tab)
