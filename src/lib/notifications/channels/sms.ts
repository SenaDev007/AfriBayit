// AfriBayit — SMS Notification Channel
// Sends SMS via Africa's Talking API

import type { NotificationDeliveryResult, NotificationChannel } from '../types';

// Africa's Talking supported country codes and their calling codes
const COUNTRY_CALLING_CODES: Record<string, string> = {
  BJ: '+229', // Bénin
  CI: '+225', // Côte d'Ivoire
  BF: '+226', // Burkina Faso
  TG: '+228', // Togo
};

interface SmsOptions {
  to: string;
  message: string;
  country?: string;
}

export async function sendSms(options: SmsOptions): Promise<NotificationDeliveryResult> {
  const channel: NotificationChannel = 'sms';

  if (!process.env.AFRICASTALKING_API_KEY) {
    console.warn('[Notifications] AFRICASTALKING_API_KEY not configured, skipping SMS');
    return { channel, success: false, error: 'AFRICASTALKING_API_KEY not configured', sentAt: new Date() };
  }

  try {
    // Format phone number with country code if needed
    let phone = options.to.replace(/\s/g, '');
    if (options.country && COUNTRY_CALLING_CODES[options.country]) {
      if (!phone.startsWith('+')) {
        phone = COUNTRY_CALLING_CODES[options.country] + phone.replace(/^0/, '');
      }
    }

    const username = process.env.AFRICASTALKING_USERNAME || 'sandbox';
    const apiKey = process.env.AFRICASTALKING_API_KEY;

    // Use Africa's Talking REST API directly
    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': apiKey!,
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        username,
        to: phone,
        message: options.message,
        from: 'AFRIBAYIT',
      }),
    });

    const data = await response.json();

    if (!response.ok || data.SMSMessageData?.Recipients?.[0]?.statusCode !== 101) {
      const error = data.SMSMessageData?.Message || `HTTP ${response.status}`;
      console.error('[Notifications] SMS send error:', error);
      return { channel, success: false, error, sentAt: new Date() };
    }

    const messageId = data.SMSMessageData?.Recipients?.[0]?.messageId;
    return { channel, success: true, messageId, sentAt: new Date() };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown SMS error';
    console.error('[Notifications] SMS exception:', message);
    return { channel, success: false, error: message, sentAt: new Date() };
  }
}

export function formatPhoneForCountry(phone: string, country: string): string {
  const callingCode = COUNTRY_CALLING_CODES[country];
  if (!callingCode) return phone;

  let cleaned = phone.replace(/\s/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = callingCode + cleaned.replace(/^0/, '');
  }
  return cleaned;
}
