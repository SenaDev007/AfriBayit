import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateSecret, storeTempSecret, enable2FA } from '@/lib/twofa';
import { z } from 'zod';

/**
 * GET /api/auth/2fa/setup
 * Generate a new TOTP secret and QR code URL for the authenticated user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    const { secret, qrCodeUrl, manualEntryKey } = await generateSecret(userId);

    // Store the secret temporarily (not enabled until verified)
    await storeTempSecret(userId, secret);

    return NextResponse.json({
      qrCodeUrl,
      manualEntryKey,
      message: 'Scannez le QR code avec votre application d\'authentification',
    });
  } catch (error) {
    console.error('2FA setup GET error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la configuration du 2FA' },
      { status: 500 }
    );
  }
}

const enable2FASchema = z.object({
  token: z.string().length(6, 'Le code TOTP doit contenir 6 chiffres'),
});

/**
 * POST /api/auth/2fa/setup
 * Verify TOTP token and enable 2FA for the authenticated user
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    const body = await request.json();
    const validation = enable2FASchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    const result = await enable2FA(userId, token);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      enabled: true,
      message: result.message,
    });
  } catch (error) {
    console.error('2FA setup POST error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'activation du 2FA' },
      { status: 500 }
    );
  }
}
