import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Verify group exists
    const group = await db.communityGroup.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const [members, total] = await Promise.all([
      db.groupMembership.findMany({
        where: { groupId: id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { joinedAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, avatar: true, reputation: true },
          },
        },
      }),
      db.groupMembership.count({ where: { groupId: id } }),
    ]);

    return NextResponse.json({
      data: members,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Group members API error:', error);
    return NextResponse.json({ error: 'Failed to fetch group members' }, { status: 500 });
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

    // Verify group exists
    const group = await db.communityGroup.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check for existing membership
    const existing = await db.groupMembership.findUnique({
      where: { groupId_userId: { groupId: id, userId: auth.userId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Already a member of this group' }, { status: 409 });
    }

    const membership = await db.groupMembership.create({
      data: {
        groupId: id,
        userId: auth.userId,
        role: 'member',
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Increment member count on the group
    await db.communityGroup.update({
      where: { id },
      data: { members: { increment: 1 } },
    });

    return NextResponse.json({ data: membership }, { status: 201 });
  } catch (error) {
    console.error('Group join error:', error);
    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 });
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

    // Check membership exists
    const membership = await db.groupMembership.findUnique({
      where: { groupId_userId: { groupId: id, userId: auth.userId } },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 404 });
    }

    // Group admins cannot leave — they must transfer ownership first
    if (membership.role === 'admin') {
      const adminCount = await db.groupMembership.count({
        where: { groupId: id, role: 'admin' },
      });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot leave: you are the only admin. Transfer ownership first.' }, { status: 400 });
      }
    }

    await db.groupMembership.delete({
      where: { groupId_userId: { groupId: id, userId: auth.userId } },
    });

    // Decrement member count on the group
    await db.communityGroup.update({
      where: { id },
      data: { members: { decrement: 1 } },
    });

    return NextResponse.json({ data: null, message: 'Left group successfully' });
  } catch (error) {
    console.error('Group leave error:', error);
    return NextResponse.json({ error: 'Failed to leave group' }, { status: 500 });
  }
}
