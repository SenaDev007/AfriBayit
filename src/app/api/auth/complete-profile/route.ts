import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// Placeholder email pattern used when Facebook OAuth doesn't return an email
const PLACEHOLDER_EMAIL_SUFFIX = '@placeholder.afribayit.com';

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
    const { country, city, phone, name, email } = body;

    // Check if the current user has a placeholder email (from Facebook OAuth without email scope)
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const hasPlaceholderEmail = currentUser?.email?.endsWith(PLACEHOLDER_EMAIL_SUFFIX);

    // Validate required fields — email is required if user has a placeholder
    if (hasPlaceholderEmail && !email) {
      return NextResponse.json(
        { error: "L'adresse email est requise" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Format d'email invalide" },
          { status: 400 }
        );
      }

      // Check email uniqueness (excluding the current user)
      const existingEmailUser = await db.user.findUnique({
        where: { email },
      });
      if (existingEmailUser && existingEmailUser.id !== userId) {
        return NextResponse.json(
          { error: 'Cette adresse email est déjà utilisée' },
          { status: 409 }
        );
      }
    }

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
    // Update email if provided and user currently has a placeholder
    if (email && hasPlaceholderEmail) {
      updateData.email = email;
    }

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
