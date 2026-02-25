# QA Checklists

> Run these before any release. Every checkbox must pass or have an accepted exception documented.

---

## Mobile App — Smoke Test (Run on Real Device)

### Authentication
- [ ] Sign in with existing account → lands on Dashboard
- [ ] Sign up with new email → verification code flow → lands on Dashboard
- [ ] Sign out → returns to sign-in screen
- [ ] Kill app and reopen → stays signed in (token persistence)
- [ ] Invalid credentials → shows clear error message

### Dashboard
- [ ] Welcome greeting shows correct name
- [ ] Next session card shows upcoming session (or empty state)
- [ ] Announcements feed loads (or empty state)
- [ ] Pull-to-refresh works
- [ ] [v1.3] Attendance stats card shows data
- [ ] [v1.3] Quick actions grid navigates correctly
- [ ] [v1.3] Upcoming payment card shows data or empty state

### Schedule
- [ ] Sessions list loads with correct dates/times
- [ ] Session type badges display correctly
- [ ] Capacity numbers accurate
- [ ] Register for session → confirmation shown
- [ ] Already registered session shows registered state
- [ ] Empty state if no upcoming sessions

### Programs
- [ ] Programs load with pricing and categories
- [ ] [v1.3] "Sign Up" opens Stripe checkout in-app (not external browser)
- [ ] [v1.3] Successful payment → confirmation screen
- [ ] [v1.3] Cancelled payment → returns to programs gracefully

### Group Chat
- [ ] [v1.3] All 4 rooms visible (General, Coaches, Parents, Announcements)
- [ ] Message history loads in each room
- [ ] Send message → appears in real-time
- [ ] Receive message from another user → appears in real-time
- [ ] Connection status indicator works
- [ ] [v1.3] Image upload → shows progress → image appears
- [ ] Timestamps display correctly

### Direct Messages
- [ ] Conversation list loads with unread badges
- [ ] Open conversation → messages load
- [ ] Send message → appears in real-time
- [ ] Receive message → appears in real-time
- [ ] Start new conversation → works
- [ ] Unread badge clears when conversation opened
- [ ] [v1.3] Mute conversation toggle works

### Push Notifications
- [ ] Notification received when app is backgrounded
- [ ] Tap chat notification → opens correct chat room
- [ ] Tap DM notification → opens correct DM conversation
- [ ] Foreground notification displays correctly
- [ ] [v1.3] Notification preferences screen loads
- [ ] [v1.3] Toggle changes persist after app restart

### Profile
- [ ] User name and email display correctly
- [ ] Role badge shows (Member/Coach/Admin)
- [ ] [v1.3] Coach contacts load from API (not hardcoded)
- [ ] Call button opens phone dialer
- [ ] Text button opens SMS
- [ ] [v1.3] Version shows correct number (dynamic)
- [ ] Sign out works
- [ ] Account deletion flow works (confirmation required)

### [v1.3] Payments
- [ ] Subscription details load
- [ ] Payment history loads with pagination
- [ ] "Manage Subscription" opens Stripe portal

### [v1.3] Attendance
- [ ] Attendance history loads
- [ ] Stats show correctly (or zeros for new users)
- [ ] Calendar view highlights attended dates

### General
- [ ] No console errors on any screen
- [ ] No crash on any transition
- [ ] All screens have loading states (skeleton, not spinner for v1.3)
- [ ] All screens have error states with retry
- [ ] All screens have empty states
- [ ] App works on airplane mode → shows offline state (not crash)
- [ ] Memory usage stable (no leaks after 5 min of navigation)

---

## Web Portal — Smoke Test

### Authentication
- [ ] Login with Clerk → dashboard loads
- [ ] OAuth fallback works (if Clerk unavailable)
- [ ] Session persists across page refresh
- [ ] Logout → returns to login

### Core Flows
- [ ] Dashboard loads with member data
- [ ] Schedule view shows sessions
- [ ] Register for session → success
- [ ] Chat works (send/receive in real-time)
- [ ] DM works (send/receive)
- [ ] Programs page loads
- [ ] Shop page loads (if enabled)

### Payments
- [ ] Stripe checkout completes (test mode)
- [ ] Stripe webhook processes correctly
- [ ] Payment history visible
- [ ] Subscription status accurate

### Admin
- [ ] Admin dashboard accessible for admin users
- [ ] Member management works
- [ ] Session management works
- [ ] Announcement creation works

### Technical
- [ ] No console errors on critical pages
- [ ] Mobile responsive (375px viewport)
- [ ] `pnpm build` succeeds
- [ ] `pnpm check` passes

---

## Marketing Site — Smoke Test

### Pages
- [ ] Homepage loads fully
- [ ] All program pages load
- [ ] About/coaches page loads
- [ ] Contact page loads
- [ ] Blog index loads
- [ ] Quiz/assessment works
- [ ] 404 page renders correctly

### SEO
- [ ] Every page has unique title tag
- [ ] Every page has meta description
- [ ] Structured data validates (spot check 3 pages)
- [ ] Sitemap.xml accessible and accurate
- [ ] robots.txt accessible and correct
- [ ] No broken internal links

### Forms & CTAs
- [ ] Contact form submits
- [ ] CTA buttons link to correct destinations
- [ ] Phone numbers are clickable (tel: links)
- [ ] Email addresses are clickable (mailto: links)

### Technical
- [ ] Mobile rendering clean (375px viewport)
- [ ] `npm run build` succeeds
- [ ] `npm run validate` passes (45+ checks)
- [ ] Core Web Vitals acceptable (Lighthouse)
