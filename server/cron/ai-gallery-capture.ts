/**
 * AI Gallery Capture — Governed Cron Job
 *
 * Scans recent chat messages for images/videos shared during training,
 * uses AI to classify whether the media is gallery-worthy (training
 * highlights, group shots, drills), and auto-publishes to the gallery.
 *
 * This replaces manual gallery uploads for the majority of content —
 * coaches share media naturally in chat, and the AI promotes the best
 * content to the public gallery automatically.
 *
 * Schedule: Daily at 10 PM CT (03:00 UTC next day)
 *
 * Governance capabilities:
 *   - cron.aiGalleryCapture (cron-level gate)
 *   - ai.classifyMedia (per-image classification)
 *   - ai.publishContent (gallery publish — high risk)
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
    logger.error(`[ai-gallery-capture] Evidence write failed for ${capabilityId}:`, err);
  }
}

// ── Main Runner ────────────────────────────────────────────────────────
export async function run() {
  logger.info("[cron/ai-gallery-capture] Starting AI gallery capture");

  const guard = await evaluateCronGovernance("cron.aiGalleryCapture", "ai-gallery-capture");
  if (!guard.allowed) {
    logger.info("[cron/ai-gallery-capture] Governance denied: " + (guard.reason || "no approval"));
    return { skipped: true, reason: guard.reason || "governance denied" };
  }

  const { getDb } = await import("../db");
  const { sql } = await import("drizzle-orm");
  const db = await getDb();
  if (!db) return { scanned: 0, promoted: 0 };

  // Find chat messages with images from the last 24h that aren't already in gallery
  const recentMedia = await db.execute(sql`
    SELECT cm.id, cm."imageUrl", cm."imageKey", cm."userName", cm.room, cm."createdAt"
    FROM "chatMessages" cm
    WHERE cm."imageUrl" IS NOT NULL
      AND cm."imageUrl" != ''
      AND cm."createdAt" >= NOW() - INTERVAL '24 hours'
      AND cm."imageUrl" NOT IN (
        SELECT g."imageUrl" FROM "galleryPhotos" g WHERE g."imageUrl" IS NOT NULL
      )
    ORDER BY cm."createdAt" DESC
    LIMIT 20
  `);

  const mediaRows = (recentMedia.rows ?? recentMedia) as any[];
  logger.info(`[ai-gallery-capture] Found ${mediaRows.length} new chat images to evaluate`);

  if (mediaRows.length === 0) {
    return { scanned: 0, promoted: 0, reason: "no new chat media" };
  }

  let promoted = 0;
  let skipped = 0;

  for (const msg of mediaRows) {
    try {
      // Record AI classification evidence
      await recordAIEvidence("ai.classifyMedia", "allow", "classifying_chat_media", {
        chatMessageId: msg.id,
        room: msg.room,
      });

      // Use AI to classify the image
      const { invokeLLM } = await import("../_core/llm");
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a content curator for The Academy, a youth athletic training facility. Evaluate whether a chat image should be promoted to the public photo gallery.

APPROVE images that show:
- Athletes training, drilling, or competing
- Group shots during sessions
- Coach-led demonstrations
- Facility shots during active sessions
- Achievement moments (PRs, celebrations)

REJECT images that are:
- Off-topic (food, memes, personal photos)
- Low quality or blurry
- Inappropriate for a public gallery
- Screenshots or text-heavy
- Duplicate of content already in gallery

Based on the context below, decide if this image should be promoted.
Output ONLY valid JSON: {"approve": true/false, "title": "short title if approved", "category": "training|highlights|events|facility"}`,
          },
          {
            role: "user",
            content: `Image shared by ${msg.userName} in the "${msg.room}" chat room. Image URL: ${msg.imageUrl}`,
          },
        ],
      });

      const raw = typeof result.choices?.[0]?.message?.content === "string"
        ? result.choices[0].message.content : "";
      const jsonStr = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      const decision = JSON.parse(jsonStr);

      if (decision.approve) {
        // Record publish evidence
        await recordAIEvidence("ai.publishContent", "allow", "auto_gallery_publish", {
          chatMessageId: msg.id,
          title: decision.title,
          category: decision.category,
        });

        // Insert into gallery
        const { galleryPhotos } = await import("../../drizzle/schema");
        await db.insert(galleryPhotos).values({
          title: String(decision.title || "Training Highlight").slice(0, 255),
          description: `Auto-captured from ${msg.room} chat`,
          imageUrl: msg.imageUrl,
          imageKey: msg.imageKey || null,
          mediaType: "image",
          category: decision.category === "highlights" ? "highlights"
            : decision.category === "events" ? "events"
            : decision.category === "facility" ? "facility"
            : "training",
          uploadedBy: 1, // System user
          isVisible: true,
        });
        promoted++;
      } else {
        skipped++;
      }
    } catch (err) {
      logger.error(`[ai-gallery-capture] Failed to process message ${msg.id}:`, err);
      skipped++;
    }
  }

  const result = { scanned: mediaRows.length, promoted, skipped };
  logger.info("[cron/ai-gallery-capture] Complete", result);
  return result;
}
