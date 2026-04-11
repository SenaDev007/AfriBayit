import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/ledger
 * Returns ledger entries for the authenticated user's escrow transactions.
 * Admins see all entries.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const escrowId = searchParams.get("escrowId");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = 20;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { userType: true },
  });

  const isAdmin = user?.userType === "ADMIN";

  // Build filter: admin sees all; users only see their escrow entries
  let escrowIds: string[] | undefined;

  if (!isAdmin) {
    if (escrowId) {
      // Verify the user is party to this escrow
      const escrow = await prisma.escrowTransaction.findUnique({
        where: { id: escrowId },
        select: { buyerId: true, sellerId: true },
      });
      if (!escrow || (escrow.buyerId !== session.user.id && escrow.sellerId !== session.user.id)) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
      escrowIds = [escrowId];
    } else {
      // All escrows the user is party to
      const userEscrows = await prisma.escrowTransaction.findMany({
        where: { OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }] },
        select: { id: true },
      });
      escrowIds = userEscrows.map((e) => e.id);
    }
  }

  const where = escrowId && isAdmin
    ? { escrowId }
    : escrowIds
    ? { escrowId: { in: escrowIds } }
    : {};

  const [entries, total] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ledgerEntry.count({ where }),
  ]);

  // Summary: platform revenue
  const revenueAgg = isAdmin
    ? await prisma.ledgerEntry.aggregate({
        where: { creditAccount: "platform:revenue" },
        _sum: { amount: true },
      })
    : null;

  return NextResponse.json({
    entries,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
    summary: revenueAgg
      ? { platformRevenue: revenueAgg._sum.amount ?? 0 }
      : undefined,
  });
}
