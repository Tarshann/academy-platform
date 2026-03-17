/**
 * Strix Governance — Feature-Flagged Procedure Wrapper
 *
 * When STRIX_GOVERNANCE_ENABLED=true:
 *   governedProcedure("capability.id") returns adminProcedure + governance middleware
 *   evaluateCronGovernance("capability.id") checks cron jobs before execution
 *
 * When STRIX_GOVERNANCE_ENABLED is falsy (default):
 *   governedProcedure() returns plain adminProcedure (zero behavioral change)
 *   evaluateCronGovernance() returns { allowed: true } (cron runs normally)
 *
 * This ensures the live site is completely unaffected until governance is explicitly activated.
 */

import { adminProcedure } from "./trpc";
import { TRPCError } from "@trpc/server";
import { logger } from "./logger";

const GOVERNANCE_ENABLED = process.env.STRIX_GOVERNANCE_ENABLED === "true";

/**
 * Returns a governed tRPC procedure for admin mutations.
 * When governance is OFF, this is identical to adminProcedure.
 */
export function governedProcedure(capabilityId?: string) {
  if (!GOVERNANCE_ENABLED || !capabilityId) {
    return adminProcedure;
  }

  return adminProcedure.use(async (opts) => {
    const { ctx, next } = opts;
    try {
      const { getStrixClient } = await import("./strix");
      const strix = getStrixClient();

      if (!strix) {
        logger.warn(`[governance] Strix SDK not available, allowing ${capabilityId}`);
        return next({ ctx });
      }

      const decision = await strix.evaluate({
        capabilityId,
        actor: {
          id: String(ctx.user.id),
          role: ctx.user.role ?? "unknown",
          email: ctx.user.email ?? undefined,
        },
        context: {
          source: "trpc",
          timestamp: new Date().toISOString(),
        },
      });

      if (decision.action === "deny") {
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
      // Fail open — allow action, log error
      logger.error(`[governance] SDK error for ${capabilityId}:`, err);
      return next({ ctx });
    }
  });
}

/**
 * Evaluates governance for a cron job before execution.
 * When governance is OFF, always returns { allowed: true }.
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

  try {
    const { getStrixClient } = await import("./strix");
    const strix = getStrixClient();

    if (!strix) {
      logger.warn(`[governance] Strix SDK not available for cron ${cronName}, allowing`);
      return { allowed: true };
    }

    const decision = await strix.evaluate({
      capabilityId,
      actor: {
        id: "system:cron",
        role: "automation",
      },
      context: {
        source: "cron",
        cronName,
        timestamp: new Date().toISOString(),
      },
    });

    if (decision.action === "deny") {
      logger.warn(`[governance] Cron ${cronName} denied: ${decision.reason}`);
      return { allowed: false, reason: decision.reason, decisionId: decision.id };
    }

    return { allowed: true, decisionId: decision.id };
  } catch (err) {
    // Fail open for cron — don't break scheduled jobs
    logger.error(`[governance] SDK error for cron ${cronName}:`, err);
    return { allowed: true };
  }
}
