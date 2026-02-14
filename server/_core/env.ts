export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  siteUrl: process.env.VITE_SITE_URL ?? process.env.SITE_URL ?? "",
  enableSocketIo:
    process.env.ENABLE_SOCKET_IO !== "false",
  storageMaxBytes: Number(process.env.STORAGE_MAX_BYTES ?? 0),
  storageAllowedContentTypes: process.env.STORAGE_ALLOWED_CONTENT_TYPES ?? "",
  // Clerk authentication
  // Support multiple naming conventions for flexibility
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? 
                        process.env.VITE_CLERK_PUBLISHABLE_KEY ?? 
                        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? 
                        "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  clerkAdminEmail: process.env.CLERK_ADMIN_EMAIL ?? "",
  // Web Push VAPID keys
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  // Ably real-time messaging
  ablyApiKey: process.env.ABLY_API_KEY ?? "",
};
