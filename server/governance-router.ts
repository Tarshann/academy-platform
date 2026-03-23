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
import { logger } from "./_core/logger";

const GOVERNANCE_ENABLED = process.env.STRIX_GOVERNANCE_ENABLED === "true";

export const governanceRouter = router({
  /** Dashboard overview stats — always reads from local DB */
  stats: adminProcedure.query(async () => {
    const base = {
      enabled: GOVERNANCE_ENABLED,
      totalCapabilities: CAPABILITIES.length,
      critical: CAPABILITIES.filter((c) => c.risk === "critical").length,
      high: CAPABILITIES.filter((c) => c.risk === "high").length,
      medium: CAPABILITIES.filter((c) => c.risk === "medium").length,
      low: CAPABILITIES.filter((c) => c.risk === "low").length,
      cronJobs: CAPABILITIES.filter((c) => c.domain === "cron").length,
    };

    try {
      const { getDb } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return { ...base, totalDecisions: 0, totalDenied: 0, totalAllowed: 0, totalEscalated: 0, totalErrors: 0, recentBlocked: [] };

      const result = await db.execute(sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE action = 'deny')::int AS denied,
          COUNT(*) FILTER (WHERE action = 'allow')::int AS allowed,
          COUNT(*) FILTER (WHERE action = 'escalate')::int AS escalated,
          COUNT(*) FILTER (WHERE action = 'error')::int AS errors
        FROM governance_evidence
      `);
      const row = (result.rows ?? result)?.[0] as any;

      return {
        ...base,
        totalDecisions: row?.total ?? 0,
        totalDenied: row?.denied ?? 0,
        totalAllowed: row?.allowed ?? 0,
        totalEscalated: row?.escalated ?? 0,
        totalErrors: row?.errors ?? 0,
        recentBlocked: [],
      };
    } catch (err: any) {
      logger.error("[governance-router] stats error:", err);
      return { ...base, totalDecisions: 0, totalDenied: 0, totalAllowed: 0, totalEscalated: 0, totalErrors: 0, recentBlocked: [] };
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
      const opts = input ?? {};

      // Validate capability ID if provided
      if (opts.capabilityId && !CAPABILITY_MAP.has(opts.capabilityId)) {
        return [];
      }

      // UI sends "allowed"/"denied"/"escalated" — DB stores "allow"/"deny"/"escalate"
      const statusToAction: Record<string, string> = {
        allowed: "allow",
        denied: "deny",
        escalated: "escalate",
      };
      const action = opts.status ? statusToAction[opts.status] ?? opts.status : undefined;

      // Use raw SQL to avoid Drizzle schema mismatch issues (evidence_hash column may not exist)
      try {
        const { getDb } = await import("./db");
        const { sql } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return [];

        const limit = opts.limit ?? 50;
        const offset = opts.offset ?? 0;

        let query;
        if (opts.capabilityId && action) {
          query = sql`SELECT id, capability_id, actor_id, actor_role, actor_email, action, reason, source, external_decision_id, metadata, created_at FROM governance_evidence WHERE capability_id = ${opts.capabilityId} AND action = ${action} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
        } else if (opts.capabilityId) {
          query = sql`SELECT id, capability_id, actor_id, actor_role, actor_email, action, reason, source, external_decision_id, metadata, created_at FROM governance_evidence WHERE capability_id = ${opts.capabilityId} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
        } else if (action) {
          query = sql`SELECT id, capability_id, actor_id, actor_role, actor_email, action, reason, source, external_decision_id, metadata, created_at FROM governance_evidence WHERE action = ${action} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
        } else {
          query = sql`SELECT id, capability_id, actor_id, actor_role, actor_email, action, reason, source, external_decision_id, metadata, created_at FROM governance_evidence ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
        }

        const result = await db.execute(query);
        const rows = result.rows ?? result ?? [];

        return (rows as any[]).map((row: any) => ({
          id: row.id,
          capabilityId: row.capability_id,
          action: row.action,
          actor: {
            id: row.actor_id,
            role: row.actor_role,
            email: row.actor_email,
          },
          reason: row.reason,
          source: row.source,
          timestamp: row.created_at instanceof Date
            ? row.created_at.toISOString()
            : row.created_at,
          evidence: {
            hash: row.evidence_hash ?? null,
            externalId: row.external_decision_id ?? null,
          },
        }));
      } catch (err: any) {
        logger.error("[governance-router] evidenceTrail raw SQL error:", err);
        return [{
          id: -1,
          capabilityId: "DEBUG_ERROR",
          action: "error",
          actor: { id: "system", role: "debug", email: null },
          reason: `Raw SQL failed: ${err?.name}: ${err?.message}${err?.code ? ` (code: ${err.code})` : ""}`,
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
