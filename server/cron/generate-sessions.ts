import { logger } from "../_core/logger";

const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export async function run() {
  logger.info("[cron/generate-sessions] Generating sessions from templates");

  const { getDb } = await import("../db");
  const { scheduleTemplates, schedules } = await import("../../drizzle/schema");
  const { eq, and, sql } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) return { sessionsCreated: 0, templatesProcessed: 0, duplicatesSkipped: 0 };

  const templates = await db
    .select()
    .from(scheduleTemplates)
    .where(eq(scheduleTemplates.isActive, true));

  let sessionsCreated = 0;
  let duplicatesSkipped = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const template of templates) {
    const targetDayNum = DAY_MAP[template.dayOfWeek] ?? -1;
    if (targetDayNum < 0) {
      logger.warn(`[cron/generate-sessions] Invalid dayOfWeek for template ${template.id}: ${template.dayOfWeek}`);
      continue;
    }

    // Find all occurrences of this day in the next 7 days
    for (let d = 0; d < 7; d++) {
      const candidate = new Date(today);
      candidate.setDate(today.getDate() + d);

      if (candidate.getDay() !== targetDayNum) continue;

      const startTime = new Date(candidate);
      startTime.setHours(template.startHour, template.startMinute ?? 0, 0, 0);

      const endTime = new Date(candidate);
      endTime.setHours(template.endHour, template.endMinute ?? 0, 0, 0);

      // Check for duplicate
      const existing = await db
        .select({ id: schedules.id })
        .from(schedules)
        .where(
          and(
            template.programId ? eq(schedules.programId, template.programId) : sql`true`,
            eq(schedules.startTime, startTime)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        duplicatesSkipped++;
        continue;
      }

      await db.insert(schedules).values({
        title: template.name,
        programId: template.programId,
        startTime,
        endTime,
        dayOfWeek: template.dayOfWeek,
        location: template.location,
        maxParticipants: template.maxParticipants,
        isRecurring: true,
      });

      sessionsCreated++;
    }
  }

  const result = { sessionsCreated, templatesProcessed: templates.length, duplicatesSkipped };
  logger.info("[cron/generate-sessions] Complete", result);
  return result;
}
