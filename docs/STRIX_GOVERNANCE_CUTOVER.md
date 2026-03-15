# Strix Governance — Production Cutover Checklist

**Date:** March 15, 2026
**Target:** Academy Platform (Live Environment)
**Author:** Manus AI

This document outlines the exact steps to safely deploy the Strix Governance integration to the live Academy platform without disrupting the current App Store submission or live customer traffic.

## 1. Current State Assessment

The Academy platform is currently live, and a mobile app build (v1.6.1 build 25) is actively being prepared for App Store submission. Since the initial governance branch, the platform has grown significantly, adding 6 new features (Athlete Metrics, Showcases, Merch Drops, Games Hub, Social Gallery, and DM Admin).

To ensure zero risk to the live environment, the governance integration has been re-architected to use **Feature Flags**. 

When the flags are off, the `governedProcedure` wrapper simply returns the standard `adminProcedure` — resulting in **zero behavioral change** from the current production code path.

## 2. Pre-Deployment Verification

Before merging to `main`, verify the following:

- [ ] **Feature Flags are Default OFF:** Ensure `.env` and deployment environments do *not* have `STRIX_GOVERNANCE_ENABLED=true` set yet.
- [ ] **Build Passes:** Run `npm run build` locally to ensure all TypeScript types align (especially the `governedProcedure` fall-through types).
- [ ] **TestFlight Impact:** Confirm that the 22 destructive routes modified in `routers.ts` are strictly admin-only and not used by the mobile app's core user flows. (Verified: all use `adminProcedure` as their base).

## 3. Deployment Sequence

This is a zero-downtime, zero-risk deployment sequence.

### Phase 1: Silent Deployment (Current State)
1. Merge the `feat/strix-governance-reintegration` branch to `main`.
2. Deploy to production.
3. **Result:** The code is live, but governance is completely dormant. The `governance-router` returns safe defaults, and `governedProcedure` acts exactly like `adminProcedure`. The App Store submission is unaffected.

### Phase 2: Key Generation (Preparation)
1. In the production environment shell, run the key generation script:
   ```bash
   npx tsx scripts/generate-strix-keys.ts
   ```
2. Store the resulting Private Key securely.
3. Add the Public Key to the environment variables as `STRIX_PUBLIC_KEY`.

### Phase 3: UI Activation (Soft Launch)
1. Set the environment variable `STRIX_GOVERNANCE_UI_ENABLED=true` (if using a separate UI flag, or simply rely on the main flag).
2. The "Governance" tab will appear in the Admin Dashboard.
3. Because `STRIX_GOVERNANCE_ENABLED` is still false, the dashboard will show a "Governance Not Enabled" banner, but the Capability Registry will be visible.
4. **Result:** Admins can see the registry, but no routes are blocked.

### Phase 4: Full Enforcement (The Cutover)
1. When ready to enforce governance (ideally after the App Store submission is approved and stable):
2. Set the following environment variables in production:
   ```env
   STRIX_GOVERNANCE_ENABLED=true
   STRIX_SIGNING_KEY=<your_private_key>
   STRIX_PUBLIC_KEY=<your_public_key>
   STRIX_EVIDENCE_PATH=/data/evidence/audit.jsonl
   ```
3. Restart the server.
4. **Result:** All 22 destructive routes now require a Strix Decision Token. Because `approvalsRequired` is currently set to `0` for all capabilities (except `notification.send.bulk`), actions will auto-approve but will generate a cryptographic evidence trail.

## 4. Architecture Notes

### Single-Tenant Boundary Safety
The Academy platform is currently a single-tenant deployment. The governance evidence trail (`audit.jsonl`) records actions for the entire platform. If the Academy ever moves to a multi-tenant (SaaS) model, the `evidenceTrail` query in `governance-router.ts` must be updated to filter records by `tenantId` to prevent data leakage between organizations.

### Evidence Growth Tracking
The evidence sink appends to `audit.jsonl`. For a platform with moderate admin activity, this file will grow slowly (approx. 1MB per 2,000 decisions). 
- **Action Required:** Ensure the volume where `STRIX_EVIDENCE_PATH` is mounted has sufficient storage.
- **Future Scaling:** If the file exceeds 50MB, consider implementing a log rotation strategy or migrating to a database-backed evidence sink (e.g., `PostgresEvidenceSink`).

## 5. Rollback Plan

If any issues arise during Phase 4 (Full Enforcement):

1. **Immediate Mitigation:** Change `STRIX_GOVERNANCE_ENABLED=false` and restart the server.
2. **Result:** Governance is instantly bypassed, and the platform returns to standard RBAC (`adminProcedure`). No code rollback is required.
