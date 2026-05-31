import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; replyId: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id, replyId } = await params;
    const body = await request.json();

    const existing = await db.communityReply.findUnique({ where: { id: replyId } });
    if (!existing) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
    }
    if (existing.postId !== id) {
      return NextResponse.json({ error: 'Reply does not belong to this post' }, { status: 400 });
    }
    if (existing.authorId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the reply author' }, { status: 403 });
    }

    if (!body.content || body.content.trim() === '') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    const updated = await db.communityReply.update({
      where: { id: replyId },
      data: { content: body.content },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, reputation: true },
        },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Community reply update error:', error);
    return NextResponse.json({ error: 'Failed to update reply' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; replyId: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id, replyId } = await params;

    const existing = await db.communityReply.findUnique({ where: { id: replyId } });
    if (!existing) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
    }
    if (existing.postId !== id) {
      return NextResponse.json({ error: 'Reply does not belong to this post' }, { status: 400 });
    }
    if (existing.authorId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the reply author' }, { status: 403 });
    }

    await db.communityReply.delete({ where: { id: replyId } });

    // Decrement reply count on the post
    await db.communityPost.update({
      where: { id },
      data: { replies: { decrement: 1 } },
    });

    return NextResponse.json({ message: 'Reply deleted' });
  } catch (error) {
    console.error('Community reply delete error:', error);
    return NextResponse.json({ error: 'Failed to delete reply' }, { status: 500 });
  }
}
