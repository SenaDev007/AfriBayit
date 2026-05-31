import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    // Users can only see their own subscriptions
    const subscriptions = await db.subscription.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Subscriptions API error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    const subscription = await db.subscription.create({
      data: {
        userId: auth.userId,
        planType: body.planType,
        priceXof: body.priceXof,
        currency: body.currency || 'XOF',
        status: 'active',
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        autoRenew: body.autoRenew ?? true,
        paymentRef: body.paymentRef,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}
