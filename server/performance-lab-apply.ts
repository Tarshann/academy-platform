import type { Request, Response } from "express";
import { sendEmail } from "./email";
import { logger } from "./_core/logger";

interface PerformanceLabApplication {
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  athleteName: string;
  athleteAge: string;
  currentSports: string;
  trainingGoals: string;
  preferredDays: string;
  injuries: string;
  hearAbout: string;
  submittedAt: string;
}

export async function handlePerformanceLabApply(req: Request, res: Response) {
  try {
    const body = req.body as PerformanceLabApplication;

    if (
      !body.parentName ||
      !body.parentPhone ||
      !body.parentEmail ||
      !body.athleteName ||
      !body.athleteAge
    ) {
      return res.status(400).json({ error: "All required fields must be filled out." });
    }

    // Send confirmation email to parent
    await sendEmail({
      to: body.parentEmail,
      subject: "Performance Lab Application Received — The Academy",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%); color: #fff; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .accent { color: #E8722A; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .details-row { margin: 10px 0; }
            .label { font-weight: 600; color: #6b7280; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <p style="margin: 0 0 4px; font-size: 13px; letter-spacing: 2px; color: #E8722A; text-transform: uppercase;">Performance Lab</p>
              <h1>Application Received</h1>
            </div>
            <div class="content">
              <p>Hi ${body.parentName},</p>
              <p>Thank you for applying to the Academy Performance Lab for <strong>${body.athleteName}</strong>.</p>
              <p>Coach Mac will review your application and reach out within 48 hours to discuss next steps and schedule your athlete's first session.</p>

              <div class="details">
                <div class="details-row"><span class="label">Athlete:</span> ${body.athleteName} (age ${body.athleteAge})</div>
                ${body.currentSports ? `<div class="details-row"><span class="label">Sports:</span> ${body.currentSports}</div>` : ""}
                ${body.preferredDays ? `<div class="details-row"><span class="label">Preferred Days:</span> ${body.preferredDays}</div>` : ""}
              </div>

              <p><strong>What happens next:</strong></p>
              <ul>
                <li>Coach Mac reviews your application</li>
                <li>You will be contacted within 48 hours</li>
                <li>We will schedule your athlete's first session</li>
              </ul>

              <p>No payment is required until your application is accepted and a start date is confirmed.</p>

              <p>We look forward to working with ${body.athleteName}!</p>
              <p><strong>— The Academy Team</strong></p>
            </div>
            <div class="footer">
              <p><strong>The Academy</strong> | Gallatin, TN</p>
              <p>Questions? Reply to this email or contact us at (571) 292-0833</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Send notification to coach/admin with full application details
    const hearAboutLabels: Record<string, string> = {
      social_media: "Social Media",
      word_of_mouth: "Word of Mouth",
      google: "Google Search",
      skills_lab: "Skills Lab Session",
      community_event: "Community Event",
      other: "Other",
    };

    await sendEmail({
      to: "omarphilmore@yahoo.com",
      subject: `New Performance Lab Application: ${body.athleteName}`,
      html: `
        <h2>New Performance Lab Application</h2>
        <hr>
        <h3>Parent / Guardian</h3>
        <p><strong>Name:</strong> ${body.parentName}</p>
        <p><strong>Phone:</strong> ${body.parentPhone}</p>
        <p><strong>Email:</strong> ${body.parentEmail}</p>
        <hr>
        <h3>Athlete</h3>
        <p><strong>Name:</strong> ${body.athleteName}</p>
        <p><strong>Age:</strong> ${body.athleteAge}</p>
        <p><strong>Current Sports:</strong> ${body.currentSports || "—"}</p>
        <p><strong>Training Goals:</strong> ${body.trainingGoals || "—"}</p>
        <p><strong>Preferred Days:</strong> ${body.preferredDays || "—"}</p>
        <p><strong>Injuries / Limitations:</strong> ${body.injuries || "None noted"}</p>
        <p><strong>How They Heard About Us:</strong> ${hearAboutLabels[body.hearAbout] || body.hearAbout || "—"}</p>
        <hr>
        <p><strong>Submitted:</strong> ${body.submittedAt}</p>
      `,
    });

    logger.info(`[Performance Lab] Application: ${body.athleteName} (age ${body.athleteAge})`);
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error("[Performance Lab] Application error:", error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
