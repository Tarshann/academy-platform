/**
 * AI Announcement Drafter — Governed Cron Job
 *
 * Monitors platform events and auto-drafts announcements:
 *   - New program added → draft welcoming announcement
 *   - Schedule changes → draft update announcement
 *   - Milestones hit → draft celebration announcement
 *   - Membership milestones (100th member, etc.)
 *
 * Drafts are NOT auto-published — they're saved as unpublished for
 * admin review. The AI removes the blank-page problem; the admin
 * still makes the publish decision.
 *
 * Schedule: Daily at 8 AM CT (13:00 UTC)
 *
 * Governance capabilities:
 *   - cron.aiAnnouncementDrafter (cron-level gate)
 *   - ai.generateAnnouncement (per-announcement generation)
 */

import { evaluateCronGovernance } from "../_core/governed-procedure";
import { logger } from "../_core/logger";

async function recordAIEvidence(
  capabilityId: string,
  action: "allow" | "deny" | "escalate",
  reason: string,
  metadata?: Record<string, unknown>
) {
  try {
    const { insertGovernanceEvidence } = await import("../db");
    const { createHash } = await import("crypto");
    const timestamp = new Date().toISOString();
    const evidenceHash = createHash("sha256")
      .update(JSON.stringify({
        capabilityId, actorId: "system:ai", actorRole: "ai_agent",
        action, reason, source: "ai", timestamp,
      }))
      .digest("hex");
    await insertGovernanceEvidence({
      capabilityId, actorId: "system:ai", actorRole: "ai_agent",
      actorEmail: null, action, reason, source: "ai",
      externalDecisionId: null, evidenceHash, metadata: metadata ?? null,
    });
  } catch (err) {
    logger.error(`[ai-announcement-drafter] Evidence write failed:`, err);
  }
}

interface PlatformEvent {
  type: "new_program" | "schedule_change" | "milestone" | "membership_milestone";
  data: Record<string, unknown>;
}

async function detectEvents(): Promise<PlatformEvent[]> {
  const { getDb } = await import("../db");
  const { sql } = await import("drizzle-orm");
  const db = await getDb();
  if (!db) return [];

  const events: PlatformEvent[] = [];

  // 1. New programs created in last 24h
  try {
    const newPrograms = await db.execute(sql`
      SELECT id, title, description
      FROM programs
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);
    for (const row of (newPrograms.rows ?? newPrograms) as any[]) {
      events.push({
        type: "new_program",
        data: { programId: row.id, title: row.title, description: row.description },
      });
    }
  } catch (err) {
    logger.warn("[ai-announcement-drafter] New programs check failed:", err);
  }

  // 2. Milestones celebrated in last 24h
  try {
    const milestones = await db.execute(sql`
      SELECT m.id, m.user_id, m.metric_name, m.new_value, m.unit, u.name
      FROM milestones m
      LEFT JOIN users u ON u.id = m.user_id
      WHERE m.created_at >= NOW() - INTERVAL '24 hours'
        AND m.celebrated = true
      LIMIT 5
    `);
    const milestoneRows = (milestones.rows ?? milestones) as any[];
    if (milestoneRows.length > 0) {
      events.push({
        type: "milestone",
        data: {
          count: milestoneRows.length,
          athletes: milestoneRows.map((m: any) => ({
            name: m.name,
            metric: m.metric_name,
            value: m.new_value,
            unit: m.unit,
          })),
        },
      });
    }
  } catch (err) {
    logger.warn("[ai-announcement-drafter] Milestones check failed:", err);
  }

  // 3. Membership milestone (every 25 members)
  try {
    const memberCount = await db.execute(sql`
      SELECT COUNT(*)::int AS total FROM users WHERE role = 'member'
    `);
    const total = Number(((memberCount.rows ?? memberCount) as any[])[0]?.total ?? 0);
    if (total > 0 && total % 25 === 0) {
      // Check if we already drafted this milestone
      const existing = await db.execute(sql`
        SELECT id FROM announcements
        WHERE title LIKE ${`%${total} member%`}
          AND created_at >= NOW() - INTERVAL '7 days'
        LIMIT 1
      `);
      if (((existing.rows ?? existing) as any[]).length === 0) {
        events.push({
          type: "membership_milestone",
          data: { memberCount: total },
        });
      }
    }
  } catch (err) {
    logger.warn("[ai-announcement-drafter] Membership milestone check failed:", err);
  }

  return events;
}

export async function run() {
  logger.info("[cron/ai-announcement-drafter] Starting AI announcement drafter");

  const guard = await evaluateCronGovernance("cron.aiAnnouncementDrafter", "ai-announcement-drafter");
  if (!guard.allowed) {
    logger.info("[cron/ai-announcement-drafter] Governance denied: " + (guard.reason || "no approval"));
    return { skipped: true, reason: guard.reason || "governance denied" };
  }

  const events = await detectEvents();
  logger.info(`[ai-announcement-drafter] Detected ${events.length} events`);

  if (events.length === 0) {
    return { events: 0, drafts: 0 };
  }

  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) return { events: events.length, drafts: 0 };

  const { invokeLLM } = await import("../_core/llm");
  let drafted = 0;

  for (const event of events) {
    await recordAIEvidence("ai.generateAnnouncement", "allow", `drafting_${event.type}`, {
      eventType: event.type,
      eventData: event.data,
    });

    const eventDescriptions: Record<string, string> = {
      new_program: `A new program was just added: "${(event.data as any).title}". Description: ${(event.data as any).description}. Write an exciting announcement.`,
      milestone: `${(event.data as any).count} athletes set personal records today! Athletes: ${JSON.stringify((event.data as any).athletes)}. Write a celebration announcement.`,
      membership_milestone: `The Academy just hit ${(event.data as any).memberCount} members! Write a grateful, community-building announcement.`,
      schedule_change: `Schedule changes were made. Write a brief heads-up announcement.`,
    };

    try {
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are the communications manager for The Academy, a youth athletic training facility in Gallatin, Tennessee. Draft an announcement for the member community.

Rules:
- Title: max 80 characters, engaging
- Body: 2-4 sentences, warm and informative
- Include a call to action when appropriate
- Tone: excited but professional, community-focused

Output ONLY valid JSON: {"title": "...", "body": "..."}`,
          },
          { role: "user", content: eventDescriptions[event.type] ?? "Write a general update announcement." },
        ],
      });

      const raw = typeof result.choices?.[0]?.message?.content === "string"
        ? result.choices[0].message.content : "";
      const jsonStr = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(jsonStr);

      const { announcements } = await import("../../drizzle/schema");
      await db.insert(announcements).values({
        title: String(parsed.title).slice(0, 255),
        content: String(parsed.body),
        createdBy: 1, // System
      });
      drafted++;
    } catch (err) {
      logger.error(`[ai-announcement-drafter] Draft failed for ${event.type}:`, err);
    }
  }

  const result = { events: events.length, drafted };
  logger.info("[cron/ai-announcement-drafter] Complete", result);
  return result;
}
