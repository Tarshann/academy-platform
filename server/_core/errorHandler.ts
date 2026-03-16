import { TRPCError } from "@trpc/server";
import { HttpError, ErrorCode } from "../../shared/_core/errors";
import { logger } from "./logger";
import { captureException } from "./sentry";

/**
 * Transform domain errors to tRPC errors
 */
export function transformError(error: unknown): TRPCError {
  if (error instanceof HttpError) {
    const codeMap: Record<number, TRPCError["code"]> = {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      500: "INTERNAL_SERVER_ERROR",
    };

    return new TRPCError({
      code: codeMap[error.statusCode] || "INTERNAL_SERVER_ERROR",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof TRPCError) {
    return error;
  }

  // Log unexpected errors and report to Sentry
  logger.error("[ErrorHandler] Unexpected error:", error);
  captureException(error, { source: "tRPC" });

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: error instanceof Error ? error.message : "An unexpected error occurred",
    cause: error,
  });
}

/**
 * Error handler middleware for tRPC procedures
 */
export function errorHandler() {
  return {
    onError: ({ error, path }: { error: unknown; path: string }) => {
      const transformed = transformError(error);
      
      // Log error with context
      logger.error(`[tRPC Error] ${path}:`, {
        code: transformed.code,
        message: transformed.message,
        cause: transformed.cause,
      });

      // Report server errors to Sentry (skip client errors like 400/401/403)
      if (transformed.code === "INTERNAL_SERVER_ERROR") {
        captureException(error, { path, code: transformed.code });
      }

      return transformed;
    },
  };
}
