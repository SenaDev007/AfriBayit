import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/security/password';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, phone, country, city, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, mot de passe et nom sont requis' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      );
    }

    // Hash password with Argon2id
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        phone: phone || null,
        country: country || null,
        city: city || null,
        role: role || 'buyer',
        kycLevel: 0,
        verified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        country: true,
        kycLevel: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user, message: 'Compte créé avec succès' }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte' },
      { status: 500 }
    );
  }
}
