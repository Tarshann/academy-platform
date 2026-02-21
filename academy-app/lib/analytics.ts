import PostHog from 'posthog-react-native';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;

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
}

export function resetUser() {
  posthogClient?.reset();
}
