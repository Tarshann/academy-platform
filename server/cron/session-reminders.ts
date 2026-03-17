import { logger } from "../_core/logger";
import { sendPushToUsers } from "../push";
import { sendEmail } from "../email";

export async function run() {
  logger.info("[cron/session-reminders] Sending session reminders");

  const { getDb } = await import("../db");
  const { schedules, sessionRegistrations, notificationPreferences, users, reminderLog } =
    await import("../../drizzle/schema");
  const { and, gte, lte, eq, inArray, sql } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) return { pushSent: 0, emailsSent: 0, sessionsNotified: 0 };

  const now = new Date();
  const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const twentyEightHoursFromNow = new Date(now.getTime() + 28 * 60 * 60 * 1000);

  // Sessions starting in 4-28 hours
  const upcomingSessions = await db
    .select()
    .from(schedules)
    .where(and(gte(schedules.startTime, fourHoursFromNow), lte(schedules.startTime, twentyEightHoursFromNow)));

  let pushSent = 0;
  let emailsSent = 0;
  let sessionsNotified = 0;

  for (const session of upcomingSessions) {
    // Get registered users
    const registrations = await db
      .select({ userId: sessionRegistrations.userId })
      .from(sessionRegistrations)
      .where(eq(sessionRegistrations.scheduleId, session.id));

    const userIds = registrations.map((r: any) => r.userId as number);
    if (userIds.length === 0) continue;

    // Check which users have already been reminded for this session
    const alreadyReminded = await db
      .select({ userId: reminderLog.userId })
      .from(reminderLog)
      .where(
        and(eq(reminderLog.scheduleId, session.id), inArray(reminderLog.userId, userIds))
      );
    const remindedSet = new Set(alreadyReminded.map((r: any) => r.userId));

    // Filter to users who haven't been reminded
    const toNotify = userIds.filter((id: any) => !remindedSet.has(id));
    if (toNotify.length === 0) continue;

    // Check notification preferences — respect opt-outs
    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(inArray(notificationPreferences.userId, toNotify));

    const prefsMap = new Map(prefs.map((p: any) => [p.userId, p]));
    const eligibleForPush = toNotify.filter((id: any) => {
      const pref = prefsMap.get(id);
      return !pref || (pref as any).sessionRegistrations !== false;
    });

    if (eligibleForPush.length > 0) {
      const startHour = session.startTime.getHours();
      const startMin = session.startTime.getMinutes();
      const timeStr = `${startHour % 12 || 12}:${String(startMin).padStart(2, "0")} ${startHour >= 12 ? "PM" : "AM"}`;

      try {
        await sendPushToUsers(eligibleForPush, {
          title: "Session Today",
          body: `${session.title} at ${timeStr} — see you there!`,
          data: { type: "session", scheduleId: session.id },
        });
        pushSent += eligibleForPush.length;
      } catch (err) {
        logger.error("[cron/session-reminders] Push failed for session", session.id, err);
      }
    }

    // Send email reminders
    const emailUsers = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(inArray(users.id, eligibleForPush));

    for (const user of emailUsers) {
      if (!user.email) continue;
      try {
        const startHour = session.startTime.getHours();
        const startMin = session.startTime.getMinutes();
        const timeStr = `${startHour % 12 || 12}:${String(startMin).padStart(2, "0")} ${startHour >= 12 ? "PM" : "AM"}`;
        const dateStr = session.startTime.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        });

        await sendEmail({
          to: user.email,
          subject: `Reminder: ${session.title} Today`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:#0a0a0a;padding:20px;text-align:center;">
                <h1 style="color:#d4a843;margin:0;font-size:24px;">The Academy</h1>
              </div>
              <div style="padding:30px 20px;">
                <h2 style="color:#333;">Hey ${user.name || "there"}!</h2>
                <p style="color:#555;font-size:16px;">Just a reminder — you have a session coming up:</p>
                <div style="background:#f9f9f9;border-left:4px solid #d4a843;padding:15px;margin:20px 0;">
                  <p style="margin:0;font-weight:bold;color:#333;">${session.title}</p>
                  <p style="margin:5px 0 0;color:#666;">${dateStr} at ${timeStr}</p>
                  ${session.location ? `<p style="margin:5px 0 0;color:#666;">📍 ${session.location}</p>` : ""}
                </div>
                <a href="https://app.academytn.com/schedule" style="display:inline-block;background:#d4a843;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">View Schedule</a>
              </div>
              <div style="text-align:center;padding:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#999;">
                <p>The Academy · Gallatin, TN</p>
              </div>
            </div>`,
        });
        emailsSent++;
      } catch (err) {
        logger.error("[cron/session-reminders] Email failed for user", user.id, err);
      }
    }

    // Log reminders sent
    for (const userId of toNotify) {
      try {
        await db.insert(reminderLog).values({
          userId,
          scheduleId: session.id,
          type: "session",
        });
      } catch {
        // Unique constraint — already logged
      }
    }

    sessionsNotified++;
  }

  const result = { pushSent, emailsSent, sessionsNotified };
  logger.info("[cron/session-reminders] Complete", result);
  return result;
}
