import { logger } from "./logger";

/**
 * Lightweight Sentry integration wrapper.
 * Uses the Sentry SDK if SENTRY_DSN is configured, otherwise no-ops.
 * Install @sentry/node when ready: pnpm add @sentry/node
 */

let sentryInitialized = false;
let Sentry: any = null;

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info("[Sentry] SENTRY_DSN not configured — error reporting disabled");
    return;
  }

  try {
    // Dynamic import to avoid hard dependency until the package is installed
    Sentry = require("@sentry/node");
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: 0.1,
      // Don't send PII
      sendDefaultPii: false,
    });
    sentryInitialized = true;
    logger.info("[Sentry] Initialized successfully");
  } catch (e) {
    logger.warn("[Sentry] @sentry/node not installed — run `pnpm add @sentry/node` to enable error reporting");
  }
}

export function captureException(error: unknown, context?: Record<string, any>) {
  if (!sentryInitialized || !Sentry) return;
  try {
    if (context) {
      Sentry.withScope((scope: any) => {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(error);
    }
  } catch (e) {
    // Sentry itself failing should never crash the app
    logger.error("[Sentry] Failed to capture exception:", e);
  }
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  if (!sentryInitialized || !Sentry) return;
  try {
    Sentry.captureMessage(message, level);
  } catch (e) {
    logger.error("[Sentry] Failed to capture message:", e);
  }
}

export function setUser(user: { id: string; email?: string }) {
  if (!sentryInitialized || !Sentry) return;
  try {
    Sentry.setUser(user);
  } catch (e) {
    // no-op
  }
}
