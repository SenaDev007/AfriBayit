import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/analytics — dashboard stats for the logged-in user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [
    propertyCount,
    activePropertyCount,
    totalViews,
    favoriteCount,
    bookingCount,
    unreadMessages,
    unreadNotifications,
    loyaltyPoints,
    subscription,
    escrowTransactions,
    recentProperties,
  ] = await Promise.all([
    prisma.property.count({ where: { ownerId: userId } }),
    prisma.property.count({ where: { ownerId: userId, status: "ACTIVE" } }),
    prisma.property.aggregate({ where: { ownerId: userId }, _sum: { viewCount: true } }),
    prisma.favorite.count({ where: { userId } }),
    prisma.booking.count({ where: { guestId: userId } }),
    prisma.message.count({ where: { receiverId: userId, isRead: false } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.user.findUnique({ where: { id: userId }, select: { loyaltyPoints: true } }),
    prisma.subscription.findFirst({
      where: { userId, status: { in: ["TRIAL", "ACTIVE"] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.escrowTransaction.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.property.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        viewCount: true,
        price: true,
        currency: true,
        city: true,
        listingType: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    stats: {
      totalProperties: propertyCount,
      activeProperties: activePropertyCount,
      totalViews: totalViews._sum.viewCount ?? 0,
      savedProperties: favoriteCount,
      totalBookings: bookingCount,
      unreadMessages,
      unreadNotifications,
      loyaltyPoints: loyaltyPoints?.loyaltyPoints ?? 0,
    },
    subscription,
    recentProperties,
    escrowTransactions,
  });
}
