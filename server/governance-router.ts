/**
 * Strix Governance — Admin API Router (Embedded Kernel)
 *
 * Provides governance dashboard data to the admin UI.
 * Stats and evidence trail are ALWAYS sourced from the local
 * governance_evidence table — this works regardless of whether
 * the external Strix SDK is configured.
 *
 * The capability registry is always available.
 */

import { z } from "zod";
import { adminProcedure, router } from "./_core/trpc";
import { CAPABILITIES, CAPABILITY_MAP } from "./_core/strix-capabilities";
import { getGovernanceEvidenceTrail, getGovernanceStats } from "./db";
import { logger } from "./_core/logger";

const GOVERNANCE_ENABLED = process.env.STRIX_GOVERNANCE_ENABLED === "true";

export const governanceRouter = router({
  /** Dashboard overview stats — always reads from local DB */
  stats: adminProcedure.query(async () => {
    try {
      const dbStats = await getGovernanceStats();
      return {
        enabled: GOVERNANCE_ENABLED,
        totalCapabilities: CAPABILITIES.length,
        critical: CAPABILITIES.filter((c) => c.risk === "critical").length,
        high: CAPABILITIES.filter((c) => c.risk === "high").length,
        medium: CAPABILITIES.filter((c) => c.risk === "medium").length,
        low: CAPABILITIES.filter((c) => c.risk === "low").length,
        cronJobs: CAPABILITIES.filter((c) => c.domain === "cron").length,
        totalDecisions: dbStats.totalDecisions,
        totalDenied: dbStats.totalDenied,
        totalAllowed: dbStats.totalAllowed,
        totalEscalated: dbStats.totalEscalated,
        totalErrors: dbStats.totalErrors,
        recentBlocked: [],
      };
    } catch (err: any) {
      logger.error("[governance-router] stats error:", err);
      return {
        enabled: GOVERNANCE_ENABLED,
        totalCapabilities: CAPABILITIES.length,
        critical: CAPABILITIES.filter((c) => c.risk === "critical").length,
        high: CAPABILITIES.filter((c) => c.risk === "high").length,
        medium: CAPABILITIES.filter((c) => c.risk === "medium").length,
        low: CAPABILITIES.filter((c) => c.risk === "low").length,
        cronJobs: CAPABILITIES.filter((c) => c.domain === "cron").length,
        totalDecisions: 0,
        totalDenied: 0,
        totalAllowed: 0,
        totalEscalated: 0,
        totalErrors: 0,
        recentBlocked: [],
        debugError: err?.message ?? String(err),
      };
    }
  }),

  /** Evidence trail — always reads from local governance_evidence table */
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
      try {
        const { getStrixClient } = await import("./_core/strix");
        const strix = getStrixClient();
        if (!strix) return [];

        if (input.capabilityId && !CAPABILITY_MAP.has(input.capabilityId)) {
          return [];
        }

        return await strix.getEvidenceTrail({
          capabilityId: input.capabilityId,
          status: input.status,
          limit: input.limit,
          offset: input.offset,
        });

        // Map DB rows to the shape the UI expects
        return rows.map((row: any) => ({
          id: row.id,
          capabilityId: row.capabilityId,
          action: row.action,
          actor: {
            id: row.actorId,
            role: row.actorRole,
            email: row.actorEmail,
          },
          reason: row.reason,
          source: row.source,
          timestamp: row.createdAt?.toISOString?.() ?? row.createdAt,
          evidence: {
            hash: row.evidenceHash ?? null,
            externalId: row.externalDecisionId ?? null,
          },
        }));
      } catch (err: any) {
        logger.error("[governance-router] evidenceTrail error:", err);
        // Surface the error for debugging instead of silently returning empty
        return [{
          id: -1,
          capabilityId: "DEBUG_ERROR",
          action: "error",
          actor: { id: "system", role: "debug", email: null },
          reason: `Query failed: ${err?.message ?? String(err)}`,
          source: "debug",
          timestamp: new Date().toISOString(),
          evidence: { hash: null, externalId: null },
        }];
      }
    }),

  /** Full capability registry — always available (shows what IS or WOULD BE governed) */
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
