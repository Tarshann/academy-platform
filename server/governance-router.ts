/**
 * Strix Governance — Admin API Router (Embedded Kernel)
 *
 * Provides governance dashboard data to the admin UI.
 * All endpoints are admin-only and feature-flagged.
 *
 * v1.8.2: Reads evidence from LOCAL PostgreSQL table (governance_evidence),
 * not from the external Strix API. This is the embedded kernel model.
 */

import { z } from "zod";
import { adminProcedure, router } from "./_core/trpc";
import { CAPABILITIES, CAPABILITY_MAP } from "./_core/strix-capabilities";
import { getGovernanceEvidenceTrail, getGovernanceStats } from "./db";
import { logger } from "./_core/logger";

const GOVERNANCE_ENABLED = process.env.STRIX_GOVERNANCE_ENABLED === "true";

export const governanceRouter = router({
  /** Dashboard overview stats — reads from local DB */
  stats: adminProcedure.query(async () => {
    const base = {
      totalCapabilities: CAPABILITIES.length,
      critical: CAPABILITIES.filter((c) => c.risk === "critical").length,
      high: CAPABILITIES.filter((c) => c.risk === "high").length,
      medium: CAPABILITIES.filter((c) => c.risk === "medium").length,
      low: CAPABILITIES.filter((c) => c.risk === "low").length,
      cronJobs: CAPABILITIES.filter((c) => c.domain === "cron").length,
    };

    if (!GOVERNANCE_ENABLED) {
      return {
        enabled: false,
        ...base,
        totalDecisions: 0,
        totalDenied: 0,
        totalAllowed: 0,
        totalEscalated: 0,
        totalErrors: 0,
        recentBlocked: [],
      };
    }

    try {
      const stats = await getGovernanceStats();
      return {
        enabled: true,
        ...base,
        ...stats,
        recentBlocked: [],
      };
    } catch (err) {
      logger.error("[governance-router] stats error:", err);
      return {
        enabled: true,
        ...base,
        totalDecisions: 0,
        totalDenied: 0,
        totalAllowed: 0,
        totalEscalated: 0,
        totalErrors: 0,
        recentBlocked: [],
      };
    }
  }),

  /** Evidence trail with pagination and filtering — reads from local DB */
  evidenceTrail: adminProcedure
    .input(
      z.object({
        capabilityId: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      if (!GOVERNANCE_ENABLED) return [];

      try {
        if (input.capabilityId && !CAPABILITY_MAP.has(input.capabilityId)) {
          return [];
        }

        const rows = await getGovernanceEvidenceTrail({
          capabilityId: input.capabilityId,
          action: input.status,
          limit: input.limit,
          offset: input.offset,
        });

        // Map DB rows to the shape the frontend expects
        return rows.map((row: any) => ({
          id: row.id,
          capabilityId: row.capabilityId,
          action: row.action,
          actor: {
            id: row.actorId,
            role: row.actorRole,
            email: row.actorEmail,
          },
          timestamp: row.createdAt?.toISOString(),
          reason: row.reason,
          evidence: row.evidenceHash ? { hash: row.evidenceHash } : undefined,
          source: row.source,
          decisionId: row.decisionId,
        }));
      } catch (err) {
        logger.error("[governance-router] evidenceTrail error:", err);
        return [];
      }
    }),

  /** Full capability registry — always available */
  listCapabilities: adminProcedure.query(async () => {
    return CAPABILITIES.map((c) => ({
      id: c.id,
      label: c.label,
      domain: c.domain,
      risk: c.risk,
      approvalsRequired: c.approvalsRequired,
      description: c.description,
      governed: GOVERNANCE_ENABLED,
    }));
  }),
});
