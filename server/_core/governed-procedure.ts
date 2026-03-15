/**
 * Academy Platform — Governed tRPC Procedure
 *
 * Provides the `governedProcedure` builder that wraps `adminProcedure`
 * with Strix governance enforcement for destructive actions.
 *
 * FEATURE FLAG: When STRIX_GOVERNANCE_ENABLED is not "true", this
 * returns a plain `adminProcedure` — zero behavior change from
 * the current production code path.
 *
 * Usage in routers:
 *
 *   // Before (fragile RBAC only):
 *   delete: adminProcedure
 *     .input(z.object({ id: z.number() }))
 *     .mutation(async ({ input }) => { ... }),
 *
 *   // After (governed by Strix kernel when flag is on):
 *   delete: governedProcedure("academy.program.delete")
 *     .input(z.object({ id: z.number() }))
 *     .mutation(async ({ input, ctx }) => { ... }),
 */

import { TRPCError } from "@trpc/server";
import { adminProcedure } from "./trpc";

// ─── Feature Flag ───────────────────────────────────────────────────

const GOVERNANCE_ENABLED = process.env.STRIX_GOVERNANCE_ENABLED === "true";

// ─── Strix Governance Context Extension ─────────────────────────────

export interface StrixContext {
  strix: {
    executionId: string;
    capabilityId: string;
    governed: true;
  };
}

// ─── Governed Procedure Builder ─────────────────────────────────────

/**
 * Create a governed procedure for a specific capability.
 *
 * When STRIX_GOVERNANCE_ENABLED=true:
 * 1. Verifies the user is an admin (via adminProcedure base)
 * 2. Extracts the Strix Decision Token from request headers
 * 3. Verifies and redeems the token via the Strix SDK
 * 4. Blocks execution if any check fails (fail-closed)
 * 5. Attaches the execution ID to the context for evidence tracking
 *
 * When STRIX_GOVERNANCE_ENABLED is not "true":
 * Returns adminProcedure unchanged — identical to current production.
 *
 * @param capabilityId - The Strix capability to enforce
 */
export function governedProcedure(capabilityId: string) {
  if (!GOVERNANCE_ENABLED) {
    // Feature flag OFF: pass through to plain adminProcedure.
    // Zero behavior change from current production.
    return adminProcedure;
  }

  // Feature flag ON: enforce Strix governance.
  // Lazy-import strix to avoid loading SDK when governance is off.
  return adminProcedure.use(async (opts) => {
    const { ctx, next } = opts;

    // ── Import Strix SDK lazily ─────────────────────────────────
    const { strix } = await import("./strix");

    // ── Extract Strix token from headers ────────────────────────
    const token = (ctx as any).req?.headers?.["x-strix-token"] as
      | string
      | undefined;

    if (!token) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Governance Blocked [TOKEN_REQUIRED]: Missing "x-strix-token" header for capability "${capabilityId}". This action requires a governance decision token.`,
      });
    }

    // ── Verify and redeem via Strix SDK ─────────────────────────
    const actorId = String((ctx as any).user?.id ?? "unknown");
    const environment = process.env.NODE_ENV ?? "development";

    const redemption = await strix.verifyAndRedeem({
      token,
      capabilityId,
      actorId,
      environment,
    });

    if (!redemption.success) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Governance Blocked [${redemption.blockCode}]: ${redemption.reason}`,
      });
    }

    // ── Attach governance context and proceed ───────────────────
    return next({
      ctx: {
        ...ctx,
        strix: {
          executionId: redemption.executionId,
          capabilityId,
          governed: true as const,
        },
      },
    });
  });
}

// ─── Helper Functions ───────────────────────────────────────────────

/**
 * Request a governance decision token.
 * Called from the admin UI before executing a destructive action.
 */
export async function requestGovernanceToken(
  capabilityId: string,
  actorId: string,
  resourceId?: string
) {
  if (!GOVERNANCE_ENABLED) {
    return { token: null, message: "Governance is not enabled" };
  }
  const { strix } = await import("./strix");
  return strix.requestDecision({
    capabilityId,
    actorId,
    resourceId,
    environment: process.env.NODE_ENV ?? "development",
  });
}

/**
 * Simulate a governance decision.
 * Useful for UI to show whether an action will be allowed.
 */
export async function simulateGovernance(
  capabilityId: string,
  actorId: string,
  resourceId?: string
) {
  if (!GOVERNANCE_ENABLED) {
    return { allowed: true, message: "Governance is not enabled" };
  }
  const { strix } = await import("./strix");
  return strix.simulate({
    capability: capabilityId,
    actorId,
    resourceId,
  });
}
