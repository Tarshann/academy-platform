# Transition To-Do List — 2026-03-21

> Everything landed. This is the human action checklist to get it all live.
> Items are grouped by platform and priority. Check each off as you go.

---

## 🔴 CRITICAL — Do These First (Blocking Deployment)

### 1. Merge & Push Academy Platform (Portal + AI Engine)
**Why**: 4 local commits not yet on origin. Vercel auto-deploys from `main`, so nothing goes live until you push. Origin also has 2 commits you need to merge (CLAUDE.md conflict — minor, our version wins).
```bash
cd academy-platform
git pull --no-rebase origin main    # merge remote (will conflict on CLAUDE.md)
# Resolve CLAUDE.md: keep OUR version for capability counts (104, not 84)
# but add circuit breaker detail from THEIR version to the strix.ts line
git add CLAUDE.md
git commit -m "merge: reconcile CLAUDE.md with remote governance resilience update"
git push origin main
```
**Deploys**: Portal (app.academytn.com) + all 16 cron jobs + 7 AI cron endpoints

### 2. Vercel Dashboard — Set AI Layer Root Directory
**Why**: Agent 3 hardened `ai-layer/src/index.ts` but Vercel doesn't know to build from that subdirectory.
- Go to Vercel → Project `__ai-layer__` → Settings → General → Root Directory
- Set to: `ai-layer`
- Click Save, then Redeploy

### 3. Submit iOS Build 36 to App Store Review
**Why**: Build 36 (v1.8.3) is approved in TestFlight but NOT submitted for App Store review.
- Open App Store Connect → The Academy → iOS
- Select build 36
- Fill in "What's New" (see below)
- Submit for Review

**What's New for v1.8.3**:
```
• Governance Dashboard — Admin tool for monitoring platform decisions, evidence trail, and AI actions
• AI Vision Capture — Record athlete metrics from voice memos and photos during training
• Gallery video support
• 14 performance index improvements
• Bug fixes and stability improvements
```

---

## 🟡 HIGH PRIORITY — Do This Week

### 4. Fix Android Play Store JWT Signature Issue
**Why**: Android submission has been failing with "Invalid JWT Signature" — blocking Google Play release.
- Go to Google Play Console → Service Account → Keys
- Verify the JSON key file matches what EAS is using
- May need to: create a new service account key, update EAS credentials
- Then: `eas submit --platform android`

### 5. Review Strix Console Agent 1 — Hardening Decisions
**Why**: Agent 1 produced `DECISIONS_NEEDED.md` with items requiring YOUR input.
- Open `apps/strix-console/docs/DECISIONS_NEEDED.md`
- Review each decision item and make your call
- Key items likely include: credential rotation schedule, security policy decisions, operational readiness gaps

### 6. Review Strix Console Agent 1 — Credential Rotation
**Why**: `SECURITY_REMEDIATION.md` documents credentials that need rotating.
- Open `apps/strix-console/docs/SECURITY_REMEDIATION.md`
- Rotate any flagged credentials/API keys
- Update environment variables in Vercel/deployment

### 7. Review & Publish AI-Generated Content Queue
**Why**: The 7 AI cron jobs are now live after push, but high-visibility content (blogs, announcements) is saved as DRAFTS only. You or an admin must approve them.
- Log into app.academytn.com → Admin → Content Queue
- Review AI-generated drafts as they appear
- Approve, edit, or reject each item

---

## 🟢 MEDIUM PRIORITY — This Sprint

### 8. Review Strix Console GTM Materials
**Why**: Agent 2 produced investor-ready materials. Review before sharing externally.
- `docs/STRIX_GLOBAL_INVARIANT.md` (28.7KB) — System constitution, 10 invariants
- `docs/PROOF_MATRIX.md` (21.1KB) — Every site claim → code → test mapping
- `docs/GTM_READINESS.md` (12.3KB) — Full go-to-market checklist
- `docs/INVESTOR_DEMO_SCRIPT.md` (8.3KB) — 3-minute pitch walkthrough
- `docs/INTEGRATION_QUICKSTART.md` (8.9KB) — Customer onboarding guide
- `docs/CASE_STUDY_ACADEMY.md` (20.9KB) — Academy proof point
- Review each for accuracy and tone before using with investors/prospects

### 9. Run Strix Console Invariant Verifier
**Why**: Agent 2 created `scripts/verify-invariants.ts` — a runnable script that checks all 10 system invariants.
```bash
cd apps/strix-console
npx ts-node scripts/verify-invariants.ts
```
- Confirm all invariants pass
- Fix any failures before demo

### 10. Seed Demo Database
**Why**: Agent 2 created `prisma/seed.ts` (973 lines) with a realistic TechCorp scenario.
```bash
cd apps/strix-console
npx prisma db seed
```
- Creates 3 tenants, 8 users, 30 decisions with real SHA-256 hashes
- Required for investor demo and interactive simulator

### 11. Test Public API Endpoints
**Why**: Agent 2 created two public API routes for live governance proof.
- `GET /api/public/governance-proof` — live proof feed
- `POST /api/public/verify-evidence` — evidence hash verification
- Test both endpoints after Strix console deploy
- These are customer-facing and must work reliably

### 12. Test Interactive Simulator & Proof Page
**Why**: Agent 2 created `/simulator` (interactive governance demo) and updated `/proof` (live decision feed + evidence verifier).
- Navigate to both pages after deploy
- Walk through the investor demo script (`INVESTOR_DEMO_SCRIPT.md`)
- Confirm profile switcher works across 3 tenant perspectives

---

## 🔵 LOW PRIORITY — Backlog

### 13. Wire 5 Orphaned AI Capabilities
**Why**: Registered in capability registry but not connected to any code.
- `ai.generateSessionRecap` → wire to `cron/post-session-content.ts`
- `ai.generateSocialCaption` → wire to `cron/post-session-content.ts`
- `ai.generateProgressInsight` → wire to `cron/progress-reports.ts`
- `ai.personalizeRecommendation` → needs new integration point
- `ai.flagMetricAnomaly` → wire to `metrics.record` mutation
- Can be a Portal Agent ticket (WEB-xxx)

### 14. Split Router/DB Monolith
**Why**: `routers.ts` (~4,067 lines) and `db.ts` (~3,371 lines) are unwieldy.
- Extract into domain modules (auth, programs, chat, admin, etc.)
- Portal Agent priority 2 in the updated prompt

### 15. Archive Old Agent Prompts
**Why**: 4 Strix agent prompts are in your local folder. Move to ops for reference.
- `STRIX_CONSOLE_HARDENING_AGENT_PROMPT.md`
- `STRIX_GTM_PRODUCTION_AGENT_PROMPT.md`
- `STRIX_AI_LAYER_DEPLOYMENT_AGENT_PROMPT.md`
- `STRIX_ACADEMY_INVARIANT_TEST_AGENT_PROMPT.md`
- Archive to `ops/60_AGENT_PROMPTS/archive/` or keep locally

---

## Verification Checklist (After All Deploys)

After items 1-4 are complete, verify end-to-end:

- [ ] Portal loads at app.academytn.com
- [ ] Admin dashboard shows all 19 manager panels
- [ ] Governance panel shows stats, capabilities (104), evidence trail
- [ ] AI cron jobs start running on schedule (check Vercel logs next day)
- [ ] Content Queue populates with AI-generated drafts
- [ ] Mobile app (build 36) works on TestFlight
- [ ] Strix console simulator page loads
- [ ] Strix proof page shows live decision feed
- [ ] Strix invariant verifier passes all 10 invariants
- [ ] Academy governance tests pass: `pnpm test` (103 assertions)

---

## Platform State Summary

| System | Version | Status | Next Action |
|--------|---------|--------|-------------|
| Academy Portal | v1.8.3 | 4 unpushed commits | Push to deploy |
| Academy Mobile iOS | v1.8.3 build 36 | TestFlight approved | Submit to App Store |
| Academy Mobile Android | v1.8.3 build 36 | JWT issue | Fix Play Console key |
| Strix Console | — | All docs + code landed | Review GTM materials |
| Strix AI Layer | — | Hardened, needs root dir | Set Vercel root directory |
| Academy AI Engine | 7 crons | Ready, awaits push | Push deploys all |
| Governance | 104 capabilities | 103 tests passing | Push deploys all |
