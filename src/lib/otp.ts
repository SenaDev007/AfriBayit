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
 * Send OTP to phone number via SMS
 * In production, integrate with Africa's Talking or Twilio
 */
async function sendOTPToPhone(phone: string, code: string): Promise<void> {
  // In production, integrate with Africa's Talking SMS API
  console.log(`[OTP] SMS to ${phone}: Your AfriBayit verification code is ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`);
  
  // TODO: Replace with actual SMS provider integration
  // Example with Africa's Talking:
  // const credentials = new AfricasTalking.Credentials({
  //   apiKey: process.env.AFRICASTALKING_API_KEY,
  //   username: process.env.AFRICASTALKING_USERNAME,
  // });
  // const sms = AfricasTalking.SMS(credentials);
  // await sms.send({
  //   to: phone,
  //   message: `Votre code de vérification AfriBayit est ${code}. Valide ${OTP_EXPIRY_MINUTES} minutes.`,
  // });
}

/**
 * Send OTP to email address
 * In production, integrate with Resend or SendGrid
 */
async function sendOTPToEmail(email: string, code: string): Promise<void> {
  // In production, integrate with Resend email API
  console.log(`[OTP] Email to ${email}: Your AfriBayit verification code is ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`);
  
  // TODO: Replace with actual email provider integration
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'AfriBayit <noreply@afribayit.com>',
  //   to: email,
  //   subject: 'Code de vérification AfriBayit',
  //   html: `<p>Votre code de vérification est <strong>${code}</strong>. Valide ${OTP_EXPIRY_MINUTES} minutes.</p>`,
  // });
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
