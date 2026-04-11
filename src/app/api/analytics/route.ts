import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/analytics — dashboard stats + charts data for logged-in user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Date range: last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    propertyCount,
    activePropertyCount,
    totalViewsAgg,
    favoriteCount,
    bookingCount,
    unreadMessages,
    unreadNotifications,
    loyaltyData,
    subscription,
    escrowTransactions,
    recentProperties,
    propertiesByType,
    escrowByState,
    recentEscrowAll,
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
    // Breakdown: properties by type
    prisma.property.groupBy({
      by: ["type"],
      where: { ownerId: userId },
      _count: true,
    }),
    // Escrow by state
    prisma.escrowTransaction.groupBy({
      by: ["state"],
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      _count: true,
      _sum: { amount: true },
    }),
    // Last 6 months escrow (for timeline chart)
    prisma.escrowTransaction.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
        createdAt: { gte: sixMonthsAgo },
      },
      select: { createdAt: true, amount: true, state: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // ── Monthly timeline (last 6 months) ──────────────────────────────────────
  const monthlyData = buildMonthlyTimeline(recentEscrowAll, sixMonthsAgo);

  // ── Properties by type (for PieChart) ─────────────────────────────────────
  const TYPE_LABELS: Record<string, string> = {
    APARTMENT: "Appartement", HOUSE: "Maison", VILLA: "Villa",
    STUDIO: "Studio", OFFICE: "Bureau", LAND: "Terrain",
    COMMERCIAL: "Commercial", WAREHOUSE: "Entrepôt",
  };

  const propertiesChartData = propertiesByType.map((p) => ({
    name: TYPE_LABELS[p.type] ?? p.type,
    value: p._count,
  }));

  // ── Escrow by state (for BarChart) ─────────────────────────────────────────
  const STATE_LABELS: Record<string, string> = {
    CREATED: "Créé", FUNDED: "Financé", IN_PROGRESS: "En cours",
    VALIDATION: "Validation", RELEASED: "Libéré", REFUNDED: "Remboursé",
    EXPIRED: "Expiré", DISPUTED: "Litige",
  };

  const escrowChartData = escrowByState.map((e) => ({
    name: STATE_LABELS[e.state] ?? e.state,
    count: e._count,
    amount: Math.round((e._sum.amount ?? 0) / 1000), // in KFCFA
  }));

  return NextResponse.json({
    stats: {
      totalProperties: propertyCount,
      activeProperties: activePropertyCount,
      totalViews: totalViewsAgg._sum.viewCount ?? 0,
      savedProperties: favoriteCount,
      totalBookings: bookingCount,
      unreadMessages,
      unreadNotifications,
      loyaltyPoints: loyaltyData?.loyaltyPoints ?? 0,
    },
    subscription,
    recentProperties,
    escrowTransactions,
    charts: {
      monthly: monthlyData,
      propertiesByType: propertiesChartData,
      escrowByState: escrowChartData,
    },
  });
}

// Build a 6-month timeline aggregating escrow amounts by month
function buildMonthlyTimeline(
  escrows: { createdAt: Date; amount: number; state: string }[],
  from: Date
): { month: string; transactions: number; montant: number }[] {
  const months: { month: string; transactions: number; montant: number }[] = [];
  const cursor = new Date(from);
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < 6; i++) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const label = cursor.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });

    const inMonth = escrows.filter((e) => {
      const d = new Date(e.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    months.push({
      month: label,
      transactions: inMonth.length,
      montant: Math.round(inMonth.reduce((s, e) => s + e.amount, 0) / 1000), // KFCFA
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}
