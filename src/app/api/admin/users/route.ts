import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['admin'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const country = searchParams.get('country');
    const status = searchParams.get('status'); // 'verified', 'banned', etc.
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    const where: Record<string, unknown> = {};

    if (role) where.role = role;
    if (country) where.country = country;
    if (status === 'verified') where.verified = true;
    if (status === 'unverified') where.verified = false;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          role: true,
          country: true,
          city: true,
          kycLevel: true,
          score: true,
          reputation: true,
          verified: true,
          premiumTier: true,
          walletBalance: true,
          escrowHeld: true,
          afriPoints: true,
          isOnline: true,
          lastSeenAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              properties: true,
              transactions: true,
              reviews: true,
            },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin users list API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['admin'] });
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { email, name, phone, password, role, country, city } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email et nom sont requis' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data: {
        email,
        name,
        phone: phone || null,
        password: password || null,
        role: role || 'buyer',
        country: country || null,
        city: city || null,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Admin create user API error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
