// POST /api/users/me/password — Change password (CDC §4.1)
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import argon2 from 'argon2';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();
    const userId = (session.user as { id?: string }).id || '';

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

    if (user.password) {
      const valid = await argon2.verify(user.password, currentPassword);
      if (!valid) return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 });
    }

    const hashed = await argon2.hash(newPassword);
    await db.user.update({ where: { id: userId }, data: { password: hashed } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[users/me/password] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
