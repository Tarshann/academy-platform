# Strix Governance Cutover Checklist (v1.8.0)

This document outlines the exact procedure for safely rolling out the Strix governance engine on the live Academy platform. The integration is built to be **100% inert** until explicitly enabled via feature flags.

## 1. The Architecture (v1.8.0)

The governance integration covers **90 total capabilities**:
- **81 Admin Mutations** (via `governedProcedure()` in `routers.ts`)
- **9 Cron Jobs** (via `evaluateCronGovernance()` in `server/cron/*.ts`)

**Safety Guarantee:**
If `STRIX_GOVERNANCE_ENABLED` is false or missing, the `governedProcedure` middleware returns plain `adminProcedure` and the cron guard returns `{ allowed: true }`. There is **zero behavioral difference** from current production.

## 2. Pre-Deployment (The "Silent Deploy")

1. Merge `feat/strix-governance-v4` into `main`.
2. Ensure the following environment variables are **NOT** set in production:
   - `STRIX_GOVERNANCE_ENABLED`
   - `STRIX_API_KEY`
3. Deploy to Vercel.
4. **Verification:**
   - Verify the Admin Dashboard loads normally.
   - Verify the "Governance" tab in the sidebar is visible but shows the "Governance Not Active" banner.
   - Verify standard admin actions (e.g., updating a schedule) work without interruption.
   - Verify cron jobs run successfully on their normal schedule.

## 3. Configuration (The "Key Gen")

1. Log into the Strix Admin Console.
2. Create a new API key for the Academy production environment.
3. Configure the default policy (recommend starting with **Auto-Approve All** for the first 24 hours to build an evidence baseline without blocking operations).
4. Add the following to Vercel Environment Variables:
   ```env
   STRIX_API_KEY=strix_live_...
   STRIX_TENANT_ID=academy_prod
   STRIX_API_URL=https://api.strix.dev/v1
   ```
5. Do **NOT** set `STRIX_GOVERNANCE_ENABLED` yet.

## 4. Activation (The "Flip")

1. In Vercel, add/update the feature flag:
   ```env
   STRIX_GOVERNANCE_ENABLED=true
   ```
2. Trigger a redeploy to apply the environment variable.
3. **Verification:**
   - Go to Admin Dashboard > Platform > Governance.
   - The "Governance Not Active" banner should disappear.
   - The stats should show "Total Capabilities: 90".
   - Perform a low-risk admin action (e.g., toggle a gallery photo visibility).
   - Refresh the Governance tab — the action should appear in the Evidence Trail as "Allowed" (assuming auto-approve policy).
   - Trigger a cron job manually via the admin panel (or wait for the next scheduled run) and verify it appears in the Evidence Trail.

## 5. Enforcement (The "Lockdown")

Once the evidence trail proves the integration is stable (typically after 24-48 hours of observation):

1. Go to the Strix Admin Console.
2. Change the policy from "Auto-Approve All" to "Enforce Thresholds".
3. **Verification:**
   - Attempt a `critical` action (e.g., change a user's role to Admin).
   - The UI should show an "Approval Required" state or throw a clean "Forbidden" error (depending on client-side handling).
   - The Governance tab should show the action as "Escalated" or "Denied" in the Evidence Trail.

## Rollback Plan

If anything goes wrong during activation or enforcement:

**Tier 1: Policy Rollback (Fastest)**
- Go to Strix Admin Console.
- Set policy back to "Auto-Approve All".
- *Result: All actions pass through immediately, but evidence is still recorded.*

**Tier 2: Full Kill Switch (Hardest)**
- Go to Vercel Environment Variables.
- Set `STRIX_GOVERNANCE_ENABLED=false`.
- Redeploy.
- *Result: Governance engine is completely bypassed, falling back to standard tRPC RBAC and ungoverned cron execution.*
