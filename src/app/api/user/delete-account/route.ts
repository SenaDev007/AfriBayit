// AfriBayit — Delete Account API
// POST /api/user/delete-account — Delete user account with confirmation

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, verifyPassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Mot de passe requis pour supprimer le compte'),
  confirmation: z.literal('SUPPRIMER', {
    errorMap: () => ({ message: 'Tapez SUPPRIMER pour confirmer' }),
  }),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    const body = await request.json();
    const validation = deleteAccountSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { password } = validation.data;

    // Verify password
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { password: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'Aucun mot de passe configuré. Contactez le support.' },
        { status: 400 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 400 }
      );
    }

    // Delete user (cascade will handle related records)
    await db.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: 'Compte supprimé avec succès',
    });
  } catch (error) {
    console.error('[delete-account] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du compte' },
      { status: 500 }
    );
  }
}
