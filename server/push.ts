import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { logger } from "./_core/logger";

const expo = new Expo();

/**
 * Send push notifications to specific users.
 * Queries the database for their Expo push tokens and sends.
 * Respects notification preferences and quiet hours.
 */
export async function sendPushToUsers(
  userIds: number[],
  notification: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }
) {
  if (userIds.length === 0) return;

  try {
    const { getDb } = await import("./db");
    const { pushSubscriptions, notificationSettings } = await import(
      "../drizzle/schema"
    );
    const { eq, and, inArray } = await import("drizzle-orm");

    const db = await getDb();
    if (!db) return;

    // Get active Expo push subscriptions for these users
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          inArray(pushSubscriptions.userId, userIds),
          eq(pushSubscriptions.isActive, true)
        )
      );

    // Filter to only Expo tokens
    const expoSubs = subscriptions.filter(
      (s: any) =>
        s.expoPushToken &&
        Expo.isExpoPushToken(s.expoPushToken) &&
        (s.platform === "ios" || s.platform === "android")
    );

    if (expoSubs.length === 0) return;

    // Check notification settings and quiet hours
    const settings = await db
      .select()
      .from(notificationSettings)
      .where(inArray(notificationSettings.userId, userIds));

    const settingsMap = new Map<number, any>(settings.map((s: any) => [s.userId, s]));

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const eligibleSubs = expoSubs.filter((sub: any) => {
      const userSettings = settingsMap.get(sub.userId);
      if (!userSettings) return true; // No settings = allow

      if (!userSettings.pushEnabled) return false;

      // Check quiet hours
      if (userSettings.quietHoursEnabled && userSettings.quietHoursStart && userSettings.quietHoursEnd) {
        const start = userSettings.quietHoursStart;
        const end = userSettings.quietHoursEnd;

        if (start < end) {
          // Same day range (e.g., 09:00 to 17:00)
          if (currentTime >= start && currentTime < end) return false;
        } else {
          // Overnight range (e.g., 22:00 to 08:00)
          if (currentTime >= start || currentTime < end) return false;
        }
      }

      return true;
    });

    if (eligibleSubs.length === 0) return;

    // Build messages
    const messages: ExpoPushMessage[] = eligibleSubs.map((sub: any) => ({
      to: sub.expoPushToken,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      sound: "default" as const,
      badge: 1,
    }));

    // Send in chunks (Expo SDK handles this)
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        // Log results
        tickets.forEach((ticket, i) => {
          if (ticket.status === "error") {
            logger.error(
              `[Push] Failed to send to ${eligibleSubs[i]?.expoPushToken}:`,
              ticket.message
            );
          }
        });
      } catch (error) {
        logger.error("[Push] Chunk send failed:", error);
      }
    }

    logger.info(
      `[Push] Sent ${eligibleSubs.length} notifications for "${notification.title}"`
    );
  } catch (error) {
    logger.error("[Push] sendPushToUsers failed:", error);
  }
}

/**
 * Send push notification for a new chat message.
 * Sends to all users EXCEPT the sender.
 */
export async function notifyChatMessage(
  senderId: number,
  senderName: string,
  room: string,
  messagePreview: string
) {
  try {
    const { getDb } = await import("./db");
    const { users } = await import("../drizzle/schema");

    const db = await getDb();
    if (!db) return;

    // Get all user IDs except sender
    const allUsers = await db
      .select({ id: users.id })
      .from(users);

    const recipientIds = allUsers
      .map((u: { id: number }) => u.id)
      .filter((id: number) => id !== senderId);

    await sendPushToUsers(recipientIds, {
      title: `#${room} — ${senderName}`,
      body: messagePreview.length > 100
        ? messagePreview.substring(0, 100) + "..."
        : messagePreview,
      data: { type: "chat", room },
    });
  } catch (error) {
    logger.error("[Push] notifyChatMessage failed:", error);
  }
}

/**
 * Send push notification for a new DM.
 */
export async function notifyDmMessage(
  conversationId: number,
  senderId: number,
  senderName: string,
  messagePreview: string
) {
  try {
    const { getDb } = await import("./db");
    const { dmParticipants } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    if (!db) return;

    // Get participants except sender
    const participants = await db
      .select()
      .from(dmParticipants)
      .where(eq(dmParticipants.conversationId, conversationId));

    const recipientIds = participants
      .map((p: any) => p.userId)
      .filter((id: number) => id !== senderId);

    await sendPushToUsers(recipientIds, {
      title: senderName,
      body: messagePreview.length > 100
        ? messagePreview.substring(0, 100) + "..."
        : messagePreview,
      data: { type: "dm", conversationId },
    });
  } catch (error) {
    logger.error("[Push] notifyDmMessage failed:", error);
  }
}
