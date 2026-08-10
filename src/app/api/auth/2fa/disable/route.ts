import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { disable2FA } from '@/lib/twofa';
import { z } from 'zod';

const disable2FASchema = z.object({
  password: z.string().min(1, 'Mot de passe requis pour désactiver le 2FA'),
});

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA after confirming with password
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    const body = await request.json();
    const validation = disable2FASchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { password } = validation.data;

    const result = await disable2FA(userId, password);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      disabled: true,
      message: result.message,
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la désactivation du 2FA' },
      { status: 500 }
    );
  }
}
