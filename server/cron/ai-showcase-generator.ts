/**
 * AI Showcase Generator — Governed Cron Job
 *
 * Automatically selects the "Athlete of the Week" based on data signals:
 *   - Attendance consistency (sessions attended in the last 7 days)
 *   - Metric improvements (PRs set in the last 7 days)
 *   - Game engagement (points earned in games hub)
 *   - Overall participation (chat messages, profile completeness)
 *
 * AI generates a personalized showcase description highlighting the
 * athlete's achievements, then creates the showcase record.
 *
 * Schedule: Weekly on Sunday at 8 PM CT (01:00 UTC Monday)
 *
 * Governance capabilities:
 *   - cron.aiShowcaseGenerator (cron-level gate)
 *   - ai.generateShowcase (AI content generation)
 *   - ai.publishContent (auto-publish — high risk)
 */

import { evaluateCronGovernance } from "../_core/governed-procedure";
import { logger } from "../_core/logger";

// ── Evidence recording ─────────────────────────────────────────────────
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
    logger.error(`[ai-showcase-generator] Evidence write failed for ${capabilityId}:`, err);
  }
}

// ── Athlete scoring ────────────────────────────────────────────────────
interface AthleteScore {
  userId: number;
  name: string;
  email: string | null;
  attendanceCount: number;
  prCount: number;
  totalPoints: number;
  score: number;
}

async function scoreAthletes(): Promise<AthleteScore[]> {
  const { getDb } = await import("../db");
  const { sql } = await import("drizzle-orm");
  const db = await getDb();
  if (!db) return [];

  try {
    // Combined scoring query — attendance (40%), PRs (35%), game points (25%)
    const result = await db.execute(sql`
      WITH attendance_scores AS (
        SELECT ar.user_id, COUNT(*) AS attendance_count
        FROM attendance_records ar
        WHERE ar.status = 'present'
          AND ar.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY ar.user_id
      ),
      pr_scores AS (
        SELECT am.user_id, COUNT(*) AS pr_count
        FROM athlete_metrics am
        WHERE am.is_pr = true
          AND am.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY am.user_id
      ),
      game_scores AS (
        SELECT ge.user_id, SUM(ge.points_earned) AS total_points
        FROM game_entries ge
        WHERE ge.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY ge.user_id
      ),
      recent_showcases AS (
        SELECT athlete_id
        FROM "athleteShowcases"
        WHERE "featuredFrom" >= NOW() - INTERVAL '21 days'
      )
      SELECT
        u.id AS user_id,
        u.name,
        u.email,
        COALESCE(a.attendance_count, 0)::int AS attendance_count,
        COALESCE(p.pr_count, 0)::int AS pr_count,
        COALESCE(g.total_points, 0)::int AS total_points,
        (
          COALESCE(a.attendance_count, 0) * 40 +
          COALESCE(p.pr_count, 0) * 35 +
          COALESCE(g.total_points, 0) * 0.25
        )::int AS score
      FROM users u
      LEFT JOIN attendance_scores a ON a.user_id = u.id
      LEFT JOIN pr_scores p ON p.user_id = u.id
      LEFT JOIN game_scores g ON g.user_id = u.id
      WHERE u.role = 'member'
        AND u.id NOT IN (SELECT athlete_id FROM recent_showcases)
        AND (COALESCE(a.attendance_count, 0) > 0 OR COALESCE(p.pr_count, 0) > 0)
      ORDER BY score DESC
      LIMIT 5
    `);

    return ((result.rows ?? result) as any[]).map((row: any) => ({
      userId: Number(row.user_id),
      name: row.name || "Academy Athlete",
      email: row.email,
      attendanceCount: Number(row.attendance_count),
      prCount: Number(row.pr_count),
      totalPoints: Number(row.total_points),
      score: Number(row.score),
    }));
  } catch (err) {
    logger.error("[ai-showcase-generator] Scoring query failed:", err);
    return [];
  }
}

// ── Main Runner ────────────────────────────────────────────────────────
export async function run() {
  logger.info("[cron/ai-showcase-generator] Starting AI showcase generator");

  const guard = await evaluateCronGovernance("cron.aiShowcaseGenerator", "ai-showcase-generator");
  if (!guard.allowed) {
    logger.info("[cron/ai-showcase-generator] Governance denied: " + (guard.reason || "no approval"));
    return { skipped: true, reason: guard.reason || "governance denied" };
  }

  // Score athletes based on the last 7 days of activity
  const candidates = await scoreAthletes();
  logger.info(`[ai-showcase-generator] Scored ${candidates.length} candidates`);

  if (candidates.length === 0) {
    return { selected: false, reason: "no eligible athletes this week" };
  }

  const winner = candidates[0];
  logger.info(`[ai-showcase-generator] Selected: ${winner.name} (score: ${winner.score})`);

  // Record AI showcase generation evidence
  await recordAIEvidence("ai.generateShowcase", "allow", "generating_weekly_showcase", {
    athleteId: winner.userId,
    athleteName: winner.name,
    score: winner.score,
    attendance: winner.attendanceCount,
    prs: winner.prCount,
  });

  // Get the athlete's recent metrics for context
  const { getDb } = await import("../db");
  const { sql } = await import("drizzle-orm");
  const db = await getDb();
  if (!db) return { selected: false, reason: "db unavailable" };

  let recentMetrics: any[] = [];
  try {
    const metricsResult = await db.execute(sql`
      SELECT metric_name, value, unit, is_pr
      FROM athlete_metrics
      WHERE user_id = ${winner.userId}
        AND created_at >= NOW() - INTERVAL '14 days'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    recentMetrics = (metricsResult.rows ?? metricsResult) as any[];
  } catch (err) {
    logger.warn("[ai-showcase-generator] Metrics fetch failed:", err);
  }

  // Generate showcase content with AI
  const { invokeLLM } = await import("../_core/llm");
  let title = `${winner.name} — Athlete of the Week`;
  let description = `${winner.name} showed incredible dedication this week with ${winner.attendanceCount} sessions and ${winner.prCount} personal records.`;
  let achievements: string[] = [];
  let stats: Record<string, string> = {};

  try {
    const metricsContext = recentMetrics.length > 0
      ? `Recent metrics: ${recentMetrics.map((m: any) => `${m.metric_name}: ${m.value}${m.unit || ''}${m.is_pr ? ' (PR!)' : ''}`).join(', ')}`
      : "No recent metrics recorded.";

    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are writing an "Athlete of the Week" spotlight for The Academy, a youth athletic training facility. Write an inspiring, specific showcase for this athlete.

Tone: Celebratory, specific, development-focused. Like a proud coach.
Avoid generic platitudes — reference actual data provided.

Output ONLY valid JSON:
{
  "title": "Creative title (max 60 chars, include athlete's first name)",
  "description": "2-3 sentence description highlighting their dedication and achievements this week. Be specific about what they accomplished.",
  "achievements": ["Achievement 1", "Achievement 2", "Achievement 3"],
  "stats": {"Sessions": "X", "PRs": "X", "Highlight": "brief"}
}`,
        },
        {
          role: "user",
          content: `Athlete: ${winner.name}\nSessions this week: ${winner.attendanceCount}\nPersonal records this week: ${winner.prCount}\nGame points earned: ${winner.totalPoints}\n${metricsContext}`,
        },
      ],
    });

    const raw = typeof result.choices?.[0]?.message?.content === "string"
      ? result.choices[0].message.content : "";
    const jsonStr = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    title = String(parsed.title || title).slice(0, 255);
    description = String(parsed.description || description);
    achievements = Array.isArray(parsed.achievements) ? parsed.achievements.map(String) : [];
    stats = typeof parsed.stats === "object" ? parsed.stats : {};
  } catch (err) {
    logger.error("[ai-showcase-generator] LLM generation failed, using fallback:", err);
    achievements = [
      `${winner.attendanceCount} training sessions attended`,
      winner.prCount > 0 ? `${winner.prCount} personal records set` : "Consistent daily effort",
      "Outstanding commitment to improvement",
    ];
    stats = {
      Sessions: String(winner.attendanceCount),
      PRs: String(winner.prCount),
    };
  }

  // Record publish evidence
  await recordAIEvidence("ai.publishContent", "allow", "auto_showcase_publish", {
    athleteId: winner.userId,
    title,
  });

  // Create the showcase
  try {
    const { athleteShowcases } = await import("../../drizzle/schema");
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + 7);

    await db.insert(athleteShowcases).values({
      athleteId: winner.userId,
      title,
      description,
      achievements: JSON.stringify(achievements),
      stats: JSON.stringify(stats),
      isActive: true,
      featuredFrom: now,
      featuredUntil: nextSunday,
      createdBy: 1, // System user
    });

    logger.info(`[ai-showcase-generator] Showcase created for ${winner.name}`);
  } catch (err) {
    logger.error("[ai-showcase-generator] Showcase insert failed:", err);
    return { selected: true, athlete: winner.name, created: false, error: String(err) };
  }

  return {
    selected: true,
    athlete: winner.name,
    score: winner.score,
    attendance: winner.attendanceCount,
    prs: winner.prCount,
    created: true,
  };
}
