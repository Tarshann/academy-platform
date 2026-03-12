/**
 * Academy Platform — Governed tRPC Procedure
 *
 * This module provides the `governedProcedure` builder that replaces
 * `adminProcedure` for destructive actions. It enforces the Strix
 * runtime governance invariant at the tRPC procedure boundary.
 *
 * Usage in routers:
 *
 *   // Before (fragile RBAC only):
 *   delete: adminProcedure
 *     .input(z.object({ id: z.number() }))
 *     .mutation(async ({ input }) => {
 *       await deleteProgram(input.id);
 *     }),
 *
 *   // After (governed by Strix kernel):
 *   delete: governedProcedure("academy.program.delete")
 *     .input(z.object({ id: z.number() }))
 *     .mutation(async ({ input, ctx }) => {
 *       await deleteProgram(input.id);
 *       return { success: true, executionId: ctx.strix.executionId };
 *     }),
 */

import { TRPCError } from "@trpc/server";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { NOT_ADMIN_ERR_MSG } from "../../shared/const";
import type { TrpcContext } from "./context";
import { strix } from "./strix";

// ─── tRPC Instance ──────────────────────────────────────────────────

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

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
 * This procedure:
 * 1. Verifies the user is an admin (preserves existing RBAC)
 * 2. Extracts the Strix Decision Token from request headers
 * 3. Verifies and redeems the token via the Strix SDK
 * 4. Blocks execution if any check fails (fail-closed)
 * 5. Attaches the execution ID to the context for evidence tracking
 *
 * @param capabilityId - The Strix capability to enforce
 */
export function governedProcedure(capabilityId: string) {
  return t.procedure.use(
    t.middleware(async (opts) => {
      const { ctx, next } = opts;

      // ── Step 1: Preserve existing RBAC (admin check) ──────────
      if (!ctx.user || ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: NOT_ADMIN_ERR_MSG,
        });
      }

      // ── Step 2: Extract Strix token from headers ──────────────
      const token = ctx.req.headers["x-strix-token"] as string | undefined;

      if (!token) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Governance Blocked [TOKEN_REQUIRED]: Missing "x-strix-token" header for capability "${capabilityId}". This action requires a governance decision token.`,
        });
      }

      // ── Step 3: Verify and redeem via Strix SDK ───────────────
      const actorId = String(ctx.user.id);
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

      // ── Step 4: Attach governance context and proceed ─────────
      return next({
        ctx: {
          ...ctx,
          user: ctx.user,
          strix: {
            executionId: redemption.executionId,
            capabilityId,
            governed: true as const,
          },
        },
      });
    })
  );
}

/**
 * Helper to request a governance decision token.
 * Called from the admin UI before executing a destructive action.
 *
 * @param capabilityId - The capability to request a decision for
 * @param actorId - The user requesting the action
 * @param resourceId - The specific resource being acted upon
 */
export async function requestGovernanceToken(
  capabilityId: string,
  actorId: string,
  resourceId?: string
) {
  return strix.requestDecision({
    capabilityId,
    actorId,
    resourceId,
    environment: process.env.NODE_ENV ?? "development",
  });
}

/**
 * Helper to simulate a governance decision.
 * Useful for UI to show whether an action will be allowed before attempting it.
 */
export async function simulateGovernance(
  capabilityId: string,
  actorId: string,
  resourceId?: string
) {
  return strix.simulate({
    capability: capabilityId,
    actorId,
    resourceId,
  });
}
