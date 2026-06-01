import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;

    const subscription = await db.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Users can only see their own subscriptions (or admins can see all)
    if (subscription.userId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the subscription owner' }, { status: 403 });
    }

    return NextResponse.json({ data: subscription });
  } catch (error) {
    console.error('Subscription detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();

    const existing = await db.subscription.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Only the subscription owner or admin can update
    if (existing.userId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the subscription owner' }, { status: 403 });
    }

    const updated = await db.subscription.update({
      where: { id },
      data: {
        ...(body.planType !== undefined && { planType: body.planType }),
        ...(body.priceXof !== undefined && { priceXof: body.priceXof }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
        ...(body.autoRenew !== undefined && { autoRenew: body.autoRenew }),
        ...(body.paymentRef !== undefined && { paymentRef: body.paymentRef }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;

    const existing = await db.subscription.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Only the subscription owner or admin can cancel
    if (existing.userId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the subscription owner' }, { status: 403 });
    }

    // Soft cancel by setting status to cancelled and autoRenew to false
    const cancelled = await db.subscription.update({
      where: { id },
      data: { status: 'cancelled', autoRenew: false },
    });

    return NextResponse.json({ data: cancelled, message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Subscription cancel error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
