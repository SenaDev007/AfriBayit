import type { Resend } from 'resend';
import type { NotificationDeliveryResult, NotificationChannel } from '../types';

const FROM_EMAIL = 'AfriBayit <notifications@afribayit.com>';
let resendInstance: Resend | null = null;
let resendLoadPromise: Promise<Resend | null> | null = null;

async function getResend(): Promise<Resend | null> {
  if (resendInstance) return resendInstance;
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendLoadPromise) {
    resendLoadPromise = (async () => {
      try {
        const { Resend: ResendClass } = await import('resend');
        resendInstance = new ResendClass(process.env.RESEND_API_KEY);
        return resendInstance;
      } catch (error) {
        console.error('[Notifications] Failed to load Resend SDK:', error);
        return null;
      } finally { resendLoadPromise = null; }
    })();
  }
  return resendLoadPromise;
}

function getBaseHtmlTemplate(title: string, body: string, actionUrl?: string, actionLabel?: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title></head><body><div style="max-width:600px;margin:0 auto;padding:20px"><h1>${title}</h1><div>${body}</div>${actionUrl ? `<a href="${actionUrl}">${actionLabel || 'Action'}</a>` : ''}</div></body></html>`;
}

export async function sendEmail(to: string | string[], title: string, body: string, options?: { actionUrl?: string; actionLabel?: string; htmlBody?: string }): Promise<NotificationDeliveryResult> {
  const channel: NotificationChannel = 'email';
  const resend = await getResend();
  if (!resend) { console.warn('[Notifications] RESEND_API_KEY not configured'); return { channel, success: false, error: 'RESEND_API_KEY not configured', sentAt: new Date() }; }
  try {
    const html = options?.htmlBody || getBaseHtmlTemplate(title, body, options?.actionUrl, options?.actionLabel);
    const { data, error } = await resend.emails.send({ from: FROM_EMAIL, to, subject: title, html, text: body.replace(/<[^>]*>/g, '') });
    if (error) return { channel, success: false, error: error.message, sentAt: new Date() };
    return { channel, success: true, messageId: data?.id, sentAt: new Date() };
  } catch (error) {
    return { channel, success: false, error: error instanceof Error ? error.message : 'Unknown', sentAt: new Date() };
  }
}
