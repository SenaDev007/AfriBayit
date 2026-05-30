import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const post = await db.communityPost.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, reputation: true },
        },
        replies_rel: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, name: true, avatar: true, reputation: true },
            },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Increment view count asynchronously
    db.communityPost.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});

    return NextResponse.json({ data: post });
  } catch (error) {
    console.error('Community post detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
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

    const existing = await db.communityPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Only the author or admin can update
    if (existing.authorId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the post author' }, { status: 403 });
    }

    const updated = await db.communityPost.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.tags !== undefined && { tags: JSON.stringify(body.tags) }),
        ...(body.pinned !== undefined && { pinned: body.pinned }),
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Community post update error:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
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

    const existing = await db.communityPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Only the author or admin can delete
    if (existing.authorId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the post author' }, { status: 403 });
    }

    await db.communityPost.delete({ where: { id } });

    return NextResponse.json({ data: null, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Community post delete error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
