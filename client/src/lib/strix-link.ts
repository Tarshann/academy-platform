/**
 * Strix tRPC Link — Attaches governance tokens to outgoing requests
 *
 * When a tRPC mutation is called with `context.strixToken`, this link
 * automatically attaches it as the `x-strix-token` HTTP header so the
 * server-side governed procedure middleware can validate it.
 *
 * Usage in tRPC client setup:
 *
 *   import { strixHeaderLink } from "@/lib/strix-link";
 *
 *   const client = trpc.createClient({
 *     links: [
 *       strixHeaderLink(),
 *       httpBatchLink({ url: "/api/trpc" }),
 *     ],
 *   });
 */

import { TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import type { AppRouter } from "../../../server/routers";

/**
 * A tRPC link that reads `strixToken` from the operation context
 * and stores it so the httpBatchLink can pick it up via headers.
 *
 * This approach uses a module-level variable that the headers
 * function in the httpBatchLink reads.
 */
let pendingStrixToken: string | null = null;

/**
 * Get and clear the pending Strix token.
 * Called by the httpBatchLink headers function.
 */
export function consumeStrixToken(): string | null {
  const token = pendingStrixToken;
  pendingStrixToken = null;
  return token;
}

/**
 * tRPC link that extracts the Strix token from operation context
 * and makes it available for the HTTP headers.
 */
export function strixHeaderLink(): TRPCLink<AppRouter> {
  return () => {
    return ({ next, op }) => {
      // Extract strixToken from the operation context
      const ctx = op.context as Record<string, unknown>;
      if (ctx?.strixToken && typeof ctx.strixToken === "string") {
        pendingStrixToken = ctx.strixToken;
      }

      return next(op);
    };
  };
}

/**
 * Headers function for httpBatchLink that includes the Strix token.
 *
 * Usage:
 *   httpBatchLink({
 *     url: "/api/trpc",
 *     headers: strixHeaders,
 *   })
 */
export function strixHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = consumeStrixToken();
  if (token) {
    headers["x-strix-token"] = token;
  }
  return headers;
}
