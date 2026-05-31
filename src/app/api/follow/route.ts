import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

// POST /api/follow — Follow a user
export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { followingId } = body;

    if (!followingId) {
      return NextResponse.json(
        { error: 'L\'identifiant de l\'utilisateur à suivre est requis' },
        { status: 400 }
      );
    }

    if (followingId === auth.userId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas vous suivre vous-même' },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await db.user.findUnique({
      where: { id: followingId },
      select: { id: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    // Check if already following
    const existing = await db.follower.findUnique({
      where: {
        followerId_followingId: {
          followerId: auth.userId,
          followingId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Vous suivez déjà cet utilisateur', code: 'ALREADY_FOLLOWING' },
        { status: 409 }
      );
    }

    const follow = await db.follower.create({
      data: {
        followerId: auth.userId,
        followingId,
      },
    });

    return NextResponse.json({
      message: `Vous suivez maintenant ${targetUser.name}`,
      follow,
    }, { status: 201 });
  } catch (error) {
    console.error('Follow API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'abonnement' },
      { status: 500 }
    );
  }
}

// DELETE /api/follow — Unfollow a user
export async function DELETE(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const followingId = searchParams.get('followingId');

    if (!followingId) {
      return NextResponse.json(
        { error: 'L\'identifiant de l\'utilisateur à ne plus suivre est requis' },
        { status: 400 }
      );
    }

    const existing = await db.follower.findUnique({
      where: {
        followerId_followingId: {
          followerId: auth.userId,
          followingId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Vous ne suivez pas cet utilisateur', code: 'NOT_FOLLOWING' },
        { status: 404 }
      );
    }

    await db.follower.delete({
      where: {
        followerId_followingId: {
          followerId: auth.userId,
          followingId,
        },
      },
    });

    return NextResponse.json({
      message: 'Vous ne suivez plus cet utilisateur',
    });
  } catch (error) {
    console.error('Unfollow API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du désabonnement' },
      { status: 500 }
    );
  }
}

// GET /api/follow — List followers/following
export async function GET(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'following'; // 'followers' or 'following'
    const userId = searchParams.get('userId') || auth.userId;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (type === 'followers') {
      const [followers, total] = await Promise.all([
        db.follower.findMany({
          where: { followingId: userId },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            follower: {
              select: {
                id: true,
                name: true,
                avatar: true,
                verified: true,
                verificationStatus: true,
                role: true,
                city: true,
                country: true,
                professionalProfile: {
                  select: { agencyName: true, headline: true, credibilityScore: true },
                },
              },
            },
          },
        }),
        db.follower.count({ where: { followingId: userId } }),
      ]);

      return NextResponse.json({
        followers: followers.map(f => ({
          id: f.id,
          followedAt: f.createdAt,
          user: f.follower,
        })),
        total,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }

    // Following list
    const [following, total] = await Promise.all([
      db.follower.findMany({
        where: { followerId: userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              avatar: true,
              verified: true,
              verificationStatus: true,
              role: true,
              city: true,
              country: true,
              professionalProfile: {
                select: { agencyName: true, headline: true, credibilityScore: true },
              },
            },
          },
        },
      }),
      db.follower.count({ where: { followerId: userId } }),
    ]);

    return NextResponse.json({
      following: following.map(f => ({
        id: f.id,
        followedAt: f.createdAt,
        user: f.following,
      })),
      total,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Follow list API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des abonnements' },
      { status: 500 }
    );
  }
}
