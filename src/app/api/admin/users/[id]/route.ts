import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard({ requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      include: {
        properties: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            price: true,
            currency: true,
            country: true,
            createdAt: true,
          },
        },
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            commission: true,
            currency: true,
            status: true,
            country: true,
            createdAt: true,
          },
        },
        kycDocuments: {
          orderBy: { createdAt: 'desc' },
        },
        notifications: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        subscriptions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        professionalProfile: true,
        _count: {
          select: {
            properties: true,
            transactions: true,
            reviews: true,
            posts: true,
            courses: true,
            favorites: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Admin user detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard({ requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();

    // Allowed fields for admin update
    const allowedFields = [
      'name', 'role', 'country', 'city', 'kycLevel', 'score',
      'reputation', 'verified', 'premiumTier', 'premiumExpiry',
      'walletBalance', 'escrowHeld', 'afriPoints', 'isOnline',
      'twoFactorEnabled', 'preferredLanguage', 'currency',
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'Aucun champ valide à mettre à jour' },
        { status: 400 }
      );
    }

    const user = await db.user.update({
      where: { id },
      data,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Admin update user API error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard({ requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const { id } = await params;

    // Soft-delete: mark as banned by changing role
    const user = await db.user.update({
      where: { id },
      data: {
        role: 'banned',
        isOnline: false,
      },
    });

    return NextResponse.json({
      message: 'Utilisateur désactivé (soft-delete)',
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Admin delete user API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
