import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/leads
 *
 * Accepts lead data from the Get Started quiz (and future forms).
 * Forwards to the platform API when deployed; for now stores
 * locally and sends a notification email via Resend.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, source, athleteAge, sport, goal, recommendedProgram } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    // Forward to platform API if configured
    const platformApiUrl = process.env.PLATFORM_API_URL;
    if (platformApiUrl) {
      try {
        await fetch(`${platformApiUrl}/api/trpc/leads.submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            json: { name, email, phone, source, athleteAge, sport, goal, recommendedProgram },
          }),
        });
      } catch {
        // Platform unreachable — fall through to email notification
      }
    }

    // Send notification email via Resend (always, as a reliable fallback)
    const resendKey = process.env.RESEND_API_KEY;
    const notifyEmail = process.env.LEAD_NOTIFY_EMAIL || "omarphilmore@yahoo.com";

    if (resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "The Academy <notifications@academytn.com>",
          to: notifyEmail,
          subject: `New Lead: ${name || "Unknown"} — ${recommendedProgram || source || "Website"}`,
          html: `
            <h2>New Lead from academytn.com</h2>
            <table style="border-collapse:collapse;width:100%;max-width:500px;">
              <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${name || "—"}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${phone ? `<a href="tel:${phone}">${phone}</a>` : "—"}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Athlete Age</td><td style="padding:8px;border-bottom:1px solid #eee;">${athleteAge || "—"}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Sport</td><td style="padding:8px;border-bottom:1px solid #eee;">${sport || "—"}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Goal</td><td style="padding:8px;border-bottom:1px solid #eee;">${goal || "—"}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;">Recommended</td><td style="padding:8px;">${recommendedProgram || "—"}</td></tr>
            </table>
          `,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to process lead" }, { status: 500 });
  }
}
