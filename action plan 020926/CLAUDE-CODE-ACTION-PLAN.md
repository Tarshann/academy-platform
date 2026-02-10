# The Academy — Claude Code Implementation Plan

## CONTEXT

You are deploying two new program pages for The Academy (academytn.com), a youth athletic training business in Gallatin, TN. The site runs React 19 + Vite on Vercel.

**Two products, two lanes — never mix them:**

| | Academy Performance Lab | Academy Skills Lab |
|---|---|---|
| **What** | Premium membership — year-round structured development | Community drop-in — fundamentals & fun |
| **Price** | $280/month | $10/session |
| **Schedule** | Tue 7:15–8:15 PM + Thu 7:15–8:15 PM + Sun 11:00 AM–12:00 PM | Tue 6:00–7:00 PM + Thu 6:00–7:00 PM |
| **Ages** | 8–14, capped at 6–8 per group | All ages, up to 25–30 |
| **Sessions** | 3/week | 2/week |

Skills Lab runs directly before Performance Lab on Tue/Thu. This is intentional — the visual handoff sells Performance Lab without words.

---

## PHASE 1: DISCOVER CODEBASE STRUCTURE

Before making any changes, run these discovery commands:

```bash
# 1. Find the project root and framework config
find . -name "vite.config.*" -o -name "next.config.*" -o -name "package.json" | head -10

# 2. Find routing setup
find . -name "App.jsx" -o -name "App.tsx" -o -name "routes.*" -o -name "router.*" | head -10

# 3. Find existing pages directory
find . -type d -name "pages" -o -type d -name "views" -o -type d -name "routes" | head -10

# 4. Find existing API/backend directory
find . -type d -name "api" -o -type d -name "server" -o -name "express*" | head -10

# 5. Find navigation/header component
grep -rn "nav\|Nav\|Header\|header" --include="*.jsx" --include="*.tsx" -l | head -10

# 6. Check for existing Resend setup
grep -rn "resend\|RESEND" --include="*.js" --include="*.ts" --include="*.env*" -l | head -10

# 7. Check package manager
ls pnpm-lock.yaml yarn.lock package-lock.json 2>/dev/null
```

**Use the results to adapt file paths below.** The plan assumes standard React + Vite structure. Adjust directory names if the codebase differs.

---

## PHASE 2: ADD NEW PAGE FILES

### File Map

Source files are provided in `/mnt/user-data/outputs/`. All files are **pre-renamed and pre-configured** with correct routes, component names, and API endpoints. Just copy to the right location:

| Source File | → Destination | Purpose |
|---|---|---|
| `academy-adm-pages/PerformanceLabPage.jsx` | `src/pages/PerformanceLabPage.jsx` | Landing page |
| `academy-adm-pages/PerformanceLabApplyPage.jsx` | `src/pages/PerformanceLabApplyPage.jsx` | Application form |
| `academy-adm-pages/SkillsLabPage.jsx` | `src/pages/SkillsLabPage.jsx` | Skills Lab landing |
| `academy-adm-pages/SkillsLabRegisterPage.jsx` | `src/pages/SkillsLabRegisterPage.jsx` | Skills Lab registration |
| `academy-adm-api/performance-lab-apply.js` | `src/api/performance-lab-apply.js` | Application form API |
| `academy-adm-api/skills-lab-register.js` | `src/api/skills-lab-register.js` | Registration API |

> **IMPORTANT:** Adjust `src/pages/` and `src/api/` to match the actual codebase directory structure discovered in Phase 1.

All internal routes are already set to `/performance-lab`, `/performance-lab/apply`, `/skills-lab`, `/skills-lab/register`. All API endpoints point to `/api/performance-lab-apply` and `/api/skills-lab-register`. Component names are already `PerformanceLabPage`, `PerformanceLabApplyPage`, etc. No find-and-replace needed after copying.

---

## PHASE 3: ADD ROUTES

Find the router configuration (likely `App.jsx`, `App.tsx`, or a dedicated routes file) and add:

```jsx
import PerformanceLabPage from './pages/PerformanceLabPage';
import PerformanceLabApplyPage from './pages/PerformanceLabApplyPage';
import SkillsLabPage from './pages/SkillsLabPage';
import SkillsLabRegisterPage from './pages/SkillsLabRegisterPage';

// Add inside your router:
<Route path="/performance-lab" element={<PerformanceLabPage />} />
<Route path="/performance-lab/apply" element={<PerformanceLabApplyPage />} />
<Route path="/skills-lab" element={<SkillsLabPage />} />
<Route path="/skills-lab/register" element={<SkillsLabRegisterPage />} />
```

> Adjust import paths based on codebase structure. If using TypeScript, add `.tsx` extensions or configure module resolution.

---

## PHASE 4: ADD API ENDPOINTS

### If Express backend:

```js
import { performanceLabApplyHandler } from './api/performance-lab-apply.js';
import { skillsLabRegisterHandler } from './api/skills-lab-register.js';

app.post('/api/performance-lab-apply', express.json(), performanceLabApplyHandler);
app.post('/api/skills-lab-register', express.json(), skillsLabRegisterHandler);
```

### If tRPC:

Wrap the handler logic in a tRPC mutation. The Zod schema for Performance Lab applications:

```ts
const performanceLabApplySchema = z.object({
  parentName: z.string().min(1),
  parentPhone: z.string().min(1),
  parentEmail: z.string().email(),
  athleteName: z.string().min(1),
  athleteAge: z.string().min(1),
  currentSports: z.string(),
  trainingGoals: z.string().optional(),
  preferredDays: z.string().optional(),
  injuries: z.string().optional(),
  hearAbout: z.string().optional(),
  submittedAt: z.string(),
});
```

### If Vercel API routes (file-based):

Place the files as:
- `api/performance-lab-apply.js`
- `api/skills-lab-register.js`

And export the handler as default:
```js
export default async function handler(req, res) { ... }
```

---

## PHASE 5: ADD FONT IMPORT

In `index.html` (or root layout), add if not already present:

```html
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## PHASE 6: UPDATE NAVIGATION

Find the site header/nav component and add program links:

```jsx
{/* Programs dropdown or nav section */}
<Link to="/performance-lab" style={{
  background: '#E8722A', color: '#fff', padding: '8px 16px', borderRadius: 6
}}>Academy Performance Lab</Link>

<Link to="/skills-lab">Academy Skills Lab</Link>
```

**Nav order matters** — Performance Lab appears first (it's the revenue product).

---

## PHASE 7: ENVIRONMENT VARIABLES

Ensure `RESEND_API_KEY` is set in the Vercel dashboard (Settings → Environment Variables). The API routes send emails via Resend to:
- **Coach notification:** `theacademytn@gmail.com`
- **Parent confirmation:** applicant's email

Sending domain must cover `noreply@academytn.com` (or update the `from` address in both API files to match your verified Resend domain).

---

## PHASE 8: VERIFY BEFORE DEPLOY

Run the build locally:

```bash
pnpm build  # or npm run build / yarn build
```

Fix any import errors, missing dependencies, or TypeScript issues.

Then check each page manually:

### Performance Lab (`/performance-lab`)
- [ ] Page loads with correct hero, pricing card ($280/month), FAQ section
- [ ] All "Apply for Performance Lab" buttons navigate to `/performance-lab/apply`
- [ ] FAQ says "three sessions per week"
- [ ] Pricing card includes "Leadership opportunities for older athletes (ages 13–14, by invitation)"
- [ ] Pricing card includes "Sunday makeup / open session access"
- [ ] Sticky mobile CTA appears after scrolling past hero and hides near footer
- [ ] Zero mentions of "ADM" in visible text
- [ ] Zero mentions of "Skills Lab" (Performance Lab page never references Skills Lab)

### Performance Lab Application (`/performance-lab/apply`)
- [ ] Form loads with all fields
- [ ] Form submits to `/api/performance-lab-apply`
- [ ] Coach Mac receives notification email
- [ ] Parent receives confirmation email
- [ ] Success state displays correctly
- [ ] "← Back to Performance Lab" link works

### Skills Lab (`/skills-lab`)
- [ ] Page loads with correct hero, schedule (Tue/Thu 6:00–7:00 PM), pricing ($10/session)
- [ ] Schedule shows Tuesday and Thursday (NOT Friday/Sunday)
- [ ] "What to Expect" section says "Movement prep to get loose and ready to go" (NOT "builds coordination and body awareness")
- [ ] "What to Expect" last item says "Wrap-up and a high note to end on" (NOT "one thing to practice at home")
- [ ] "What it's not" line present: "Skills Lab is not a long-term training program or membership"
- [ ] Performance Lab mentioned ONLY once at very bottom as a soft signpost
- [ ] Bottom signpost reads: "Families looking for year-round, structured weekly training can learn about the Academy Performance Lab."
- [ ] Zero mentions of "ADM" anywhere

### Skills Lab Registration (`/skills-lab/register`)
- [ ] Form loads with session chips: "Tuesday 6:00–7:00 PM" and "Thursday 6:00–7:00 PM"
- [ ] Form submits to `/api/skills-lab-register`
- [ ] Coach Mac receives notification email
- [ ] $10 per session pricing referenced correctly
- [ ] "← Back" link returns to `/skills-lab`

### Cross-Page Integrity
- [ ] Performance Lab page never mentions Skills Lab
- [ ] Skills Lab page mentions Performance Lab only once (bottom signpost)
- [ ] No page references "ADM" or "Athlete Development Membership"
- [ ] No page references Friday or Sunday for Skills Lab schedule
- [ ] All pages responsive on mobile

---

## PHASE 9: DEPLOY

```bash
git add .
git commit -m "feat: add Academy Performance Lab + Skills Lab pages

- Performance Lab: $280/month membership landing page + application form
- Skills Lab: $10/session drop-in landing page + registration form
- API endpoints for both application and registration flows
- Resend email integration for coach notifications + parent confirmations
- Leadership Demo Program included in Performance Lab pricing features
- Schedule: Skills Lab Tue/Thu 6-7pm, Performance Lab Tue/Thu 7:15-8:15pm + Sun 11am"

git push origin main
```

Or deploy directly:
```bash
vercel --prod
```

---

## PHASE 10: POST-DEPLOY UPDATES

After `/performance-lab` and `/skills-lab` are live:

1. **Homepage:** Add a prominent callout or banner linking to `/performance-lab`
2. **Programs page (if exists):** Feature Performance Lab as primary offering
3. **Social media bio:** Update link to `academytn.com/performance-lab`
4. **Google Business:** Update services/offerings
5. **Remove conflicting language:** Ensure no existing page references "the barn" — use "Academy Performance Center" everywhere

---

## REFERENCE: PRICING STRUCTURE

| Item | Price |
|---|---|
| Performance Lab (single athlete) | $280/month |
| Performance Lab (sibling) | $230/month ($50 off) |
| Performance Lab (referral first month) | $230 ($50 off) |
| Skills Lab (per session) | $10 |

---

## REFERENCE: COMPLETE WEEKLY SCHEDULE

| Day | Time | Program | Cap |
|---|---|---|---|
| Tuesday | 6:00–7:00 PM | Skills Lab | 25–30 |
| Tuesday | 7:15–8:15 PM | Performance Lab | 6–8/group |
| Thursday | 6:00–7:00 PM | Skills Lab | 25–30 |
| Thursday | 7:15–8:15 PM | Performance Lab | 6–8/group |
| Sunday | 11:00 AM–12:00 PM | Performance Lab | 6–8/group |

**Leadership Demo:** 2–3 selected Performance Lab athletes (ages 13–14) arrive at 6:30 PM on Tue/Thu to help coach the competitive games segment of Skills Lab (6:35–7:00), then transition into their Performance Lab session at 7:15. Rotation of 3–4 athletes, ~1 session each per week.

---

## REFERENCE: FILE INVENTORY

All source files are in `/mnt/user-data/outputs/`:

```
outputs/
├── academy-adm-pages/
│   ├── PerformanceLabPage.jsx          ← deploy (landing page)
│   ├── PerformanceLabApplyPage.jsx     ← deploy (application form)
│   ├── SkillsLabPage.jsx              ← deploy (Skills Lab landing)
│   └── SkillsLabRegisterPage.jsx      ← deploy (Skills Lab registration)
├── academy-adm-api/
│   ├── performance-lab-apply.js        ← deploy (application API)
│   └── skills-lab-register.js          ← deploy (registration API)
├── Coach-Playbook-PerformanceLab-vs-SkillsLab.pdf   (internal doc, not deployed)
├── TheAcademy_PerformanceLab_Product_Offering.docx   (internal doc, not deployed)
├── ADM-Landing-Page-Critique.md                       (internal doc, not deployed)
├── INTEGRATION-GUIDE.md                               (reference, not deployed)
├── CLAUDE-CODE-ACTION-PLAN.md                         (this file)
└── academy-adm-landing-page.html                      (standalone HTML alternative, not deployed unless needed)
```

**Only the 4 page files + 2 API files get deployed.** Everything else is internal documentation.

---

## CRITICAL RULES

1. **"ADM" must not appear anywhere in user-facing text.** The product is called "Academy Performance Lab" (formal) or "Performance Lab" (shorthand). Variable names in code are fine but display text must be clean.

2. **Skills Lab page must NOT use development/training language.** It says "fundamentals, movement, and positive competition" — never "movement education" or "introduction to structured training." Those are Performance Lab territory.

3. **Skills Lab mentions Performance Lab exactly once** — at the very bottom as a signpost, not a sell.

4. **Performance Lab page never mentions Skills Lab.** They are parallel lanes.

5. **All routes use `/performance-lab` prefix** (not `/adm`). All API endpoints use `/api/performance-lab-apply` (not `/api/adm-apply`).
