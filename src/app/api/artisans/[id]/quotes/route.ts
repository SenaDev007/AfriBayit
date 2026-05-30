import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = { artisanId: id };
    if (status) where.status = status;

    const [quotes, total] = await Promise.all([
      db.artisanQuote.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.artisanQuote.count({ where }),
    ]);

    return NextResponse.json({
      quotes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Artisan quotes API error:', error);
    return NextResponse.json({ error: 'Failed to fetch artisan quotes' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const quote = await db.artisanQuote.create({
      data: {
        artisanId: id,
        userId: body.userId,
        propertyId: body.propertyId,
        title: body.title,
        description: body.description,
        estimatedBudget: body.estimatedBudget,
        status: 'requested',
      },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error('Artisan quote creation error:', error);
    return NextResponse.json({ error: 'Failed to request quote' }, { status: 500 });
  }
}
