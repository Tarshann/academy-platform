# Strix Governance — v1.7.1 Cutover Checklist

This document details the rollout plan for the Strix Governance SDK integration on the Academy Platform, specifically adapted for the **v1.7.1** architecture.

## 1. Pre-Deploy Architecture Notes

- **Target Base:** Current v1.7.1 main (includes RBAC, waitlists, family accounts, billing, schedule templates, and AI progress reports)
- **Governed Routes:** 73 total `adminProcedure` mutations wired to `governedProcedure()`
- **Safety Mechanism:** Governance is entirely controlled by feature flags. When `STRIX_GOVERNANCE_ENABLED` is false, `governedProcedure()` acts exactly like `adminProcedure` — zero behavioral change.
- **Admin Dashboard:** Governance is now integrated as a sidebar navigation panel (`GovernanceManager`), respecting the new v1.7.1 dashboard layout.

## 2. Environment Variables

The following environment variables must be added to the production environment before Phase 2:

```env
# Required for enforcement
STRIX_GOVERNANCE_ENABLED="true"
STRIX_API_KEY="sk_live_..."
STRIX_TENANT_ID="tenant_..."

# Required for Admin UI visibility
STRIX_GOVERNANCE_UI_ENABLED="true"

# Optional overrides
STRIX_API_URL="https://api.strix.dev/v1"
```

## 3. Rollout Phases

### Phase 1: Silent Deploy (Current State)
- **Action:** Merge `feat/strix-governance-v3` to `main` and deploy.
- **Flags:** `STRIX_GOVERNANCE_ENABLED="false"`, `STRIX_GOVERNANCE_UI_ENABLED="false"`
- **Result:** Code is in production but dormant. Admin procedures function normally. The Governance sidebar item is hidden.
- **Verification:** Confirm all admin mutations work as expected.

### Phase 2: Shadow Mode / Dry Run
- **Action:** Enable SDK but configure policies to "auto-approve" in the Strix Dashboard.
- **Flags:** `STRIX_GOVERNANCE_ENABLED="true"`, `STRIX_GOVERNANCE_UI_ENABLED="false"`
- **Result:** `governedProcedure()` calls the Strix API. Because policies are set to auto-approve, all actions succeed, but evidence is logged.
- **Verification:** Check Strix Dashboard to ensure evidence trails are populating for actions like `admin.programs.update` or `roles.setRole`.

### Phase 3: UI Activation
- **Action:** Enable the Governance panel in the Admin Dashboard.
- **Flags:** `STRIX_GOVERNANCE_UI_ENABLED="true"`
- **Result:** The "Platform > Governance" tab appears in the admin sidebar. Admins can view the capability registry and evidence trail.
- **Verification:** Log in as an admin, click "Governance" in the sidebar, and verify the evidence trail matches the Strix Dashboard.

### Phase 4: Full Enforcement
- **Action:** Update policies in the Strix Dashboard from "auto-approve" to require approvals for critical/high-risk actions.
- **Result:** Critical actions (e.g., `roles.setRole`, `progressReports.sendToParents`) will now throw `TRPCError` ("Action requires governance approval") until approved via the Strix workflow.
- **Verification:** Attempt a critical action without approval and confirm the UI shows the appropriate error toast.

## 4. Rollback Plan

If issues occur in production:

**Tier 1 (Strix Issue):**
If the Strix API is unreachable, the SDK is designed to **fail-open** (allow the action and log an error). No immediate action required.

**Tier 2 (Logic Issue):**
If governance logic is blocking legitimate actions, update the Strix Dashboard policy to "auto-approve" for the affected capability.

**Tier 3 (System Issue):**
If the integration itself is causing crashes, set `STRIX_GOVERNANCE_ENABLED="false"` in the production environment variables and restart the server. This instantly reverts all routes to plain `adminProcedure`.
