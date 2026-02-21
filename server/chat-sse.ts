import { Express, Request, Response } from "express";
import multer from "multer";
import { getDb } from "./db";
import { chatMessages, users } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { logger } from "./_core/logger";
import { sdk } from "./_core/sdk";
import { chatSendRateLimiter } from "./_core/rateLimiter";

const ALLOWED_ROOMS = new Set(["general", "announcements", "parents", "coaches"]);
const MAX_MESSAGE_LENGTH = 5000;

// Store active SSE connections
interface SSEClient {
  id: string;
  userId: number;
  userName: string;
  response: Response;
  rooms: Set<string>;
  lastPing: number;
}

const clients = new Map<string, SSEClient>();

// Broadcast message to all clients in a room
export function broadcastToRoom(room: string, event: string, data: unknown) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  clients.forEach((client) => {
    if (client.rooms.has(room) || room === "all") {
      try {
        client.response.write(message);
      } catch (error) {
        logger.error(`[SSE] Failed to send to client ${client.id}:`, error);
      }
    }
  });
}

// Broadcast to specific user (for DMs)
export function broadcastToUser(userId: number, event: string, data: unknown) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  clients.forEach((client) => {
    if (client.userId === userId) {
      try {
        client.response.write(message);
      } catch (error) {
        logger.error(`[SSE] Failed to send to user ${userId}:`, error);
      }
    }
  });
}

// Get online users
export function getOnlineUsers(): { id: number; name: string }[] {
  const uniqueUsers = new Map<number, string>();
  clients.forEach((client) => {
    uniqueUsers.set(client.userId, client.userName);
  });
  return Array.from(uniqueUsers.entries()).map(([id, name]) => ({ id, name }));
}

// Broadcast online users to all clients
function broadcastOnlineUsers() {
  const onlineUsers = getOnlineUsers();
  broadcastToRoom("all", "online_users", onlineUsers);
}

// Verify session token using SDK
async function verifySession(token: string): Promise<{ openId: string } | null> {
  try {
    const session = await sdk.verifySession(token);
    if (session && session.openId) {
      return { openId: session.openId };
    }
    return null;
  } catch {
    return null;
  }
}

// Shared helper: resolve a token to a user record
async function resolveUser(token: string): Promise<{ id: number; name: string } | null> {
  const session = await verifySession(token);
  if (!session) return null;

  const db = await getDb();
  if (!db) return null;

  const [dbUser] = await db.select().from(users).where(eq(users.openId, session.openId)).limit(1);
  return dbUser ? { id: dbUser.id, name: dbUser.name || "User" } : null;
}

export function setupSSEChat(app: Express) {
  // SSE endpoint for real-time updates
  app.get("/api/chat/stream", async (req: Request, res: Response) => {
    const token = req.query.token as string;

    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    // Verify token
    let user: { id: number; name: string } | null = null;
    try {
      user = await resolveUser(token);
    } catch (error) {
      logger.error("[SSE] Token verification failed:", error);
      return res.status(401).json({ error: "Invalid token" });
    }

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
    res.flushHeaders();

    // Generate client ID
    const clientId = `${user.id}-${Date.now()}`;

    // Create client entry
    const client: SSEClient = {
      id: clientId,
      userId: user.id,
      userName: user.name,
      response: res,
      rooms: new Set(ALLOWED_ROOMS),
      lastPing: Date.now(),
    };

    clients.set(clientId, client);
    logger.info(`[SSE] Client connected: ${clientId} (${user.name})`);

    // Send initial connection success
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, userId: user.id, userName: user.name })}\n\n`);

    // Broadcast updated online users
    broadcastOnlineUsers();

    // Keep-alive ping every 30 seconds
    const pingInterval = setInterval(() => {
      try {
        res.write(`event: ping\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`);
        client.lastPing = Date.now();
      } catch {
        clearInterval(pingInterval);
      }
    }, 30000);

    // Handle client disconnect
    req.on("close", () => {
      clearInterval(pingInterval);
      clients.delete(clientId);
      logger.info(`[SSE] Client disconnected: ${clientId}`);
      broadcastOnlineUsers();
    });
  });

  // Get message history for a room (auth required)
  app.get("/api/chat/history/:room", async (req: Request, res: Response) => {
    const token = req.query.token as string;
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await resolveUser(token);
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { room } = req.params;
    if (!ALLOWED_ROOMS.has(room)) {
      return res.status(400).json({ error: "Invalid room" });
    }

    const limit = parseInt(req.query.limit as string) || 50;

    try {
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
      logger.error("[Chat] Failed to get history:", error);
      res.status(500).json({ error: "Failed to get message history" });
    }
  });

  // Send a message to a room (auth required, rate limited)
  app.post("/api/chat/send", chatSendRateLimiter, async (req: Request, res: Response) => {
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

    // Verify token
    let user: { id: number; name: string } | null = null;
    try {
      user = await resolveUser(token);
    } catch (error) {
      logger.error("[Chat] Token verification failed:", error);
      return res.status(401).json({ error: "Invalid token" });
    }

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    try {
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      // Save message to database
      const [newMessage] = await db.insert(chatMessages).values({
        userId: user.id,
        userName: user.name,
        message,
        room,
        imageUrl: imageUrl || null,
        imageKey: imageKey || null,
        mentions: mentions ? JSON.stringify(mentions) : null,
      }).returning();

      const savedMessage = {
        id: newMessage.id,
        userId: user.id,
        userName: user.name,
        message,
        room,
        imageUrl,
        imageKey,
        mentions,
        createdAt: new Date().toISOString(),
      };

      // Broadcast to room
      broadcastToRoom(room, "new_message", savedMessage);

      // If there are mentions, notify mentioned users
      if (mentions && Array.isArray(mentions)) {
        mentions.forEach((mentionedUserId: number) => {
          broadcastToUser(mentionedUserId, "mention", {
            from: user!.name,
            room,
            message: message.substring(0, 100),
          });
        });
      }

      res.json({ success: true, message: savedMessage });
    } catch (error) {
      logger.error("[Chat] Failed to send message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Get online users (auth required)
  app.get("/api/chat/online", async (req: Request, res: Response) => {
    const token = req.query.token as string;
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await resolveUser(token);
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    res.json(getOnlineUsers());
  });

  // Get all users for @mentions (auth required)
  app.get("/api/chat/users", async (req: Request, res: Response) => {
    const token = req.query.token as string;
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await resolveUser(token);
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    try {
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
      logger.error("[Chat] Failed to get users:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  // Upload image for chat
  app.post("/api/chat/upload-image", async (req: Request, res: Response) => {
    try {
      const { storagePut } = await import("./storage");

      const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
        fileFilter: (_req, file, cb) => {
          if (file.mimetype.startsWith("image/")) {
            cb(null, true);
          } else {
            cb(new Error("Only image files are allowed"));
          }
        },
      }).single("file");

      upload(req, res, async (err: unknown) => {
        if (err) {
          logger.error("[Chat] Image upload error:", err);
          const errorMessage = err instanceof Error ? err.message : "Upload failed";
          return res.status(400).json({ error: errorMessage });
        }

        const file = (req as Request & { file?: Express.Multer.File }).file;
        const token = req.body.token;

        if (!file) {
          return res.status(400).json({ error: "No file provided" });
        }

        if (!token) {
          return res.status(401).json({ error: "No token provided" });
        }

        // Verify token
        let user: { id: number; name: string } | null = null;
        try {
          user = await resolveUser(token);
        } catch (error) {
          logger.error("[Chat] Token verification failed:", error);
          return res.status(401).json({ error: "Invalid token" });
        }

        if (!user) {
          return res.status(401).json({ error: "User not found" });
        }

        // Generate unique filename
        const ext = file.originalname.split(".").pop() || "jpg";
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const key = `chat-images/${user.id}-${timestamp}-${randomSuffix}.${ext}`;

        // Upload to S3
        const { url } = await storagePut(key, file.buffer, file.mimetype);

        logger.info(`[Chat] Image uploaded: ${key}`);
        res.json({ url, key });
      });
    } catch (error) {
      logger.error("[Chat] Image upload failed:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  logger.info("[SSE] Chat endpoints registered");
}
