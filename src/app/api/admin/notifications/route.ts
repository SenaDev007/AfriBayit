import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    // 🔒 P1.3 — Admin authGuard (defense in depth)
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const country = searchParams.get('country') || '';
    const type = searchParams.get('type') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (country) where.country = country;
    if (type) where.type = type;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.notification.count({ where }),
    ]);

    const [unread, byTypeRaw] = await Promise.all([
      db.notification.count({ where: { read: false } }),
      db.notification.groupBy({ by: ['type'], _count: { type: true } }),
    ]);

    const byType: Record<string, number> = {};
    for (const row of byTypeRaw) {
      byType[row.type] = row._count.type;
    }

    return NextResponse.json({
      notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: { total, unread, byType },
    });
  } catch (error) {
    console.error('Admin notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 🔒 P1.3 — Admin authGuard (defense in depth)
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { userId, type, title, message, country } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields: userId, type, title, message' }, { status: 400 });
    }

    const notification = await db.notification.create({
      data: {
        userId,
        type,
        category: type,
        title,
        message,
        country: country || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Admin notifications create error:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
