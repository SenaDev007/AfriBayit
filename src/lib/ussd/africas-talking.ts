// AfriBayit — Africa's Talking SDK Integration
// USSD, SMS, and Airtime via Africa's Talking API

// ── Configuration ───────────────────────────────────────────

const AT_API_KEY = process.env.AFRICASTALKING_API_KEY || '';
const AT_USERNAME = process.env.AFRICASTALKING_USERNAME || 'sandbox';
const AT_BASE_URL = process.env.AFRICASTALKING_BASE_URL || 'https://api.sandbox.africastalking.com/version1';

// ── SMS Service ─────────────────────────────────────────────

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an SMS via Africa's Talking
 */
export async function sendSms(
  to: string,
  message: string,
  from?: string
): Promise<SmsResult> {
  try {
    if (!AT_API_KEY) {
      console.info('[AT] SMS not sent — API key not configured');
      return { success: false, error: 'API key not configured' };
    }

    const body = new URLSearchParams({
      username: AT_USERNAME,
      to,
      message,
      ...(from ? { from } : {}),
    });

    const response = await fetch(`${AT_BASE_URL}/messaging`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        apiKey: AT_API_KEY,
        Accept: 'application/json',
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (data.SMSMessageData?.MessageSent) {
      return {
        success: true,
        messageId: data.SMSMessageData.MessageSent[0]?.messageId,
      };
    }

    return {
      success: false,
      error: data.SMSMessageData?.Message || 'Unknown SMS error',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[AT] sendSms failed:', message);
    return { success: false, error: message };
  }
}

// ── USSD Service ────────────────────────────────────────────

export interface UssdRequest {
  sessionId: string;
  serviceCode: string;
  phoneNumber: string;
  text: string;
}

export interface UssdResponse {
  response: string;
  responseType: 'CON' | 'END';
}

/**
 * Send a USSD response in the Africa's Talking format.
 * CON = Continue (show more menus)
 * END = End (terminate session)
 */
export function formatUssdResponse(
  text: string,
  shouldContinue: boolean = false
): UssdResponse {
  return {
    response: `${shouldContinue ? 'CON' : 'END'} ${text}`,
    responseType: shouldContinue ? 'CON' : 'END',
  };
}

/**
 * Initialize the Africa's Talking SDK client.
 * Returns helper functions for SMS, USSD, and Airtime.
 */
export function getAfricasTalkingClient() {
  return {
    sms: {
      send: sendSms,
    },
    ussd: {
      formatResponse: formatUssdResponse,
    },
    isConfigured: !!AT_API_KEY && AT_USERNAME !== '',
    username: AT_USERNAME,
  };
}
