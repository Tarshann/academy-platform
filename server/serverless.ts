import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { clerkMiddleware } from "@clerk/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { ENV } from "./_core/env";
import { getHealthStatus } from "./_core/health";
import { apiRateLimiter, chatSendRateLimiter, contactFormRateLimiter } from "./_core/rateLimiter";

const ALLOWED_ROOMS = new Set(["general", "announcements", "parents", "coaches"]);
const MAX_MESSAGE_LENGTH = 5000;

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

// Extract chat token from query param or Authorization header
function extractToken(req: express.Request): string | undefined {
  const queryToken = req.query.token as string | undefined;
  if (queryToken) return queryToken;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return undefined;
}

// Shared auth helper — verifies chat token from query, header, or body
async function verifyChatToken(token: string | undefined): Promise<{ id: number; name: string } | null> {
  if (!token) return null;
  try {
    const { sdk } = await import("./_core/sdk");
    const session = await sdk.verifySession(token);
    if (!session || !session.openId) return null;

    const { getDb } = await import("./db");
    const { users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    if (!db) return null;

    const [dbUser] = await db.select().from(users).where(eq(users.openId, session.openId)).limit(1);
    return dbUser ? { id: dbUser.id, name: dbUser.name || "User" } : null;
  } catch {
    return null;
  }
}

// Skills Lab registration (rate-limited)
app.post("/api/skills-lab-register", contactFormRateLimiter, async (req, res) => {
  const { handleSkillsLabRegister } = await import("./skills-lab-register");
  return handleSkillsLabRegister(req, res);
});

// Performance Lab application (rate-limited)
app.post("/api/performance-lab-apply", contactFormRateLimiter, async (req, res) => {
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
  // Auth required
  const user = await verifyChatToken(extractToken(req));
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { room } = req.params;
  if (!ALLOWED_ROOMS.has(room)) {
    return res.status(400).json({ error: "Invalid room" });
  }

  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 200);
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

app.post("/api/chat/send", chatSendRateLimiter, async (req, res) => {
  const { token, room, message, imageUrl, imageKey, mentions } = req.body;

  if (!token || !room || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!ALLOWED_ROOMS.has(room)) {
    return res.status(400).json({ error: "Invalid room" });
  }

  if (typeof message !== "string" || message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `Message must be at most ${MAX_MESSAGE_LENGTH} characters` });
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
      .returning();

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

    // Publish to Ably for real-time delivery
    const { publishChatMessage } = await import("./ably");
    await publishChatMessage(room, savedMessage);

    // Send push notifications to offline users (fire-and-forget)
    import("./push").then(({ notifyChatMessage }) =>
      notifyChatMessage(dbUser.id, dbUser.name || "User", room, message)
    ).catch(() => {});

    res.json({ success: true, message: savedMessage });
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.get("/api/chat/users", async (req, res) => {
  // Auth required
  const user = await verifyChatToken(extractToken(req));
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

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

// Chat image upload
app.post("/api/chat/upload-image", async (req, res) => {
  try {
    const multer = (await import("multer")).default;
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Only image files are allowed"));
      },
    }).single("file");

    upload(req, res, async (err: unknown) => {
      if (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        return res.status(400).json({ error: msg });
      }
      const file = (req as any).file;
      const token = req.body.token;
      if (!file) return res.status(400).json({ error: "No file provided" });
      if (!token) return res.status(401).json({ error: "No token provided" });

      const user = await verifyChatToken(token);
      if (!user) return res.status(401).json({ error: "Invalid token" });

      try {
        const { storagePut } = await import("./storage");
        const ext = file.originalname.split(".").pop() || "jpg";
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const key = `chat-images/${user.id}-${timestamp}-${randomSuffix}.${ext}`;
        const { url } = await storagePut(key, file.buffer, file.mimetype);
        res.json({ url, key });
      } catch (error) {
        res.status(500).json({ error: "Failed to upload image" });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// Vision Capture media upload (images + audio)
app.post("/api/capture/upload", async (req, res) => {
  try {
    const multer = (await import("multer")).default;
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/m4a"];
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
        else cb(new Error("Unsupported file type"));
      },
    }).single("file");

    upload(req, res, async (err: unknown) => {
      if (err) {
        const msg = err instanceof Error && err.message.includes("limit") ? "File too large (max 10MB)" : "Upload failed";
        return res.status(400).json({ error: msg });
      }
      const file = (req as any).file;
      const token = req.body.token;
      if (!file) return res.status(400).json({ error: "No file provided" });
      if (!token) return res.status(401).json({ error: "No token provided" });

      const user = await verifyChatToken(token);
      if (!user) return res.status(401).json({ error: "Invalid token" });

      try {
        const { storagePut } = await import("./storage");
        const ext = file.originalname.split(".").pop() || "bin";
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const key = `captures/${user.id}-${timestamp}-${randomSuffix}.${ext}`;
        const { url } = await storagePut(key, file.buffer, file.mimetype);
        res.json({ url, key, mimeType: file.mimetype });
      } catch (error) {
        res.status(500).json({ error: "Failed to upload media" });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to upload media" });
  }
});

// Profile picture upload
app.post("/api/profile/upload-picture", async (req, res) => {
  try {
    const multer = (await import("multer")).default;
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Only image files are allowed"));
      },
    }).single("file");

    upload(req, res, async (err: unknown) => {
      if (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        return res.status(400).json({ error: msg });
      }
      const file = (req as any).file;
      if (!file) return res.status(400).json({ error: "No file provided" });

      try {
        const { authenticateClerkRequest } = await import("./_core/clerk");
        const user = await authenticateClerkRequest(req);
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const { storagePut } = await import("./storage");
        const ext = file.originalname.split(".").pop() || "jpg";
        const key = `profile-pictures/${user.id}-${Date.now()}.${ext}`;
        const { url } = await storagePut(key, file.buffer, file.mimetype);
        res.json({ url, key });
      } catch (error) {
        res.status(500).json({ error: "Upload failed" });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
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

// Global error handler — ensures all errors return JSON (not HTML).
// Without this, Express's default handler returns HTML which causes
// "JSON Parse error: Unexpected character" on mobile/SPA clients.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = status === 500 ? "Internal server error" : (err.message || "An error occurred");
  res.status(status).json({ error: message });
});

export default app;
