# Competitor Snapshots

> Research findings from RES-001, RES-002, RES-003.
> Generated: 2026-02-26 by Competitor Intel Agent

---

## Feature Comparison Matrix (RES-001)

### Academy v1.2 vs. National Competitors

| Feature | TeamSnap | SportsEngine | GameChanger | Academy v1.2 | Gap? |
|---------|----------|--------------|-------------|--------------|------|
| Schedule + Calendar | Yes (calendar sync, RSVP) | Yes (with facility scheduling) | Yes (game schedule) | Partial (view + register, no calendar sync) | YES |
| In-App Registration | Yes (via org) | Yes (primary feature) | No (team-level only) | No (mobile), Yes (portal) | YES (mobile) |
| In-App Payments | Yes (dues, invoicing) | Yes (registration fees) | Yes (subscriptions) | No (mobile), Yes (portal Stripe) | YES (mobile) |
| Real-Time Chat | Yes (basic, no threading) | Yes (coach-parent messaging) | No (feed-based) | Yes (Ably + SSE, channels + DM) | NO - Academy leads |
| Direct Messaging | Yes (manager-member) | Yes (role-based) | No | Yes (full DM with block/mute/archive) | NO - Academy leads |
| Push Notifications | Yes (schedule changes) | Yes (announcements) | Yes (every play, aggressive) | Yes (Expo + APNs) | PARITY |
| Attendance Tracking | No (RSVP only) | No | No | Yes (portal: mark + view stats) | NO - Academy leads |
| Photo/Video Gallery | Yes (team photos, limited) | No (separate SportsEngine Play) | Yes (AI highlights, streaming) | Partial (portal gallery + video embeds, not mobile) | YES (mobile) |
| Team Roster/Profiles | Yes (player profiles, emergency contacts) | Yes (full roster management) | Yes (player profiles + career stats) | No (admin roster only, no member-facing) | YES |
| Stats & Progress | Basic (game stats) | No | Yes (comprehensive, spray charts) | No | YES |
| Merchandise Shop | Yes (via SquadLocker) | No | No (DICK'S integration) | Partial (portal backend ready, frontend incomplete) | YES |
| Offline Support | No | No | No | No | PARITY (none) |
| Dark Mode | No | No | No | No | PARITY (none) |
| Onboarding Flow | Yes (invite code, profile setup) | Yes (org-initiated registration) | Yes (guided team creation) | No (straight to login) | YES |
| Calendar Sync | Yes (iCal export) | Yes (iCal export) | Yes | No | YES |
| Live Scoring/Stats | Yes (basic) | Yes (standings) | Yes (primary feature) | No | PARTIAL (not relevant to training) |
| Volunteer Management | Yes (snack/carpool signup) | Yes (role assignment) | No | No | LOW PRIORITY |
| Background Checks | No (TeamSnap for Business) | Yes (built-in SafeSport) | No | No | NOT NEEDED |
| Website Builder | Yes (for Business tier) | Yes (SportsEngine Sites) | No | Yes (separate marketing site) | PARITY |
| Multi-Team/Org View | Yes (family-level aggregation) | Yes (cross-org family view) | Yes (per-sport) | No (single facility) | NOT RELEVANT |

### App Store Ratings Comparison

| Platform | iOS Rating | Android Rating | Estimated Users |
|----------|-----------|---------------|-----------------|
| TeamSnap | ~4.6-4.7 | ~4.2-4.4 | 25M+ |
| SportsEngine | ~2.5-3.0 | ~2.5-3.0 | Millions (via NGBs) |
| GameChanger | ~4.6 | ~4.2 | Millions (baseball/softball dominant) |
| Academy | New (v1.2) | N/A | < 500 |

---

## UX Patterns Worth Adopting

### 1. One-Tap Availability/RSVP (from TeamSnap)
- **Observation**: TeamSnap's most-praised feature is one-tap RSVP for games/practices. Parents mark "Going / Maybe / Not Going" from the notification or home screen without opening event details.
- **Why it matters**: Reduces friction to absolute minimum. Coaches see attendance predictions at a glance. Drives daily app opens (engagement).
- **How to implement**: Add RSVP buttons to session cards in `academy-app/app/(tabs)/schedule.tsx`. Backend: new `session.rsvp` tRPC mutation adding a `sessionRsvp` table to `drizzle/schema.ts`.
- **Effort**: M (1-2 sessions)
- **Ticket created**: MOB-040 in NEXT.md

### 2. Automatic Video Highlight Clips (from GameChanger)
- **Observation**: GameChanger's AI generates 10-20 second highlight clips from training sessions, then sends push notifications ("Watch Sarah's play!"). The emotional hook of parental pride drives viral sharing.
- **Why it matters**: GameChanger's highest engagement lever. Parents share clips to social media, driving organic acquisition. Emotional connection = retention.
- **How to implement**: Academy already has video infrastructure (WEB-021 planned). The "auto highlight" concept can be simplified: coach records a session, manually clips 15-30s highlights via the app, and shares. Full AI clips are L+ effort, but manual clip sharing is M.
- **Effort**: Already planned as MOB-030/031/032. The insight is to prioritize "coach shares a clip" → push notification to parents as the MVP engagement loop.
- **Ticket created**: Recommendation added to MOB-030 priority notes

### 3. Calendar Sync (from TeamSnap + SportsEngine)
- **Observation**: Both TeamSnap and SportsEngine offer iCal feed export so sessions appear in Google Calendar, Apple Calendar, and Outlook automatically. This is a "set it and forget it" feature that keeps the schedule visible without opening the app.
- **Why it matters**: Parents with 2-3 kids in activities live in their calendar app. If Academy sessions aren't there, they'll forget or double-book.
- **How to implement**: Generate iCal `.ics` feed per user from their registered sessions. New tRPC route `schedule.icalFeed` returns iCal formatted data. Mobile: "Add to Calendar" button using `expo-calendar` (already listed in MOB-021).
- **Effort**: S (< 1 session for server, M for mobile integration)
- **Ticket created**: WEB-030 in NEXT.md, MOB-021 already in LATER.md (promote)

### 4. Guided Onboarding Flow (from all three competitors)
- **Observation**: All three competitors have a guided onboarding: create account → profile → notification permissions → first action (view schedule / join team / score a game). Academy drops users straight to login with no guidance.
- **Why it matters**: First impression determines retention. If a parent downloads the app and doesn't know what to do, they uninstall. Target: time to first session registration < 3 minutes (per VISION.md).
- **How to implement**: 3-4 screen animated walkthrough using Reanimated. Already planned as MOB-018 in LATER.md but should be promoted to NEXT.
- **Effort**: L (3+ sessions, already scoped in MOB-018)
- **Ticket created**: Promote MOB-018 from LATER to NEXT

### 5. Family/Multi-Child Account View (from TeamSnap + SportsEngine)
- **Observation**: TeamSnap and SportsEngine let parents manage multiple children from one account. Families see all kids' schedules, payments, and communications in one place.
- **Why it matters**: Sports families almost always have 2+ kids in activities. A parent managing 3 kids needs one login, not three.
- **How to implement**: Database: `familyMembers` table linking parent userId to child userIds. UI: family switcher in profile. This is a significant feature that touches auth, scheduling, payments, and chat.
- **Effort**: L (3+ sessions, cross-cutting)
- **Ticket created**: MOB-050 in LATER.md

---

## Top 5 Adoption Recommendations

| # | Feature | Source | Impact | Effort | Ticket |
|---|---------|--------|--------|--------|--------|
| 1 | In-App Payments (Stripe Checkout) | TeamSnap, SportsEngine | **HIGH** (revenue: eliminates redirect friction, targets 15-25% mobile transactions) | M | MOB-004 (already in NOW) |
| 2 | Session RSVP / Availability Tracking | TeamSnap | **HIGH** (engagement: daily app opens, coach visibility, parent convenience) | M | MOB-040 in NEXT |
| 3 | Calendar Sync (iCal Export) | TeamSnap, SportsEngine | **MEDIUM-HIGH** (retention: keeps Academy in daily workflow) | S (server) + M (mobile) | WEB-030 + promote MOB-021 |
| 4 | Guided Onboarding Flow | All competitors | **HIGH** (retention: first impression, time-to-value < 3 min) | L | Promote MOB-018 to NEXT |
| 5 | Video Clip Sharing + Push Notifications | GameChanger | **HIGH** (engagement + acquisition: viral sharing, emotional hook) | L | MOB-030/031 (already in NEXT) |

### Honorable Mentions (Future Cycles)

| # | Feature | Source | Impact | Effort | Ticket |
|---|---------|--------|--------|--------|--------|
| 6 | Family/Multi-Child Accounts | TeamSnap, SportsEngine | Medium-High | L | MOB-050 (LATER) |
| 7 | App Store Rating Prompt | GameChanger | Medium | S | MOB-027 (LATER, promote if ratings dip) |
| 8 | Progress/Stats Dashboard | GameChanger | Medium | L | MOB-041 (LATER) |
| 9 | Coach Video Posts to Feed | GameChanger | Medium | M | Part of MOB-030 scope |
| 10 | Streak/Achievement Badges | Peloton/NTC (aspirational) | Medium | L | MOB-042 (LATER) |

---

## Detailed Findings (RES-001)

### Finding 1: Session RSVP Is the #1 Engagement Feature in Youth Sports Apps
- **Observation**: TeamSnap's most praised feature across 200K+ App Store reviews is one-tap availability tracking. Parents RSVP from push notification or home screen. Coaches see real-time attendance predictions. Both SportsEngine and GameChanger also include RSVP. Academy has registration but no RSVP/availability indicator for scheduled sessions.
- **Why it matters**: Drives daily app opens (check who's going), gives coaches planning data, and reduces no-shows. TeamSnap users cite this as the single reason they keep the app installed.
- **How to implement**: New `sessionRsvp` table (userId, scheduleId, status: going/maybe/not_going, createdAt). New tRPC routes: `session.rsvp` (upsert), `session.getRsvps` (list per session). Mobile UI: RSVP buttons on session card in schedule tab + push notification action buttons. Portal: show RSVP counts on admin schedule view.
- **Effort**: M (1-2 sessions)
- **Ticket created**: MOB-040 in NEXT.md

### Finding 2: Calendar Sync Is Expected Table Stakes
- **Observation**: Both TeamSnap and SportsEngine offer iCal feed export. Parents with multiple kids across sports rely on their calendar app as the master schedule. Not having calendar sync means Academy sessions compete for mental space against activities that DO sync.
- **Why it matters**: Retention mechanism. Once sessions are in the calendar, parents don't need to remember to check the app. Reduces no-shows by 15-30% (industry estimates).
- **How to implement**: Server: new route `schedule.icalFeed` generating `.ics` format from user's registered sessions. Mobile: "Add to Calendar" button using `expo-calendar`. Web portal: "Subscribe to Calendar" link with iCal URL.
- **Effort**: S (< 1 session for server endpoint) + M (mobile integration)
- **Ticket created**: WEB-030 in NEXT.md

### Finding 3: Video Highlight Sharing Is GameChanger's Killer Feature
- **Observation**: GameChanger's automatic highlight clips (AI-detected key moments → 15-second clips → push notification to parents → one-tap social sharing) drive their highest engagement and organic acquisition. Parents post clips to Instagram/Facebook, which attracts new families.
- **Why it matters**: Academy already has the video infrastructure planned (WEB-020/021/022, MOB-030/031/032/033). The key insight is that the MVP is NOT full AI clips -- it's "coach records training, clips a 15s highlight, posts to the feed → push notification to parents → parent shares to social media." This workflow alone captures 80% of the value.
- **How to implement**: Already scoped in existing tickets. The recommendation is to prioritize the sharing flow: clip upload → feed card with share button → native share sheet → social media. The push notification "Watch [child's name]'s highlight!" is the critical engagement trigger.
- **Effort**: Already planned (MOB-030-033)
- **Ticket created**: Priority note added to MOB-030

### Finding 4: Guided Onboarding Reduces First-Session Dropout
- **Observation**: All three competitors have multi-screen onboarding. TeamSnap: join team → profile → notifications → view schedule. SportsEngine: org registration → family setup → app download. GameChanger: create team → invite → first game. Academy drops users to a login screen with no guidance.
- **Why it matters**: VISION.md target is "time to first session registration < 3 minutes." Without onboarding, new users must: figure out login → find programs → understand schedule → register. Friction kills conversion.
- **How to implement**: Already planned as MOB-018. 3-4 Reanimated screens: Welcome → Browse Programs → Enable Notifications → View Schedule. Should be promoted from LATER to NEXT.
- **Effort**: L (3+ sessions)
- **Ticket created**: Promote MOB-018 from LATER to NEXT

### Finding 5: Competitor Monetization Through Transaction Fees Is a Revenue Opportunity
- **Observation**: TeamSnap charges ~2.9% + $0.30 on payment transactions. SportsEngine charges 3-4% + per-transaction fee. GameChanger monetizes through Plus subscriptions ($15.99/mo). All competitors generate significant revenue from payments flowing through their platform.
- **Why it matters**: Academy currently has Stripe integration in the portal but not in the mobile app. Getting mobile payments live (MOB-004) is the single highest-revenue-impact feature. Every session enrollment and shop purchase that happens in-app instead of via website redirect increases conversion and captures the full transaction.
- **How to implement**: MOB-004 is already in NOW.md. This finding reinforces its priority: it should be the FIRST mobile feature completed after foundation setup (MOB-001).
- **Effort**: Already planned (MOB-004)
- **Ticket created**: Priority confirmed for MOB-004

### Finding 6: SportsEngine's Low App Store Ratings (2.5-3.0) Reveal a Vulnerable Incumbent
- **Observation**: SportsEngine has the most institutional market power (NGB relationships, NBC Sports backing) but the worst user experience (2.5-3.0 app store ratings). Common complaints: crashes, confusing navigation, slow loading, login issues. Families forced onto SportsEngine by their league actively dislike the experience.
- **Why it matters**: Academy will never compete with SportsEngine at the NGB/league level. But for individual training facilities, the lesson is clear: user experience is the differentiator. A 4.5+ rated app with delightful UX wins against institutional giants with bad UX. Academy's opportunity is to be the best-in-class UX for small training facilities.
- **How to implement**: Maintain quality bar (QUALITY_BAR.md): skeleton screens, three-state screens (loading/error/empty), fast interactions, beautiful animations. Every screen ships with polish, not as an afterthought.
- **Effort**: Ongoing discipline
- **Ticket created**: No new ticket (reinforces existing quality bar)

### Finding 7: TeamSnap's Dated Chat Is an Academy Advantage
- **Observation**: TeamSnap's chat is flat (no threading, no reactions, no rich formatting), basic (text only, no image sharing), and often ignored by teams who use GroupMe, WhatsApp, or iMessage instead. SportsEngine's messaging is one-way (announcements). GameChanger has no messaging.
- **Why it matters**: Academy already has superior chat: real-time Ably-powered group channels, DMs with block/mute/archive, image uploads (portal), @mentions (portal). When mobile catches up (MOB-010 for images, MOB-011 for @mentions), Academy's chat will be significantly better than all three competitors.
- **How to implement**: Maintain investment in chat features. Prioritize MOB-010 (image upload) and MOB-011 (@mentions) as they directly differentiate against TeamSnap's weakness.
- **Effort**: Already planned
- **Ticket created**: No new tickets (reinforces MOB-010, MOB-011 priority)

---

## Local Competitors (RES-002)

### Gallatin / Sumner County / Nashville North Area

| # | Competitor | Location | Website | Programs | Estimated Reviews | Key Differentiator |
|---|-----------|----------|---------|----------|-------------------|-------------------|
| 1 | **D1 Training Hendersonville** | 117 Saundersville Rd, Hendersonville, TN | d1training.com/facility/hendersonville | Youth (ages 7-11, 12-14, 15-18), Adult, 5-pillar athletic training | 50-100+ (franchise brand) | National franchise, structured age-based programs, professional facility |
| 2 | **Six1Five Sports Training** | Mt. Juliet, Lebanon, Gallatin, Hendersonville | 615sportstraining.com | Baseball, Softball, Soccer, Football, Speed & Agility | Moderate | Multi-location, sport-specific lessons, regional presence |
| 3 | **N Zone Sports Northern TN** | Gallatin, TN | nzonesports.com/ntn | Soccer, Flag Football, T-Ball, Basketball, Cheerleading (ages 3-12) | Low-Moderate | Youth league focus (rec sports), convenient Gallatin location |
| 4 | **Sports Lab TN** | Between Mt. Juliet & Lebanon | facilitysportslab.com | Pitching, Hitting, Fielding lessons, Strength Training | Low-Moderate | Indoor facility, baseball/softball specialty |
| 5 | **Gallatin Parks & Recreation Youth Leagues** | Gallatin, TN | gallatintn.gov/457/Youth-Leagues | Basketball, Baseball, Football, Soccer leagues (ages 5-16) | N/A (municipal) | Free/low-cost rec leagues, established community presence |
| 6 | **Hendersonville Parks Youth Athletics** | Hendersonville, TN | hvilletn.org/286/Youth-Athletics | Various youth league sports | N/A (municipal) | Free/low-cost, established in community |
| 7 | **Next Level Athlete Training** | Middle Tennessee | nextlevelathletetraining.com | Speed & Agility, Sport-Specific Training | Low | Youth to professional, performance focus |
| 8 | **26 Training Academy** | Nashville area | 26trainingacademy.com | Track & Field, Football/Soccer conditioning, Speed & Agility | Low | Track & field specialty, conditioning focus |
| 9 | **i9 Sports East Nashville** | East Nashville, TN | i9sports.com | Flag Football, Soccer, Basketball (ages 3-14) | Moderate (franchise) | National franchise, recreational focus, convenience |

### Competitive Landscape Assessment

**Academy's Direct Competitors** (most overlapping):
1. **D1 Training Hendersonville** -- Most direct threat. Professional facility, structured youth programs, national brand recognition. However: franchise model = less personalized, higher pricing, no tech platform for members.
2. **Six1Five Sports Training** -- Multi-sport training across the same service area. More sport-specific (baseball/softball heavy), less performance/SAQ focused.
3. **N Zone Sports** -- Younger age range (3-12) with rec sports focus. Less overlap with Academy's performance training positioning.

**Academy's Advantages Over Local Competitors**:
- **Technology platform**: No local competitor has a member portal + mobile app + real-time chat + attendance tracking. This is a major differentiator.
- **Multi-sport SAQ focus**: Most competitors are sport-specific (baseball) or franchise-generic (D1). Academy's SAQ + multi-sport approach is distinctive.
- **Drop-in model**: Skills Lab at $10/session is unique. Competitors require memberships or packages.
- **Community features**: Chat, announcements, coach communication -- none of the local competitors offer in-app community features.

**Academy's Vulnerabilities**:
- **Facility/brand recognition**: D1 Training has national brand awareness. Academy needs to build local brand through SEO and word-of-mouth.
- **Review volume**: D1 and franchises have more Google Reviews. Academy needs aggressive review generation.
- **Sport-specific depth**: Families wanting pure baseball training will choose Sports Lab TN or Six1Five over Academy.

### Local SEO Recommendations

1. **Claim and optimize Google Business Profile immediately** -- This is the #1 local SEO action. Academy's `layout.tsx` has Google verification commented out, suggesting GBP may not be fully active. D1 Hendersonville has a fully optimized profile.

2. **Aggressively generate Google Reviews** -- Target 5 new reviews per month. After each 6-week cohort, send a follow-up asking parents for a review. Goal: 30+ reviews within 6 months.

3. **Create city-specific landing pages** for Hendersonville, Mt. Juliet, Lebanon, and Goodlettsville. D1 Training has individual location pages ranking for each city. Academy has one local page.

4. **Target "near me" keywords with Google Business Posts** -- Weekly posts about upcoming sessions, training tips, and athlete highlights keep the GBP active and improve local pack ranking.

5. **Position against D1 Training** -- Create comparison content: "How Academy Compares to Franchise Training" emphasizing personalized coaching, community features, flexible pricing (drop-in), and technology platform.

---

## SEO Keyword Analysis (RES-003)

### Top 20 Target Keywords

| # | Keyword | Volume Est. | Competition | Currently Targeted? |
|---|---------|-------------|-------------|-------------------|
| 1 | youth athletic training Gallatin TN | Low (50-150) | Low | Yes (dedicated page) |
| 2 | sports training near me (Gallatin) | High (5K-10K national) | High | No |
| 3 | youth basketball training Gallatin TN | Low (30-80) | Low | Partial (no dedicated page) |
| 4 | speed and agility training for kids | Medium (500-1K) | Medium | Partial (mentioned) |
| 5 | youth sports academy Nashville | Medium (200-500) | Medium | No |
| 6 | flag football training near me | Medium (300-700) | Low-Medium | No dedicated page |
| 7 | youth strength and conditioning program | Medium (300-600) | Medium | No dedicated page |
| 8 | SAQ training for youth athletes | Low (50-150) | Low | Yes (mentioned throughout) |
| 9 | kids athletic training Hendersonville TN | Low (20-60) | Low | Partial (service area listed) |
| 10 | multi-sport training kids Tennessee | Low (30-80) | Low | Yes (core message) |
| 11 | private sports training for kids | Medium (200-500) | Medium | Yes (program page exists) |
| 12 | best youth sports academy in Tennessee | Low (50-150) | Medium | No |
| 13 | how to improve my child's speed | Medium (500-1K) | Medium | No (blog planned but unpublished) |
| 14 | youth soccer training Sumner County | Low (20-50) | Low | No dedicated page |
| 15 | sports performance testing for kids | Low (50-150) | Low | Mentioned but no page |
| 16 | after school sports program Gallatin | Low (30-80) | Low | No |
| 17 | youth football training near Nashville | Low (50-150) | Medium | No |
| 18 | athletic development ages 8-14 | Low (20-60) | Low | Core offering, not targeted |
| 19 | drop in youth sports training | Low (30-80) | Low | Yes (Skills Lab) but not optimized |
| 20 | youth personal trainer Gallatin Tennessee | Low (10-30) | Low | No dedicated page |

### Quick Win Keywords (Fastest Path to Page 1)

| Keyword | Why Winnable | Action |
|---------|-------------|--------|
| SAQ training youth Gallatin TN | Extremely niche, no local competition | Add H2 on local SEO page |
| drop in youth sports Gallatin Tennessee | High intent, Academy's $10 Skills Lab is unique | Dedicated section or page |
| youth basketball training Sumner County | Few local options target this specifically | Dedicated sport page |
| kids speed training Hendersonville TN | Zero competition for this long-tail | Service-area page for Hendersonville |
| youth flag football training near Nashville | Flag football booming, few target this | Dedicated sport page |

### Content Gap Analysis

| Content Type | Competitors Have | Academy Status | Priority |
|-------------|-----------------|---------------|----------|
| Blog posts (parent education) | 10-100+ articles | 0 published (3 "Coming Soon") | CRITICAL |
| Sport-specific landing pages | Dedicated per sport | None (all sports share generic pages) | HIGH |
| City-specific landing pages | Per location served | 1 page only (Gallatin) | HIGH |
| Video content (training clips) | Embedded throughout | Zero video on marketing site | MEDIUM |
| Testimonials/reviews | 10-200+ across platforms | 3 on site, Google Reviews unknown | HIGH |
| Results/metrics page | Before/after athlete data | Mentioned in copy, no data shown | MEDIUM |
| FAQ schema markup | Rich snippets in Google | FAQ exists but no FAQPage schema | HIGH (easy win) |
| Age-group specific pages | Common in training facilities | None | MEDIUM |

### SEO Recommendations (Prioritized)

| # | Action | Impact | Effort | Ticket |
|---|--------|--------|--------|--------|
| 1 | Activate Google Business Profile + review campaign | HIGH | LOW | SEO-010 |
| 2 | Publish first 5 blog posts (requires blog routing) | HIGH | MEDIUM | MKT-020 |
| 3 | Create 4 sport-specific landing pages | HIGH | LOW | MKT-021 |
| 4 | Add FAQPage schema markup | MEDIUM | LOW | SEO-011 |
| 5 | Create 3 service-area city pages | MEDIUM-HIGH | LOW | MKT-022 |
| 6 | Expand testimonials to 10+ on site | MEDIUM | LOW-MEDIUM | MKT-023 |
| 7 | Add video content to marketing site | MEDIUM | MEDIUM | MKT-024 |
| 8 | Create results/metrics page | MEDIUM | MEDIUM | MKT-025 |

---

## Competitor Monetization Comparison

| Revenue Stream | TeamSnap | SportsEngine | GameChanger | Academy (Current) | Academy (Opportunity) |
|---------------|----------|--------------|-------------|--------------------|-----------------------|
| SaaS Subscription | $13-15/mo per team | $500-$25K/yr per org | $15.99/mo Plus | Membership model (recurring Stripe) | Expand subscription tiers |
| Transaction Fees | ~2.9% + $0.30 | ~3-4% + flat fee | Via Plus sub | Stripe standard fees | Already capturing |
| In-App Advertising | Free tier ads | Sponsored site zones | Free tier ads + DICK'S | None | NOT RECOMMENDED (small scale) |
| Merchandise/Retail | SquadLocker partnership | None | DICK'S integration | Shop backend ready, frontend pending | Complete shop (MOB-006) |
| Data/Audience | Sports family graph sold to advertisers | NGB data within Comcast | Youth sports data to DICK'S | None | NOT RELEVANT (too small) |
| Premium Content | None | SportsEngine Play (video) | AI highlights (Plus) | None | Training content library (future) |

---

## Key Takeaways for Academy Strategy

### Where Academy Already Wins
1. **Chat/Messaging** -- Superior to all three competitors. Ably real-time, DMs, channels, @mentions, image uploads, block/mute. Maintain this lead.
2. **Attendance Tracking** -- None of the three competitors offer true attendance tracking with stats. Academy has this in the portal.
3. **Integrated Platform** -- Marketing site + Member portal + Mobile app as one ecosystem. Competitors are either team-management-only (TeamSnap) or org-management-only (SportsEngine).
4. **Drop-In Model** -- $10 Skills Lab is unique in the market. No competitor offers true drop-in athletic training at this price point.

### Where Academy Must Catch Up (v1.3 Priority)
1. **Mobile Payments** -- MOB-004 (already in NOW). Without this, every transaction requires a website redirect.
2. **Session RSVP** -- New ticket MOB-040. The single most valued feature in youth sports apps.
3. **Calendar Sync** -- New ticket WEB-030. Expected table stakes.
4. **Onboarding Flow** -- Promote MOB-018. First impression determines retention.

### Where Academy Should Differentiate (v1.4+)
1. **Video clip sharing** -- Already planned. Prioritize the "coach posts highlight → parent gets push → shares to social" loop.
2. **Progress tracking** -- No competitor does this well for training facilities. Track speed improvements, attendance streaks, skill progression. This is Academy's unique opportunity.
3. **Community features** -- Academy's chat superiority + announcements + coach DMs create a community platform competitors don't have. Double down.
