import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/properties/alerts — Create price alert
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, filters, notifyVia, frequency } = body as {
      userId: string;
      filters: Record<string, unknown>;
      notifyVia?: string;
      frequency?: string;
    };

    if (!userId || !filters) {
      return NextResponse.json(
        { error: 'userId et filters requis' },
        { status: 400 }
      );
    }

    const alert = await db.priceAlert.create({
      data: {
        userId,
        filters: JSON.stringify(filters),
        notifyVia: notifyVia || 'email',
        frequency: frequency || 'daily',
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Create alert error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET /api/properties/alerts?userId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const alerts = await db.priceAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      alerts: alerts.map(a => ({
        ...a,
        filters: JSON.parse(a.filters),
      })),
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
