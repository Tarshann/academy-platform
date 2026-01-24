import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { logger } from "./logger";
import { validateEnv } from "./validateEnv";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  validateEnv();
  const app = express();
  const server = createServer(app);
  
  // Setup Socket.IO for realtime chat
  const { setupChat } = await import("../chat");
  setupChat(server);
  
  // Stripe webhook MUST be registered BEFORE express.json() to preserve raw body
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const { handleStripeWebhook } = await import("../stripe-webhook");
      return handleStripeWebhook(req, res);
    }
  );
  
  // Configure Clerk middleware (if configured)
  const { ENV } = await import("./env");
  if (ENV.clerkSecretKey) {
    app.use(clerkMiddleware({
      secretKey: ENV.clerkSecretKey,
      publishableKey: ENV.clerkPublishableKey,
    }));
    logger.info("[Clerk] Middleware initialized");
  } else {
    // Fallback to old OAuth if Clerk not configured
    registerOAuthRoutes(app);
  }
  
  // Body parser already configured above
  // Rate limiting middleware
  const { apiRateLimiter } = await import("./rateLimiter");
  app.use("/api/trpc", apiRateLimiter);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    logger.warn(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(error => {
  logger.error("Server failed to start:", error);
});
