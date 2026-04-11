import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/community/points — get user's points and badges
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user, badges, pointHistory, leaderboard] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { loyaltyPoints: true, reputationScore: true },
    }),
    prisma.userBadge.findMany({ where: { userId: session.user.id } }),
    prisma.pointTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    // Top 10 users by loyalty points
    prisma.user.findMany({
      where: { loyaltyPoints: { gt: 0 } },
      orderBy: { loyaltyPoints: "desc" },
      take: 10,
      select: { id: true, name: true, image: true, loyaltyPoints: true, userType: true },
    }),
  ]);

  return NextResponse.json({ user, badges, pointHistory, leaderboard });
}

// POST /api/community/points — award points (internal use)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reason, refId } = await req.json();

  const POINT_RULES: Record<string, number> = {
    listing_published: 50,
    review_left: 30,
    first_booking: 100,
    profile_complete: 50,
    kyc_verified: 200,
    referral: 150,
  };

  const points = POINT_RULES[reason] ?? 10;

  await prisma.pointTransaction.create({
    data: { userId: session.user.id, points, reason, refId },
  });

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { loyaltyPoints: { increment: points } },
    select: { loyaltyPoints: true },
  });

  return NextResponse.json({ awarded: points, total: updated.loyaltyPoints });
}
