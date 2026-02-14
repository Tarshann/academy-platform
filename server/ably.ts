import Ably from "ably";
import { logger } from "./_core/logger";

let ablyRest: Ably.Rest | null = null;

/**
 * Get the Ably REST client (server-side, for publishing).
 * Returns null if ABLY_API_KEY is not configured.
 */
export function getAbly(): Ably.Rest | null {
  if (ablyRest) return ablyRest;

  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    logger.warn("[Ably] ABLY_API_KEY not set — real-time disabled");
    return null;
  }

  ablyRest = new Ably.Rest({ key: apiKey });
  logger.info("[Ably] REST client initialized");
  return ablyRest;
}

/**
 * Publish a message to a chat channel.
 * Channel naming: chat:{room} (e.g. chat:general, chat:announcements)
 */
export async function publishChatMessage(
  room: string,
  message: {
    id: number;
    userId: number;
    userName: string;
    message: string;
    room: string;
    imageUrl?: string | null;
    imageKey?: string | null;
    mentions?: number[] | null;
    createdAt: string;
  }
) {
  const ably = getAbly();
  if (!ably) return;

  try {
    const channel = ably.channels.get(`chat:${room}`);
    await channel.publish("message", message);
  } catch (error) {
    logger.error(`[Ably] Failed to publish to chat:${room}:`, error);
  }
}

/**
 * Publish a DM to a conversation channel.
 * Channel naming: dm:{conversationId}
 */
export async function publishDmMessage(
  conversationId: number,
  message: {
    id: number;
    conversationId: number;
    senderId: number;
    senderName: string;
    content: string;
    createdAt: string;
  }
) {
  const ably = getAbly();
  if (!ably) return;

  try {
    const channel = ably.channels.get(`dm:${conversationId}`);
    await channel.publish("message", message);
  } catch (error) {
    logger.error(`[Ably] Failed to publish to dm:${conversationId}:`, error);
  }
}

/**
 * Create a scoped token request for client-side Ably connections.
 * Each user gets subscribe + publish on chat channels and their DM channels,
 * plus presence on the global presence channel.
 */
export async function createAblyTokenRequest(
  userId: number,
  userName: string
): Promise<Ably.TokenRequest | null> {
  const ably = getAbly();
  if (!ably) return null;

  try {
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId: `${userId}:${userName}`,
      capability: {
        "chat:*": ["subscribe", "publish", "presence"],
        "dm:*": ["subscribe", "publish"],
        "presence:global": ["subscribe", "presence"],
      },
    });
    return tokenRequest;
  } catch (error) {
    logger.error("[Ably] Failed to create token request:", error);
    return null;
  }
}
