import { logger } from "./_core/logger";
import { sendPushToUsers } from "./push";

// Metrics where lower values indicate improvement (timed events)
const LOWER_IS_BETTER = [
  "40-Yard Dash",
  "Pro Agility (5-10-5)",
  "10-Yard Split",
  "L-Drill",
  "Mile Run",
  "3-Cone Drill",
];

export function isPR(
  metricName: string,
  newValue: number,
  previousBest: number
): boolean {
  if (LOWER_IS_BETTER.includes(metricName)) return newValue < previousBest;
  return newValue > previousBest;
}

/**
 * Orchestrates the full milestone celebration pipeline:
 * 1. Insert milestone record
 * 2. Generate celebration card image (async, non-blocking)
 * 3. Push notification to parents
 * 4. Post to community feed (via session_recaps with type='milestone')
 */
export async function triggerMilestone(params: {
  athleteId: number;
  athleteName: string;
  metricName: string;
  previousValue: number | null;
  newValue: number;
  unit: string;
  improvementPct: number | null;
  improvementDisplay: string;
}): Promise<{ milestoneId: number; cardUrl: string | null }> {
  const {
    athleteId,
    athleteName,
    metricName,
    previousValue,
    newValue,
    unit,
    improvementPct,
    improvementDisplay,
  } = params;

  const { getDb, getParentsForChild } = await import("./db");
  const { milestones, sessionRecaps } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) {
    logger.error("[milestones] DB unavailable, cannot create milestone");
    return { milestoneId: 0, cardUrl: null };
  }

  // 1. Insert milestone record
  let milestoneId = 0;
  try {
    const [inserted] = await db
      .insert(milestones)
      .values({
        athleteId,
        metricName,
        previousValue: previousValue != null ? String(previousValue) : null,
        newValue: String(newValue),
        unit,
        improvementPct: improvementPct != null ? String(improvementPct) : null,
        improvementDisplay,
      })
      .returning({ id: milestones.id });
    milestoneId = inserted.id;
  } catch (err) {
    logger.error("[milestones] Insert failed", err);
    return { milestoneId: 0, cardUrl: null };
  }

  // 2. Generate celebration card (non-blocking)
  let cardUrl: string | null = null;
  try {
    const { generateMilestoneCard } = await import("./milestone-card");
    cardUrl = await generateMilestoneCard({
      athleteName,
      metricName,
      newValue,
      unit,
      improvementDisplay,
    });

    if (cardUrl) {
      await db
        .update(milestones)
        .set({ cardImageUrl: cardUrl })
        .where(eq(milestones.id, milestoneId));
    }
  } catch (err) {
    logger.error("[milestones] Card generation failed (non-fatal)", err);
  }

  // 3. Post to community feed as a milestone recap
  try {
    const feedContent = `${athleteName} just set a new personal record! ${metricName}: ${newValue} ${unit}. ${improvementDisplay}`;
    await db.insert(sessionRecaps).values({
      scheduleId: null,
      content: feedContent,
      type: "milestone",
    });
  } catch (err) {
    logger.error("[milestones] Feed post failed (non-fatal)", err);
  }

  // 4. Push notification to parents
  try {
    const parents = await getParentsForChild(athleteId);
    const parentIds = parents.map((p: any) => p.id as number).filter(Boolean);
    if (parentIds.length > 0) {
      await sendPushToUsers(parentIds, {
        title: `New PR for ${athleteName}!`,
        body: `${metricName}: ${newValue} ${unit} — ${improvementDisplay}`,
        data: { type: "milestone", milestoneId },
      });
    }
  } catch (err) {
    logger.error("[milestones] Parent push failed (non-fatal)", err);
  }

  logger.info("[milestones] Milestone created", {
    milestoneId,
    athleteId,
    metricName,
    improvementDisplay,
  });

  return { milestoneId, cardUrl };
}
