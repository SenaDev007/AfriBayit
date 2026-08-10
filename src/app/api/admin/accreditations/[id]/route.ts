import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, active, expiresAt } = body;

    const existing = await db.countryAccreditation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Accreditation not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (role !== undefined) data.role = role;
    if (active !== undefined) data.active = active;
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const updated = await db.countryAccreditation.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Update accreditation error:', error);
    return NextResponse.json({ error: 'Failed to update accreditation' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.countryAccreditation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Accreditation not found' }, { status: 404 });
    }

    // Soft delete by setting active = false
    await db.countryAccreditation.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete accreditation error:', error);
    return NextResponse.json({ error: 'Failed to revoke accreditation' }, { status: 500 });
  }
}
