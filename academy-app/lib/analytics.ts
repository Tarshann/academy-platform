import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;

// ---------------------------------------------------------------------------
// Sentry
// ---------------------------------------------------------------------------

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('[Analytics] EXPO_PUBLIC_SENTRY_DSN not set — Sentry disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.2,
    enableNativeCrashHandling: true,
    enableAutoPerformanceTracing: true,
  });
}

// ---------------------------------------------------------------------------
// PostHog
// ---------------------------------------------------------------------------

let posthogClient: PostHog | null = null;

export function getPostHog(): PostHog | null {
  return posthogClient;
}

export async function initPostHog(): Promise<PostHog | null> {
  if (!POSTHOG_API_KEY) {
    console.warn('[Analytics] EXPO_PUBLIC_POSTHOG_API_KEY not set — PostHog disabled');
    return null;
  }

  posthogClient = new PostHog(POSTHOG_API_KEY, {
    host: 'https://us.posthog.com',
  });

  return posthogClient;
}

// ---------------------------------------------------------------------------
// Tracking helpers — safe to call even when PostHog is not configured
// ---------------------------------------------------------------------------

export function trackEvent(event: string, properties?: Record<string, string | number | boolean | null>) {
  posthogClient?.capture(event, properties);
}

export function identifyUser(userId: string, traits?: Record<string, string | number | boolean | null>) {
  posthogClient?.identify(userId, traits);
  Sentry.setUser({ id: userId, ...traits });
}

export function resetUser() {
  posthogClient?.reset();
  Sentry.setUser(null);
}
