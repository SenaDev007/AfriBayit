import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const group = await db.communityGroup.findUnique({
      where: { id },
      include: {
        _count: { select: { memberships: true } },
        memberships: {
          take: 10,
          orderBy: { joinedAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, avatar: true, reputation: true },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ data: group });
  } catch (error) {
    console.error('Community group detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
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

    const existing = await db.communityGroup.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is admin of the group or system admin
    const membership = await db.groupMembership.findUnique({
      where: { groupId_userId: { groupId: id, userId: auth.userId } },
    });
    if ((!membership || membership.role !== 'admin') && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not a group admin' }, { status: 403 });
    }

    const updated = await db.communityGroup.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.isPrivate !== undefined && { isPrivate: body.isPrivate }),
        ...(body.coverImage !== undefined && { coverImage: body.coverImage }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Community group update error:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;

    const existing = await db.communityGroup.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Only system admin can delete a group
    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    await db.communityGroup.delete({ where: { id } });

    return NextResponse.json({ data: null, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Community group delete error:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
