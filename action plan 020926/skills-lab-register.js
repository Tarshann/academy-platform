/**
 * Skills Lab Registration API Route
 * 
 * Lightweight: sends a notification email to Coach Mac.
 * No database write needed for Phase 1 — this is a $10 community session,
 * not a CRM pipeline.
 * 
 * Express: app.post('/api/skills-lab-register', skillsLabRegisterHandler);
 */

export async function skillsLabRegisterHandler(req, res) {
  try {
    const {
      parentName, parentPhone, parentEmail,
      athleteName, athleteAge, sessions, submittedAt,
    } = req.body;

    if (!parentName || !parentPhone || !athleteName || !athleteAge) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Notify Coach Mac
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'The Academy <noreply@academytn.com>',
        to: ['theacademytn@gmail.com'],
        subject: `Skills Lab Registration: ${athleteName} (age ${athleteAge})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px;">
            <div style="background: #1B2A4A; padding: 16px 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: #4AA460; margin: 0; font-size: 18px;">Skills Lab Registration</h2>
            </div>
            <div style="background: #fff; padding: 20px; border: 1px solid #E8E8E8; border-top: none; border-radius: 0 0 8px 8px;">
              <p><strong>Athlete:</strong> ${athleteName} (age ${athleteAge})</p>
              <p><strong>Parent:</strong> ${parentName}</p>
              <p><strong>Phone:</strong> <a href="tel:${parentPhone}">${parentPhone}</a></p>
              <p><strong>Email:</strong> ${parentEmail || 'Not provided'}</p>
              <p><strong>Session(s):</strong> ${sessions}</p>
              <p style="font-size: 12px; color: #999; margin-top: 16px;">Registered ${new Date(submittedAt || Date.now()).toLocaleString('en-US', { timeZone: 'America/Chicago' })}</p>
            </div>
          </div>
        `,
        reply_to: parentEmail || undefined,
      }),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Skills Lab register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default skillsLabRegisterHandler;
