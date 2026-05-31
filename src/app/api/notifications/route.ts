import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

// GET /api/notifications — List user notifications with filters
export async function GET(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const read = searchParams.get('read');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = { userId: auth.userId };
    if (category) where.category = category;
    if (type) where.type = type;
    if (read !== null && read !== '') where.read = read === 'true';

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: { userId: auth.userId, read: false },
      }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST /api/notifications — Create a notification (system use)
export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    const notification = await db.notification.create({
      data: {
        userId: body.userId,
        type: body.type || 'system',
        category: body.category || 'system',
        country: body.country || null,
        title: body.title,
        message: body.message,
        actionUrl: body.actionUrl || null,
        actorId: body.actorId || null,
        actorName: body.actorName || null,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
        channels: body.channels ? JSON.stringify(body.channels) : null,
        sentVia: JSON.stringify([]),
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Notification creation error:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
