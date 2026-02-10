# ⚠️ AGENT CONSTRAINTS — READ BEFORE DOING ANYTHING

## You are working in the Academy-platform monorepo.

**Stop. Do not write code yet.** Complete every step in Phase 0 before touching any files. Skipping this will break the build.

---

## PHASE 0: MANDATORY PRE-FLIGHT (DO THIS FIRST)

### Step 0.1 — Create a feature branch

```bash
git checkout -b feat/performance-lab-skills-lab
```

**NEVER commit directly to `main`.** All work happens on this branch. The owner will review and merge.

### Step 0.2 — Map the monorepo structure

```bash
# Print the top-level structure
ls -la
cat package.json | head -20

# Find the workspace configuration
cat package.json | grep -A 10 "workspaces"
# OR
cat pnpm-workspace.yaml

# Map packages
ls packages/
ls packages/web/src/ | head -20
ls packages/web/src/pages/ 2>/dev/null || ls packages/web/src/views/ 2>/dev/null || ls packages/web/src/routes/ 2>/dev/null

# Find the router
grep -rn "Route\|createBrowserRouter\|BrowserRouter" packages/web/src/ --include="*.jsx" --include="*.tsx" -l

# Find the nav/header
grep -rn "nav\|Nav\|Header\|<header" packages/web/src/ --include="*.jsx" --include="*.tsx" -l

# Find existing API routes
ls packages/server/src/ 2>/dev/null || ls packages/web/src/api/ 2>/dev/null || find . -path "*/api/*" -name "*.js" -o -name "*.ts" | head -20

# Check the build tool
cat packages/web/package.json | grep -A 3 "scripts"
cat packages/web/package.json | grep -A 5 "dependencies" | head -20

# Check for Resend
grep -rn "resend\|RESEND" --include="*.js" --include="*.ts" --include="*.env*" -l 2>/dev/null

# Check for existing CSS strategy
find packages/web/src -name "*.css" -o -name "*.module.css" -o -name "*.scss" | head -10
grep -rn "tailwind\|Tailwind" packages/web/ --include="*.config.*" --include="*.css" -l 2>/dev/null
```

### Step 0.3 — Record your findings

Before proceeding, write down:

1. **Package manager:** pnpm / npm / yarn
2. **Web package location:** `packages/web/` or ___
3. **Pages directory:** `packages/web/src/pages/` or ___
4. **Router file:** ___ (path to the file containing Route definitions)
5. **Nav/header file:** ___ (path to the navigation component)
6. **API directory:** `packages/server/src/routes/` or ___
7. **Build tool:** Vite / react-scripts / Next.js
8. **CSS strategy:** CSS modules / Tailwind / styled-components / inline
9. **TypeScript:** yes / no
10. **Existing Resend setup:** yes / no (and where)

**ADAPT ALL PATHS IN THE ACTION PLAN TO MATCH THESE FINDINGS.**

### Step 0.4 — Verify clean build state

```bash
# Make sure the current codebase builds before you touch anything
cd packages/web && pnpm build
```

If this fails, STOP. Do not proceed. The codebase has pre-existing build issues that must be resolved first. Report back to the owner.

---

## HARD RULES (NEVER VIOLATE)

### 1. FILE PLACEMENT
- **Pages go inside `packages/web/src/pages/`** (or wherever existing pages live). NOT at the repo root. NOT in a new top-level directory.
- **API routes go inside `packages/server/`** (or wherever the existing backend lives). NOT in `packages/web/`.
- **Do NOT create new top-level directories.** Work within the existing package structure.

### 2. DEPENDENCIES
- **Install to the correct workspace package**, not the root:
  ```bash
  # CORRECT
  pnpm --filter @academy-portal/web add react-router-dom
  
  # WRONG
  pnpm add react-router-dom  # This adds to root, not to web package
  ```
- **Do NOT install any new dependencies unless absolutely required.** The provided JSX files use only React, React Router, and inline styles. If React Router is already installed in `packages/web`, you need nothing else for the pages.
- **Resend** is only needed in the server/API package. Check if it's already installed before adding it.

### 3. IMPORTS AND ROUTING
- **Match the existing import pattern.** If the codebase uses `import X from './pages/X'`, do the same. If it uses `import X from '@/pages/X'`, use that.
- **Match the existing Route pattern.** If routes are defined in `App.jsx` with `<Route>`, add yours there. If they use `createBrowserRouter`, add to the router config. Do NOT create a separate routing file.
- **Check for a Layout wrapper.** If existing routes are wrapped in a `<Layout>` or `<MainLayout>` component, wrap the new pages the same way so they get the site header/footer.

### 4. STYLING
- **The provided JSX files use inline styles.** This is intentional — it avoids conflicts with whatever CSS strategy the codebase uses (Tailwind, CSS modules, etc.).
- **Do NOT convert inline styles to Tailwind or CSS modules.** The inline approach is a deliberate isolation strategy.
- **Do NOT create new CSS files** for these pages.

### 5. DO NOT MODIFY EXISTING FILES (except these)
You may ONLY modify:
- **The router file** (to add new routes)
- **The nav/header component** (to add program links)
- **The server entry point** (to add API endpoints, if Express-based)

You may NOT modify:
- Any existing page files
- package.json scripts (unless adding a postinstall for Resend)
- Build configuration (vite.config, webpack, etc.)
- Any existing API routes
- Database schemas
- Environment variable files (.env)

### 6. BUILD VERIFICATION
After adding files, run the build BEFORE committing:
```bash
cd packages/web && pnpm build
```
If it fails, fix the issue. Common problems:
- Missing import (React Router not installed)
- TypeScript errors (if codebase is TS, you may need to rename .jsx → .tsx and add types)
- Path alias mismatch (codebase uses `@/` but you used `./`)

### 7. FONT IMPORT
Check `packages/web/index.html` (or `public/index.html`) for existing Google Fonts. Only add Bebas Neue and DM Sans if they're not already there. Do NOT duplicate existing font imports.

---

## TYPESCRIPT HANDLING

If the codebase uses TypeScript (`.tsx` files):

1. **Rename the provided `.jsx` files to `.tsx`**
2. **Add minimal type annotations** — the provided files use simple React patterns that TypeScript will mostly infer. You may need to add:
   ```tsx
   // For event handlers
   const handleSubmit = async (e: React.FormEvent) => { ... }
   
   // For state
   const [form, setForm] = useState<Record<string, string>>({})
   
   // For refs
   const ref = useRef<HTMLDivElement>(null)
   ```
3. **Do NOT add complex type definitions.** Keep it minimal — the goal is to pass the build, not achieve perfect type coverage.

---

## VERCEL API ROUTES

If the project deploys to Vercel (check for `vercel.json` or `.vercel/` directory):

The API files may need to be placed as **Vercel serverless functions** instead of Express routes:

```
packages/web/api/performance-lab-apply.ts   ← Vercel convention
packages/web/api/skills-lab-register.ts
```

**Check the existing API pattern:**
```bash
find . -path "*/api/*" -name "*.ts" -o -name "*.js" | head -20
ls api/ 2>/dev/null
ls packages/web/api/ 2>/dev/null
```

If Vercel API routes exist, the handler format changes:
```ts
// Vercel format
export default async function handler(req, res) { ... }

// NOT Express format  
export async function performanceLabApplyHandler(req, res) { ... }
```

Adapt the provided API files to match whichever pattern exists.

---

## COMMIT STRATEGY

Make **small, atomic commits** — not one giant commit:

```bash
# Commit 1: Add page files only
git add src/pages/PerformanceLabPage.tsx src/pages/PerformanceLabApplyPage.tsx src/pages/SkillsLabPage.tsx src/pages/SkillsLabRegisterPage.tsx
git commit -m "feat: add Performance Lab and Skills Lab page components"

# Commit 2: Add API routes
git add api/performance-lab-apply.ts api/skills-lab-register.ts
git commit -m "feat: add API routes for Performance Lab applications and Skills Lab registration"

# Commit 3: Wire routes and nav
git add src/App.tsx  # or wherever the router lives
git commit -m "feat: add routes for /performance-lab and /skills-lab"

# Commit 4: Add nav links
git add src/components/Header.tsx  # or wherever the nav lives
git commit -m "feat: add Performance Lab and Skills Lab to site navigation"

# Commit 5: Font import (if needed)
git add index.html
git commit -m "feat: add Bebas Neue and DM Sans font imports"
```

This lets the owner revert any single change without losing everything.

---

## ROLLBACK PLAN

If anything goes wrong:

```bash
# Option 1: Undo last commit (keeps changes staged)
git reset --soft HEAD~1

# Option 2: Undo all changes on the branch
git checkout main
git branch -D feat/performance-lab-skills-lab

# Option 3: If already pushed, revert
git revert HEAD
```

---

## VERIFICATION CHECKLIST (RUN BEFORE PUSHING)

```bash
# 1. Build passes
cd packages/web && pnpm build

# 2. No ADM in display text
grep -rn '"ADM\|>ADM\| ADM ' src/pages/PerformanceLab*.tsx src/pages/SkillsLab*.tsx
# Expected: ZERO results

# 3. No old schedule references  
grep -rn "Friday\|Sunday\|5:30\|2:00.*3:00" src/pages/SkillsLab*.tsx
# Expected: ZERO results

# 4. Correct routes
grep -rn "/performance-lab\|/skills-lab" src/pages/ src/App.tsx
# Expected: All routes use /performance-lab and /skills-lab

# 5. No /adm routes
grep -rn '"/adm' src/
# Expected: ZERO results (unless /admin exists elsewhere)

# 6. API endpoints correct
grep -rn "performance-lab-apply\|skills-lab-register" src/ api/
# Expected: Matching endpoint references

# 7. Skills Lab mentions Performance Lab only once
grep -c "Performance Lab" src/pages/SkillsLabPage.tsx
# Expected: 1 (the bottom signpost only)

# 8. Performance Lab never mentions Skills Lab
grep -c "Skills Lab" src/pages/PerformanceLabPage.tsx
# Expected: 0
```

If ANY check fails, fix it before pushing.

---

## SUMMARY: AGENT WORKFLOW

```
1. git checkout -b feat/performance-lab-skills-lab
2. Run all Phase 0 discovery commands
3. Record codebase structure findings
4. Verify existing build passes
5. Copy page files to correct location (adapt paths)
6. Copy API files to correct location (adapt pattern)
7. Rename .jsx → .tsx if codebase uses TypeScript
8. Add routes to router file
9. Add nav links to header component
10. Add font imports if missing
11. Run build — fix any errors
12. Run verification checklist
13. Make atomic commits
14. Push branch
15. Report back to owner for review
```

**Do NOT skip steps. Do NOT combine steps. Do NOT commit to main.**

---

Now proceed to `CLAUDE-CODE-ACTION-PLAN.md` for the actual implementation details.
