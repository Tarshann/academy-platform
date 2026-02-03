import type { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { getDb, getUserByOpenId } from "./db";
import { chatMessages } from "../drizzle/schema";
import { desc } from "drizzle-orm";
import { logger } from "./_core/logger";
import { sdk } from "./_core/sdk";

export function setupChat(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/socket.io/",
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string") {
      return next(new Error("Unauthorized"));
    }

    const session = await sdk.verifySession(token);
    if (!session) {
      return next(new Error("Unauthorized"));
    }

    const user = await getUserByOpenId(session.openId);
    if (!user) {
      return next(new Error("Unauthorized"));
    }

    socket.data.user = user;
    return next();
  });

  // Track online users
  const onlineUsers = new Map<
    string,
    { userId: number; userName: string; socketId: string; room: string }
  >();

  io.on("connection", socket => {
    logger.info(`[Chat] User connected: ${socket.id}`);

    // Join a room
    socket.on("join_room", async ({ room }) => {
      if (typeof room !== "string" || room.trim().length === 0) {
        socket.emit("error", { message: "Invalid room" });
        return;
      }
      const user = socket.data.user;
      if (!user) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }
      const userId = user.id;
      const userName = user.name || "Member";

      socket.join(room);
      logger.info(`[Chat] User ${userName} (${userId}) joined room: ${room}`);

      // Track online user
      const userKey = `${userId}-${room}`;
      onlineUsers.set(userKey, { userId, userName, socketId: socket.id, room });

      // Broadcast online users list to room
      const roomUsers = Array.from(onlineUsers.values())
        .filter(u => u.room === room)
        .map(u => ({ userId: u.userId, userName: u.userName }));
      io.to(room).emit("online_users", roomUsers);

      // Send recent messages from this room
      try {
        const db = await getDb();
        if (db) {
          const { eq } = await import("drizzle-orm");
          const recentMessages = await db
            .select()
            .from(chatMessages)
            .where(eq(chatMessages.room, room))
            .orderBy(desc(chatMessages.createdAt))
            .limit(50);

          socket.emit("message_history", recentMessages.reverse());
        }
      } catch (error) {
        logger.error("[Chat] Error loading message history:", error);
      }

      // Notify room
      socket.to(room).emit("user_joined", { userName });
    });

    // Handle get room history request
    socket.on("get_room_history", async ({ room }) => {
      if (typeof room !== "string" || room.trim().length === 0) {
        socket.emit("error", { message: "Invalid room" });
        return;
      }
      const user = socket.data.user;
      if (!user) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      try {
        const db = await getDb();
        if (db) {
          const { eq } = await import("drizzle-orm");
          const recentMessages = await db
            .select()
            .from(chatMessages)
            .where(eq(chatMessages.room, room))
            .orderBy(desc(chatMessages.createdAt))
            .limit(50);

          socket.emit("message_history", recentMessages.reverse());
        }
      } catch (error) {
        logger.error("[Chat] Error loading room history:", error);
      }
    });

    // Handle new messages
    socket.on("send_message", async ({ room, message }) => {
      if (typeof room !== "string" || room.trim().length === 0) {
        socket.emit("error", { message: "Invalid room" });
        return;
      }
      const user = socket.data.user;
      if (!user) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }
      const userId = user.id;
      const userName = user.name || "Member";

      try {
        const db = await getDb();
        if (db) {
          // Save message to database
          await db.insert(chatMessages).values({
            userId,
            userName,
            message,
            room,
          });

          // Broadcast to room
          const messageData = {
            userId,
            userName,
            message,
            room,
            createdAt: new Date(),
          };

          io.to(room).emit("receive_message", messageData);
        }
      } catch (error) {
        logger.error("[Chat] Error saving message:", error);
      }
    });

    // Handle typing indicator
    socket.on("typing", ({ room }) => {
      if (typeof room !== "string" || room.trim().length === 0) {
        return;
      }
      const user = socket.data.user;
      if (!user) {
        return;
      }
      const userName = user.name || "Member";
      socket.to(room).emit("user_typing", { userName });
    });

    socket.on("stop_typing", ({ room }) => {
      if (typeof room !== "string" || room.trim().length === 0) {
        return;
      }
      const user = socket.data.user;
      if (!user) {
        return;
      }
      const userName = user.name || "Member";
      socket.to(room).emit("user_stop_typing", { userName });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      logger.info(`[Chat] User disconnected: ${socket.id}`);

      // Remove from online users
      for (const [key, user] of Array.from(onlineUsers.entries())) {
        if (user.socketId === socket.id) {
          onlineUsers.delete(key);
          // Broadcast updated online users list
          const roomUsers = Array.from(onlineUsers.values())
            .filter(u => u.room === user.room)
            .map(u => ({ userId: u.userId, userName: u.userName }));
          io.to(user.room).emit("online_users", roomUsers);
          break;
        }
      }
    });
  });

  return io;
}
