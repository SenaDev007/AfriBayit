/**
 * AfriBayit — OTP Verification Module
 * Handles generation, sending, and verification of 6-digit OTP codes
 * with 5-minute expiry for phone/email verification
 */

import { db } from '@/lib/db';
import crypto from 'crypto';

const OTP_EXPIRY_MINUTES = 5;
const OTP_LENGTH = 6;
const MAX_OTP_ATTEMPTS = 3;

/**
 * Generate a random 6-digit OTP code
 */
export function generateOTP(): string {
  const digits = '0123456789';
  let code = '';
  const randomBytes = crypto.randomBytes(OTP_LENGTH);
  for (let i = 0; i < OTP_LENGTH; i++) {
    code += digits[randomBytes[i] % digits.length];
  }
  return code;
}

/**
 * Determine if identifier is email or phone
 */
function getIdentifierType(identifier: string): 'email' | 'phone' {
  return identifier.includes('@') ? 'email' : 'phone';
}

/**
 * Send OTP to phone number via Africa's Talking SMS API.
 * SECURITY FIX (P2.7 — juillet 2026) : Intégration réelle Africa's Talking
 * (was: console.log OTP en clair — security issue).
 * Falls back to console.warn (masked) if AFRICASTALKING_API_KEY is missing.
 */
async function sendOTPToPhone(phone: string, code: string): Promise<void> {
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME || 'sandbox';
  const senderId = process.env.AFRICASTALKING_SENDER_ID || 'AFRIBAYIT';

  if (!apiKey) {
    // P2.7 — masked log (was: full OTP in cleartext)
    console.warn(`[OTP] AFRICASTALKING_API_KEY not configured — SMS to ${maskPhone(phone)} NOT sent.`);
    return;
  }

  try {
    const message = `Votre code de vérification AfriBayit est ${code}. Valide ${OTP_EXPIRY_MINUTES} minutes.`;

    // Africa's Talking SMS API (https://builders.africastalking.com/docs/sms)
    const url = username === 'sandbox'
      ? 'https://api.sandbox.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging';

    const body = new URLSearchParams({
      username,
      to: phone,
      message,
      from: senderId,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': apiKey,
        'Accept': 'application/json',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[OTP] Africa's Talking API error ${response.status}: ${errorText}`);
      return;
    }

    const data = await response.json();
    if (data.SMSMessageData?.Recipients?.length > 0) {
      const recipient = data.SMSMessageData.Recipients[0];
      if (recipient.status === 'Success') {
        console.log(`[OTP] SMS sent to ${maskPhone(phone)} via Africa's Talking (cost: ${recipient.cost || 'N/A'})`);
      } else {
        console.error(`[OTP] SMS delivery failed for ${maskPhone(phone)}: ${recipient.status}`);
      }
    }
  } catch (error) {
    console.error(`[OTP] Failed to send SMS to ${maskPhone(phone)}:`, error);
    // Don't throw — the OTP is stored in the DB, user can retry
  }
}

/**
 * Mask a phone number for logging (e.g. "+229 97 12 34 XX")
 */
function maskPhone(phone: string): string {
  if (phone.length <= 4) return '****';
  return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
}

/**
 * Send OTP to email address via Resend
 * Uses noreply@academiahelm.com as sender for testing/production
 */
async function sendOTPToEmail(email: string, code: string): Promise<void> {
  console.log(`[OTP] Sending verification code to ${email}`);

  if (!process.env.RESEND_API_KEY) {
    console.warn('[OTP] RESEND_API_KEY not configured — OTP email will NOT be sent. Code for dev:', code);
    return;
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'AfriBayit <noreply@academiahelm.com>',
      to: email,
      subject: 'Code de vérification AfriBayit',
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-family: 'Cormorant Garamond', Georgia, serif; color: #003366; font-size: 28px; margin: 0;">Afri<span style="color: #FFCC00;">Bayit</span></h1>
            <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Où l'Afrique trouve sa maison</p>
          </div>
          <div style="background: #f0f4f8; border-radius: 16px; padding: 24px; text-align: center;">
            <p style="color: #2C2E2F; font-size: 14px; margin-bottom: 16px;">Votre code de vérification est :</p>
            <div style="font-family: 'DM Mono', monospace; font-size: 32px; font-weight: 700; color: #003366; letter-spacing: 8px; padding: 12px 0;">
              ${code}
            </div>
            <p style="color: #6b7280; font-size: 12px; margin-top: 16px;">Ce code est valable pendant ${OTP_EXPIRY_MINUTES} minutes.</p>
          </div>
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 24px;">
            Si vous n'avez pas demandé ce code, ignorez cet email. Votre compte est en sécurité.
          </p>
        </div>
      `,
    });

    console.log(`[OTP] Verification email sent to ${email} via Resend`);
  } catch (error) {
    console.error('[OTP] Failed to send email via Resend:', error);
    // Don't throw — the OTP is stored in the DB, user can still use dev console
  }
}

/**
 * Send OTP to identifier (phone or email)
 * Generates a 6-digit code, stores in DB with 5min expiry, and sends via appropriate channel
 */
export async function sendOTP(identifier: string): Promise<{ success: boolean; message: string }> {
  const type = getIdentifierType(identifier);
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate any existing unverified OTPs for this identifier
  await db.otpVerification.updateMany({
    where: {
      identifier,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    data: { verified: true }, // Mark as consumed to prevent reuse
  });

  // Store new OTP
  await db.otpVerification.create({
    data: {
      identifier,
      code,
      type,
      expiresAt,
    },
  });

  // Send via appropriate channel
  if (type === 'phone') {
    await sendOTPToPhone(identifier, code);
  } else {
    await sendOTPToEmail(identifier, code);
  }

  return {
    success: true,
    message: `Code de vérification envoyé à ${identifier}`,
  };
}

/**
 * Verify OTP code against stored record
 * Checks expiry and marks as verified on success
 */
export async function verifyOTP(identifier: string, code: string): Promise<{ success: boolean; message: string }> {
  // Find the most recent unverified OTP for this identifier
  const otpRecord = await db.otpVerification.findFirst({
    where: {
      identifier,
      code,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    return {
      success: false,
      message: 'Code invalide ou expiré',
    };
  }

  // Mark as verified
  await db.otpVerification.update({
    where: { id: otpRecord.id },
    data: { verified: true },
  });

  return {
    success: true,
    message: 'Vérification réussie',
  };
}

/**
 * Check if an identifier has been recently verified
 */
export async function isOTPVerified(identifier: string, withinMinutes = 30): Promise<boolean> {
  const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
  const verifiedRecord = await db.otpVerification.findFirst({
    where: {
      identifier,
      verified: true,
      createdAt: { gt: cutoff },
    },
  });
  return !!verifiedRecord;
}

export { MAX_OTP_ATTEMPTS, OTP_EXPIRY_MINUTES };
