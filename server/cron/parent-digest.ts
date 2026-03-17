import { evaluateCronGovernance } from "../_core/governed-procedure";
import { logger } from "../_core/logger";
import { sendEmail } from "../email";

export async function run() {
  logger.info("[cron/parent-digest] Generating parent weekly digests");
  // Strix governance check — when enabled, cron must be approved before executing
  const guard = await evaluateCronGovernance("cron.parentDigest", "parent-digest");
  if (!guard.allowed) {
    logger.info("[cron/parent-digest] Governance denied: " + (guard.reason || "no approval"));
    return { skipped: true, reason: guard.reason || "governance denied" };
  }

  const { getDb } = await import("../db");
  const {
    users,
    userRelations,
    attendanceRecords,
    schedules,
    athleteMetrics,
    athleteShowcases,
    sessionRegistrations,
    notificationPreferences,
    digestLog,
  } = await import("../../drizzle/schema");
  const { eq, and, gte, lte, desc, inArray } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) return { digestsSent: 0, childrenCovered: 0, parentsSkipped: 0 };

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Week key for dedup — ISO 8601 week number
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const startOfISOYear = new Date(jan4);
  startOfISOYear.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const weekNum = Math.ceil(((now.getTime() - startOfISOYear.getTime()) / 86400000 + 1) / 7);
  const yearWeek = `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;

  // Get all parent-child relationships
  const relations = await db.select().from(userRelations);
  if (relations.length === 0) {
    return { digestsSent: 0, childrenCovered: 0, parentsSkipped: 0 };
  }

  // Group children by parent
  const parentChildMap = new Map<number, number[]>();
  for (const rel of relations as any[]) {
    const children = parentChildMap.get(rel.parentId) || [];
    children.push(rel.childId);
    parentChildMap.set(rel.parentId, children);
  }

  const parentIds = [...parentChildMap.keys()];
  const parentUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, parentIds));

  // Check notification preferences
  const prefs = await db
    .select()
    .from(notificationPreferences)
    .where(inArray(notificationPreferences.userId, parentIds));
  const prefsMap = new Map(prefs.map((p: any) => [p.userId, p]));

  let digestsSent = 0;
  let childrenCovered = 0;
  let parentsSkipped = 0;

  for (const parent of parentUsers) {
    if (!parent.email) {
      parentsSkipped++;
      continue;
    }

    // Respect email opt-out
    const pref = prefsMap.get(parent.id) as any;
    if (pref && pref.marketing === false) {
      parentsSkipped++;
      continue;
    }

    // Check digest dedup
    try {
      const existing = await db
        .select({ id: digestLog.id })
        .from(digestLog)
        .where(
          and(
            eq(digestLog.userId, parent.id),
            eq(digestLog.type, "parent-weekly"),
            eq(digestLog.weekKey, yearWeek)
          )
        )
        .limit(1);
      if (existing.length > 0) {
        parentsSkipped++;
        continue;
      }
    } catch {
      // Continue if check fails
    }

    const childIds = parentChildMap.get(parent.id) || [];
    if (childIds.length === 0) {
      parentsSkipped++;
      continue;
    }

    // Get child details
    const children = await db
      .select()
      .from(users)
      .where(inArray(users.id, childIds));

    let childSections = "";
    let hasContent = false;

    for (const child of children) {
      // Attendance this week
      const attendance = await db
        .select({
          scheduleId: attendanceRecords.scheduleId,
          markedAt: attendanceRecords.markedAt,
        })
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.userId, child.id),
            gte(attendanceRecords.markedAt, sevenDaysAgo)
          )
        );

      // Get session names for attended sessions
      const scheduleIds = attendance.map((a: any) => a.scheduleId);
      let attendedSessions: any[] = [];
      if (scheduleIds.length > 0) {
        attendedSessions = await db
          .select({ id: schedules.id, title: schedules.title, startTime: schedules.startTime })
          .from(schedules)
          .where(inArray(schedules.id, scheduleIds));
      }

      // New metrics this week
      const metrics = await db
        .select()
        .from(athleteMetrics)
        .where(
          and(
            eq(athleteMetrics.athleteId, child.id),
            gte(athleteMetrics.sessionDate, sevenDaysAgo)
          )
        )
        .orderBy(desc(athleteMetrics.sessionDate));

      // Showcase check
      const showcases = await db
        .select()
        .from(athleteShowcases)
        .where(
          and(
            eq(athleteShowcases.athleteId, child.id),
            gte(athleteShowcases.featuredFrom, sevenDaysAgo),
            lte(athleteShowcases.featuredFrom, now)
          )
        );

      // Upcoming sessions
      const upcoming = await db
        .select({ scheduleId: sessionRegistrations.scheduleId })
        .from(sessionRegistrations)
        .where(eq(sessionRegistrations.userId, child.id));
      const upcomingIds = upcoming.map((u: any) => u.scheduleId);
      let upcomingSessions: any[] = [];
      if (upcomingIds.length > 0) {
        upcomingSessions = await db
          .select()
          .from(schedules)
          .where(
            and(inArray(schedules.id, upcomingIds), gte(schedules.startTime, now), lte(schedules.startTime, sevenDaysFromNow))
          );
      }

      // Build child section
      let section = `<div style="margin-bottom:25px;padding:20px;background:#f9f9f9;border-radius:8px;">`;
      section += `<h3 style="color:#333;margin:0 0 15px;">${child.name || "Your Athlete"}</h3>`;

      // Sessions attended
      section += `<p style="color:#555;font-weight:bold;">Sessions This Week: ${attendance.length}</p>`;
      if (attendedSessions.length > 0) {
        section += `<ul style="color:#666;margin:5px 0 15px;">`;
        for (const s of attendedSessions) {
          const dateStr = new Date(s.startTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          section += `<li>${s.title} — ${dateStr}</li>`;
        }
        section += `</ul>`;
        hasContent = true;
      }

      // Metrics
      if (metrics.length > 0) {
        section += `<p style="color:#555;font-weight:bold;">Progress Updates:</p><ul style="color:#666;margin:5px 0 15px;">`;
        for (const m of metrics.slice(0, 5)) {
          section += `<li>${m.metricName}: ${m.value} ${m.unit || ""}</li>`;
        }
        section += `</ul>`;
        hasContent = true;
      }

      // Upcoming
      if (upcomingSessions.length > 0) {
        section += `<p style="color:#555;font-weight:bold;">Upcoming:</p><ul style="color:#666;margin:5px 0 15px;">`;
        for (const s of upcomingSessions.slice(0, 5)) {
          const dateStr = new Date(s.startTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          const timeStr = new Date(s.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
          section += `<li>${s.title} — ${dateStr} at ${timeStr}</li>`;
        }
        section += `</ul>`;
        hasContent = true;
      }

      // Showcase
      if (showcases.length > 0) {
        section += `<div style="background:#d4a843;color:#fff;padding:10px 15px;border-radius:6px;margin-top:10px;text-align:center;font-weight:bold;">&#11088; ${child.name || "Your athlete"} was this week's Athlete Spotlight!</div>`;
        hasContent = true;
      }

      section += `</div>`;
      childSections += section;
      childrenCovered++;
    }

    if (!hasContent) {
      parentsSkipped++;
      continue;
    }

    // Build date range string
    const rangeStart = sevenDaysAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const rangeEnd = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const childName = children.length === 1 ? children[0].name || "Your Athlete" : "Your Athletes";

    try {
      await sendEmail({
        to: parent.email,
        subject: `${childName}'s Week at The Academy — ${rangeStart}–${rangeEnd}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#0a0a0a;padding:20px;text-align:center;">
              <h1 style="color:#d4a843;margin:0;font-size:24px;">The Academy</h1>
              <p style="color:#999;margin:5px 0 0;font-size:14px;">Weekly Digest — ${rangeStart} to ${rangeEnd}</p>
            </div>
            <div style="padding:30px 20px;">
              <h2 style="color:#333;">Hi ${parent.name || "there"}!</h2>
              <p style="color:#555;font-size:16px;">Here's what happened this week:</p>
              ${childSections}
              <div style="text-align:center;margin-top:25px;">
                <a href="https://app.academytn.com/family" style="display:inline-block;background:#d4a843;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">View Full Details</a>
              </div>
            </div>
            <div style="text-align:center;padding:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#999;">
              <p>The Academy · Gallatin, TN</p>
            </div>
          </div>`,
      });

      // Log digest
      try {
        await db.insert(digestLog).values({
          userId: parent.id,
          type: "parent-weekly",
          weekKey: yearWeek,
        });
      } catch {
        // Unique constraint — already logged
      }

      digestsSent++;
    } catch (err) {
      logger.error("[cron/parent-digest] Email failed for parent", parent.id, err);
    }
  }

  const result = { digestsSent, childrenCovered, parentsSkipped };
  logger.info("[cron/parent-digest] Complete", result);
  return result;
}
