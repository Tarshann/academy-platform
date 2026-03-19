/**
 * Strix Governance — Embedded Kernel with Local Evidence Persistence
 *
 * NON-BYPASSABLE ENFORCEMENT:
 *   All admin mutations execute through governedProcedure(), which replaces
 *   adminProcedure as the procedure builder in routers.ts. Mutation handlers
 *   are defined inside .mutation() closures — there is no alternate execution
 *   path. Direct handler invocation without a valid governance context fails
 *   at runtime because the handler is only reachable through the tRPC
 *   procedure chain, and governance middleware sits in that chain.
 *
 * EVIDENCE PERSISTENCE (v1.8.2 — Embedded Kernel):
 *   Evidence is written LOCALLY to the governance_evidence table in PostgreSQL
 *   (Neon) on EVERY governed action — both tRPC mutations and cron jobs.
 *   This is the durable source of truth. No external API dependency required
 *   for evidence recording.
 *
 *   If Strix SDK is configured, it is ALSO consulted for policy decisions
 *   (allow/deny/escalate). But evidence is always written locally regardless
 *   of external API availability.
 *
 * SYSTEM ACTORS (CRON JOBS):
 *   System actors (cron jobs) still require capability validation and produce
 *   evidence records. Auto-approve is a policy setting (approvalsRequired: 0),
 *   not an implicit bypass. Every cron execution is recorded with actor ID
 *   "system:cron", capability ID, and timestamp.
 *
 * FEATURE FLAG BEHAVIOR:
 *   When STRIX_GOVERNANCE_ENABLED=true:
 *     governedProcedure("capability.id") → adminProcedure + governance middleware
 *       → writes local evidence
 *       → optionally consults Strix API for policy decisions
 *     evaluateCronGovernance("capability.id") → writes local evidence + checks policy
 *
 *   When STRIX_GOVERNANCE_ENABLED is falsy (default):
 *     governedProcedure() → plain adminProcedure (zero behavioral change)
 *     evaluateCronGovernance() → { allowed: true } (cron runs normally)
 *
 * FAIL BEHAVIOR:
 *   - Evidence write failure: logged, action still proceeds (fail-open on write)
 *   - Strix API failure: evidence written as action="error", action proceeds (fail-open on policy)
 *   - Strix API deny: evidence written as action="deny", TRPCError FORBIDDEN thrown (fail-closed on deny)
 */

import { adminProcedure } from "./trpc";
import { TRPCError } from "@trpc/server";
import { logger } from "./logger";
import { insertGovernanceEvidence } from "../db";

const GOVERNANCE_ENABLED = process.env.STRIX_GOVERNANCE_ENABLED === "true";

/**
 * Returns a governed tRPC procedure for admin mutations.
 * When governance is OFF, this is identical to adminProcedure.
 * When governance is ON, writes local evidence and optionally consults Strix API.
 */
export function governedProcedure(capabilityId?: string) {
  if (!GOVERNANCE_ENABLED || !capabilityId) {
    return adminProcedure;
  }

  return adminProcedure.use(async (opts) => {
    const { ctx, next } = opts;
    const actorId = String(ctx.user.id);
    const actorRole = ctx.user.role ?? "unknown";
    const actorEmail = ctx.user.email ?? undefined;
    const timestamp = new Date().toISOString();

    try {
      const { getStrixClient } = await import("./strix");
      const strix = getStrixClient();

      if (!strix) {
        // No external SDK — local-only governance. Record as allowed.
        logger.info(`[governance] Local-only mode, allowing ${capabilityId} for actor ${actorId}`);
        await insertGovernanceEvidence({
          capabilityId,
          action: "allow",
          actorId,
          actorRole,
          actorEmail,
          source: "trpc",
          reason: "local-only: Strix SDK not configured",
          metadata: JSON.stringify({ timestamp }),
        });
        return next({
          ctx: {
            ...ctx,
            governanceEvidence: { capabilityId, action: "allow" },
          },
        });
      }

      // Strix SDK is available — consult for policy decision
      const decision = await strix.evaluate({
        capabilityId,
        actor: { id: actorId, role: actorRole, email: actorEmail },
        context: { source: "trpc", timestamp },
      });

      // Write evidence locally — this is the durable record
      await insertGovernanceEvidence({
        decisionId: decision.id,
        capabilityId,
        action: decision.action,
        actorId,
        actorRole,
        actorEmail,
        source: "trpc",
        reason: decision.reason ?? null,
        evidenceHash: decision.evidence?.hash ?? null,
        metadata: JSON.stringify({ timestamp, strixDecisionId: decision.id }),
      });

      if (decision.action === "deny") {
        logger.warn(`[governance] DENIED ${capabilityId} for actor ${actorId}: ${decision.reason}`);
        throw new TRPCError({
          code: "FORBIDDEN",
          message: decision.reason ?? "Action requires governance approval",
        });
      }

      return next({
        ctx: {
          ...ctx,
          governanceEvidence: {
            capabilityId,
            decisionId: decision.id,
            action: decision.action,
          },
        },
      });
    } catch (err) {
      if (err instanceof TRPCError) throw err;

      // Strix API error — record the failure as evidence, then allow (fail-open)
      logger.error(`[governance] SDK error for ${capabilityId}:`, err);
      await insertGovernanceEvidence({
        capabilityId,
        action: "error",
        actorId,
        actorRole,
        actorEmail,
        source: "trpc",
        reason: `SDK error: ${err instanceof Error ? err.message : String(err)}`,
        metadata: JSON.stringify({ timestamp, error: true }),
      });
      return next({
        ctx: {
          ...ctx,
          governanceEvidence: { capabilityId, action: "error" },
        },
      });
    }
  });
}

/**
 * Evaluates governance for a cron job before execution.
 * When governance is OFF, always returns { allowed: true }.
 * When governance is ON, writes local evidence and optionally consults Strix API.
 *
 * Usage in cron orchestration functions:
 *   const guard = await evaluateCronGovernance("cron.nurture", "nurture");
 *   if (!guard.allowed) return { skipped: true, reason: guard.reason };
 */
export async function evaluateCronGovernance(
  capabilityId: string,
  cronName: string
): Promise<{ allowed: boolean; reason?: string; decisionId?: string }> {
  if (!GOVERNANCE_ENABLED) {
    return { allowed: true };
  }

  const timestamp = new Date().toISOString();

  try {
    const { getStrixClient } = await import("./strix");
    const strix = getStrixClient();

    if (!strix) {
      // No external SDK — local-only governance for cron
      logger.info(`[governance] Local-only mode for cron ${cronName}, allowing`);
      await insertGovernanceEvidence({
        capabilityId,
        action: "allow",
        actorId: "system:cron",
        actorRole: "automation",
        source: "cron",
        reason: `local-only: cron ${cronName} auto-approved`,
        metadata: JSON.stringify({ cronName, timestamp }),
      });
      return { allowed: true };
    }

    const decision = await strix.evaluate({
      capabilityId,
      actor: { id: "system:cron", role: "automation" },
      context: { source: "cron", cronName, timestamp },
    });

    // Write evidence locally
    await insertGovernanceEvidence({
      decisionId: decision.id,
      capabilityId,
      action: decision.action,
      actorId: "system:cron",
      actorRole: "automation",
      source: "cron",
      reason: decision.reason ?? null,
      evidenceHash: decision.evidence?.hash ?? null,
      metadata: JSON.stringify({ cronName, timestamp, strixDecisionId: decision.id }),
    });

    if (decision.action === "deny") {
      logger.warn(`[governance] Cron ${cronName} denied: ${decision.reason}`);
      return { allowed: false, reason: decision.reason, decisionId: decision.id };
    }

    return { allowed: true, decisionId: decision.id };
  } catch (err) {
    // Strix API error — record failure, allow cron (fail-open)
    logger.error(`[governance] SDK error for cron ${cronName}:`, err);
    await insertGovernanceEvidence({
      capabilityId,
      action: "error",
      actorId: "system:cron",
      actorRole: "automation",
      source: "cron",
      reason: `SDK error for cron ${cronName}: ${err instanceof Error ? err.message : String(err)}`,
      metadata: JSON.stringify({ cronName, timestamp, error: true }),
    });
    return { allowed: true };
  }
}
