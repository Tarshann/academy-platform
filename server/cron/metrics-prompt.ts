import { evaluateCronGovernance } from "../_core/governed-procedure";
import { logger } from "../_core/logger";
import { sendPushToUsers } from "../push";

export async function run() {
  logger.info("[cron/metrics-prompt] Prompting coaches to enter metrics");
  // Strix governance check — when enabled, cron must be approved before executing
  const guard = await evaluateCronGovernance("cron.metricsPrompt", "metrics-prompt");
  if (!guard.allowed) {
    logger.info("[cron/metrics-prompt] Governance denied: " + (guard.reason || "no approval"));
    return { skipped: true, reason: guard.reason || "governance denied" };
  }

  const { getDb } = await import("../db");
  const { schedules, attendanceRecords, users } = await import("../../drizzle/schema");
  const { and, gte, lte, eq, sql, count, or, inArray } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) return { promptsSent: 0, sessionsProcessed: 0 };

  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

  // Sessions that ended in the last 3 hours
  const recentSessions = await db
    .select()
    .from(schedules)
    .where(and(gte(schedules.endTime, threeHoursAgo), lte(schedules.endTime, now)));

  if (recentSessions.length === 0) {
    logger.info("[cron/metrics-prompt] No recent sessions found");
    return { promptsSent: 0, sessionsProcessed: 0 };
  }

  // Get admin/coach users
  const adminUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(
      or(
        eq(users.role, "admin"),
        inArray(users.extendedRole, ["owner", "admin", "head_coach"])
      )
    );

  const adminIds = adminUsers.map((u: any) => u.id as number);
  if (adminIds.length === 0) {
    logger.info("[cron/metrics-prompt] No admin users found");
    return { promptsSent: 0, sessionsProcessed: recentSessions.length };
  }

  let promptsSent = 0;

  for (const session of recentSessions) {
    // Count attendance
    const [attendanceCount] = await db
      .select({ count: count() })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.scheduleId, session.id));

    const attendeeCount = attendanceCount?.count ?? 0;

    try {
      await sendPushToUsers(adminIds, {
        title: "Session Complete",
        body: `${session.title} — ${attendeeCount} athletes attended. Tap to enter metrics.`,
        data: { type: "admin-metrics" },
      });
      promptsSent += adminIds.length;
    } catch (err) {
      logger.error("[cron/metrics-prompt] Push failed for session", session.id, err);
    }
  }

  const result = { promptsSent, sessionsProcessed: recentSessions.length };
  logger.info("[cron/metrics-prompt] Complete", result);
  return result;
}
