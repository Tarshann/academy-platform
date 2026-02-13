import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { clerkMiddleware } from "@clerk/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { ENV } from "./_core/env";
import { getHealthStatus } from "./_core/health";
import { apiRateLimiter } from "./_core/rateLimiter";

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
  const { handleSkillsLabRegister } = await import("./skills-lab-register");
  return handleSkillsLabRegister(req, res);
});

// Performance Lab application
app.post("/api/performance-lab-apply", async (req, res) => {
  const { handlePerformanceLabApply } = await import(
    "./performance-lab-apply"
  );
  return handlePerformanceLabApply(req, res);
});

// Health check
app.get("/api/health", async (_req, res) => {
  const status = await getHealthStatus();
  res.status(status.ok ? 200 : 503).json(status);
});

// Chat API routes (serverless-compatible, no SSE)
app.get("/api/chat/history/:room", async (req, res) => {
  try {
    const { room } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const { getDb } = await import("./db");
    const { chatMessages } = await import("../drizzle/schema");
    const { eq, desc } = await import("drizzle-orm");

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.room, room))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: "Failed to get message history" });
  }
});

app.post("/api/chat/send", async (req, res) => {
  const { token, room, message, imageUrl, imageKey, mentions } = req.body;

  if (!token || !room || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { sdk } = await import("./_core/sdk");
    const { getDb } = await import("./db");
    const { chatMessages, users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const session = await sdk.verifySession(token);
    if (!session || !session.openId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.openId, session.openId))
      .limit(1);

    if (!dbUser) {
      return res.status(401).json({ error: "User not found" });
    }

    const [newMessage] = await db
      .insert(chatMessages)
      .values({
        userId: dbUser.id,
        userName: dbUser.name || "User",
        message,
        room,
        imageUrl: imageUrl || null,
        imageKey: imageKey || null,
        mentions: mentions ? JSON.stringify(mentions) : null,
      })
      .$returningId();

    const savedMessage = {
      id: newMessage.id,
      userId: dbUser.id,
      userName: dbUser.name || "User",
      message,
      room,
      imageUrl,
      imageKey,
      mentions,
      createdAt: new Date().toISOString(),
    };

    res.json({ success: true, message: savedMessage });
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.get("/api/chat/users", async (_req, res) => {
  try {
    const { getDb } = await import("./db");
    const { users } = await import("../drizzle/schema");

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const allUsers = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .limit(100);

    res.json(allUsers.filter((u: { id: number; name: string | null }) => u.name));
  } catch (error) {
    res.status(500).json({ error: "Failed to get users" });
  }
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
