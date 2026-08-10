// AfriBayit — Unlink OAuth Account API
// POST /api/auth/oauth-unlink — Unlink an OAuth provider from the user's account

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const unlinkSchema = z.object({
  provider: z.enum(['google', 'facebook'], { error: 'Fournisseur invalide' }),
  password: z.string().min(1, 'Mot de passe requis pour dissocier'),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    const body = await request.json();
    const validation = unlinkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { provider } = validation.data;

    // Check user has a password or another auth method
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    const oauthAccounts = await db.oAuthAccount.findMany({
      where: { userId },
      select: { provider: true },
    });

    const linkedProviders = oauthAccounts.map((a) => a.provider);
    const hasPassword = !!user?.password;

    // Must have at least one other auth method
    if (!hasPassword && linkedProviders.length <= 1) {
      return NextResponse.json(
        { error: 'Impossible de dissocier. Vous devez avoir au moins un autre moyen de connexion.' },
        { status: 400 }
      );
    }

    // Delete the OAuth account link
    await db.oAuthAccount.deleteMany({
      where: { userId, provider },
    });

    return NextResponse.json({
      success: true,
      message: `Compte ${provider === 'google' ? 'Google' : 'Facebook'} dissocié avec succès`,
    });
  } catch (error) {
    console.error('[oauth-unlink] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la dissociation du compte' },
      { status: 500 }
    );
  }
}
