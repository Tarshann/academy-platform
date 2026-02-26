# NOW — Active Work

> These tickets are in flight or ready to start immediately.
> Maximum 3-4 tickets per workstream at any time.

---

## Mobile App

### MOB-001: Version Bump + Foundation Setup
- **Workstream**: Mobile
- **Owner**: Mobile Agent
- **Status**: BACKLOG
- **Goal**: Prepare academy-app for v1.3 development with correct versioning and dependency foundation
- **Scope**:
  - Bump version to 1.3.0 in app.json
  - Bump buildNumber to 17
  - Configure EAS Update channel in eas.json
  - Fix hardcoded "v1.1" in profile.tsx to read from Constants.expoConfig
  - Add core new dependencies (reanimated, image-picker, bottom-sheet, haptics, date-fns, expo-image)
- **Non-goals**:
  - No feature work yet
  - Don't enable New Architecture (separate ticket)
- **Acceptance Criteria**:
  - [ ] `app.json` version is `1.3.0`, buildNumber is `17`
  - [ ] `eas.json` has `channel` field in build profiles
  - [ ] Profile footer shows "v1.3.0" dynamically
  - [ ] `npx expo start` runs without errors after dependency install
  - [ ] No existing functionality broken
- **Touched Files**:
  - `academy-app/app.json`
  - `academy-app/eas.json`
  - `academy-app/package.json`
  - `academy-app/app/(tabs)/profile.tsx`
- **Test Plan**:
  - Run `npm install` — no errors
  - Run `npx expo start` — launches cleanly
  - Navigate to Profile tab — version shows 1.3.0
- **Telemetry**: No new events
- **Release**: v1.3.0 foundation

---

### MOB-002: Enable All Chat Rooms
- **Workstream**: Mobile
- **Owner**: Mobile Agent
- **Status**: BACKLOG
- **Goal**: Show all 4 available chat rooms (General, Coaches, Parents, Announcements) instead of just 2
- **Scope**:
  - Update chat.tsx to display Parents and Announcements rooms
  - Add appropriate icons/descriptions per room
  - Announcements room should be visually distinct (read-focused)
  - Maintain existing real-time subscription pattern
- **Non-goals**:
  - No image upload yet (MOB-010)
  - No @mentions yet (MOB-011)
  - No read-only mode for announcements (future ticket)
- **Acceptance Criteria**:
  - [ ] Chat tab shows 4 rooms: General, Coaches, Parents, Announcements
  - [ ] Each room has a distinct icon and description
  - [ ] Tapping any room opens chat with message history
  - [ ] Real-time messages work in all 4 rooms
  - [ ] Announcements room loads and displays messages
  - [ ] Existing General and Coaches functionality unchanged
- **Touched Files**:
  - `academy-app/app/(tabs)/chat.tsx`
- **Test Plan**:
  - Open Chat tab — see 4 rooms listed
  - Tap each room — messages load, can send
  - Send a message in General — still works
- **Telemetry**:
  - `chat_room_opened` event includes room name for all 4
- **Release**: v1.3.0

---

### MOB-003: Coach Contact from API
- **Workstream**: Mobile
- **Owner**: Mobile Agent
- **Status**: BACKLOG
- **Goal**: Replace hardcoded coach phone numbers with data from coaches.list API
- **Scope**:
  - Call `coaches.list` tRPC route
  - Display coach names, photos (if available), phone numbers
  - Maintain call/text shortcuts
  - Handle empty state if no coaches returned
- **Non-goals**:
  - No coach profiles page yet (MOB-020)
  - No booking through coach card (MOB-024)
- **Acceptance Criteria**:
  - [ ] Profile screen shows coaches from API, not hardcoded data
  - [ ] Coach cards display name and phone number
  - [ ] Call button opens phone dialer
  - [ ] Text button opens SMS
  - [ ] Empty state shows "No coaches available" if API returns empty
  - [ ] Loading state shows skeleton while fetching
  - [ ] Error state shows retry if API fails
- **Touched Files**:
  - `academy-app/app/(tabs)/profile.tsx`
- **Test Plan**:
  - Open Profile — coaches load from API
  - Tap call — dialer opens with correct number
  - Tap text — SMS opens with correct number
  - Disconnect network — error state with retry
- **Telemetry**:
  - `coach_contact_call` / `coach_contact_text` events
- **Release**: v1.3.0

---

### MOB-004: In-App Program Enrollment (Stripe Checkout)
- **Workstream**: Mobile
- **Owner**: Mobile Agent
- **Status**: BACKLOG
- **Goal**: Allow members to enroll in programs directly from the app instead of redirecting to website
- **Scope**:
  - Replace website redirect with in-app Stripe checkout flow
  - Use `payment.createCheckout` tRPC route to get Stripe checkout URL
  - Open checkout in expo-web-browser (in-app browser, not external Safari)
  - Handle success/cancel callbacks via deep linking
  - Show confirmation state after successful payment
- **Non-goals**:
  - Native Stripe SDK integration (use WebView/browser approach first)
  - Subscription management (MOB-005)
  - Merchandise shop (MOB-006)
- **Acceptance Criteria**:
  - [ ] Programs page "Sign Up" button opens Stripe checkout in-app
  - [ ] Checkout loads with correct program and pricing
  - [ ] Successful payment redirects back to app with confirmation
  - [ ] Cancelled checkout returns to programs page gracefully
  - [ ] Loading state while checkout URL is being generated
  - [ ] Error state if checkout creation fails
  - [ ] Works on slow network (timeout handling)
- **Touched Files**:
  - `academy-app/app/(tabs)/programs.tsx`
  - `academy-app/lib/trpc.tsx` (if new route types needed)
- **Test Plan**:
  - Tap Sign Up on any program — Stripe checkout opens in-app
  - Complete test payment — returns to app with confirmation
  - Cancel checkout — returns to programs page
  - Slow network — loading state visible, no crash
- **Telemetry**:
  - `payment_checkout_started` (program name, price)
  - `payment_checkout_completed` (program name)
  - `payment_checkout_cancelled` (program name)
  - `payment_checkout_failed` (error type)
- **Release**: v1.3.0

---

## Web Portal

### WEB-001: Full UX Audit
- **Workstream**: Portal
- **Owner**: Portal Agent
- **Status**: BACKLOG
- **Goal**: Systematically review every portal page and document all UX issues, broken flows, and improvement opportunities
- **Scope**:
  - Walk through every page as a member, coach, and admin
  - Document: broken features, confusing UX, missing states, accessibility issues, mobile responsiveness
  - Produce a prioritized list of fix tickets
  - Check all payment flows end-to-end
  - Check all chat/DM flows
  - Check admin tools completeness
- **Non-goals**:
  - Don't fix anything during the audit — just document
  - Don't refactor code — just identify issues
- **Acceptance Criteria**:
  - [ ] Every portal page visited and evaluated
  - [ ] Issues logged with severity (CRITICAL/HIGH/MEDIUM/LOW)
  - [ ] At least 3 fix tickets created in NEXT.md from findings
  - [ ] Audit report written to `ops/50_REPORTS/audit-findings.md`
- **Touched Files**:
  - `ops/50_REPORTS/audit-findings.md` (new)
  - `ops/10_BACKLOG/NEXT.md` (new tickets from findings)
- **Test Plan**: N/A (this IS the test)
- **Telemetry**: No new events
- **Release**: Informs future web deploys

---

### WEB-002: API Route Impact Assessment
- **Workstream**: Portal
- **Owner**: Portal Agent
- **Status**: BACKLOG
- **Goal**: Document which tRPC routes the mobile app uses (current + planned v1.3) and verify they all work correctly
- **Scope**:
  - Verify all 14 currently-used mobile routes return expected data
  - Test all 47 planned-to-be-used routes for mobile v1.3
  - Document any routes with unexpected behavior, missing pagination, or null-handling issues
  - Flag any routes that need fixes before mobile can consume them
- **Non-goals**:
  - Don't change route signatures
  - Don't add new routes
- **Acceptance Criteria**:
  - [ ] All 14 current mobile routes verified working
  - [ ] All 47 planned routes tested and documented
  - [ ] Issues logged with specific route names and expected vs. actual behavior
  - [ ] Mobile agent notified of any routes that need workarounds
- **Touched Files**:
  - `ops/50_REPORTS/audit-findings.md`
- **Test Plan**: Call each route with test data, verify response shape
- **Telemetry**: No new events
- **Release**: Informs mobile v1.3

---

## Marketing Site + SEO

### MKT-001: Full SEO Audit
- **Workstream**: Marketing/SEO
- **Owner**: Marketing/SEO Agent
- **Status**: BACKLOG
- **Goal**: Comprehensive SEO audit of academytn.com — meta tags, structured data, sitemap, robots.txt, heading hierarchy, images, links
- **Scope**:
  - Inventory all pages with current meta tags
  - Check structured data coverage and validity
  - Verify sitemap.xml and robots.txt
  - Check Open Graph and Twitter Card tags
  - Review heading hierarchy per page
  - Check image alt text coverage
  - Scan for broken internal/external links
  - Assess mobile rendering
- **Non-goals**:
  - Don't make changes during audit — document only
  - Don't do content writing (separate tickets)
- **Acceptance Criteria**:
  - [ ] Every public page audited against SEO checklist
  - [ ] Issues categorized by severity
  - [ ] At least 5 SEO improvement tickets created in NEXT.md
  - [ ] Audit report written to `ops/50_REPORTS/audit-findings.md`
- **Touched Files**:
  - `ops/50_REPORTS/audit-findings.md`
  - `ops/10_BACKLOG/NEXT.md`
- **Test Plan**: N/A (this IS the audit)
- **Telemetry**: No new events
- **Release**: Informs SEO improvements

---

### SEO-001: Core Web Vitals Baseline
- **Workstream**: SEO
- **Owner**: Marketing/SEO Agent
- **Status**: BACKLOG
- **Goal**: Measure current Core Web Vitals and establish baseline for improvement
- **Scope**:
  - Run Lighthouse on all key pages (home, programs, about, contact, blog index)
  - Document LCP, CLS, INP, FCP, TTFB for each
  - Identify top 3 performance bottlenecks
  - Create optimization tickets based on findings
- **Non-goals**:
  - Don't fix yet — measure first
- **Acceptance Criteria**:
  - [ ] Lighthouse scores documented for 5+ key pages
  - [ ] Top 3 bottlenecks identified with specific causes
  - [ ] Optimization tickets created in NEXT.md
  - [ ] Baseline documented in `ops/50_REPORTS/audit-findings.md`
- **Touched Files**:
  - `ops/50_REPORTS/audit-findings.md`
  - `ops/10_BACKLOG/NEXT.md`
- **Test Plan**: Run Lighthouse, record scores
- **Telemetry**: No new events
- **Release**: Informs CWV optimization

---

## Research

*(RES-001 completed 2026-02-26 — see DONE section)*

---

## Release / QA

### REL-001: QA Checklists + Release Plan
- **Workstream**: Release
- **Owner**: QA/Release Agent
- **Status**: BACKLOG
- **Goal**: Create comprehensive QA checklists for all three apps and a v1.3 release plan
- **Scope**:
  - Mobile smoke test checklist (15+ items)
  - Portal smoke test checklist (10+ items)
  - Marketing smoke test checklist (10+ items)
  - Release timeline for v1.3 mobile
  - App Store submission checklist
- **Non-goals**:
  - Not doing the actual QA yet — creating the system
- **Acceptance Criteria**:
  - [ ] `CHECKLIST_QA.md` complete with all three app checklists
  - [ ] `RELEASE_PLAN.md` has v1.3 timeline with milestones
  - [ ] `CHECKLIST_APP_STORE.md` covers iOS submission requirements
  - [ ] All checklists are actionable checkboxes, not prose
- **Touched Files**:
  - `ops/40_RELEASES/CHECKLIST_QA.md`
  - `ops/40_RELEASES/RELEASE_PLAN.md`
  - `ops/40_RELEASES/CHECKLIST_APP_STORE.md`
- **Test Plan**: Review checklists for completeness
- **Telemetry**: No new events
- **Release**: System infrastructure

---

## DONE

### RES-001: Competitor App Feature Analysis — DONE 2026-02-26
- **Owner**: Competitor Intel Agent
- **Output**: Full feature comparison matrix + 7 detailed findings + 5 top adoption recommendations + UX pattern analysis in `ops/50_REPORTS/competitor-snapshots.md`
- **Acceptance Criteria Results**:
  - [x] Feature comparison table complete for 3 competitors (16-row matrix)
  - [x] Top 5 adoption recommendations documented with effort (S/M/L)
  - [x] UX patterns documented (5 patterns with implementation details)
  - [x] 7 adoption tickets created in NEXT.md (MOB-040, MOB-018, WEB-030, SEO-010, SEO-011, MKT-020, MKT-021)
  - [x] Report written to `ops/50_REPORTS/competitor-snapshots.md`
- **Also completed in same session**: RES-002 (local competitors) and RES-003 (SEO keywords)
- **Tickets created**:
  - NEXT: MOB-040 (RSVP), MOB-018 (onboarding, promoted from LATER), WEB-030 (calendar sync), SEO-010 (GBP), SEO-011 (FAQ schema), MKT-020 (blog), MKT-021 (sport pages)
  - LATER: MOB-041 (progress stats), MOB-042 (achievements), MOB-050 (family accounts), MKT-022 (city pages), MKT-023 (testimonials), MKT-024 (video), MKT-025 (results page)
