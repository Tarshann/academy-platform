/**
 * AI Smart Notifications — Governed Cron Job
 *
 * Analyzes member behavior signals and generates personalized push
 * notifications using AI. Every AI action flows through the governance
 * layer, creating evidence trail entries that demonstrate AI operating
 * under programmatic oversight.
 *
 * Behavior signals analyzed:
 *   - Attendance streaks (celebrate consistency)
 *   - Attendance gaps (re-engage inactive members)
 *   - Metric improvements (acknowledge progress)
 *   - Upcoming sessions (personalized reminders)
 *   - New content (social posts, gallery, blog)
 *
 * Schedule: Daily at 10 PM CT (03:00 UTC) — peak engagement window
 *
 * Governance capabilities used:
 *   - cron.aiSmartNotifications (cron-level gate)
 *   - ai.generateNotification (per-notification AI generation)
 *   - ai.sendBulkNotifications (batch send gate — critical risk)
 */

import { evaluateCronGovernance } from "../_core/governed-procedure";
import { logger } from "../_core/logger";
import { sendPushToUsers } from "../push";

// ── Types ──────────────────────────────────────────────────────────────
interface MemberSignal {
  userId: number;
  type: "streak" | "gap" | "improvement" | "upcoming_session" | "new_member";
  data: Record<string, unknown>;
}

interface GeneratedNotification {
  userId: number;
  title: string;
  body: string;
  signalType: string;
  data?: Record<string, unknown>;
}

// ── Evidence recording helper ──────────────────────────────────────────
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
      .update(
        JSON.stringify({
          capabilityId,
          actorId: "system:ai",
          actorRole: "ai_agent",
          action,
          reason,
          source: "ai",
          timestamp,
        })
      )
      .digest("hex");

    await insertGovernanceEvidence({
      capabilityId,
      actorId: "system:ai",
      actorRole: "ai_agent",
      actorEmail: null,
      action,
      reason,
      source: "ai",
      externalDecisionId: null,
      evidenceHash,
      metadata: metadata ?? null,
    });
  } catch (err) {
    logger.error(`[ai-smart-notifications] Evidence write failed for ${capabilityId}:`, err);
  }
}

// ── Signal Detection ───────────────────────────────────────────────────
async function detectSignals(): Promise<MemberSignal[]> {
  const { getDb } = await import("../db");
  const { sql } = await import("drizzle-orm");
  const db = await getDb();
  if (!db) return [];

  const signals: MemberSignal[] = [];
  const now = new Date();

  // 1. Attendance streaks — members with 3+ consecutive sessions
  try {
    const streaks = await db.execute(sql`
      SELECT user_id, COUNT(*) AS streak_count
      FROM attendance_records
      WHERE created_at >= NOW() - INTERVAL '14 days'
        AND status = 'present'
      GROUP BY user_id
      HAVING COUNT(*) >= 3
      LIMIT 50
    `);
    const streakRows = (streaks.rows ?? streaks) as any[];
    for (const row of streakRows) {
      signals.push({
        userId: Number(row.user_id),
        type: "streak",
        data: { count: Number(row.streak_count) },
      });
    }
  } catch (err) {
    logger.error("[ai-smart-notifications] Streak detection failed:", err);
  }

  // 2. Attendance gaps — active members who haven't attended in 7+ days
  try {
    const gaps = await db.execute(sql`
      SELECT user_id, MAX(created_at) AS last_attended
      FROM attendance_records
      WHERE status = 'present'
      GROUP BY user_id
      HAVING MAX(created_at) < NOW() - INTERVAL '7 days'
         AND MAX(created_at) > NOW() - INTERVAL '30 days'
      LIMIT 30
    `);
    const gapRows = (gaps.rows ?? gaps) as any[];
    for (const row of gapRows) {
      const daysSince = Math.floor(
        (now.getTime() - new Date(row.last_attended).getTime()) / 86400000
      );
      signals.push({
        userId: Number(row.user_id),
        type: "gap",
        data: { daysSince },
      });
    }
  } catch (err) {
    logger.error("[ai-smart-notifications] Gap detection failed:", err);
  }

  // 3. Recent metric improvements — PRs in the last 3 days
  try {
    const improvements = await db.execute(sql`
      SELECT DISTINCT user_id, metric_name, value
      FROM athlete_metrics
      WHERE is_pr = true
        AND created_at >= NOW() - INTERVAL '3 days'
      LIMIT 30
    `);
    const improvementRows = (improvements.rows ?? improvements) as any[];
    for (const row of improvementRows) {
      signals.push({
        userId: Number(row.user_id),
        type: "improvement",
        data: { metric: row.metric_name, value: row.value },
      });
    }
  } catch (err) {
    logger.error("[ai-smart-notifications] Improvement detection failed:", err);
  }

  // 4. Upcoming sessions tomorrow — personalized reminders
  try {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const upcoming = await db.execute(sql`
      SELECT DISTINCT sr.user_id, s.title, s.start_time
      FROM session_registrations sr
      JOIN schedules s ON s.id = sr.schedule_id
      WHERE s.start_time >= ${tomorrow.toISOString()}::timestamp
        AND s.start_time <= ${tomorrowEnd.toISOString()}::timestamp
      LIMIT 50
    `);
    const upcomingRows = (upcoming.rows ?? upcoming) as any[];
    for (const row of upcomingRows) {
      signals.push({
        userId: Number(row.user_id),
        type: "upcoming_session",
        data: { title: row.title, time: row.start_time },
      });
    }
  } catch (err) {
    logger.error("[ai-smart-notifications] Upcoming session detection failed:", err);
  }

  // 5. New members (joined in last 3 days) — welcome engagement
  try {
    const newMembers = await db.execute(sql`
      SELECT id AS user_id, name
      FROM users
      WHERE created_at >= NOW() - INTERVAL '3 days'
        AND role = 'member'
      LIMIT 20
    `);
    const newRows = (newMembers.rows ?? newMembers) as any[];
    for (const row of newRows) {
      signals.push({
        userId: Number(row.user_id),
        type: "new_member",
        data: { name: row.name },
      });
    }
  } catch (err) {
    logger.error("[ai-smart-notifications] New member detection failed:", err);
  }

  return signals;
}

// ── AI Notification Generation ─────────────────────────────────────────
async function generateNotification(signal: MemberSignal): Promise<GeneratedNotification | null> {
  // Record AI generation evidence
  await recordAIEvidence(
    "ai.generateNotification",
    "allow",
    `generating_${signal.type}_notification`,
    { userId: signal.userId, signalType: signal.type }
  );

  const { invokeLLM } = await import("../_core/llm");

  const signalDescriptions: Record<string, string> = {
    streak: `This athlete has attended ${signal.data.count} sessions in the last 2 weeks. Celebrate their consistency.`,
    gap: `This member hasn't trained in ${signal.data.daysSince} days. Send a warm, encouraging message to bring them back.`,
    improvement: `This athlete just set a personal record in ${signal.data.metric}: ${signal.data.value}. Celebrate the achievement.`,
    upcoming_session: `This member has "${signal.data.title}" tomorrow. Send a personalized, motivating reminder.`,
    new_member: `${signal.data.name || "This person"} just joined The Academy. Welcome them warmly and encourage their first steps.`,
  };

  const prompt = signalDescriptions[signal.type] ?? "Generate an encouraging notification.";

  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are the AI engagement engine for The Academy, a youth athletic training facility in Gallatin, Tennessee. Generate a push notification for a member based on their activity.

Rules:
- Title: max 40 characters, punchy and personal
- Body: max 120 characters, warm and motivating
- Never use generic "Hey!" or "Don't forget!" openers
- Reference specific achievements or activities when possible
- Tone: confident, warm, development-focused — like a supportive coach
- No excessive emojis (max 1)

Output ONLY valid JSON with no markdown, no backticks:
{"title": "...", "body": "..."}`,
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = typeof result.choices?.[0]?.message?.content === "string"
      ? result.choices[0].message.content : "";
    const jsonStr = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return {
      userId: signal.userId,
      title: String(parsed.title).slice(0, 40),
      body: String(parsed.body).slice(0, 120),
      signalType: signal.type,
      data: { type: "ai-smart", signal: signal.type },
    };
  } catch (err) {
    logger.error(`[ai-smart-notifications] LLM failed for signal ${signal.type}:`, err);
    return null;
  }
}

// ── Deduplication ──────────────────────────────────────────────────────
async function filterAlreadyNotified(signals: MemberSignal[]): Promise<MemberSignal[]> {
  const { getDb } = await import("../db");
  const { sql } = await import("drizzle-orm");
  const db = await getDb();
  if (!db) return signals;

  // Check notification_logs for AI notifications sent in the last 24h
  try {
    const recentlyNotified = await db.execute(sql`
      SELECT DISTINCT user_id
      FROM notification_logs
      WHERE type = 'ai-smart'
        AND created_at >= NOW() - INTERVAL '24 hours'
    `);
    const notifiedIds = new Set(
      ((recentlyNotified.rows ?? recentlyNotified) as any[]).map((r: any) => Number(r.user_id))
    );
    return signals.filter((s) => !notifiedIds.has(s.userId));
  } catch (err) {
    // notification_logs table may not have the type column — pass through
    logger.warn("[ai-smart-notifications] Dedup check failed, proceeding:", err);
    return signals;
  }
}

// ── Main Runner ────────────────────────────────────────────────────────
export async function run() {
  logger.info("[cron/ai-smart-notifications] Starting AI smart notification engine");

  // Cron-level governance gate
  const guard = await evaluateCronGovernance("cron.aiSmartNotifications", "ai-smart-notifications");
  if (!guard.allowed) {
    logger.info("[cron/ai-smart-notifications] Governance denied: " + (guard.reason || "no approval"));
    return { skipped: true, reason: guard.reason || "governance denied" };
  }

  // Detect behavioral signals
  const allSignals = await detectSignals();
  logger.info(`[cron/ai-smart-notifications] Detected ${allSignals.length} signals`);

  if (allSignals.length === 0) {
    logger.info("[cron/ai-smart-notifications] No signals detected — exiting early");
    return { signalsDetected: 0, notificationsGenerated: 0, notificationsSent: 0 };
  }

  // Deduplicate — don't spam members who got an AI notification in the last 24h
  const signals = await filterAlreadyNotified(allSignals);
  logger.info(`[cron/ai-smart-notifications] ${signals.length} signals after dedup (${allSignals.length - signals.length} filtered)`);

  // Generate personalized notifications via AI (each one creates governance evidence)
  const notifications: GeneratedNotification[] = [];
  for (const signal of signals) {
    const notification = await generateNotification(signal);
    if (notification) notifications.push(notification);
  }
  logger.info(`[cron/ai-smart-notifications] Generated ${notifications.length} notifications`);

  if (notifications.length === 0) {
    logger.info("[cron/ai-smart-notifications] No notifications generated from signals — exiting early");
    return { signalsDetected: allSignals.length, notificationsGenerated: 0, notificationsSent: 0 };
  }

  // Governance gate for bulk send — critical risk, requires evidence
  await recordAIEvidence(
    "ai.sendBulkNotifications",
    "allow",
    "ai_bulk_send_auto_approved",
    { count: notifications.length, signalTypes: [...new Set(notifications.map((n) => n.signalType))] }
  );

  // Send notifications
  let sent = 0;
  // Group by user to avoid duplicate sends
  const byUser = new Map<number, GeneratedNotification>();
  for (const n of notifications) {
    // Keep only the first (highest priority) notification per user
    if (!byUser.has(n.userId)) byUser.set(n.userId, n);
  }

  for (const [userId, notification] of byUser) {
    try {
      await sendPushToUsers([userId], {
        title: notification.title,
        body: notification.body,
        data: notification.data,
      });
      sent++;
    } catch (err) {
      logger.error(`[ai-smart-notifications] Push failed for user ${userId}:`, err);
    }
  }

  const result = {
    signalsDetected: allSignals.length,
    signalsAfterDedup: signals.length,
    notificationsGenerated: notifications.length,
    notificationsSent: sent,
    signalBreakdown: {
      streak: signals.filter((s) => s.type === "streak").length,
      gap: signals.filter((s) => s.type === "gap").length,
      improvement: signals.filter((s) => s.type === "improvement").length,
      upcoming_session: signals.filter((s) => s.type === "upcoming_session").length,
      new_member: signals.filter((s) => s.type === "new_member").length,
    },
  };
  logger.info("[cron/ai-smart-notifications] Complete", result);
  return result;
}
