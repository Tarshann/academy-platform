import { Resend } from 'resend';
import { logger } from "./_core/logger";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    logger.warn('[Email] RESEND_API_KEY not configured. Email notifications disabled.');
    return null;
  }
  
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  
  return resend;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send an email using Resend
 * Returns true on success, false on failure
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const client = getResend();
  
  if (!client) {
    logger.warn('[Email] Skipping email send - service not configured');
    return false;
  }

  try {
    const from = options.from || 'The Academy <notifications@academytn.com>';
    
    await client.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    
    logger.info(`[Email] Sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}

/**
 * Send session registration confirmation email
 */
export async function sendSessionRegistrationEmail(params: {
  to: string;
  userName: string;
  sessionTitle: string;
  sessionDate: Date;
  sessionLocation: string;
}): Promise<boolean> {
  const { to, userName, sessionTitle, sessionDate, sessionLocation } = params;
  
  const formattedDate = sessionDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .details-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { font-weight: 600; color: #6b7280; }
        .value { color: #111827; }
        .button { display: inline-block; background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">✓ Registration Confirmed</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>You're all set! Your registration for <strong>${sessionTitle}</strong> has been confirmed.</p>
          
          <div class="details">
            <h3 style="margin-top: 0;">Session Details</h3>
            <div class="details-row">
              <span class="label">Session:</span>
              <span class="value">${sessionTitle}</span>
            </div>
            <div class="details-row">
              <span class="label">Date & Time:</span>
              <span class="value">${formattedDate}</span>
            </div>
            <div class="details-row">
              <span class="label">Location:</span>
              <span class="value">${sessionLocation}</span>
            </div>
          </div>

          <p><strong>What to bring:</strong></p>
          <ul>
            <li>Athletic wear and training shoes</li>
            <li>Water bottle</li>
            <li>Positive attitude and readiness to work</li>
          </ul>

          <p>If you need to cancel or reschedule, please contact us as soon as possible.</p>

          <p>See you at the session!</p>
          <p><strong>The Academy Team</strong></p>
        </div>
        <div class="footer">
          <p>The Academy | Developing Elite Youth Athletes</p>
          <p>Questions? Reply to this email or contact us at info@academytn.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Registration Confirmed: ${sessionTitle}`,
    html,
  });
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(params: {
  to: string;
  userName: string;
  productName: string;
  amount: number;
  currency: string;
  receiptUrl?: string;
}): Promise<boolean> {
  const { to, userName, productName, amount, currency, receiptUrl } = params;
  
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .payment-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .amount { font-size: 36px; font-weight: bold; color: #22c55e; margin: 10px 0; }
        .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .details-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .details-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #6b7280; }
        .value { color: #111827; }
        .button { display: inline-block; background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">✓ Payment Successful</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Thank you for your payment! Your transaction has been processed successfully.</p>
          
          <div class="payment-box">
            <p style="margin: 0; color: #6b7280;">Amount Paid</p>
            <div class="amount">${formattedAmount}</div>
          </div>

          <div class="details">
            <h3 style="margin-top: 0;">Payment Details</h3>
            <div class="details-row">
              <span class="label">Product:</span>
              <span class="value">${productName}</span>
            </div>
            <div class="details-row">
              <span class="label">Amount:</span>
              <span class="value">${formattedAmount}</span>
            </div>
            <div class="details-row">
              <span class="label">Date:</span>
              <span class="value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          ${receiptUrl ? `
            <div style="text-align: center;">
              <a href="${receiptUrl}" class="button">View Receipt</a>
            </div>
          ` : ''}

          <p>Your access has been activated and you can now enjoy all the benefits of your purchase.</p>

          <p>If you have any questions about your payment, please don't hesitate to contact us.</p>

          <p><strong>The Academy Team</strong></p>
        </div>
        <div class="footer">
          <p>The Academy | Developing Elite Youth Athletes</p>
          <p>Questions? Reply to this email or contact us at info@academytn.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Payment Confirmation - ${productName}`,
    html,
  });
}


/**
 * Send payment confirmation email to guest customers (no account)
 */
export async function sendGuestPaymentConfirmationEmail(params: {
  to: string;
  productName: string;
  amount: number;
  currency: string;
  receiptUrl?: string;
}): Promise<boolean> {
  const { to, productName, amount, currency, receiptUrl } = params;
  
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .container { padding: 20px; }
        .header { background: linear-gradient(135deg, #CFB53B 0%, #B8A235 100%); color: #000; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        .payment-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .amount { font-size: 36px; font-weight: bold; color: #CFB53B; margin: 10px 0; }
        .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .details-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .details-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #6b7280; }
        .value { color: #111827; }
        .button { display: inline-block; background: #CFB53B; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; padding: 20px; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">THE ACADEMY</div>
          <h1>✓ Payment Confirmed</h1>
        </div>
        <div class="content">
          <p>Thank you for your purchase!</p>
          <p>Your payment has been processed successfully and your registration is confirmed.</p>
          
          <div class="payment-box">
            <p style="margin: 0; color: #6b7280;">Amount Paid</p>
            <div class="amount">${formattedAmount}</div>
          </div>

          <div class="details">
            <h3 style="margin-top: 0;">Purchase Details</h3>
            <div class="details-row">
              <span class="label">Program:</span>
              <span class="value">${productName}</span>
            </div>
            <div class="details-row">
              <span class="label">Amount:</span>
              <span class="value">${formattedAmount}</span>
            </div>
            <div class="details-row">
              <span class="label">Date:</span>
              <span class="value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          ${receiptUrl ? `
            <div style="text-align: center;">
              <a href="${receiptUrl}" class="button">View Receipt</a>
            </div>
          ` : ''}

          <h3>What's Next?</h3>
          <ul>
            <li><strong>Group Sessions:</strong> Check our schedule page for upcoming session times</li>
            <li><strong>Private Training:</strong> Text your coach to coordinate location and schedule</li>
            <li><strong>Questions?</strong> Contact us at (571) 292-0833 or reply to this email</li>
          </ul>

          <p style="margin-top: 30px;">We look forward to training with you!</p>
          <p><strong>— The Academy Team</strong></p>
        </div>
        <div class="footer">
          <p><strong>The Academy</strong> | Gallatin, TN</p>
          <p>Building Complete Athletes. Not Just Better Players.</p>
          <p>Coach O: (571) 292-0633 · omarphilmore@yahoo.com</p>
          <p>Coach Mac: (315) 542-6222 · Tarshann@gmail.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Payment Confirmed - ${productName} | The Academy`,
    html,
  });
}
