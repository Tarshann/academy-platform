/**
 * Strix Governance — Admin API Router
 *
 * Provides governance dashboard data to the admin UI.
 * All endpoints are admin-only and feature-flagged.
 * When STRIX_GOVERNANCE_ENABLED is false, returns safe defaults.
 */

import { z } from "zod";
import { adminProcedure, router } from "./_core/trpc";
import { CAPABILITIES, CAPABILITY_MAP } from "./_core/strix-capabilities";
import { logger } from "./_core/logger";

const GOVERNANCE_ENABLED = process.env.STRIX_GOVERNANCE_ENABLED === "true";

export const governanceRouter = router({
  /** Dashboard overview stats */
  stats: adminProcedure.query(async () => {
    if (!GOVERNANCE_ENABLED) {
      return {
        enabled: false,
        totalCapabilities: CAPABILITIES.length,
        critical: CAPABILITIES.filter((c) => c.risk === "critical").length,
        high: CAPABILITIES.filter((c) => c.risk === "high").length,
        medium: CAPABILITIES.filter((c) => c.risk === "medium").length,
        low: CAPABILITIES.filter((c) => c.risk === "low").length,
        cronJobs: CAPABILITIES.filter((c) => c.domain === "cron").length,
        totalDecisions: 0,
        totalDenied: 0,
        recentBlocked: [],
      };
    }

    try {
      const { getStrixClient } = await import("./_core/strix");
      const strix = getStrixClient();
      if (!strix) throw new Error("SDK not configured");

      const stats = await strix.getStats();
      return {
        enabled: true,
        totalCapabilities: CAPABILITIES.length,
        critical: CAPABILITIES.filter((c) => c.risk === "critical").length,
        high: CAPABILITIES.filter((c) => c.risk === "high").length,
        medium: CAPABILITIES.filter((c) => c.risk === "medium").length,
        low: CAPABILITIES.filter((c) => c.risk === "low").length,
        cronJobs: CAPABILITIES.filter((c) => c.domain === "cron").length,
        totalDecisions: stats.totalDecisions ?? 0,
        totalDenied: stats.totalDenied ?? 0,
        recentBlocked: stats.recentBlocked ?? [],
      };
    } catch (err) {
      logger.error("[governance-router] stats error:", err);
      return {
        enabled: true,
        totalCapabilities: CAPABILITIES.length,
        critical: CAPABILITIES.filter((c) => c.risk === "critical").length,
        high: CAPABILITIES.filter((c) => c.risk === "high").length,
        medium: CAPABILITIES.filter((c) => c.risk === "medium").length,
        low: CAPABILITIES.filter((c) => c.risk === "low").length,
        cronJobs: CAPABILITIES.filter((c) => c.domain === "cron").length,
        totalDecisions: 0,
        totalDenied: 0,
        recentBlocked: [],
      };
    }
  }),

  /** Evidence trail with pagination and filtering */
  evidenceTrail: adminProcedure
    .input(
      z.object({
        capabilityId: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      if (!GOVERNANCE_ENABLED) return [];

      try {
        const { getStrixClient } = await import("./_core/strix");
        const strix = getStrixClient();
        if (!strix) return [];

        const opts = input ?? {};
        if (opts.capabilityId && !CAPABILITY_MAP.has(opts.capabilityId)) {
          return [];
        }

        return await strix.getEvidenceTrail({
          capabilityId: opts.capabilityId,
          status: opts.status,
          limit: opts.limit ?? 50,
          offset: opts.offset ?? 0,
        });
      } catch (err) {
        logger.error("[governance-router] evidenceTrail error:", err);
        return [];
      }
    }),

  /** Full capability registry — always available (shows what WOULD be governed) */
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
