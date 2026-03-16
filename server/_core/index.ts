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
import { getHealthStatus } from "./health";
import { initSentry } from "./sentry";

// Initialize Sentry as early as possible
initSentry();

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
  
  // Setup Socket.IO for realtime chat (fallback)
  const { ENV } = await import("./env");
  if (ENV.enableSocketIo) {
    const { setupChat } = await import("../chat");
    setupChat(server);
  } else {
    logger.warn("[Chat] Socket.IO disabled. Set ENABLE_SOCKET_IO=true to enable.");
  }
  
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
  
  // Body parser for JSON requests
  app.use(express.json());

  // Skills Lab registration endpoint (rate-limited)
  const { contactFormRateLimiter } = await import("./rateLimiter");
  app.post("/api/skills-lab-register", contactFormRateLimiter, async (req, res) => {
    const { handleSkillsLabRegister } = await import("../skills-lab-register");
    return handleSkillsLabRegister(req, res);
  });

  // Performance Lab application endpoint (rate-limited)
  app.post("/api/performance-lab-apply", contactFormRateLimiter, async (req, res) => {
    const { handlePerformanceLabApply } = await import("../performance-lab-apply");
    return handlePerformanceLabApply(req, res);
  });

  // Profile picture upload endpoint
  const multer = (await import("multer")).default;
  const profileUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"));
      }
    },
  }).single("file");

  app.post("/api/profile/upload-picture", (req, res) => {
    profileUpload(req, res, async (err: unknown) => {
      if (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        return res.status(400).json({ error: msg });
      }
      const file = (req as any).file;
      if (!file) return res.status(400).json({ error: "No file provided" });

      // Authenticate via Authorization header (Clerk JWT)
      try {
        const { authenticateClerkRequest } = await import("./clerk");
        const user = await authenticateClerkRequest(req);
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const { storagePut } = await import("../storage");
        const ext = file.originalname.split(".").pop() || "jpg";
        const key = `profile-pictures/${user.id}-${Date.now()}.${ext}`;
        const { url } = await storagePut(key, file.buffer, file.mimetype);
        res.json({ url, key });
      } catch (error) {
        logger.error("[Profile] Picture upload failed:", error);
        res.status(500).json({ error: "Upload failed" });
      }
    });
  });

  // Setup SSE-based chat (works on all hosting platforms)
  const { setupSSEChat } = await import("../chat-sse");
  setupSSEChat(app);
  
  // Rate limiting middleware
  const { apiRateLimiter } = await import("./rateLimiter");
  app.use("/api/trpc", apiRateLimiter);

  app.get("/api/health", async (_req, res) => {
    const status = await getHealthStatus();
    res.status(status.ok ? 200 : 503).json(status);
  });

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
