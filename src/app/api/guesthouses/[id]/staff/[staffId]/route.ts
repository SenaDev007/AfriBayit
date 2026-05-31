import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id, staffId } = await params;

    // Verify staff belongs to guesthouse
    const staff = await db.guesthouseStaff.findFirst({
      where: { id: staffId, guesthouseId: id },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    await db.guesthouseStaff.delete({ where: { id: staffId } });

    // Check if there are remaining staff
    const remaining = await db.guesthouseStaff.count({ where: { guesthouseId: id } });
    if (remaining === 0) {
      await db.guesthouse.update({
        where: { id },
        data: { hasStaff: false },
      });
    }

    return NextResponse.json({ message: 'Staff member removed' });
  } catch (error) {
    console.error('Staff deletion error:', error);
    return NextResponse.json({ error: 'Failed to remove staff member' }, { status: 500 });
  }
}
