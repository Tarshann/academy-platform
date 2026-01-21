export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL - supports both Clerk and legacy OAuth
export const getLoginUrl = () => {
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  
  // If Clerk is configured, use Clerk's sign-in
  if (clerkKey) {
    return "/sign-in"; // Clerk will handle this route
  }
  
  // Fallback to legacy OAuth
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  if (!oauthPortalUrl || !appId) {
    console.warn("[Auth] No authentication configured. Set VITE_CLERK_PUBLISHABLE_KEY or OAuth credentials.");
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
    console.error("[Auth] Failed to create login URL:", error);
    return "#";
  }
};
