/**
 * Performance Lab Application API Route
 * 
 * Receives form submissions and emails Coach Mac via Resend.
 * 
 * Setup:
 *   1. Add RESEND_API_KEY to your environment variables (Vercel dashboard)
 *   2. Add this route to your Express/tRPC backend
 *   3. Ensure Resend is configured with your sending domain
 * 
 * If using Express directly:
 *   app.post('/api/performance-lab-apply', performanceLabApplyHandler);
 * 
 * If using tRPC, wrap in a mutation:
 *   admApply: publicProcedure.input(admApplySchema).mutation(async ({ input }) => { ... })
 */

// ── Express Route Handler ──
export async function performanceLabApplyHandler(req, res) {
  try {
    const {
      parentName, parentPhone, parentEmail,
      athleteName, athleteAge, currentSports,
      trainingGoals, preferredDays, injuries,
      hearAbout, submittedAt,
    } = req.body;

    // Validate required fields
    if (!parentName || !parentPhone || !parentEmail || !athleteName || !athleteAge) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Send notification email to Coach Mac via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1B2A4A; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #E8722A; margin: 0; font-size: 24px;">New Performance Lab Application</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0;">Submitted ${new Date(submittedAt || Date.now()).toLocaleString('en-US', { timeZone: 'America/Chicago' })}</p>
        </div>
        
        <div style="background: #fff; padding: 24px; border: 1px solid #E8E8E8; border-top: none;">
          <h2 style="color: #1B2A4A; font-size: 16px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #E8722A; padding-bottom: 8px;">Parent Info</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #999; width: 120px;">Name</td><td style="padding: 6px 0; font-weight: 600;">${parentName}</td></tr>
            <tr><td style="padding: 6px 0; color: #999;">Phone</td><td style="padding: 6px 0;"><a href="tel:${parentPhone}" style="color: #E8722A; font-weight: 600;">${parentPhone}</a></td></tr>
            <tr><td style="padding: 6px 0; color: #999;">Email</td><td style="padding: 6px 0;"><a href="mailto:${parentEmail}" style="color: #E8722A;">${parentEmail}</a></td></tr>
          </table>

          <h2 style="color: #1B2A4A; font-size: 16px; margin: 24px 0 12px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #E8722A; padding-bottom: 8px;">Athlete Info</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #999; width: 120px;">Name</td><td style="padding: 6px 0; font-weight: 600;">${athleteName}</td></tr>
            <tr><td style="padding: 6px 0; color: #999;">Age/Grade</td><td style="padding: 6px 0;">${athleteAge}</td></tr>
            <tr><td style="padding: 6px 0; color: #999;">Sports</td><td style="padding: 6px 0;">${currentSports || 'Not specified'}</td></tr>
            <tr><td style="padding: 6px 0; color: #999;">Goals</td><td style="padding: 6px 0;">${trainingGoals || 'Not specified'}</td></tr>
            <tr><td style="padding: 6px 0; color: #999;">Preferred Days</td><td style="padding: 6px 0;">${preferredDays || 'Flexible'}</td></tr>
            <tr><td style="padding: 6px 0; color: #999;">Injuries</td><td style="padding: 6px 0;">${injuries || 'None'}</td></tr>
          </table>

          <h2 style="color: #1B2A4A; font-size: 16px; margin: 24px 0 12px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #E8722A; padding-bottom: 8px;">Attribution</h2>
          <p style="margin: 0;">How they heard about us: <strong>${hearAbout || 'Not specified'}</strong></p>
        </div>

        <div style="background: #FFF3E8; padding: 16px 24px; border-radius: 0 0 8px 8px; border: 1px solid #E8E8E8; border-top: none;">
          <p style="margin: 0; font-size: 14px; color: #666;">
            <strong style="color: #E8722A;">Action required:</strong> Call/text ${parentName} at 
            <a href="tel:${parentPhone}" style="color: #E8722A; font-weight: 600;">${parentPhone}</a> 
            within 24 hours to confirm fit and placement.
          </p>
        </div>
      </div>
    `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'The Academy <noreply@academytn.com>', // Update with your verified Resend domain
        to: ['theacademytn@gmail.com'],
        subject: `New Performance Lab Application: ${athleteName} (${athleteAge})`,
        html: emailHtml,
        reply_to: parentEmail,
      }),
    });

    if (!emailResponse.ok) {
      const err = await emailResponse.text();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Failed to send notification' });
    }

    // Also send confirmation to the parent
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'The Academy <noreply@academytn.com>',
        to: [parentEmail],
        subject: `We received your Performance Lab application for ${athleteName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1B2A4A; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: #fff; margin: 0; font-size: 22px;">THE ACADEMY</h1>
              <p style="color: #E8722A; margin: 4px 0 0; font-size: 14px; letter-spacing: 2px;">ACADEMY PERFORMANCE LAB</p>
            </div>
            <div style="background: #fff; padding: 24px; border: 1px solid #E8E8E8; border-top: none;">
              <p style="font-size: 16px; color: #333;">Hi ${parentName},</p>
              <p style="color: #666; line-height: 1.7;">Thanks for applying to The Academy's ADM for <strong>${athleteName}</strong>. We're excited about the possibility of working together.</p>
              <p style="color: #666; line-height: 1.7;"><strong style="color: #1B2A4A;">What happens next:</strong> Coach Mac will reach out within <strong>24 hours</strong> for a quick 5–10 minute call to answer your questions, confirm fit, and get ${athleteName} placed in the right group.</p>
              <p style="color: #666; line-height: 1.7;">If you need to reach us sooner, text Coach Mac directly at <a href="tel:5712920833" style="color: #E8722A; font-weight: 600;">(571) 292-0833</a>.</p>
              <p style="color: #666; margin-top: 24px;">— Coach Mac & Coach O<br/>The Academy | Gallatin, TN</p>
            </div>
          </div>
        `,
      }),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('ADM apply error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * If using tRPC, here's the Zod schema:
 * 
 * import { z } from 'zod';
 * 
 * export const admApplySchema = z.object({
 *   parentName: z.string().min(1),
 *   parentPhone: z.string().min(1),
 *   parentEmail: z.string().email(),
 *   athleteName: z.string().min(1),
 *   athleteAge: z.string().min(1),
 *   currentSports: z.string(),
 *   trainingGoals: z.string().optional(),
 *   preferredDays: z.string().optional(),
 *   injuries: z.string().optional(),
 *   hearAbout: z.string().optional(),
 *   submittedAt: z.string(),
 * });
 */

export default performanceLabApplyHandler;
