import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

// POST /api/notifications/mark-all-read — Mark all notifications as read
export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json().catch(() => ({}));
    const category = body.category as string | undefined;

    const where: Record<string, unknown> = {
      userId: auth.userId,
      read: false,
    };

    if (category) {
      where.category = category;
    }

    const result = await db.notification.updateMany({
      where,
      data: { read: true, readAt: new Date() },
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error('Mark all read error:', error);
    return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 });
  }
}
