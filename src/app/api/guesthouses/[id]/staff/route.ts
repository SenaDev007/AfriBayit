import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const staff = await db.guesthouseStaff.findMany({
      where: { guesthouseId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ staff });
  } catch (error) {
    console.error('Guesthouse staff API error:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
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

    const staff = await db.guesthouseStaff.create({
      data: {
        guesthouseId: id,
        name: body.name,
        role: body.role,
        phone: body.phone || null,
        schedule: body.schedule || null,
        accessLevel: body.accessLevel || 1,
      },
    });

    // Update hasStaff flag
    await db.guesthouse.update({
      where: { id },
      data: { hasStaff: true },
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    console.error('Staff creation error:', error);
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 });
  }
}
