import { logger } from "@/lib/logger";
export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const CLERK_KEY_REGEX = /^pk_(test|live)_[a-zA-Z0-9]+$/;

// Helper to get Clerk publishable key - supports both VITE_ and NEXT_PUBLIC_ naming conventions
export const getClerkPublishableKey = (): string => {
  const key =
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    "";

  if (!key) return "";

  if (!CLERK_KEY_REGEX.test(key)) {
    logger.warn(
      "[Auth] Clerk publishable key is invalid. Falling back to OAuth."
    );
    return "";
  }

  return key;
};

// Generate login URL - supports both Clerk and legacy OAuth
export const getLoginUrl = () => {
  const clerkKey = getClerkPublishableKey();
  
  // If Clerk is configured, use Clerk's sign-in
  if (clerkKey) {
    return "/sign-in"; // Clerk will handle this route
  }
  
  // Fallback to legacy OAuth
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  if (!oauthPortalUrl || !appId) {
    logger.warn("[Auth] No authentication configured. Set VITE_CLERK_PUBLISHABLE_KEY or OAuth credentials.");
    return "#";
  }
  
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (error) {
    logger.error("[Auth] Failed to create login URL:", error);
    return "#";
  }
};
