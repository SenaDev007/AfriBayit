import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;

    // Verify post exists
    const post = await db.communityPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if already liked
    const existing = await db.postLike.findUnique({
      where: { postId_userId: { postId: id, userId: auth.userId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Already liked this post' }, { status: 409 });
    }

    // Create like record and increment likes count
    const like = await db.postLike.create({
      data: {
        postId: id,
        userId: auth.userId,
      },
    });

    await db.communityPost.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });

    return NextResponse.json({ data: like }, { status: 201 });
  } catch (error) {
    console.error('Post like error:', error);
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;

    // Check like exists
    const like = await db.postLike.findUnique({
      where: { postId_userId: { postId: id, userId: auth.userId } },
    });
    if (!like) {
      return NextResponse.json({ error: 'Not liked this post' }, { status: 404 });
    }

    // Delete like record and decrement likes count
    await db.postLike.delete({
      where: { postId_userId: { postId: id, userId: auth.userId } },
    });

    const post = await db.communityPost.findUnique({ where: { id } });
    if (post && post.likes > 0) {
      await db.communityPost.update({
        where: { id },
        data: { likes: { decrement: 1 } },
      });
    }

    return NextResponse.json({ data: null, message: 'Post unliked successfully' });
  } catch (error) {
    console.error('Post unlike error:', error);
    return NextResponse.json({ error: 'Failed to unlike post' }, { status: 500 });
  }
}
