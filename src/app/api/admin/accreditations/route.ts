import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

// GET /api/admin/accreditations?country=BJ
export async function GET(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['admin'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const userId = searchParams.get('userId');
    const activeOnly = searchParams.get('active') === 'true';

    const where: Record<string, unknown> = {};
    if (country) where.country = country;
    if (userId) where.userId = userId;
    if (activeOnly) where.active = true;

    const accreditations = await db.countryAccreditation.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: accreditations });
  } catch (error) {
    console.error('Accreditations GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch accreditations' }, { status: 500 });
  }
}

// POST /api/admin/accreditations — Grant accreditation
export async function POST(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['admin'] });
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { userId, country, role, expiresAt } = body;

    if (!userId || !country) {
      return NextResponse.json(
        { error: 'userId et country sont requis' },
        { status: 400 }
      );
    }

    const validCountries = ['BJ', 'CI', 'BF', 'TG'];
    if (!validCountries.includes(country)) {
      return NextResponse.json(
        { error: 'Code pays invalide. Utilisez BJ, CI, BF ou TG' },
        { status: 400 }
      );
    }

    const validRoles = ['admin', 'editor', 'viewer'];
    const accreditationRole = validRoles.includes(role) ? role : 'admin';

    // Check if user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      // Try to find by email
      const userByEmail = await db.user.findUnique({ where: { email: userId } });
      if (!userByEmail) {
        return NextResponse.json(
          { error: 'Utilisateur introuvable' },
          { status: 404 }
        );
      }
      // Use the found user's ID
      const accreditation = await db.countryAccreditation.upsert({
        where: { userId_country: { userId: userByEmail.id, country } },
        update: {
          role: accreditationRole,
          grantedBy: auth.userId,
          active: true,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
        create: {
          userId: userByEmail.id,
          country,
          role: accreditationRole,
          grantedBy: auth.userId,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          active: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
      });

      return NextResponse.json({ data: accreditation, message: 'Accréditation accordée avec succès' });
    }

    const accreditation = await db.countryAccreditation.upsert({
      where: { userId_country: { userId, country } },
      update: {
        role: accreditationRole,
        grantedBy: auth.userId,
        active: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      create: {
        userId,
        country,
        role: accreditationRole,
        grantedBy: auth.userId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ data: accreditation, message: 'Accréditation accordée avec succès' });
  } catch (error) {
    console.error('Accreditations POST error:', error);
    return NextResponse.json(
      { error: 'Impossible de gérer l\'accréditation' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/accreditations — Update accreditation
export async function PATCH(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['admin'] });
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { id, active, role, expiresAt } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'L\'identifiant de l\'accréditation est requis' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (typeof active === 'boolean') updateData.active = active;
    if (role) {
      const validRoles = ['admin', 'editor', 'viewer'];
      if (validRoles.includes(role)) updateData.role = role;
    }
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    const accreditation = await db.countryAccreditation.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ data: accreditation, message: 'Accréditation mise à jour' });
  } catch (error) {
    console.error('Accreditations PATCH error:', error);
    return NextResponse.json(
      { error: 'Impossible de mettre à jour l\'accréditation' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/accreditations — Revoke accreditation
export async function DELETE(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['admin'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'L\'identifiant de l\'accréditation est requis' },
        { status: 400 }
      );
    }

    // Soft-delete: set active to false instead of deleting
    const accreditation = await db.countryAccreditation.update({
      where: { id },
      data: { active: false },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ data: accreditation, message: 'Accréditation révoquée avec succès' });
  } catch (error) {
    console.error('Accreditations DELETE error:', error);
    return NextResponse.json(
      { error: 'Impossible de révoquer l\'accréditation' },
      { status: 500 }
    );
  }
}
