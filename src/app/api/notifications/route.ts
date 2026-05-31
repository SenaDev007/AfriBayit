import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const read = searchParams.get('read');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Users can only see their own notifications
    const where: Record<string, unknown> = { userId: auth.userId };

    if (category) where.category = category;
    if (read !== null) where.read = read === 'true';

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.notification.count({ where }),
    ]);

    const unreadCount = await db.notification.count({
      where: { userId: auth.userId, read: false },
    });

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

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    const notification = await db.notification.create({
      data: {
        userId: body.userId,
        type: body.type,
        category: body.category,
        title: body.title,
        message: body.message,
        actionUrl: body.actionUrl,
        actorId: body.actorId,
        actorName: body.actorName,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
        channels: body.channels ? JSON.stringify(body.channels) : null,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Notification creation error:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    // Users can only mark their own notifications as read
    const result = await db.notification.updateMany({
      where: { userId: auth.userId, read: false },
      data: { read: true, readAt: new Date() },
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error('Notification bulk update error:', error);
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
  }
}
