import { logger } from "../_core/logger";
import { sendPushToUsers } from "../push";
import { sendEmail } from "../email";

export async function run() {
  logger.info("[cron/reengagement] Running re-engagement check");

  const { getDb } = await import("../db");
  const { users, attendanceRecords, reengagementLog } = await import("../../drizzle/schema");
  const { sql, eq, gte, and, desc, count, inArray } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) return { pushSent: 0, emailsSent: 0, activeSkipped: 0 };

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirteenDaysAgo = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Users with 3+ total attendance records (established members)
  const establishedMembers = await db
    .select({ userId: attendanceRecords.userId })
    .from(attendanceRecords)
    .groupBy(attendanceRecords.userId)
    .having(sql`count(*) >= 3`);

  const memberIds = establishedMembers.map((m: any) => m.userId as number);
  if (memberIds.length === 0) {
    return { pushSent: 0, emailsSent: 0, activeSkipped: 0 };
  }

  // Get user details
  const memberUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, memberIds));

  let pushSent = 0;
  let emailsSent = 0;
  let activeSkipped = 0;

  for (const user of memberUsers) {
    // Get most recent attendance
    const [lastAttendance] = await db
      .select({ markedAt: attendanceRecords.markedAt })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.userId, user.id))
      .orderBy(desc(attendanceRecords.markedAt))
      .limit(1);

    if (!lastAttendance?.markedAt) continue;

    const lastDate = new Date(lastAttendance.markedAt);
    const daysSinceLast = Math.floor((now.getTime() - lastDate.getTime()) / 86400000);

    // Active within 7 days — skip
    if (daysSinceLast < 7) {
      activeSkipped++;
      continue;
    }

    // Check recent re-engagement logs for this user
    const recentLogs = await db
      .select()
      .from(reengagementLog)
      .where(
        and(
          eq(reengagementLog.userId, user.id),
          gte(reengagementLog.sentAt, thirtyDaysAgo)
        )
      );

    const recentPush = recentLogs.find(
      (l: any) => l.type === "push" && new Date(l.sentAt) >= fourteenDaysAgo
    );
    const recentEmail = recentLogs.find(
      (l: any) => l.type === "email" && new Date(l.sentAt) >= thirtyDaysAgo
    );

    // 7-13 days inactive: send push (if no push in last 14 days)
    if (daysSinceLast >= 7 && daysSinceLast <= 13 && !recentPush) {
      try {
        await sendPushToUsers([user.id], {
          title: "We miss you!",
          body: `We missed ${user.name || "you"} at The Academy this week! Everything okay?`,
          data: { type: "reengagement" },
        });
        await db.insert(reengagementLog).values({ userId: user.id, type: "push" });
        pushSent++;
      } catch (err) {
        logger.error("[cron/reengagement] Push failed for user", user.id, err);
      }
      continue; // Never send both push and email in same run
    }

    // 14+ days inactive: send email (if no email in last 30 days)
    if (daysSinceLast >= 14 && !recentEmail && user.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: `We'd love to see ${user.name || "you"} back at The Academy!`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:#0a0a0a;padding:20px;text-align:center;">
                <h1 style="color:#d4a843;margin:0;font-size:24px;">The Academy</h1>
              </div>
              <div style="padding:30px 20px;">
                <h2 style="color:#333;">Hey ${user.name || "there"}!</h2>
                <p style="color:#555;font-size:16px;">It's been a little while since we've seen you at The Academy. We hope everything is going well!</p>
                <p style="color:#555;font-size:16px;">Our coaches and athletes would love to have you back. There are some great sessions coming up this week.</p>
                <div style="margin:25px 0;text-align:center;">
                  <a href="https://app.academytn.com/schedule" style="display:inline-block;background:#d4a843;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">View This Week's Schedule</a>
                </div>
                <p style="color:#555;font-size:14px;">See you soon!</p>
                <p style="color:#555;font-size:14px;">— The Academy Team</p>
              </div>
              <div style="text-align:center;padding:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#999;">
                <p>The Academy · Gallatin, TN</p>
              </div>
            </div>`,
        });
        await db.insert(reengagementLog).values({ userId: user.id, type: "email" });
        emailsSent++;
      } catch (err) {
        logger.error("[cron/reengagement] Email failed for user", user.id, err);
      }
    }
  }

  const result = { pushSent, emailsSent, activeSkipped };
  logger.info("[cron/reengagement] Complete", result);
  return result;
}
