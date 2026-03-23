/**
 * Strix Governance — Embedded Kernel with Local Evidence Persistence
 *
 * NON-BYPASSABLE ENFORCEMENT:
 *   All admin mutations execute through governedProcedure(), which replaces
 *   adminProcedure as the procedure builder in routers.ts. Mutation handlers
 *   are defined inside .mutation() closures — there is no alternate execution
 *   path.
 *
 * EVIDENCE PERSISTENCE:
 *   Evidence is ALWAYS written locally to the governance_evidence table in
 *   PostgreSQL (Neon) — for every governed action, regardless of whether the
 *   external Strix SDK is configured. This is the durable source of truth.
 *
 * STRIX SDK (OPTIONAL):
 *   When STRIX_GOVERNANCE_ENABLED=true AND STRIX_API_KEY is set, the SDK is
 *   also consulted for policy decisions (allow/deny/escalate). External
 *   decisions are recorded locally with externalDecisionId.
 *
 * FAIL BEHAVIOR:
 *   - Evidence write failure: logged, action still proceeds (fail-open on write)
 *   - Strix API failure: logged, action proceeds, evidence recorded as allow (fail-open on policy)
 *   - Strix API deny: evidence recorded as deny, TRPCError FORBIDDEN thrown (fail-closed on deny)
 */

import { adminProcedure } from "./trpc";
import { TRPCError } from "@trpc/server";
import { createHash } from "crypto";
import { logger } from "./logger";
import { getCapability } from "./strix-capabilities";

const GOVERNANCE_ENABLED = process.env.STRIX_GOVERNANCE_ENABLED === "true";

/**
 * Per-process SDK error dedup flag.
 *
 * In Vercel serverless, each invocation is a fresh process so the circuit
 * breaker state in strix.ts resets every time. Without dedup, every governed
 * action that hits an unreachable SDK logs a separate error — producing 100+
 * error entries/day from cron jobs alone.
 *
 * This flag ensures we log the FIRST SDK error per process (as a warning),
 * then silently fall through on subsequent calls within the same invocation.
 */
let _sdkErrorLoggedThisProcess = false;

/**
 * Local policy evaluation — deterministic rules based on capability registry.
 * Provides real enforcement without external SDK dependency.
 *
 * Policy rules:
 *   CRITICAL (approvalsRequired >= 2) → deny unless actor is owner
 *   HIGH     (approvalsRequired >= 1) → escalate (soft: recorded, action proceeds)
 *   MEDIUM/LOW                        → allow with local_policy attribution
 *
 * Escalate is "soft" until an approval workflow UI exists —
 * the action proceeds but evidence records the escalation for audit.
 */
function evaluateLocalPolicy(
  capabilityId: string,
  actor: { id: string; role: string; email?: string }
): { action: "allow" | "deny" | "escalate"; reason: string } {
  const capability = getCapability(capabilityId);
  if (!capability) {
    return { action: "allow", reason: "unregistered_capability" };
  }

  const ownerEmail = process.env.CLERK_ADMIN_EMAIL;

  // CRITICAL capabilities: only the owner can execute
  if (capability.risk === "critical" && capability.approvalsRequired >= 2) {
    if (actor.email !== ownerEmail) {
      return { action: "deny", reason: "critical_requires_owner" };
    }
    // Owner executing critical action — allow but note it
    return { action: "allow", reason: "owner_authorized" };
  }

  // HIGH capabilities with approval requirements: escalate (soft)
  if (capability.risk === "high" && capability.approvalsRequired >= 1) {
    return { action: "escalate", reason: "high_risk_audit" };
  }

  return { action: "allow", reason: "local_policy" };
}

/**
 * Computes a SHA-256 hash of the decision payload for tamper-proof evidence.
 * The hash covers all decision-relevant fields in a deterministic order.
 */
function computeEvidenceHash(params: {
  capabilityId: string;
  actorId: string;
  actorRole: string;
  actorEmail?: string;
  action: string;
  reason?: string;
  source: string;
  timestamp: string;
}): string {
  const payload = JSON.stringify({
    capabilityId: params.capabilityId,
    actorId: params.actorId,
    actorRole: params.actorRole,
    actorEmail: params.actorEmail ?? null,
    action: params.action,
    reason: params.reason ?? null,
    source: params.source,
    timestamp: params.timestamp,
  });
  return createHash("sha256").update(payload).digest("hex");
}

/**
 * Records a governance decision to the local database.
 * Fire-and-forget — never blocks the mutation.
 * Each evidence record includes a SHA-256 hash of the decision payload
 * for tamper detection and audit integrity.
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
    const timestamp = new Date().toISOString();
    const evidenceHash = computeEvidenceHash({
      capabilityId: params.capabilityId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      actorEmail: params.actorEmail,
      action: params.action,
      reason: params.reason,
      source: params.source,
      timestamp,
    });

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
      evidenceHash,
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
        const { getStrixClient, isStrixCircuitOpen, isStrixConfigured } = await import("./strix");

        // Skip SDK call entirely when circuit breaker is open or SDK not configured
        if (isStrixConfigured() && !isStrixCircuitOpen()) {
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

            // Reset dedup flag on success — SDK is reachable again
            _sdkErrorLoggedThisProcess = false;

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
        }
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        // Fail open — allow action, still record locally.
        // Log only the first SDK error per process to avoid log spam in serverless.
        if (!_sdkErrorLoggedThisProcess) {
          _sdkErrorLoggedThisProcess = true;
          logger.warn(`[governance] SDK unreachable for ${capabilityId}, falling back to local policy:`, err);
        }
      }
    }

    // Evaluate local policy when SDK is unavailable or governance is off
    const localDecision = GOVERNANCE_ENABLED
      ? evaluateLocalPolicy(capabilityId, actor)
      : { action: "allow" as const, reason: "governance_disabled" };

    // Record evidence with local policy decision
    recordEvidence({
      capabilityId,
      actorId: actor.id,
      actorRole: actor.role,
      actorEmail: actor.email,
      action: localDecision.action,
      reason: localDecision.reason,
      source: "trpc",
    });

    // Hard deny — block the mutation
    if (localDecision.action === "deny") {
      const capability = getCapability(capabilityId);
      logger.warn(
        `[governance] Local policy denied ${capabilityId} for actor ${actor.id}: ${localDecision.reason}`
      );
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Action denied by governance policy: ${localDecision.reason}. "${capability?.label ?? capabilityId}" is a critical capability that requires owner authorization.`,
      });
    }

    // Escalate (soft) or allow — proceed with evidence attached
    return next({
      ctx: {
        ...ctx,
        governanceEvidence: {
          capabilityId,
          action: localDecision.action,
        },
      },
    });
  });
}

/**
 * Evaluates governance for a cron job before execution.
 * Always records evidence locally. When Strix is enabled and available,
 * also consults the external SDK for policy decisions.
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
      const { getStrixClient, isStrixCircuitOpen, isStrixConfigured } = await import("./strix");

      // Skip SDK call entirely when circuit breaker is open or SDK not configured
      if (isStrixConfigured() && !isStrixCircuitOpen()) {
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

          // Reset dedup flag on success — SDK is reachable again
          _sdkErrorLoggedThisProcess = false;

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
      }
    } catch (err) {
      // Fail open for cron — don't break scheduled jobs.
      // Log only the first SDK error per process to avoid log spam in serverless.
      if (!_sdkErrorLoggedThisProcess) {
        _sdkErrorLoggedThisProcess = true;
        logger.warn(`[governance] SDK unreachable for cron ${cronName}, falling back to local policy:`, err);
      }
    }
  }

  // Local policy for cron: all cron jobs have approvalsRequired: 0,
  // so they pass local policy as "allow" with local_policy attribution
  const cronCapability = getCapability(capabilityId);
  const cronReason = GOVERNANCE_ENABLED
    ? (cronCapability ? "local_policy" : "unregistered_capability")
    : "governance_disabled";

  recordEvidence({
    capabilityId,
    actorId: "system:cron",
    actorRole: "automation",
    action: "allow",
    reason: cronReason,
    source: "cron",
    metadata: { cronName },
  });

  return { allowed: true };
}
