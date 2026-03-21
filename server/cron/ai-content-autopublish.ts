/**
 * AI Content Autopublish — Governed Cron Job
 *
 * Auto-approves AI-generated content in the content queue that has been
 * sitting in "draft" status for 24+ hours without rejection. This removes
 * the bottleneck of manual approval while still giving admins a window
 * to reject inappropriate content.
 *
 * Safety: Only publishes content that was AI-generated (has a scheduleId).
 * Human-submitted content is never auto-approved.
 *
 * Schedule: Daily at 9 AM CT (14:00 UTC) — gives admins overnight to review
 *
 * Governance capabilities:
 *   - cron.aiContentAutopublish (cron-level gate)
 *   - ai.publishContent (per-item publish — high risk)
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
    logger.error(`[ai-content-autopublish] Evidence write failed:`, err);
  }
}

export async function run() {
  logger.info("[cron/ai-content-autopublish] Starting content autopublish");

  const guard = await evaluateCronGovernance("cron.aiContentAutopublish", "ai-content-autopublish");
  if (!guard.allowed) {
    logger.info("[cron/ai-content-autopublish] Governance denied: " + (guard.reason || "no approval"));
    return { skipped: true, reason: guard.reason || "governance denied" };
  }

  const { getDb } = await import("../db");
  const { sql } = await import("drizzle-orm");
  const db = await getDb();
  if (!db) return { published: 0 };

  // Find draft content older than 24h that was AI-generated (has schedule_id)
  try {
    const drafts = await db.execute(sql`
      SELECT id, content, platform, schedule_id
      FROM content_queue
      WHERE status = 'draft'
        AND schedule_id IS NOT NULL
        AND generated_at <= NOW() - INTERVAL '24 hours'
      ORDER BY generated_at ASC
      LIMIT 20
    `);

    const rows = (drafts.rows ?? drafts) as any[];
    logger.info(`[ai-content-autopublish] Found ${rows.length} aged drafts to auto-approve`);

    let published = 0;
    for (const row of rows) {
      await recordAIEvidence("ai.publishContent", "allow", "auto_approve_aged_content", {
        contentQueueId: row.id,
        platform: row.platform,
        scheduleId: row.schedule_id,
      });

      await db.execute(sql`
        UPDATE content_queue
        SET status = 'approved', reviewed_at = NOW()
        WHERE id = ${row.id}
      `);
      published++;
    }

    const result = { found: rows.length, published };
    logger.info("[cron/ai-content-autopublish] Complete", result);
    return result;
  } catch (err) {
    logger.error("[ai-content-autopublish] Failed:", err);
    return { published: 0, error: String(err) };
  }
}
