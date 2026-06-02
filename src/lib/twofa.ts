/**
 * AfriBayit — 2FA/TOTP Enrollment Module
 * Implements Time-based One-Time Password (TOTP) per RFC 6238
 * Uses otpauth library for TOTP generation and verification
 */

import { TOTP, Secret } from 'otpauth';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/security/password';

const TOTP_ISSUER = 'AfriBayit';
const TOTP_PERIOD = 30; // 30-second window
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1; // Allow 1 step drift (before/after)

/**
 * Generate a new TOTP secret for a user
 * Returns the secret and a QR code URL for authenticator apps
 */
export async function generateSecret(userId: string): Promise<{
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}> {
  // Generate a random secret (20 bytes = 32 base32 chars)
  const secret = new Secret({ size: 20 });

  const totp = new TOTP({
    issuer: TOTP_ISSUER,
    label: await getUserLabel(userId),
    algorithm: 'SHA1',
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    secret: secret,
  });

  return {
    secret: secret.base32,
    qrCodeUrl: totp.toString(), // otpauth:// URI for QR code
    manualEntryKey: secret.base32,
  };
}

/**
 * Verify a TOTP token against a secret
 * Uses a window of ±1 to account for clock drift
 */
export function verifyTOTP(secretBase32: string, token: string): boolean {
  try {
    const secret = Secret.fromBase32(secretBase32);

    const totp = new TOTP({
      issuer: TOTP_ISSUER,
      algorithm: 'SHA1',
      digits: TOTP_DIGITS,
      period: TOTP_PERIOD,
      secret: secret,
    });

    const delta = totp.validate({
      token: token,
      window: TOTP_WINDOW,
    });

    return delta !== null;
  } catch {
    return false;
  }
}

/**
 * Enable 2FA for a user after successful TOTP verification
 * Stores the secret in the user record and sets twoFactorEnabled to true
 */
export async function enable2FA(userId: string, token: string): Promise<{
  success: boolean;
  message: string;
}> {
  // Get user's pending TOTP secret
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (!user) {
    return { success: false, message: 'Utilisateur non trouvé' };
  }

  if (user.twoFactorEnabled) {
    return { success: false, message: '2FA déjà activé' };
  }

  if (!user.twoFactorSecret) {
    return { success: false, message: 'Aucun secret TOTP configuré. Veuillez d\'abord configurer le 2FA.' };
  }

  // Verify the TOTP token
  if (!verifyTOTP(user.twoFactorSecret, token)) {
    return { success: false, message: 'Code TOTP invalide' };
  }

  // Enable 2FA
  await db.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  });

  return { success: true, message: '2FA activé avec succès' };
}

/**
 * Disable 2FA for a user after password confirmation
 */
export async function disable2FA(userId: string, password: string): Promise<{
  success: boolean;
  message: string;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { password: true, twoFactorEnabled: true },
  });

  if (!user) {
    return { success: false, message: 'Utilisateur non trouvé' };
  }

  if (!user.twoFactorEnabled) {
    return { success: false, message: '2FA n\'est pas activé' };
  }

  // Verify password
  if (!user.password) {
    return { success: false, message: 'Aucun mot de passe configuré' };
  }

  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    return { success: false, message: 'Mot de passe incorrect' };
  }

  // Disable 2FA and clear secret
  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });

  return { success: true, message: '2FA désactivé avec succès' };
}

/**
 * Verify 2FA during login flow
 * Called after password verification when user has 2FA enabled
 */
export async function verify2FALogin(userId: string, token: string): Promise<{
  success: boolean;
  message: string;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true, twoFactorSecret: true },
  });

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return { success: false, message: '2FA non configuré' };
  }

  if (!verifyTOTP(user.twoFactorSecret, token)) {
    return { success: false, message: 'Code TOTP invalide' };
  }

  return { success: true, message: 'Vérification 2FA réussie' };
}

/**
 * Store a TOTP secret for a user (before enabling, for setup phase)
 */
export async function storeTempSecret(userId: string, secret: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  });
}

/**
 * Get user label for TOTP QR code
 */
async function getUserLabel(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return user?.email || userId;
}
