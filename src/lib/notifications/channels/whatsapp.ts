// AfriBayit — WhatsApp Business API Channel
// Sends messages via WhatsApp Cloud API

import type { NotificationDeliveryResult, NotificationChannel } from '../types';

interface WhatsAppMessageOptions {
  to: string;
  templateName: string;
  templateLanguage?: string;
  parameters?: string[];
  textBody?: string; // for simple text messages
}

interface WhatsAppTemplateButton {
  type: 'reply';
  reply: {
    id: string;
    title: string;
  };
}

export async function sendWhatsApp(options: WhatsAppMessageOptions): Promise<NotificationDeliveryResult> {
  const channel: NotificationChannel = 'whatsapp';

  if (!process.env.WHATSAPP_API_KEY || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('[Notifications] WhatsApp API not configured, skipping');
    return { channel, success: false, error: 'WhatsApp API not configured', sentAt: new Date() };
  }

  try {
    const phone = options.to.replace(/\s/g, '').replace(/^0/, '');
    const apiUrl = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    let body: Record<string, unknown>;

    if (options.templateName) {
      // Template-based message
      body = {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: options.templateName,
          language: { code: options.templateLanguage || 'fr' },
          components: options.parameters?.length
            ? [{
                type: 'body',
                parameters: options.parameters.map(p => ({ type: 'text', text: p })),
              }]
            : undefined,
        },
      };
    } else if (options.textBody) {
      // Simple text message
      body = {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: options.textBody },
      };
    } else {
      return { channel, success: false, error: 'No template or text body provided', sentAt: new Date() };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data.error?.message || `HTTP ${response.status}`;
      console.error('[Notifications] WhatsApp send error:', error);
      return { channel, success: false, error, sentAt: new Date() };
    }

    const messageId = data.messages?.[0]?.id;
    return { channel, success: true, messageId, sentAt: new Date() };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown WhatsApp error';
    console.error('[Notifications] WhatsApp exception:', message);
    return { channel, success: false, error: message, sentAt: new Date() };
  }
}

export function buildInteractiveMessage(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>
): Record<string, unknown> {
  return {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.map(b => ({
          type: 'reply',
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  };
}
