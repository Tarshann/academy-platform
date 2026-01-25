import { TRPCClientError } from "@trpc/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

/**
 * Get user-friendly error message from tRPC error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof TRPCClientError) {
    return error.message || "An error occurred";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

/**
 * Handle errors with appropriate user feedback
 */
export function handleError(error: unknown, context?: string) {
  const message = getErrorMessage(error);
  const fullMessage = context ? `${context}: ${message}` : message;
  
  toast.error(fullMessage);
  
  logger.error(`[ErrorHandler] ${context || "Error"}:`, error);
}

/**
 * Error recovery strategies
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof TRPCClientError) {
        const code = (error.data as any)?.code;
        if (code && code.startsWith("4")) {
          throw error;
        }
      }
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
}
