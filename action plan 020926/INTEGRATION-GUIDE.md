# Performance Lab Integration Guide — Vercel + React 19 + Vite

## Files Included

```
academy-performance-lab/
├── pages/
│   ├── ADMPage.jsx          # Landing page (/adm)
│   └── ADMApplyPage.jsx     # Application form (/adm/apply)
├── api/
│   └── adm-apply.js         # Backend handler for form submissions (Resend email)
└── INTEGRATION-GUIDE.md     # This file
```

---

## Step 1: Add Font Import

In your `index.html` (or root CSS file), add:

```html
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## Step 2: Add Routes

In your React Router configuration (likely `App.jsx` or `routes.jsx`):

```jsx
import ADMPage from './pages/ADMPage';
import ADMApplyPage from './pages/ADMApplyPage';
import SkillsLabPage from './pages/SkillsLabPage';
import SkillsLabRegisterPage from './pages/SkillsLabRegisterPage';

// Inside your router:
<Route path="/adm" element={<ADMPage />} />
<Route path="/adm/apply" element={<ADMApplyPage />} />
<Route path="/skills-lab" element={<SkillsLabPage />} />
<Route path="/skills-lab/register" element={<SkillsLabRegisterPage />} />
```

---

## Step 3: Add Navigation Links

In your site header/nav component, add links under a "Programs" dropdown:

```jsx
{/* Programs dropdown */}
<Link to="/adm" style={{ 
  background: '#E8722A', color: '#fff', padding: '8px 16px', borderRadius: 6 
}}>Performance Lab Membership</Link>

<Link to="/skills-lab">Skills Lab</Link>
```

**Nav order matters** (reinforces Performance Lab as primary):
- Programs
  - Academy Performance Lab
  - Academy Skills Lab

---

## Step 4: Wire Up the API Endpoint

### Option A: Express Route (if your backend uses Express)

In your Express server file:

```js
import { admApplyHandler } from './api/adm-apply.js';
import { skillsLabRegisterHandler } from './api/skills-lab-register.js';

app.post('/api/adm-apply', express.json(), admApplyHandler);
app.post('/api/skills-lab-register', express.json(), skillsLabRegisterHandler);
```

### Option B: tRPC Mutation (if you prefer tRPC)

```ts
import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

const admApplySchema = z.object({
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

export const admRouter = router({
  submitApplication: publicProcedure
    .input(admApplySchema)
    .mutation(async ({ input }) => {
      // Copy the Resend email logic from adm-apply.js
    }),
});
```

Then update `ADMApplyPage.jsx` to use:
```js
const mutation = trpc.adm.submitApplication.useMutation();
await mutation.mutateAsync(formData);
```

---

## Step 5: Environment Variables

Ensure these are set in your Vercel dashboard (Settings → Environment Variables):

| Variable | Value | Notes |
|----------|-------|-------|
| `RESEND_API_KEY` | `re_xxxxx` | You likely already have this configured |

The API route sends two emails:
1. **Coach Mac notification** → `theacademytn@gmail.com` with full application details
2. **Parent confirmation** → applicant's email with next-steps info

Make sure your Resend sending domain covers `noreply@academytn.com` (or update the `from` address in the API route to match your verified domain).

---

## Step 6: Deploy

```bash
pnpm build
vercel --prod
```

Or if you have Git integration, just push to your main branch.

---

## Step 7: Verify

After deployment, check:

**Performance Lab:**
- [ ] `academytn.com/adm` loads the landing page
- [ ] All "Apply for Performance Lab" buttons navigate to `/adm/apply`
- [ ] Application form submits successfully
- [ ] Coach Mac receives the notification email
- [ ] Parent receives the confirmation email
- [ ] FAQ toggles work on mobile
- [ ] Sticky mobile CTA appears after scrolling past hero
- [ ] Sticky mobile CTA hides near footer

**Skills Lab:**
- [ ] `academytn.com/skills-lab` loads correctly
- [ ] "Register" buttons navigate to `/skills-lab/register`
- [ ] Registration form submits successfully
- [ ] Coach Mac receives the registration email
- [ ] Single soft Performance Lab mention appears only at bottom of page
- [ ] Page is intentionally simpler than /adm (by design)

**Both:**
- [ ] Pages are responsive on phone/tablet
- [ ] No cross-contamination (Performance Lab page doesn't mention Skills Lab, Skills Lab has only one Performance Lab link at bottom)

---

## Step 8: Update Existing Site References

Once `/adm` is live:

1. **Homepage**: Update the "Programs" section to feature Performance Lab prominently, or add a banner/callout
2. **Programs page**: Add Performance Lab as the featured/primary offering
3. **Navigation**: Add "Performance Lab" or "Membership" link
4. **Social media bio**: Update link to `academytn.com/adm`
5. **Remove conflicting language**: Ensure no page still references "the barn" — use "Academy Performance Center" everywhere

---

## Optional: Redirect `/programs` to Feature Performance Lab

If Performance Lab is now your primary offering, consider adding a prominent Performance Lab callout at the top of `/programs`, or redirecting session-based offerings to show Performance Lab first with individual sessions as secondary.

---

## Database Integration (Phase 2)

If you want to store applications in PostgreSQL via Drizzle:

```ts
// schema
export const admApplications = pgTable('adm_applications', {
  id: serial('id').primaryKey(),
  parentName: varchar('parent_name', { length: 255 }).notNull(),
  parentPhone: varchar('parent_phone', { length: 50 }).notNull(),
  parentEmail: varchar('parent_email', { length: 255 }).notNull(),
  athleteName: varchar('athlete_name', { length: 255 }).notNull(),
  athleteAge: varchar('athlete_age', { length: 50 }).notNull(),
  currentSports: text('current_sports'),
  trainingGoals: text('training_goals'),
  preferredDays: varchar('preferred_days', { length: 100 }),
  injuries: text('injuries'),
  hearAbout: varchar('hear_about', { length: 100 }),
  status: varchar('status', { length: 20 }).default('pending'), // pending, contacted, enrolled, declined
  createdAt: timestamp('created_at').defaultNow(),
});
```

This lets you track applications, conversion rates, and attribution data directly in your app's admin panel.
