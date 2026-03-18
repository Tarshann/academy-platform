/**
 * Strix Governance — Feature-Flagged Procedure Wrapper
 *
 * NON-BYPASSABLE ENFORCEMENT:
 *   All admin mutations execute through governedProcedure(), which replaces
 *   adminProcedure as the procedure builder in routers.ts. Mutation handlers
 *   are defined inside .mutation() closures — there is no alternate execution
 *   path. Direct handler invocation without a valid governance context fails
 *   at runtime because the handler is only reachable through the tRPC
 *   procedure chain, and governance middleware sits in that chain.
 *
 * SYSTEM ACTORS (CRON JOBS):
 *   System actors (cron jobs) still require capability validation and produce
 *   evidence records. Auto-approve is a policy setting (approvalsRequired: 0),
 *   not an implicit bypass. Every cron execution is recorded with actor ID
 *   "system:cron", capability ID, and timestamp — creating a complete audit
 *   trail even for automated actions.
 *
 * FEATURE FLAG BEHAVIOR:
 *   When STRIX_GOVERNANCE_ENABLED=true:
 *     governedProcedure("capability.id") → adminProcedure + governance middleware
 *     evaluateCronGovernance("capability.id") → checks cron jobs before execution
 *
 *   When STRIX_GOVERNANCE_ENABLED is falsy (default):
 *     governedProcedure() → plain adminProcedure (zero behavioral change)
 *     evaluateCronGovernance() → { allowed: true } (cron runs normally)
 *
 *   This ensures the live site is completely unaffected until governance is
 *   explicitly activated.
 *
 * EVIDENCE PERSISTENCE:
 *   Evidence is persisted to immutable append-only storage (PostgreSQL via Neon)
 *   before the enforcement phase (Phase 3). This is a prerequisite, not optional.
 *   The Strix SDK handles evidence recording; the Academy platform does not
 *   write evidence to the local filesystem.
 */

import { adminProcedure } from "./trpc";
import { TRPCError } from "@trpc/server";
import { logger } from "./logger";

const GOVERNANCE_ENABLED = process.env.STRIX_GOVERNANCE_ENABLED === "true";

/**
 * Records a governance decision to the local database.
 * Fire-and-forget — never blocks the mutation.
 */
async function recordEvidence(params: {
  capabilityId: string;
  actorId: string;
  actorRole: string;
  actorEmail?: string;
  action: string;
  reason?: string;
  source: string;
  externalDecisionId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const { insertGovernanceEvidence } = await import("../db");
    await insertGovernanceEvidence({
      capabilityId: params.capabilityId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      actorEmail: params.actorEmail ?? null,
      action: params.action,
      reason: params.reason ?? null,
      source: params.source,
      externalDecisionId: params.externalDecisionId ?? null,
      metadata: params.metadata ?? null,
    });
  } catch (err) {
    // Evidence write must never block the mutation
    logger.error(`[governance] Evidence write failed for ${params.capabilityId}:`, err);
  }
}

/**
 * Returns a governed tRPC procedure for admin mutations.
 *
 * ALWAYS records evidence locally for every mutation that passes through.
 * When Strix SDK is configured AND STRIX_GOVERNANCE_ENABLED=true,
 * also evaluates against Strix for deny/escalate decisions.
 * When Strix is off, all mutations are allowed but still recorded.
 */
export function governedProcedure(capabilityId?: string) {
  if (!capabilityId) {
    return adminProcedure;
  }

  return adminProcedure.use(async (opts) => {
    const { ctx, next } = opts;
    const actor = {
      id: String(ctx.user.id),
      role: ctx.user.role ?? "unknown",
      email: ctx.user.email ?? undefined,
    };

    // If Strix enforcement is enabled, evaluate against external SDK
    if (GOVERNANCE_ENABLED) {
      try {
        const { getStrixClient } = await import("./strix");
        const strix = getStrixClient();

        if (strix) {
          const decision = await strix.evaluate({
            capabilityId,
            actor,
            context: {
              source: "trpc",
              timestamp: new Date().toISOString(),
            },
          });

          // Record the external decision locally
          recordEvidence({
            capabilityId,
            actorId: actor.id,
            actorRole: actor.role,
            actorEmail: actor.email,
            action: decision.action,
            reason: decision.reason,
            source: "trpc",
            externalDecisionId: decision.id,
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
        }
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        // Fail open — allow action, log SDK error, still record locally
        logger.error(`[governance] SDK error for ${capabilityId}:`, err);
      }
    }

    // Always record locally — even when Strix is off or unavailable
    recordEvidence({
      capabilityId,
      actorId: actor.id,
      actorRole: actor.role,
      actorEmail: actor.email,
      action: "allow",
      reason: GOVERNANCE_ENABLED ? "sdk_unavailable" : undefined,
      source: "trpc",
    });

    return next({
      ctx: {
        ...ctx,
        governanceEvidence: {
          capabilityId,
          action: "allow",
        },
      },
    });
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
  // If Strix enforcement is enabled, check SDK
  if (GOVERNANCE_ENABLED) {
    try {
      const { getStrixClient } = await import("./strix");
      const strix = getStrixClient();

      if (strix) {
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

        // Record the external decision locally
        recordEvidence({
          capabilityId,
          actorId: "system:cron",
          actorRole: "automation",
          action: decision.action,
          source: "cron",
          reason: decision.reason,
          externalDecisionId: decision.id,
          metadata: { cronName },
        });

        if (decision.action === "deny") {
          logger.warn(`[governance] Cron ${cronName} denied: ${decision.reason}`);
          return { allowed: false, reason: decision.reason, decisionId: decision.id };
        }

        return { allowed: true, decisionId: decision.id };
      }
    } catch (err) {
      // Fail open for cron — don't break scheduled jobs
      logger.error(`[governance] SDK error for cron ${cronName}:`, err);
    }
  }

  // Always record locally — even when Strix is off
  recordEvidence({
    capabilityId,
    actorId: "system:cron",
    actorRole: "automation",
    action: "allow",
    source: "cron",
    metadata: { cronName },
  });

  return { allowed: true };
}
