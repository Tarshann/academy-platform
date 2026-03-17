/**
 * Governed Procedure — Strix Governance SDK integration for tRPC
 *
 * When STRIX_GOVERNANCE_ENABLED=true, wraps adminProcedure with governance
 * checks (capability validation, approval workflows, evidence logging).
 *
 * When disabled (default), returns plain adminProcedure — zero behavioral change.
 *
 * This file imports from the shared tRPC instance (trpc.ts) to avoid
 * duplicate initTRPC calls. It does NOT create its own tRPC context.
 */

import { adminProcedure } from "./trpc";
import { getStrixClient } from "./strix";
import { CAPABILITIES, type CapabilityId } from "./strix-capabilities";
import { TRPCError } from "@trpc/server";
import { logger } from "./logger";

const GOVERNANCE_ENABLED = process.env.STRIX_GOVERNANCE_ENABLED === "true";

/**
 * Creates a governed version of adminProcedure for a specific capability.
 *
 * Usage in routers.ts:
 *   delete: governedProcedure("admin.programs.delete")
 *     .input(z.object({ id: z.number() }))
 *     .mutation(async ({ input }) => { ... })
 *
 * When governance is OFF: returns adminProcedure unchanged.
 * When governance is ON: adds pre-execution governance check + post-execution evidence logging.
 */
export function governedProcedure(capabilityId: CapabilityId) {
  if (!GOVERNANCE_ENABLED) {
    return adminProcedure;
  }

  const capability = CAPABILITIES[capabilityId];
  if (!capability) {
    logger.error(`[Strix] Unknown capability: ${capabilityId} — falling back to adminProcedure`);
    return adminProcedure;
  }

  // Return adminProcedure with governance middleware
  return adminProcedure.use(async (opts) => {
    const { ctx, next } = opts;
    const strix = getStrixClient();

    if (!strix) {
      // SDK not initialized — fail open with warning (configurable to fail-closed)
      logger.warn(`[Strix] SDK not available for ${capabilityId} — allowing (fail-open)`);
      return next({ ctx });
    }

    const actorId = ctx.user?.id?.toString() ?? "unknown";
    const actorRole = ctx.user?.role ?? "unknown";

    try {
      // Request governance authorization
      const decision = await strix.authorize({
        capabilityId,
        actor: {
          id: actorId,
          role: actorRole,
          type: "human",
        },
        context: {
          riskLevel: capability.riskLevel,
          timestamp: new Date().toISOString(),
        },
      });

      if (!decision.allowed) {
        logger.info(`[Strix] DENIED: ${capabilityId} for actor ${actorId} — reason: ${decision.reason}`);
        throw new TRPCError({
          code: "FORBIDDEN",
          message: decision.reason ?? "Action requires governance approval",
        });
      }

      // Execute the actual procedure
      const result = await next({ ctx });

      // Log evidence (fire-and-forget — don't block the response)
      strix.logEvidence({
        capabilityId,
        actor: { id: actorId, role: actorRole, type: "human" },
        decision: "allowed",
        timestamp: new Date().toISOString(),
      }).catch((err: unknown) => {
        logger.error(`[Strix] Evidence logging failed for ${capabilityId}:`, err);
      });

      return result;
    } catch (err) {
      if (err instanceof TRPCError) throw err;
      // Governance check failed — fail open with error logging
      logger.error(`[Strix] Governance check error for ${capabilityId}:`, err);
      return next({ ctx });
    }
  });
}
