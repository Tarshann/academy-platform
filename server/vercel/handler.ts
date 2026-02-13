import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { clerkMiddleware } from "@clerk/express";
import { appRouter } from "../routers";
import { createContext } from "../_core/context";
import { ENV } from "../_core/env";
import { getHealthStatus } from "../_core/health";
import { apiRateLimiter } from "../_core/rateLimiter";

const app = express();

// Clerk middleware (if configured)
if (ENV.clerkSecretKey) {
  app.use(
    clerkMiddleware({
      secretKey: ENV.clerkSecretKey,
      publishableKey: ENV.clerkPublishableKey,
    })
  );
}

// JSON body parser
app.use(express.json());

// Skills Lab registration
app.post("/api/skills-lab-register", async (req, res) => {
  const { handleSkillsLabRegister } = await import(
    "../skills-lab-register"
  );
  return handleSkillsLabRegister(req, res);
});

// Performance Lab application
app.post("/api/performance-lab-apply", async (req, res) => {
  const { handlePerformanceLabApply } = await import(
    "../performance-lab-apply"
  );
  return handlePerformanceLabApply(req, res);
});

// Health check
app.get("/api/health", async (_req, res) => {
  const status = await getHealthStatus();
  res.status(status.ok ? 200 : 503).json(status);
});

// Rate limiting for tRPC
app.use("/api/trpc", apiRateLimiter);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;
