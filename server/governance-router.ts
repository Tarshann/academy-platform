/**
 * Governance Router — tRPC endpoints for the Governance Evidence Pane
 *
 * All endpoints are admin-only. When STRIX_GOVERNANCE_ENABLED is false,
 * returns safe defaults (empty arrays, zero stats, disabled flag).
 */

import { z } from "zod";
import { router, adminProcedure } from "./_core/trpc";
import { getStrixClient } from "./_core/strix";
import { CAPABILITIES } from "./_core/strix-capabilities";
import { logger } from "./_core/logger";

const GOVERNANCE_ENABLED = process.env.STRIX_GOVERNANCE_ENABLED === "true";
const UI_ENABLED = process.env.STRIX_GOVERNANCE_UI_ENABLED === "true";

export const governanceRouter = router({
  /** Check if governance is enabled */
  status: adminProcedure.query(() => ({
    governanceEnabled: GOVERNANCE_ENABLED,
    uiEnabled: UI_ENABLED,
  })),

  /** List all registered capabilities with their risk levels */
  listCapabilities: adminProcedure.query(() => {
    return Object.values(CAPABILITIES).map((cap) => ({
      id: cap.id,
      name: cap.name,
      description: cap.description,
      riskLevel: cap.riskLevel,
      routerPath: cap.routerPath,
      routerLine: cap.routerLine,
    }));
  }),

  /** Get governance statistics */
  stats: adminProcedure.query(async () => {
    if (!GOVERNANCE_ENABLED) {
      const caps = Object.values(CAPABILITIES);
      return {
        totalCapabilities: caps.length,
        byRiskLevel: {
          critical: caps.filter((c) => c.riskLevel === "critical").length,
          high: caps.filter((c) => c.riskLevel === "high").length,
          medium: caps.filter((c) => c.riskLevel === "medium").length,
          low: caps.filter((c) => c.riskLevel === "low").length,
        },
        totalDecisions: 0,
        allowedCount: 0,
        deniedCount: 0,
        pendingCount: 0,
        recentBlocked: [],
      };
    }

    try {
      const strix = getStrixClient();
      if (!strix) {
        return {
          totalCapabilities: Object.keys(CAPABILITIES).length,
          byRiskLevel: { critical: 0, high: 0, medium: 0, low: 0 },
          totalDecisions: 0,
          allowedCount: 0,
          deniedCount: 0,
          pendingCount: 0,
          recentBlocked: [],
        };
      }

      const stats = await strix.getStats();
      const caps = Object.values(CAPABILITIES);
      return {
        totalCapabilities: caps.length,
        byRiskLevel: {
          critical: caps.filter((c) => c.riskLevel === "critical").length,
          high: caps.filter((c) => c.riskLevel === "high").length,
          medium: caps.filter((c) => c.riskLevel === "medium").length,
          low: caps.filter((c) => c.riskLevel === "low").length,
        },
        ...stats,
      };
    } catch (err) {
      logger.error("[Governance Router] Stats fetch failed:", err);
      return {
        totalCapabilities: Object.keys(CAPABILITIES).length,
        byRiskLevel: { critical: 0, high: 0, medium: 0, low: 0 },
        totalDecisions: 0,
        allowedCount: 0,
        deniedCount: 0,
        pendingCount: 0,
        recentBlocked: [],
      };
    }
  }),

  /** Get paginated evidence trail */
  evidenceTrail: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(25),
        offset: z.number().min(0).default(0),
        status: z.enum(["all", "allowed", "denied", "pending"]).default("all"),
      })
    )
    .query(async ({ input }) => {
      if (!GOVERNANCE_ENABLED) {
        return { items: [], total: 0, hasMore: false };
      }

      try {
        const strix = getStrixClient();
        if (!strix) {
          return { items: [], total: 0, hasMore: false };
        }

        const items = await strix.getEvidenceTrail({
          limit: input.limit,
          offset: input.offset,
          status: input.status === "all" ? undefined : input.status,
        });

        return {
          items,
          total: items.length,
          hasMore: items.length === input.limit,
        };
      } catch (err) {
        logger.error("[Governance Router] Evidence trail fetch failed:", err);
        return { items: [], total: 0, hasMore: false };
      }
    }),
});
