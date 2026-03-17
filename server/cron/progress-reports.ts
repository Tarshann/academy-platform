import { evaluateCronGovernance } from "../_core/governed-procedure";
import { logger } from "../_core/logger";
import { sendEmail } from "../email";
import { sendPushToUsers } from "../push";

export async function run() {
  logger.info("[cron/progress-reports] Generating bi-weekly progress reports");
  // Strix governance check — when enabled, cron must be approved before executing
  const guard = await evaluateCronGovernance("cron.progressReports", "progress-reports");
  if (!guard.allowed) {
    logger.info("[cron/progress-reports] Governance denied: " + (guard.reason || "no approval"));
    return { skipped: true, reason: guard.reason || "governance denied" };
  }

  // Check if this is a report week (even ISO week number)
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const weekNum = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);

  if (weekNum % 2 !== 0) {
    logger.info("[cron/progress-reports] Odd week — skipping");
    return { reportsGenerated: 0, emailsSent: 0, athletesSkipped: 0 };
  }

  const { getDb, getAthleteReportData, getParentsForChild } = await import("../db");
  const { athleteMetrics, progressReports, users } = await import("../../drizzle/schema");
  const { sql, gte, eq, or, inArray } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) return { reportsGenerated: 0, emailsSent: 0, athletesSkipped: 0 };

  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Athletes with 2+ metrics in the last 14 days
  const athleteRows = await db
    .select({ athleteId: athleteMetrics.athleteId })
    .from(athleteMetrics)
    .where(gte(athleteMetrics.sessionDate, fourteenDaysAgo))
    .groupBy(athleteMetrics.athleteId)
    .having(sql`count(*) >= 2`);

  let reportsGenerated = 0;
  let emailsSent = 0;
  let athletesSkipped = 0;

  for (const { athleteId } of athleteRows) {
    try {
      const reportData = await getAthleteReportData(athleteId);
      if (!reportData || !reportData.athlete || !reportData.metrics || reportData.metrics.length === 0) {
        athletesSkipped++;
        continue;
      }

      // Generate report via LLM
      const { invokeLLM } = await import("../_core/llm");

      const metricsText = reportData.metrics
        .slice(0, 20)
        .map(
          (m: any) =>
            `${m.metricName}: ${m.value} ${m.unit || ""} (${new Date(m.sessionDate).toLocaleDateString()})`
        )
        .join("\n");

      const attendanceCount = reportData.attendance?.length ?? 0;

      let reportContent: string;
      try {
        const llmResult = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are a youth athletic development coach writing a progress report for a parent. Be encouraging, specific about improvements, and suggest 1-2 focus areas for the next cycle. Keep it under 300 words. Use the athlete's name. Reference specific metrics and improvements. Tone: warm, professional, motivational — like a coach who genuinely cares about their kid.",
            },
            {
              role: "user",
              content: `Athlete: ${reportData.athlete.name || "Athlete"}\nSessions attended (last 14 days): ${attendanceCount}\n\nRecent metrics:\n${metricsText}`,
            },
          ],
        });

        const choice = llmResult.choices?.[0];
        reportContent =
          typeof choice?.message?.content === "string"
            ? choice.message.content
            : "Progress report generation in progress.";
      } catch (llmErr) {
        logger.error("[cron/progress-reports] LLM failed for athlete", athleteId, llmErr);
        athletesSkipped++;
        continue;
      }

      // Store report
      await db.insert(progressReports).values({
        athleteId,
        content: reportContent,
        generatedAt: now,
      });

      // Email parents
      const parents = await getParentsForChild(athleteId);
      for (const parent of parents) {
        if (!parent.email) continue;
        try {
          await sendEmail({
            to: parent.email,
            subject: `${reportData.athlete.name || "Your Athlete"}'s Progress Report — The Academy`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                <div style="background:#0a0a0a;padding:20px;text-align:center;">
                  <h1 style="color:#d4a843;margin:0;font-size:24px;">The Academy</h1>
                  <p style="color:#999;margin:5px 0 0;font-size:14px;">Athlete Progress Report</p>
                </div>
                <div style="padding:30px 20px;">
                  <h2 style="color:#333;">${reportData.athlete.name || "Your Athlete"}'s Progress</h2>
                  <div style="color:#555;font-size:15px;line-height:1.7;white-space:pre-wrap;">${reportContent}</div>
                  <div style="margin-top:30px;text-align:center;">
                    <a href="https://app.academytn.com/family" style="display:inline-block;background:#d4a843;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">View full progress in the app</a>
                  </div>
                </div>
                <div style="text-align:center;padding:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#999;">
                  <p>The Academy · Gallatin, TN</p>
                </div>
              </div>`,
          });
          emailsSent++;
        } catch (emailErr) {
          logger.error("[cron/progress-reports] Email failed for parent", parent.id, emailErr);
        }
      }

      reportsGenerated++;
    } catch (err) {
      logger.error("[cron/progress-reports] Failed for athlete", athleteId, err);
      athletesSkipped++;
    }
  }

  // Notify admins
  if (reportsGenerated > 0) {
    const adminUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(
        or(eq(users.role, "admin"), inArray(users.extendedRole, ["owner", "admin", "head_coach"]))
      );
    const adminIds = adminUsers.map((u: any) => u.id as number);
    if (adminIds.length > 0) {
      try {
        await sendPushToUsers(adminIds, {
          title: "Progress Reports Sent",
          body: `${reportsGenerated} progress reports sent to parents`,
          data: { type: "admin-reports" },
        });
      } catch {
        // Non-critical
      }
    }
  }

  const result = { reportsGenerated, emailsSent, athletesSkipped };
  logger.info("[cron/progress-reports] Complete", result);
  return result;
}
