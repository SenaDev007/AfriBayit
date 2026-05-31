import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';
import { getVapidPublicKey } from '@/lib/notifications';

// POST /api/notifications/subscribe — Register push notification subscription
export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { subscription } = body as { subscription: Record<string, unknown> };

    if (!subscription?.endpoint || !subscription?.keys) {
      return NextResponse.json(
        { error: 'Invalid push subscription object' },
        { status: 400 }
      );
    }

    // Store push subscription in user's metadata
    // We store it as JSON in a compatible field
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { specialties: true },
    });

    let subscriptions: Record<string, unknown>[] = [];
    try {
      if (user?.specialties) {
        const parsed = JSON.parse(user.specialties);
        if (Array.isArray(parsed)) {
          subscriptions = parsed;
        }
      }
    } catch {
      subscriptions = [];
    }

    // Check if subscription already exists
    const existingIndex = subscriptions.findIndex(
      (s) => s.endpoint === subscription.endpoint
    );

    if (existingIndex >= 0) {
      subscriptions[existingIndex] = subscription;
    } else {
      subscriptions.push(subscription);
    }

    await db.user.update({
      where: { id: auth.userId },
      data: {
        specialties: JSON.stringify(subscriptions),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json({ error: 'Failed to register push subscription' }, { status: 500 });
  }
}

// GET /api/notifications/subscribe — Get VAPID public key
export async function GET() {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json({ error: 'Push notifications not configured' }, { status: 503 });
  }
  return NextResponse.json({ publicKey });
}
