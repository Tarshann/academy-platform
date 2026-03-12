/**
 * useGovernedMutation — Strix Governance Token Flow for Admin UI
 *
 * This hook wraps any tRPC mutation that targets a governed route.
 * Before executing the destructive action, it:
 *
 *   1. Requests a governance decision token from the Strix SDK
 *   2. Attaches the token to the mutation via x-strix-token header
 *   3. Executes the mutation only if the token was issued
 *   4. Handles REQUIRES_APPROVAL and DENIED states gracefully
 *
 * Usage:
 *   const deleteProgram = useGovernedMutation(
 *     trpc.admin.programs.delete,
 *     "academy.program.delete"
 *   );
 *
 *   // In your handler:
 *   await deleteProgram.governedMutateAsync({ id: 42 });
 */

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

type GovernanceDecision = {
  decisionId: string;
  status: "ALLOWED" | "DENIED" | "REQUIRES_APPROVAL";
  token?: string;
  reason?: string;
  missingApprovals?: number;
};

type GovernedMutationState = {
  isRequestingToken: boolean;
  isExecuting: boolean;
  isPending: boolean;
  lastDecision: GovernanceDecision | null;
  error: string | null;
};

type GovernedMutationResult<TInput, TOutput> = GovernedMutationState & {
  /** Request a token and execute the mutation in one step */
  governedMutateAsync: (input: TInput, resourceId?: string) => Promise<TOutput>;
  /** Simulate the governance decision without executing */
  simulate: () => Promise<{ status: string; reason?: string; missingApprovals?: number }>;
  /** Reset error state */
  reset: () => void;
};

/**
 * Hook that wraps a tRPC mutation with Strix governance token flow.
 *
 * @param mutation - The tRPC mutation hook (e.g., trpc.admin.programs.delete)
 * @param capabilityId - The Strix capability ID (e.g., "academy.program.delete")
 */
export function useGovernedMutation<TInput, TOutput>(
  mutation: any,
  capabilityId: string
): GovernedMutationResult<TInput, TOutput> {
  const [state, setState] = useState<GovernedMutationState>({
    isRequestingToken: false,
    isExecuting: false,
    isPending: false,
    lastDecision: null,
    error: null,
  });

  const requestToken = trpc.governance.requestToken.useMutation();
  const simulateDecision = trpc.governance.simulate.useMutation();
  const innerMutation = mutation.useMutation();

  const reset = useCallback(() => {
    setState({
      isRequestingToken: false,
      isExecuting: false,
      isPending: false,
      lastDecision: null,
      error: null,
    });
  }, []);

  const simulate = useCallback(async () => {
    try {
      const result = await simulateDecision.mutateAsync({ capabilityId });
      return result;
    } catch (err: any) {
      throw new Error(err?.message || "Simulation failed");
    }
  }, [capabilityId, simulateDecision]);

  const governedMutateAsync = useCallback(
    async (input: TInput, resourceId?: string): Promise<TOutput> => {
      setState((prev) => ({
        ...prev,
        isRequestingToken: true,
        isPending: true,
        error: null,
      }));

      try {
        // Step 1: Request governance decision token
        const decision = await requestToken.mutateAsync({
          capabilityId,
          resourceId,
        });

        setState((prev) => ({
          ...prev,
          isRequestingToken: false,
          lastDecision: decision as GovernanceDecision,
        }));

        // Step 2: Handle non-ALLOWED decisions
        if (decision.status === "DENIED") {
          const errorMsg = `Action denied by governance: ${decision.reason || "Policy denied"}`;
          setState((prev) => ({
            ...prev,
            isPending: false,
            error: errorMsg,
          }));
          throw new Error(errorMsg);
        }

        if (decision.status === "REQUIRES_APPROVAL") {
          const errorMsg = `This action requires ${decision.missingApprovals} additional approval(s)`;
          setState((prev) => ({
            ...prev,
            isPending: false,
            error: errorMsg,
          }));
          throw new Error(errorMsg);
        }

        if (!decision.token) {
          const errorMsg = "Governance token was not issued";
          setState((prev) => ({
            ...prev,
            isPending: false,
            error: errorMsg,
          }));
          throw new Error(errorMsg);
        }

        // Step 3: Execute the mutation with the governance token
        setState((prev) => ({ ...prev, isExecuting: true }));

        // The token is passed via a custom header. The tRPC client
        // needs to pick this up. We store it in a global that the
        // tRPC link can read, or we pass it as part of the context.
        const result = await innerMutation.mutateAsync(input, {
          context: {
            strixToken: decision.token,
          },
        });

        setState({
          isRequestingToken: false,
          isExecuting: false,
          isPending: false,
          lastDecision: decision as GovernanceDecision,
          error: null,
        });

        return result as TOutput;
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          isRequestingToken: false,
          isExecuting: false,
          isPending: false,
          error: prev.error || err?.message || "Governed action failed",
        }));
        throw err;
      }
    },
    [capabilityId, requestToken, innerMutation]
  );

  return {
    ...state,
    governedMutateAsync,
    simulate,
    reset,
  };
}
