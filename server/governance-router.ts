/**
 * Academy Platform — Governance API Router
 *
 * Exposes tRPC endpoints for the admin UI to:
 * 1. Request governance decision tokens before destructive actions
 * 2. Simulate governance decisions (preview what will happen)
 * 3. List governed capabilities
 * 4. View the evidence trail (audit log of all governance decisions)
 * 5. View governance statistics (dashboard summary)
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
import { strix } from "./_core/strix";

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

  /**
   * Get the evidence trail — recent governance decisions.
   * Returns the most recent evidence records from the Strix evidence sink.
   * Used by the GovernanceEvidencePane to show audit history.
   */
  evidenceTrail: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        capabilityFilter: z.string().optional(),
        statusFilter: z.enum(["approved", "denied", "all"]).default("all"),
      }).optional()
    )
    .query(async ({ input }) => {
      const opts = input ?? { limit: 50, offset: 0, statusFilter: "all" as const };

      try {
        const trail = await strix.getEvidenceTrail({
          limit: opts.limit,
          offset: opts.offset,
          capabilityFilter: opts.capabilityFilter,
          statusFilter: opts.statusFilter === "all" ? undefined : opts.statusFilter,
        });

        return {
          records: trail.records,
          total: trail.total,
          hasMore: trail.hasMore,
        };
      } catch {
        // If evidence store is not yet initialized, return empty
        return {
          records: [],
          total: 0,
          hasMore: false,
        };
      }
    }),

  /**
   * Get governance statistics for the dashboard summary.
   * Aggregates evidence data into counts by status, risk level, and time period.
   */
  stats: adminProcedure.query(async () => {
    try {
      const stats = await strix.getGovernanceStats();
      return {
        totalDecisions: stats.totalDecisions,
        approved: stats.approved,
        denied: stats.denied,
        pendingApproval: stats.pendingApproval,
        byRiskLevel: stats.byRiskLevel,
        byCapability: stats.byCapability,
        last24Hours: stats.last24Hours,
        last7Days: stats.last7Days,
      };
    } catch {
      // If stats are not yet available, return zeros
      return {
        totalDecisions: 0,
        approved: 0,
        denied: 0,
        pendingApproval: 0,
        byRiskLevel: { low: 0, medium: 0, high: 0, critical: 0 },
        byCapability: {},
        last24Hours: 0,
        last7Days: 0,
      };
    }
  }),
});
