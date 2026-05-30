import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const country = searchParams.get('country');
    const authorId = searchParams.get('authorId');
    const sort = searchParams.get('sort') || 'recent';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (category) where.category = category;
    if (country) where.country = country;
    if (authorId) where.authorId = authorId;

    const orderBy: Record<string, string> = sort === 'popular'
      ? { likes: 'desc' }
      : sort === 'most_replies'
        ? { replies: 'desc' }
        : { createdAt: 'desc' };

    const [posts, total] = await Promise.all([
      db.communityPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          author: {
            select: { id: true, name: true, avatar: true, reputation: true },
          },
          _count: { select: { replies_rel: true } },
        },
      }),
      db.communityPost.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Community posts API error:', error);
    return NextResponse.json({ error: 'Failed to fetch community posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    const post = await db.communityPost.create({
      data: {
        authorId: auth.userId,
        title: body.title,
        content: body.content,
        category: body.category,
        country: body.country,
        tags: body.tags ? JSON.stringify(body.tags) : null,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Community post creation error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
