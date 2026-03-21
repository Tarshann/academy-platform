/**
 * AI Blog Generator — Governed Cron Job
 *
 * Auto-generates weekly blog content based on platform activity:
 *   - Training tips based on the most-practiced metrics that week
 *   - Weekly recap of community achievements
 *   - Seasonal/sport-specific training advice
 *
 * Blog posts are created as UNPUBLISHED drafts for admin review.
 * This ensures fresh content is always waiting without requiring
 * someone to sit down and write from scratch.
 *
 * Schedule: Weekly on Saturday at 10 AM CT (15:00 UTC)
 *
 * Governance capabilities:
 *   - cron.aiBlogGenerator (cron-level gate)
 *   - ai.generateBlogPost (content generation)
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
    logger.error(`[ai-blog-generator] Evidence write failed:`, err);
  }
}

export async function run() {
  logger.info("[cron/ai-blog-generator] Starting AI blog generator");

  const guard = await evaluateCronGovernance("cron.aiBlogGenerator", "ai-blog-generator");
  if (!guard.allowed) {
    logger.info("[cron/ai-blog-generator] Governance denied: " + (guard.reason || "no approval"));
    return { skipped: true, reason: guard.reason || "governance denied" };
  }

  const { getDb } = await import("../db");
  const { sql } = await import("drizzle-orm");
  const db = await getDb();
  if (!db) return { generated: 0 };

  // Gather weekly context
  let weeklyContext = "";

  try {
    // Most practiced metrics this week
    const topMetrics = await db.execute(sql`
      SELECT metric_name, COUNT(*) AS cnt
      FROM athlete_metrics
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY metric_name
      ORDER BY cnt DESC
      LIMIT 5
    `);
    const metrics = (topMetrics.rows ?? topMetrics) as any[];
    if (metrics.length > 0) {
      weeklyContext += `Most practiced metrics this week: ${metrics.map((m: any) => `${m.metric_name} (${m.cnt}x)`).join(", ")}. `;
    }

    // Total sessions and attendance
    const sessionStats = await db.execute(sql`
      SELECT
        COUNT(DISTINCT s.id)::int AS sessions,
        COUNT(DISTINCT ar.user_id)::int AS unique_athletes
      FROM schedules s
      LEFT JOIN attendance_records ar ON ar.schedule_id = s.id AND ar.status = 'present'
      WHERE s.start_time >= NOW() - INTERVAL '7 days'
    `);
    const ss = ((sessionStats.rows ?? sessionStats) as any[])[0];
    weeklyContext += `${ss?.sessions ?? 0} sessions held this week with ${ss?.unique_athletes ?? 0} unique athletes. `;

    // PR count
    const prCount = await db.execute(sql`
      SELECT COUNT(*)::int AS prs FROM athlete_metrics
      WHERE is_pr = true AND created_at >= NOW() - INTERVAL '7 days'
    `);
    const prs = Number(((prCount.rows ?? prCount) as any[])[0]?.prs ?? 0);
    weeklyContext += `${prs} personal records set this week. `;
  } catch (err) {
    logger.warn("[ai-blog-generator] Context gathering failed:", err);
    weeklyContext = "Standard training week at The Academy.";
  }

  // Determine blog topic based on context
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "long" });
  const weekOfYear = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 86400000));
  const topicSeed = weekOfYear % 4;
  const topics = [
    "training tips based on this week's most practiced metrics",
    "a weekly community recap celebrating athlete achievements",
    `seasonal ${month} training advice for youth athletes`,
    "parent guide on supporting young athletes at home",
  ];
  const selectedTopic = topics[topicSeed];

  await recordAIEvidence("ai.generateBlogPost", "allow", `generating_blog_${selectedTopic.split(" ").slice(0, 3).join("_")}`, {
    topic: selectedTopic,
    weekOfYear,
  });

  try {
    const { invokeLLM } = await import("../_core/llm");
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are the content writer for The Academy, a youth athletic training facility in Gallatin, Tennessee. Write a blog post.

Requirements:
- Title: engaging, SEO-friendly, max 80 characters
- Slug: URL-friendly (lowercase, hyphens, no special chars)
- Body: 300-500 words, informative and actionable
- Include practical tips parents and athletes can use
- Reference specific data when provided
- Tone: knowledgeable, encouraging, development-focused
- End with a call to action about The Academy

Output ONLY valid JSON:
{
  "title": "...",
  "slug": "...",
  "content": "Full blog post body in plain text with paragraph breaks",
  "excerpt": "1-2 sentence preview (max 160 chars)"
}`,
        },
        {
          role: "user",
          content: `Write a blog post about ${selectedTopic}.\n\nThis week's context: ${weeklyContext}`,
        },
      ],
    });

    const raw = typeof result.choices?.[0]?.message?.content === "string"
      ? result.choices[0].message.content : "";
    const jsonStr = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    const { blogPosts } = await import("../../drizzle/schema");
    await db.insert(blogPosts).values({
      title: String(parsed.title).slice(0, 255),
      slug: String(parsed.slug || "ai-generated-post").slice(0, 255).toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      content: String(parsed.content),
      excerpt: String(parsed.excerpt || "").slice(0, 500),
      isPublished: false, // Always draft — admin publishes
      authorId: 1, // System
    });

    const genResult = { generated: 1, topic: selectedTopic, title: parsed.title };
    logger.info("[cron/ai-blog-generator] Complete", genResult);
    return genResult;
  } catch (err) {
    logger.error("[ai-blog-generator] Generation failed:", err);
    return { generated: 0, error: String(err) };
  }
}
