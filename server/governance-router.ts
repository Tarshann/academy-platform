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
 * FEATURE FLAG: When STRIX_GOVERNANCE_ENABLED is not "true", all
 * endpoints return safe defaults (empty arrays, zero stats).
 * The router is still registered but inert.
 *
 * Production Hardening:
 * - All endpoints require admin role
 * - Input validation on capability IDs (must be registered)
 * - Pagination limits enforced on evidence trail
 * - Structured error responses (never leak internal errors)
 * - Timestamp normalization to ISO 8601 UTC
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

// ─── Feature Flag ────────────────────────────────────────────────────

const GOVERNANCE_ENABLED = process.env.STRIX_GOVERNANCE_ENABLED === "true";

// ─── Input Validation Helpers ─────────────────────────────────────────

function validateCapabilityId(capabilityId: string): void {
  const validIds = getAllCapabilityIds();
  if (!validIds.includes(capabilityId)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Unknown capability: "${capabilityId}". Only registered capabilities can be queried.`,
    });
  }
}

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
   */
  requestToken: adminProcedure
    .input(
      z.object({
        capability: z.string().min(1).max(128),
        resourceId: z.string().max(256).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!GOVERNANCE_ENABLED) {
        return {
          status: "disabled" as const,
          token: null,
          decisionId: null,
          reason: "Governance is not enabled. Set STRIX_GOVERNANCE_ENABLED=true to activate.",
          missingApprovals: 0,
          policyVersion: null,
        };
      }

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
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process governance decision. Please try again.",
        });
      }
    }),

  /**
   * Simulate a governance decision without executing anything.
   */
  simulate: adminProcedure
    .input(
      z.object({
        capabilityId: z.string().min(1).max(128),
        resourceId: z.string().max(256).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!GOVERNANCE_ENABLED) {
        return { allowed: true, message: "Governance is not enabled" };
      }

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
   */
  capabilities: adminProcedure.query(async () => {
    return {
      capabilities: ACADEMY_CAPABILITIES.map((cap) => ({
        id: cap.capabilityId,
        capabilityId: cap.capabilityId,
        riskLevel: cap.riskLevel,
        irreversible: cap.irreversible,
        approvalsRequired: cap.approvalsRequired,
        allowedEnvironments: cap.allowedEnvironments,
      })),
      total: ACADEMY_CAPABILITIES.length,
      governanceEnabled: GOVERNANCE_ENABLED,
    };
  }),

  /**
   * Alias for backward compatibility with GovernanceAuditPanel.
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
   * Returns empty when governance is disabled.
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
      if (!GOVERNANCE_ENABLED) {
        return { records: [], total: 0, hasMore: false };
      }

      const opts = input ?? {
        limit: 50,
        offset: 0,
        statusFilter: "all" as const,
      };

      if (opts.capabilityFilter) {
        validateCapabilityId(opts.capabilityFilter);
      }

      try {
        const { strix } = await import("./_core/strix");
        const trail = await strix.getEvidenceTrail({
          limit: opts.limit,
          offset: opts.offset,
          capabilityFilter: opts.capabilityFilter,
          statusFilter:
            opts.statusFilter === "all" ? undefined : opts.statusFilter,
        });

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
        return { records: [], total: 0, hasMore: false };
      }
    }),

  /**
   * Get governance statistics for the dashboard summary.
   * Returns zeros when governance is disabled.
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
      governanceEnabled: GOVERNANCE_ENABLED,
    };

    if (!GOVERNANCE_ENABLED) {
      return emptyStats;
    }

    try {
      const { strix } = await import("./_core/strix");
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
        governanceEnabled: GOVERNANCE_ENABLED,
      };
    } catch {
      return emptyStats;
    }
  }),
});
