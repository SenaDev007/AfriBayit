import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    if (!userId) {
      return NextResponse.json(
        { error: 'Session invalide' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { country, city, phone, name } = body;

    // Validate required fields
    if (!country) {
      return NextResponse.json(
        { error: 'Le pays est requis' },
        { status: 400 }
      );
    }

    // Validate country is one of the supported values
    const validCountries = ['BJ', 'CI', 'BF', 'TG', 'SN'];
    if (!validCountries.includes(country)) {
      return NextResponse.json(
        { error: 'Pays non supporté. Pays acceptés : BJ, CI, BF, TG, SN' },
        { status: 400 }
      );
    }

    // Build update data — only update provided fields
    const updateData: Record<string, unknown> = { country };
    if (city) updateData.city = city;
    if (phone) updateData.phone = phone;
    if (name) updateData.name = name;

    // Update user in database
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        country: true,
        city: true,
        kycLevel: true,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: 'Profil complété avec succès',
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}
