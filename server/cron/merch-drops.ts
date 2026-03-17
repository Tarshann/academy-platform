import { logger } from "../_core/logger";
import { sendPushToUsers } from "../push";

export async function run() {
  logger.info("[cron/merch-drops] Checking for scheduled drops to send");

  const { getDb } = await import("../db");
  const { merchDrops, pushSubscriptions } = await import("../../drizzle/schema");
  const { and, lte, isNull, eq, sql } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) return { dropsSent: 0, notificationsSent: 0 };

  const now = new Date();

  // Drops that are due but haven't been sent
  const pendingDrops = await db
    .select()
    .from(merchDrops)
    .where(and(lte(merchDrops.scheduledAt, now), eq(merchDrops.isSent, false)));

  let dropsSent = 0;
  let notificationsSent = 0;

  for (const drop of pendingDrops) {
    // Get all users with active push subscriptions
    const activeSubscriptions = await db
      .select({ userId: pushSubscriptions.userId })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.isActive, true));

    const userIdSet = new Set<number>(activeSubscriptions.map((s: any) => s.userId));
    const userIds = [...userIdSet];

    if (userIds.length > 0) {
      try {
        const body = drop.description
          ? drop.description.length > 100
            ? drop.description.slice(0, 97) + "..."
            : drop.description
          : "Check it out!";

        await sendPushToUsers(userIds, {
          title: drop.title,
          body,
          data: { type: "merch-drop", dropId: drop.id },
        });
        notificationsSent += userIds.length;
      } catch (err) {
        logger.error("[cron/merch-drops] Push failed for drop", drop.id, err);
      }
    }

    // Mark as sent
    await db
      .update(merchDrops)
      .set({ isSent: true, sentAt: now })
      .where(eq(merchDrops.id, drop.id));

    dropsSent++;
  }

  const result = { dropsSent, notificationsSent };
  logger.info("[cron/merch-drops] Complete", result);
  return result;
}
