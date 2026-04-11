/**
 * OTP utilities — CDC §10.5
 * "Double validation : toute transaction > 500 000 FCFA déclenche confirmation 2FA obligatoire"
 *
 * Uses the existing VerificationToken table (identifier: "escrow-otp:{escrowId}:{userId}")
 * OTP lifetime: 10 minutes
 */

import { prisma } from "@/lib/prisma";
import { randomInt } from "crypto";

const OTP_LIFETIME_MS = 10 * 60 * 1000; // 10 minutes
const ESCROW_2FA_THRESHOLD = 500_000; // FCFA

export const REQUIRES_2FA = (amount: number) => amount >= ESCROW_2FA_THRESHOLD;

function otpKey(escrowId: string, userId: string) {
  return `escrow-otp:${escrowId}:${userId}`;
}

/** Generate and store a 6-digit OTP for escrow release */
export async function generateEscrowOTP(
  escrowId: string,
  userId: string
): Promise<string> {
  const otp = String(randomInt(100000, 999999));
  const identifier = otpKey(escrowId, userId);

  // Replace any existing OTP for this escrow+user
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: otp,
      expires: new Date(Date.now() + OTP_LIFETIME_MS),
    },
  });

  return otp;
}

/** Verify an OTP — returns true if valid, deletes it after use */
export async function verifyEscrowOTP(
  escrowId: string,
  userId: string,
  otp: string
): Promise<{ valid: boolean; reason?: string }> {
  const identifier = otpKey(escrowId, userId);
  const token = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier, token: otp } },
  });

  if (!token) return { valid: false, reason: "Code OTP invalide." };
  if (token.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier, token: otp } },
    });
    return { valid: false, reason: "Code OTP expiré. Demandez-en un nouveau." };
  }

  // Consume the token
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier, token: otp } },
  });

  return { valid: true };
}
