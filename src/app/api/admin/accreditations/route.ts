import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    const where: Record<string, unknown> = {};
    if (country && country !== 'ALL') {
      where.country = country;
    }

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
      orderBy: { grantedAt: 'desc' },
    });

    return NextResponse.json({ data: accreditations });
  } catch (error) {
    console.error('Fetch accreditations error:', error);
    return NextResponse.json({ error: 'Failed to fetch accreditations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, country, role, grantedBy, expiresAt } = body;

    if (!userId || !country || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, country, role' },
        { status: 400 }
      );
    }

    const validRoles = ['SUPER_ADMIN', 'COUNTRY_ADMIN'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    const validCountries = ['BJ', 'CI', 'BF', 'TG', 'ALL'];
    if (!validCountries.includes(country)) {
      return NextResponse.json(
        { error: `Invalid country. Must be one of: ${validCountries.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if user exists - userId might be email
    let user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await db.user.findUnique({ where: { email: userId } });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if accreditation already exists
    const existing = await db.countryAccreditation.findUnique({
      where: { userId_country: { userId: user.id, country } },
    });

    if (existing) {
      // Update existing accreditation
      const updated = await db.countryAccreditation.update({
        where: { id: existing.id },
        data: {
          role,
          active: true,
          grantedBy: grantedBy || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          grantedAt: new Date(),
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, role: true },
          },
        },
      });
      return NextResponse.json({ data: updated });
    }

    // Create new accreditation
    const accreditation = await db.countryAccreditation.create({
      data: {
        userId: user.id,
        country,
        role,
        grantedBy: grantedBy || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
      },
    });

    return NextResponse.json({ data: accreditation }, { status: 201 });
  } catch (error) {
    console.error('Create accreditation error:', error);
    return NextResponse.json({ error: 'Failed to create accreditation' }, { status: 500 });
  }
}
