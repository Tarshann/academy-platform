import { sendEmail } from "./email";
import { logger } from "./_core/logger";

/**
 * Nurture email sequence for leads captured from the marketing site.
 *
 * Each step has a delay (days after capture) and email content.
 * A cron job calls processNurtureQueue() daily to advance leads
 * through the sequence.
 */

interface NurtureStep {
  step: number;
  delayDays: number;
  subject: string;
  html: (lead: { name?: string | null; recommendedProgram?: string | null; athleteAge?: string | null; sport?: string | null }) => string;
}

const NURTURE_SEQUENCE: NurtureStep[] = [
  {
    step: 1,
    delayDays: 0, // Sent immediately on capture
    subject: "Welcome to The Academy — Here's Your Personalized Recommendation",
    html: (lead) => `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;">
        <div style="background:#1a1a1a;padding:30px;text-align:center;border-radius:8px 8px 0 0;">
          <h1 style="color:#CFB53B;margin:0;font-size:28px;">THE ACADEMY</h1>
          <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;">Building Complete Athletes</p>
        </div>
        <div style="padding:30px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
          <p>Hi ${lead.name || "there"},</p>
          <p>Thanks for taking the quiz on our website. Based on what you told us${lead.recommendedProgram ? `, we think <strong>${lead.recommendedProgram}</strong> is the best fit` : ""}.</p>
          <p>Here's what makes The Academy different:</p>
          <ul>
            <li><strong>Multi-sport development</strong> — We don't just train one skill. We build complete athletes through SAQ, strength, and sport-specific work.</li>
            <li><strong>Small groups</strong> — Capped at 6–8 athletes per session so every kid gets coaching attention.</li>
            <li><strong>Real progress tracking</strong> — Baseline testing and 90-day cycles so you can actually see improvement.</li>
          </ul>
          <p>The easiest way to see if we're the right fit? <strong>Drop in to a Skills Lab session for $10.</strong> No commitment, no pressure. Your athlete trains, you watch, and you decide.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="https://academytn.com/programs/skills-lab" style="display:inline-block;background:#CFB53B;color:#1a1a1a;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;">Learn About Skills Lab</a>
          </div>
          <p>Or just reply to this email with any questions — Coach Mac and Coach O are happy to help.</p>
          <p style="margin-top:24px;">— The Academy Team<br><span style="color:#999;">Gallatin, TN</span></p>
        </div>
      </body>
      </html>
    `,
  },
  {
    step: 2,
    delayDays: 3,
    subject: "What a Typical Week Looks Like at The Academy",
    html: (lead) => `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;">
        <div style="background:#1a1a1a;padding:30px;text-align:center;border-radius:8px 8px 0 0;">
          <h1 style="color:#CFB53B;margin:0;font-size:28px;">THE ACADEMY</h1>
        </div>
        <div style="padding:30px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
          <p>Hi ${lead.name || "there"},</p>
          <p>Parents always ask: "What exactly does my kid do at a session?" Here's the breakdown:</p>
          <div style="background:#f9fafb;padding:20px;border-radius:8px;margin:16px 0;">
            <p style="margin:0 0 8px;font-weight:bold;">A typical 60-minute session:</p>
            <ul style="margin:0;">
              <li>10 min — Dynamic warm-up and movement prep</li>
              <li>15 min — Speed, agility, and footwork drills</li>
              <li>15 min — Sport-specific skill development</li>
              <li>15 min — Competitive games that reinforce skills</li>
              <li>5 min — Cool-down and coach feedback</li>
            </ul>
          </div>
          <p>Every session is structured and age-appropriate. No standing in lines. No wasted time. Your athlete is moving and learning the entire hour.</p>
          <p><strong>Skills Lab</strong> runs Tuesday and Thursday, 6:00–6:50 PM. <strong>Performance Lab</strong> adds a third session and deeper programming for committed athletes.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="https://academytn.com/programs" style="display:inline-block;background:#CFB53B;color:#1a1a1a;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;">See All Programs</a>
          </div>
          <p>Questions? Call or text us at <a href="tel:+15712920633">(571) 292-0633</a>.</p>
          <p>— The Academy Team</p>
        </div>
      </body>
      </html>
    `,
  },
  {
    step: 3,
    delayDays: 7,
    subject: "Summer Camps Are Filling Up — Spots Are Limited",
    html: (lead) => `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;">
        <div style="background:#1a1a1a;padding:30px;text-align:center;border-radius:8px 8px 0 0;">
          <h1 style="color:#CFB53B;margin:0;font-size:28px;">THE ACADEMY</h1>
          <p style="color:#CFB53B;margin:8px 0 0;font-size:14px;letter-spacing:2px;">SUMMER CAMPS 2026</p>
        </div>
        <div style="padding:30px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
          <p>Hi ${lead.name || "there"},</p>
          <p>Quick heads up — our summer camps at Sumner Academy are open for registration and spots fill fast.</p>
          <div style="background:#f9fafb;padding:20px;border-radius:8px;margin:16px 0;">
            <p style="margin:0 0 12px;font-weight:bold;">Academy Basketball Camp</p>
            <p style="margin:0;">Week 2 (June 1–5) &amp; Week 6 (June 29–July 3)<br>AM: Grades 10–12 | PM: Grades 2–9<br><strong>$185/week</strong></p>
          </div>
          <div style="background:#f9fafb;padding:20px;border-radius:8px;margin:16px 0;">
            <p style="margin:0 0 12px;font-weight:bold;">Speed &amp; Agility Camp</p>
            <p style="margin:0;">Week 3 (June 8–12)<br>PM: Grades 2–9<br><strong>$185/week</strong></p>
          </div>
          <p>Same coaches, same structured approach as our year-round programs — just packed into a week of intensive development.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="https://academytn.com/events" style="display:inline-block;background:#CFB53B;color:#1a1a1a;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;">View Camp Details &amp; Register</a>
          </div>
          <p>Registration closes May 15. Don't wait on this one.</p>
          <p>— The Academy Team</p>
        </div>
      </body>
      </html>
    `,
  },
  {
    step: 4,
    delayDays: 14,
    subject: "Still thinking about it? Here's what parents say",
    html: (lead) => `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;">
        <div style="background:#1a1a1a;padding:30px;text-align:center;border-radius:8px 8px 0 0;">
          <h1 style="color:#CFB53B;margin:0;font-size:28px;">THE ACADEMY</h1>
        </div>
        <div style="padding:30px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
          <p>Hi ${lead.name || "there"},</p>
          <p>We get it — choosing the right program for your kid is a big decision. Here's what other Academy parents have told us:</p>
          <blockquote style="border-left:4px solid #CFB53B;padding:12px 16px;margin:16px 0;background:#f9fafb;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-style:italic;">"My son tried three other training programs before The Academy. This is the first one where he actually wants to go back every week. The coaches push him but he's having fun doing it."</p>
          </blockquote>
          <blockquote style="border-left:4px solid #CFB53B;padding:12px 16px;margin:16px 0;background:#f9fafb;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-style:italic;">"I love that they work on more than just basketball. My daughter's speed and agility have improved across every sport she plays."</p>
          </blockquote>
          <p>The best way to see it for yourself: <strong>bring your athlete to a $10 Skills Lab drop-in.</strong> If they don't love it, you're out ten bucks. If they do, you've found their training home.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="https://academytn.com/get-started" style="display:inline-block;background:#CFB53B;color:#1a1a1a;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;">Get Started</a>
          </div>
          <p>Or text Coach Mac at <a href="tel:+15712920633">(571) 292-0633</a> to ask anything.</p>
          <p>— The Academy Team</p>
        </div>
      </body>
      </html>
    `,
  },
];

/**
 * Process the nurture queue: find leads ready for their next email and send it.
 * Call this from a cron job (e.g., daily at 9 AM).
 */
export async function processNurtureQueue(): Promise<{ sent: number; errors: number }> {
  const { getDb } = await import("./db");
  const { leads, nurtureEmailLog } = await import("../drizzle/schema");
  const { eq, and, lte, inArray } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) {
    logger.warn("[Nurture] Database not available, skipping");
    return { sent: 0, errors: 0 };
  }

  // Get all active leads (new or nurturing) that haven't finished the sequence
  const activeLeads = await db
    .select()
    .from(leads)
    .where(
      inArray(leads.status, ["new", "nurturing"])
    );

  let sent = 0;
  let errors = 0;

  for (const lead of activeLeads) {
    const nextStep = lead.nurtureStep + 1;
    const stepDef = NURTURE_SEQUENCE.find((s) => s.step === nextStep);

    if (!stepDef) {
      // Lead has completed the sequence
      continue;
    }

    // Check if enough days have passed since capture
    const daysSinceCapture = Math.floor(
      (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceCapture < stepDef.delayDays) {
      continue; // Not ready yet
    }

    // Check if we already sent this step (idempotency)
    const alreadySent = await db
      .select()
      .from(nurtureEmailLog)
      .where(
        and(
          eq(nurtureEmailLog.leadId, lead.id),
          eq(nurtureEmailLog.step, nextStep)
        )
      )
      .limit(1);

    if (alreadySent.length > 0) {
      // Already sent, just update the lead step counter
      await db
        .update(leads)
        .set({ nurtureStep: nextStep, status: "nurturing", updatedAt: new Date() })
        .where(eq(leads.id, lead.id));
      continue;
    }

    // Send the email
    const html = stepDef.html({
      name: lead.name,
      recommendedProgram: lead.recommendedProgram,
      athleteAge: lead.athleteAge,
      sport: lead.sport,
    });

    const success = await sendEmail({
      to: lead.email,
      subject: stepDef.subject,
      html,
    });

    if (success) {
      // Log the send
      await db.insert(nurtureEmailLog).values({
        leadId: lead.id,
        step: nextStep,
        subject: stepDef.subject,
      });

      // Advance the lead
      await db
        .update(leads)
        .set({
          nurtureStep: nextStep,
          status: "nurturing",
          lastNurtureAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(leads.id, lead.id));

      sent++;
      logger.info(`[Nurture] Sent step ${nextStep} to ${lead.email}`);
    } else {
      errors++;
      logger.warn(`[Nurture] Failed to send step ${nextStep} to ${lead.email}`);
    }
  }

  logger.info(`[Nurture] Queue processed: ${sent} sent, ${errors} errors`);
  return { sent, errors };
}

/**
 * Send the welcome email immediately when a new lead is captured.
 * Call this right after inserting the lead.
 */
export async function sendWelcomeEmail(leadEmail: string): Promise<void> {
  const { getDb } = await import("./db");
  const { leads, nurtureEmailLog } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) return;

  const [lead] = await db.select().from(leads).where(eq(leads.email, leadEmail)).limit(1);
  if (!lead || lead.nurtureStep > 0) return;

  const step1 = NURTURE_SEQUENCE[0];
  const html = step1.html({
    name: lead.name,
    recommendedProgram: lead.recommendedProgram,
    athleteAge: lead.athleteAge,
    sport: lead.sport,
  });

  const success = await sendEmail({
    to: lead.email,
    subject: step1.subject,
    html,
  });

  if (success) {
    await db.insert(nurtureEmailLog).values({
      leadId: lead.id,
      step: 1,
      subject: step1.subject,
    });
    await db
      .update(leads)
      .set({ nurtureStep: 1, status: "nurturing", lastNurtureAt: new Date(), updatedAt: new Date() })
      .where(eq(leads.id, lead.id));
  }
}

export { NURTURE_SEQUENCE };
