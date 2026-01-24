import { ENV } from "./env";
import { logger } from "./logger";

type EnvCheck = {
  key: string;
  value: string | undefined;
  requiredInProd?: boolean;
};

const envChecks: EnvCheck[] = [
  { key: "DATABASE_URL", value: ENV.databaseUrl, requiredInProd: true },
  { key: "JWT_SECRET", value: ENV.cookieSecret, requiredInProd: true },
];

function hasAuthConfig() {
  const hasClerk = Boolean(ENV.clerkSecretKey && ENV.clerkPublishableKey);
  const hasOAuth = Boolean(ENV.oAuthServerUrl && ENV.appId);
  return hasClerk || hasOAuth;
}

export function validateEnv() {
  if (!ENV.isProduction) return;

  const missingRequired = envChecks
    .filter(check => check.requiredInProd && !check.value)
    .map(check => check.key);

  if (!hasAuthConfig()) {
    missingRequired.push(
      "CLERK_SECRET_KEY/CLERK_PUBLISHABLE_KEY or OAUTH_SERVER_URL/VITE_APP_ID"
    );
  }

  if (missingRequired.length > 0) {
    logger.error(
      `[Env] Missing required production variables: ${missingRequired.join(", ")}`
    );
    process.exit(1);
  }

  if (!ENV.stripeSecretKey || !ENV.stripeWebhookSecret) {
    logger.warn(
      "[Env] Stripe secrets are not configured. Payments will fail in production."
    );
  }

  if (!ENV.resendApiKey) {
    logger.warn(
      "[Env] RESEND_API_KEY not configured. Email notifications will be disabled."
    );
  }
}
