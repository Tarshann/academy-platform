import type { Request, Response } from "express";
import { sendEmail } from "./email";
import { logger } from "./_core/logger";

interface SkillsLabRegistration {
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  athleteName: string;
  athleteAge: string;
  selectedSessions: string;
  submittedAt: string;
}

export async function handleSkillsLabRegister(req: Request, res: Response) {
  try {
    const body = req.body as SkillsLabRegistration;

    if (
      !body.parentName ||
      !body.parentPhone ||
      !body.parentEmail ||
      !body.athleteName ||
      !body.athleteAge ||
      !body.selectedSessions
    ) {
      return res.status(400).json({ error: "All required fields must be filled out." });
    }

    // Send confirmation email to parent
    await sendEmail({
      to: body.parentEmail,
      subject: "Skills Lab Registration Confirmed — The Academy",
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
            .accent { color: #2563EB; }
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
              <p style="margin: 0 0 4px; font-size: 13px; letter-spacing: 2px; color: #2563EB; text-transform: uppercase;">Skills Lab</p>
              <h1>Registration Confirmed</h1>
            </div>
            <div class="content">
              <p>Hi ${body.parentName},</p>
              <p><strong>${body.athleteName}</strong> is registered for Skills Lab. Just show up at the Academy Performance Center at your selected session time.</p>

              <div class="details">
                <div class="details-row"><span class="label">Athlete:</span> ${body.athleteName} (age ${body.athleteAge})</div>
                <div class="details-row"><span class="label">Sessions:</span> ${body.selectedSessions}</div>
                <div class="details-row"><span class="label">Cost:</span> $10 per session (pay at the door)</div>
              </div>

              <p><strong>What to bring:</strong></p>
              <ul>
                <li>Athletic wear and training shoes</li>
                <li>Water bottle</li>
                <li>$10 cash or card per session</li>
              </ul>

              <p>See you there!</p>
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

    // Send notification to coach/admin
    await sendEmail({
      to: ["omarphilmore@yahoo.com", "Tarshann@gmail.com"],
      subject: `New Skills Lab Registration: ${body.athleteName}`,
      html: `
        <h2>New Skills Lab Registration</h2>
        <p><strong>Parent:</strong> ${body.parentName}</p>
        <p><strong>Phone:</strong> ${body.parentPhone}</p>
        <p><strong>Email:</strong> ${body.parentEmail}</p>
        <p><strong>Athlete:</strong> ${body.athleteName} (age ${body.athleteAge})</p>
        <p><strong>Sessions:</strong> ${body.selectedSessions}</p>
        <p><strong>Submitted:</strong> ${body.submittedAt}</p>
      `,
    });

    logger.info(`[Skills Lab] Registration: ${body.athleteName} — ${body.selectedSessions}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error("[Skills Lab] Registration error:", error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
