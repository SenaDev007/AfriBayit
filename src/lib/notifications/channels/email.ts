// AfriBayit — Email Notification Channel
// Sends templated emails via Resend

import type { NotificationDeliveryResult, NotificationChannel } from '../types';

const FROM_EMAIL = 'AfriBayit <notifications@afribayit.com>';

// Lazy-load Resend to avoid build-time errors when API key is not set
let resendInstance: InstanceType<typeof import('resend').Resend> | null = null;

function getResend() {
  if (!resendInstance && process.env.RESEND_API_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Resend } = require('resend');
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

function getBaseHtmlTemplate(title: string, body: string, actionUrl?: string, actionLabel?: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <!-- Header -->
    <tr>
      <td style="background:#003087;padding:24px 32px;text-align:center;">
        <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:700;letter-spacing:0.5px;">AfriBayit</h1>
        <p style="color:#D4AF37;font-size:12px;margin:4px 0 0;font-weight:500;">La Plateforme Immobilière Africaine</p>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:32px;">
        <h2 style="color:#2C2E2F;font-size:20px;margin:0 0 16px;font-weight:600;">${title}</h2>
        <div style="color:#4a4a4a;font-size:15px;line-height:1.6;">${body}</div>
        ${actionUrl ? `
        <div style="margin:24px 0;text-align:center;">
          <a href="${actionUrl}" style="background:#003087;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
            ${actionLabel || 'Voir les détails'}
          </a>
        </div>
        ` : ''}
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:20px 32px;background:#f8f9fa;border-top:1px solid #e5e5e5;">
        <p style="color:#6b7280;font-size:12px;margin:0;text-align:center;">
          © ${new Date().getFullYear()} AfriBayit — Où l'Afrique trouve sa maison.<br>
          Vous recevez cet e-mail car vous avez un compte AfriBayit.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendEmail(
  to: string,
  title: string,
  body: string,
  options?: {
    actionUrl?: string;
    actionLabel?: string;
    htmlBody?: string;
  }
): Promise<NotificationDeliveryResult> {
  const channel: NotificationChannel = 'email';

  const resend = getResend();
  if (!resend) {
    console.warn('[Notifications] RESEND_API_KEY not configured, skipping email');
    return { channel, success: false, error: 'RESEND_API_KEY not configured', sentAt: new Date() };
  }

  try {
    const html = options?.htmlBody || getBaseHtmlTemplate(title, body, options?.actionUrl, options?.actionLabel);
    const text = body.replace(/<[^>]*>/g, '');

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: title,
      html,
      text,
    });

    if (error) {
      console.error('[Notifications] Email send error:', error);
      return { channel, success: false, error: error.message, sentAt: new Date() };
    }

    return { channel, success: true, messageId: data?.id, sentAt: new Date() };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    console.error('[Notifications] Email exception:', message);
    return { channel, success: false, error: message, sentAt: new Date() };
  }
}
