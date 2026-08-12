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

    // Verify post exists
    const post = await db.communityPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const [replies, total] = await Promise.all([
      db.communityReply.findMany({
        where: { postId: id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          author: {
            select: { id: true, name: true, avatar: true, reputation: true },
          },
        },
      }),
      db.communityReply.count({ where: { postId: id } }),
    ]);

    return NextResponse.json({
      data: replies,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Community replies API error:', error);
    return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
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

    if (!body.content || body.content.trim() === '') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    // Verify post exists
    const post = await db.communityPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const reply = await db.communityReply.create({
      data: {
        postId: id,
        authorId: auth.userId,
        content: body.content,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, reputation: true },
        },
      },
    });

    // Increment reply count on the post
    await db.communityPost.update({
      where: { id },
      data: { replies: { increment: 1 } },
    });

    return NextResponse.json({ data: reply }, { status: 201 });
  } catch (error) {
    console.error('Community reply creation error:', error);
    return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 });
  }
}
