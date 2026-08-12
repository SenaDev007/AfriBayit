import { NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';
import { getVapidPublicKey, storePushSubscription, removePushSubscription } from '@/lib/notifications/channels/push';

// POST /api/notifications/subscribe — Register push notification subscription
export async function POST(request: Request) {
  try {
    const auth = await authGuard(request);
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { subscription } = body as {
      subscription: {
        endpoint: string;
        keys: {
          p256dh: string;
          auth: string;
        };
      };
    };

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid push subscription object. Required: endpoint, keys.p256dh, keys.auth' },
        { status: 400 }
      );
    }

    // Store push subscription in dedicated PushSubscription table
    const userAgent = request.headers.get('user-agent') || undefined;
    const result = await storePushSubscription(auth.userId, subscription, userAgent);

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to store push subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json({ error: 'Failed to register push subscription' }, { status: 500 });
  }
}

// DELETE /api/notifications/subscribe — Remove push notification subscription
export async function DELETE(request: Request) {
  try {
    const auth = await authGuard(request);
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { endpoint } = body as { endpoint: string };

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    const removed = await removePushSubscription(auth.userId, endpoint);

    if (!removed) {
      return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push subscription removal error:', error);
    return NextResponse.json({ error: 'Failed to remove push subscription' }, { status: 500 });
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
