/**
 * Academy Platform — Governance API Router (Production-Hardened)
 *
 * Exposes tRPC endpoints for the admin UI to:
 * 1. Request governance decision tokens before destructive actions
 * 2. Simulate governance decisions (preview what will happen)
 * 3. List governed capabilities
 * 4. View the evidence trail (audit log of all governance decisions)
 * 5. View governance statistics (dashboard summary)
 *
 * Production Hardening (v2):
 * - All endpoints require admin role (no governance data leaks to non-admins)
 * - Input validation on capability IDs (must be registered)
 * - Pagination limits enforced on evidence trail
 * - Structured error responses (never leak internal errors)
 * - Timestamp normalization to ISO 8601 UTC
 * - No tenant boundary concerns (single-tenant Academy deployment)
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
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "./_core/trpc";
import {
  requestGovernanceToken,
  simulateGovernance,
} from "./_core/governed-procedure";
import {
  getAllCapabilityIds,
  getCapability,
  ACADEMY_CAPABILITIES,
} from "./_core/strix-capabilities";
import { strix } from "./_core/strix";

// ─── Input Validation Helpers ─────────────────────────────────────────

/**
 * Validate that a capability ID is registered in the Academy capability registry.
 * Prevents probing for non-existent capabilities.
 */
function validateCapabilityId(capabilityId: string): void {
  const validIds = getAllCapabilityIds();
  if (!validIds.includes(capabilityId)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Unknown capability: "${capabilityId}". Only registered capabilities can be queried.`,
    });
  }
}

/**
 * Normalize a timestamp to ISO 8601 UTC string.
 * Handles Date objects, ISO strings, and Unix timestamps.
 */
function normalizeTimestamp(ts: unknown): string {
  if (!ts) return new Date().toISOString();
  if (ts instanceof Date) return ts.toISOString();
  if (typeof ts === "string") return new Date(ts).toISOString();
  if (typeof ts === "number") return new Date(ts).toISOString();
  return new Date().toISOString();
}

// ─── Router ───────────────────────────────────────────────────────────

export const governanceRouter = router({
  /**
   * Request a governance decision token for a specific capability.
   * Returns a signed SDT that must be included in the subsequent
   * destructive action request.
   *
   * Auth: admin only
   * Validation: capability must be registered
   */
  requestToken: adminProcedure
    .input(
      z.object({
        capability: z.string().min(1).max(128),
        resourceId: z.string().max(256).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      validateCapabilityId(input.capability);

      try {
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
      } catch (err: unknown) {
        // Re-throw TRPCErrors as-is; wrap unexpected errors
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process governance decision. Please try again.",
        });
      }
    }),

  /**
   * Simulate a governance decision without executing anything.
   * Used by the UI to show whether an action will be allowed,
   * denied, or requires additional approvals.
   *
   * Auth: admin only (changed from protectedProcedure — governance
   * simulation data should not be visible to non-admin users)
   */
  simulate: adminProcedure
    .input(
      z.object({
        capabilityId: z.string().min(1).max(128),
        resourceId: z.string().max(256).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      validateCapabilityId(input.capabilityId);

      try {
        const result = await simulateGovernance(
          input.capabilityId,
          String(ctx.user.id),
          input.resourceId
        );
        return result;
      } catch (err: unknown) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to simulate governance decision.",
        });
      }
    }),

  /**
   * List all governed capabilities in the Academy platform.
   * Used by the admin dashboard to display governance status.
   *
   * Auth: admin only
   * Note: This is the canonical endpoint. `listCapabilities` is an alias.
   */
  capabilities: adminProcedure.query(async () => {
    return {
      capabilities: ACADEMY_CAPABILITIES.map((cap) => ({
        id: cap.capabilityId,
        capabilityId: cap.capabilityId, // alias for backward compat
        riskLevel: cap.riskLevel,
        irreversible: cap.irreversible,
        approvalsRequired: cap.approvalsRequired,
        allowedEnvironments: cap.allowedEnvironments,
      })),
      total: ACADEMY_CAPABILITIES.length,
    };
  }),

  /**
   * Alias for `capabilities` — backward compatibility with GovernanceAuditPanel.
   * The old component uses `trpc.governance.listCapabilities.useQuery()`.
   */
  listCapabilities: adminProcedure.query(async () => {
    return ACADEMY_CAPABILITIES.map((cap) => ({
      capabilityId: cap.capabilityId,
      riskLevel: cap.riskLevel,
      irreversible: cap.irreversible,
      approvalsRequired: cap.approvalsRequired,
      allowedEnvironments: cap.allowedEnvironments,
    }));
  }),

  /**
   * Get the evidence trail — recent governance decisions.
   * Returns the most recent evidence records from the Strix evidence sink.
   *
   * Auth: admin only
   * Pagination: max 100 records per page, cursor-based offset
   * Filters: by capability ID, by decision status
   */
  evidenceTrail: adminProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
          capabilityFilter: z.string().max(128).optional(),
          statusFilter: z
            .enum(["approved", "denied", "all"])
            .default("all"),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const opts = input ?? {
        limit: 50,
        offset: 0,
        statusFilter: "all" as const,
      };

      // Validate capability filter if provided
      if (opts.capabilityFilter) {
        validateCapabilityId(opts.capabilityFilter);
      }

      try {
        const trail = await strix.getEvidenceTrail({
          limit: opts.limit,
          offset: opts.offset,
          capabilityFilter: opts.capabilityFilter,
          statusFilter:
            opts.statusFilter === "all" ? undefined : opts.statusFilter,
        });

        // Normalize timestamps in evidence records
        const normalizedRecords = (trail.records || []).map((record: any) => ({
          ...record,
          createdAt: normalizeTimestamp(record.createdAt || record.timestamp),
          evidenceHash: record.evidenceHash || record.hash || "",
          decisionStatus: record.decisionStatus || record.status || "unknown",
          reasons: Array.isArray(record.reasons)
            ? record.reasons
            : record.reason
              ? [record.reason]
              : [],
        }));

        return {
          records: normalizedRecords,
          total: trail.total ?? normalizedRecords.length,
          hasMore: trail.hasMore ?? false,
        };
      } catch {
        // If evidence store is not yet initialized, return empty
        // This is expected on first deployment before any governed action runs
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
   *
   * Auth: admin only
   * Note: Returns zeros if stats are not yet available (first deployment)
   */
  stats: adminProcedure.query(async () => {
    const emptyStats = {
      totalDecisions: 0,
      approved: 0,
      denied: 0,
      pendingApproval: 0,
      byRiskLevel: { low: 0, medium: 0, high: 0, critical: 0 },
      byCapability: {} as Record<string, number>,
      last24Hours: 0,
      last7Days: 0,
    };

    try {
      const stats = await strix.getGovernanceStats();
      return {
        totalDecisions: stats.totalDecisions ?? 0,
        approved: stats.approved ?? 0,
        denied: stats.denied ?? 0,
        pendingApproval: stats.pendingApproval ?? 0,
        byRiskLevel: stats.byRiskLevel ?? emptyStats.byRiskLevel,
        byCapability: stats.byCapability ?? emptyStats.byCapability,
        last24Hours: stats.last24Hours ?? 0,
        last7Days: stats.last7Days ?? 0,
      };
    } catch {
      // Stats not yet available — expected on first deployment
      return emptyStats;
    }
  }),
});
