import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pricingRules = await db.guesthousePricingRule.findMany({
      where: { guesthouseId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ pricingRules });
  } catch (error) {
    console.error('Guesthouse pricing rules API error:', error);
    return NextResponse.json({ error: 'Failed to fetch pricing rules' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();

    // Verify guesthouse exists
    const guesthouse = await db.guesthouse.findUnique({ where: { id } });
    if (!guesthouse) {
      return NextResponse.json({ error: 'Guesthouse not found' }, { status: 404 });
    }

    const rule = await db.guesthousePricingRule.create({
      data: {
        guesthouseId: id,
        name: body.name,
        period: body.period,
        multiplier: body.multiplier || 1.0,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        event_name: body.eventName || null,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Pricing rule creation error:', error);
    return NextResponse.json({ error: 'Failed to create pricing rule' }, { status: 500 });
  }
}
