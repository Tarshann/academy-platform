/**
 * Academy Platform — Governance API Router
 *
 * Exposes tRPC endpoints for the admin UI to:
 * 1. Request governance decision tokens before destructive actions
 * 2. Simulate governance decisions (preview what will happen)
 * 3. List governed capabilities
 *
 * These endpoints are called by the admin dashboard BEFORE
 * the actual destructive mutation is invoked.
 *
 * Flow:
 *   Admin clicks "Delete Program"
 *   → UI calls governance.requestToken({ capability: "academy.program.delete" })
 *   → UI receives signed SDT
 *   → UI calls admin.programs.delete({ id: 42 }) with x-strix-token header
 *   → governedProcedure verifies + redeems token
 *   → Handler executes (or is blocked)
 */

import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "./_core/trpc";
import {
  requestGovernanceToken,
  simulateGovernance,
} from "./_core/governed-procedure";
import {
  getAllCapabilityIds,
  ACADEMY_CAPABILITIES,
} from "./_core/strix-capabilities";

export const governanceRouter = router({
  /**
   * Request a governance decision token for a specific capability.
   * Returns a signed SDT that must be included in the subsequent
   * destructive action request.
   */
  requestToken: adminProcedure
    .input(
      z.object({
        capability: z.string(),
        resourceId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const decision = await requestGovernanceToken(
        input.capability,
        String(ctx.user.id),
        input.resourceId
      );

      return {
        status: decision.status,
        token: decision.token,
        decisionId: decision.decisionId,
        reason: decision.reason,
        missingApprovals: decision.missingApprovals,
        policyVersion: decision.policyVersion,
      };
    }),

  /**
   * Simulate a governance decision without executing anything.
   * Used by the UI to show whether an action will be allowed,
   * denied, or requires additional approvals.
   */
  simulate: protectedProcedure
    .input(
      z.object({
        capability: z.string(),
        resourceId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await simulateGovernance(
        input.capability,
        String(ctx.user.id),
        input.resourceId
      );

      return result;
    }),

  /**
   * List all governed capabilities in the Academy platform.
   * Used by the admin dashboard to display governance status.
   */
  capabilities: adminProcedure.query(async () => {
    return {
      capabilities: ACADEMY_CAPABILITIES.map((cap) => ({
        id: cap.capabilityId,
        riskLevel: cap.riskLevel,
        irreversible: cap.irreversible,
        approvalsRequired: cap.approvalsRequired,
        allowedEnvironments: cap.allowedEnvironments,
      })),
      total: ACADEMY_CAPABILITIES.length,
    };
  }),
});
