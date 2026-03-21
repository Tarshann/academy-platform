/**
 * AI Feed Engagement — Governed Cron Job
 *
 * Keeps the app feed alive by generating engagement content when
 * organic content is slow. Detects "feed gaps" (periods with no new
 * content) and generates:
 *   - Training tips of the day
 *   - Motivational quotes relevant to current training focus
 *   - "Did you know?" facts about youth athletic development
 *   - Upcoming session previews
 *
 * Content is posted directly to the session recaps table (which feeds
 * into the unified feed) as "tip" type entries.
 *
 * Schedule: Twice daily at 7 AM CT (12:00 UTC) and 3 PM CT (20:00 UTC)
 *
 * Governance capabilities:
 *   - cron.aiFeedEngagement (cron-level gate)
 *   - ai.generateFeedContent (content generation)
 *   - ai.publishContent (auto-publish to feed — high risk)
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
    logger.error(`[ai-feed-engagement] Evidence write failed:`, err);
  }
}

export async function run() {
  logger.info("[cron/ai-feed-engagement] Starting AI feed engagement engine");

  const guard = await evaluateCronGovernance("cron.aiFeedEngagement", "ai-feed-engagement");
  if (!guard.allowed) {
    logger.info("[cron/ai-feed-engagement] Governance denied: " + (guard.reason || "no approval"));
    return { skipped: true, reason: guard.reason || "governance denied" };
  }

  const { getDb } = await import("../db");
  const { sql } = await import("drizzle-orm");
  const db = await getDb();
  if (!db) return { posted: 0 };

  // Check if there's been organic content in the last 8 hours
  try {
    const recentContent = await db.execute(sql`
      SELECT COUNT(*)::int AS cnt FROM (
        SELECT id FROM session_recaps WHERE created_at >= NOW() - INTERVAL '8 hours'
        UNION ALL
        SELECT id FROM "galleryPhotos" WHERE "createdAt" >= NOW() - INTERVAL '8 hours' AND "isVisible" = true
        UNION ALL
        SELECT id FROM videos WHERE "createdAt" >= NOW() - INTERVAL '8 hours' AND "isPublished" = true
      ) recent
    `);
    const count = Number(((recentContent.rows ?? recentContent) as any[])[0]?.cnt ?? 0);

    if (count >= 2) {
      logger.info(`[ai-feed-engagement] Feed is active (${count} items in 8h), skipping`);
      return { posted: 0, reason: `feed_active_${count}_items` };
    }
  } catch (err) {
    logger.warn("[ai-feed-engagement] Recent content check failed:", err);
    // Continue anyway — better to post than to leave feed empty
  }

  // Gather context for generation
  let context = "";
  try {
    // What's being trained this week
    const topMetrics = await db.execute(sql`
      SELECT metric_name, COUNT(*) AS cnt
      FROM athlete_metrics
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY metric_name
      ORDER BY cnt DESC
      LIMIT 3
    `);
    const metrics = (topMetrics.rows ?? topMetrics) as any[];
    if (metrics.length > 0) {
      context += `Current training focus: ${metrics.map((m: any) => m.metric_name).join(", ")}. `;
    }

    // Upcoming sessions
    const upcoming = await db.execute(sql`
      SELECT title, start_time
      FROM schedules
      WHERE start_time >= NOW()
        AND start_time <= NOW() + INTERVAL '48 hours'
      ORDER BY start_time
      LIMIT 3
    `);
    const sessions = (upcoming.rows ?? upcoming) as any[];
    if (sessions.length > 0) {
      context += `Upcoming: ${sessions.map((s: any) => s.title).join(", ")}. `;
    }
  } catch (err) {
    logger.warn("[ai-feed-engagement] Context fetch failed:", err);
  }

  // Determine content type based on time of day
  const hour = new Date().getUTCHours();
  const contentType = hour < 16 ? "morning_tip" : "afternoon_motivation";

  await recordAIEvidence("ai.generateFeedContent", "allow", `generating_${contentType}`, {
    contentType,
    feedGapDetected: true,
  });

  try {
    const { invokeLLM } = await import("../_core/llm");

    const prompts: Record<string, string> = {
      morning_tip: `Generate a "Training Tip of the Day" for youth athletes. Make it actionable, specific, and relevant to the current training focus. Include a brief explanation of WHY this tip matters for athletic development.`,
      afternoon_motivation: `Generate an afternoon motivational post for youth athletes heading into evening training. Be specific and encouraging, not generic. Reference the upcoming sessions if available.`,
    };

    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are the social media voice of The Academy, a youth athletic training facility. Generate a short feed post.

Rules:
- Max 200 words
- Specific and actionable (not generic motivation)
- Reference training data when available
- Include 1 emoji max
- Tone: like a knowledgeable coach talking to their team

Output ONLY valid JSON: {"content": "The full post text"}`,
        },
        {
          role: "user",
          content: `${prompts[contentType]}\n\nContext: ${context || "General training week."}`,
        },
      ],
    });

    const raw = typeof result.choices?.[0]?.message?.content === "string"
      ? result.choices[0].message.content : "";
    const jsonStr = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    await recordAIEvidence("ai.publishContent", "allow", "auto_feed_publish", {
      contentType,
    });

    // Post to session_recaps as a "tip" — this flows into the unified feed
    const { sessionRecaps } = await import("../../drizzle/schema");
    await db.insert(sessionRecaps).values({
      content: String(parsed.content).slice(0, 2000),
      // No scheduleId — this is standalone AI content, not tied to a session
    });

    const genResult = { posted: 1, type: contentType };
    logger.info("[cron/ai-feed-engagement] Complete", genResult);
    return genResult;
  } catch (err) {
    logger.error("[ai-feed-engagement] Generation failed:", err);
    return { posted: 0, error: String(err) };
  }
}
