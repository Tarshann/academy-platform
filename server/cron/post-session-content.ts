import { evaluateCronGovernance } from "../_core/governed-procedure";
import { logger } from "../_core/logger";
import { sendPushToUsers } from "../push";

export async function run() {
  logger.info("[cron/post-session-content] Generating post-session content");
  // Strix governance check — when enabled, cron must be approved before executing
  const guard = await evaluateCronGovernance("cron.postSessionContent", "post-session-content");
  if (!guard.allowed) {
    logger.info("[cron/post-session-content] Governance denied: " + (guard.reason || "no approval"));
    return { skipped: true, reason: guard.reason || "governance denied" };
  }

  const { getDb, getParentsForChild } = await import("../db");
  const {
    schedules,
    attendanceRecords,
    galleryPhotos,
    sessionRecaps,
    contentQueue,
  } = await import("../../drizzle/schema");
  const { and, gte, lte, eq, count, sql } = await import("drizzle-orm");

  const db = await getDb();
  if (!db)
    return { sessionsProcessed: 0, recapsGenerated: 0, socialDraftsQueued: 0, parentPushSent: 0 };

  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Sessions that ended in the last 3 hours
  const recentSessions = await db
    .select()
    .from(schedules)
    .where(and(gte(schedules.endTime, threeHoursAgo), lte(schedules.endTime, now)));

  let sessionsProcessed = 0;
  let recapsGenerated = 0;
  let socialDraftsQueued = 0;
  let parentPushSent = 0;

  let skippedDuplicates = 0;

  for (const session of recentSessions) {
    // Dedup: skip if a recap already exists for this session
    const existingRecap = await db
      .select({ id: sessionRecaps.id })
      .from(sessionRecaps)
      .where(eq(sessionRecaps.scheduleId, session.id))
      .limit(1);

    if (existingRecap.length > 0) {
      skippedDuplicates++;
      continue;
    }

    // Count attendance
    const [attendanceResult] = await db
      .select({ count: count() })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.scheduleId, session.id));
    const attendeeCount = Number(attendanceResult?.count ?? 0);

    if (attendeeCount === 0) continue;

    // Check for gallery photos uploaded today
    const [photoResult] = await db
      .select({ count: count() })
      .from(galleryPhotos)
      .where(
        and(
          gte(galleryPhotos.createdAt, todayStart),
          eq(galleryPhotos.isVisible, true)
        )
      );
    const photoCount = Number(photoResult?.count ?? 0);

    // Format times
    const startHour = session.startTime.getHours();
    const startMin = session.startTime.getMinutes();
    const endHour = session.endTime.getHours();
    const endMin = session.endTime.getMinutes();
    const fmtTime = (h: number, m: number) =>
      `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
    const dateStr = session.startTime.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    // Call LLM
    const { invokeLLM } = await import("../_core/llm");

    const userMessage = `Session: ${session.title}\nDate: ${dateStr}\nTime: ${fmtTime(startHour, startMin)} - ${fmtTime(endHour, endMin)}\nAthletes: ${attendeeCount}\nPhotos uploaded: ${photoCount}`;

    let llmData: {
      sessionRecap?: string;
      socialCaption?: string;
      parentPushTitle?: string;
      parentPushBody?: string;
    } = {};

    try {
      const llmResult = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a social media manager for The Academy, a youth athletic training program in Gallatin, Tennessee. Generate two pieces of content based on the session details provided.

Tone: Professional, motivational, parent-facing. Appeals to parents of youth athletes.
Brand voice: Confident but warm. Development-focused, not hype.

Output ONLY valid JSON with no markdown formatting, no backticks, no preamble:
{
  "sessionRecap": "A 2-3 sentence recap of what happened in the session for the in-app community feed. Mention the program name, how many athletes participated, and a highlight. Keep it specific and energizing.",
  "socialCaption": "An Instagram/TikTok caption (under 200 characters) for posting a photo from this session. Include 1-2 relevant hashtags from: #TheAcademyWay #TrainTheWholeAthlete #YouthSports #GallatinTN #BuildComplete. No emoji overload — max 2 emoji.",
  "parentPushTitle": "Short push notification title (under 40 chars)",
  "parentPushBody": "Push notification body (under 100 chars) telling parents what their kids worked on today"
}`,
          },
          { role: "user", content: userMessage },
        ],
      });

      const choice = llmResult.choices?.[0];
      const raw =
        typeof choice?.message?.content === "string" ? choice.message.content : "";

      // Try to parse JSON from response (strip any markdown fences if present)
      const jsonStr = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      llmData = JSON.parse(jsonStr);
    } catch (llmErr) {
      logger.error(
        "[cron/post-session-content] LLM/parse failed for session",
        session.id,
        llmErr
      );
      // Fallback recap
      llmData = {
        sessionRecap: `Great session today! ${attendeeCount} athletes trained hard in ${session.title}. Keep up the amazing work!`,
        parentPushTitle: "Session Complete",
        parentPushBody: `${session.title} wrapped up with ${attendeeCount} athletes today.`,
      };
    }

    // Store session recap
    if (llmData.sessionRecap) {
      try {
        await db.insert(sessionRecaps).values({
          scheduleId: session.id,
          content: llmData.sessionRecap,
        });
        recapsGenerated++;
      } catch (err) {
        logger.error("[cron/post-session-content] Recap insert failed", session.id, err);
      }
    }

    // Store social caption (only if photos exist)
    if (photoCount > 0 && llmData.socialCaption) {
      try {
        await db.insert(contentQueue).values({
          content: llmData.socialCaption,
          platform: "instagram",
          status: "draft",
          scheduleId: session.id,
        });
        socialDraftsQueued++;
      } catch (err) {
        logger.error("[cron/post-session-content] Content queue insert failed", session.id, err);
      }
    }

    // Send parent push
    if (llmData.parentPushTitle && llmData.parentPushBody) {
      // Get parent user IDs of athletes who attended
      const attendees = await db
        .select({ userId: attendanceRecords.userId })
        .from(attendanceRecords)
        .where(eq(attendanceRecords.scheduleId, session.id));

      // Batch-load parent relationships via userRelations table
      const attendeeIds = attendees.map((a: any) => a.userId as number);
      const parentIds: number[] = [];
      if (attendeeIds.length > 0) {
        const { userRelations } = await import("../../drizzle/schema");
        const { inArray } = await import("drizzle-orm");
        const relations = await db
          .select({ parentId: userRelations.parentId })
          .from(userRelations)
          .where(inArray(userRelations.childId, attendeeIds));
        for (const r of relations) parentIds.push(r.parentId);
      }

      const uniqueParentIds = [...new Set(parentIds)];
      if (uniqueParentIds.length > 0) {
        try {
          await sendPushToUsers(uniqueParentIds, {
            title: llmData.parentPushTitle.slice(0, 40),
            body: llmData.parentPushBody.slice(0, 100),
            data: { type: "session-recap", scheduleId: session.id },
          });
          parentPushSent += uniqueParentIds.length;
        } catch (err) {
          logger.error("[cron/post-session-content] Parent push failed", session.id, err);
        }
      }
    }

    sessionsProcessed++;
  }

  const result = { sessionsProcessed, recapsGenerated, socialDraftsQueued, parentPushSent, skippedDuplicates };
  logger.info("[cron/post-session-content] Complete", result);
  return result;
}
