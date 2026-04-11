import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  type: z.enum(["PROPERTY_SALE", "LONG_TERM_RENTAL", "SHORT_TERM_RENTAL", "ARTISAN_SERVICE", "HOTEL_BOOKING", "GEOTRUST_MISSION"]),
  sellerId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default("XOF"),
  propertyId: z.string().optional(),
  bookingId: z.string().optional(),
  paymentMethod: z.string().optional(),
});

// Compute commission based on type (CDC §6)
function computeCommission(type: string, amount: number): { commission: number; netAmount: number } {
  const rates: Record<string, number> = {
    PROPERTY_SALE: 0.04,        // 4% average (2-5%)
    LONG_TERM_RENTAL: 0,        // 1 mois loyer — handled separately
    SHORT_TERM_RENTAL: 0.03,    // 3% host
    ARTISAN_SERVICE: 0.08,      // 8%
    HOTEL_BOOKING: 0.12,        // 12% (10-15%)
    GEOTRUST_MISSION: 0.05,     // 5%
  };
  const rate = rates[type] ?? 0.04;
  const commission = Math.round(amount * rate);
  return { commission, netAmount: amount - commission };
}

// GET /api/escrow — list user's escrow transactions
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") ?? "all"; // buyer, seller, all

  const where: Record<string, unknown> = {};
  if (role === "buyer") where.buyerId = session.user.id;
  else if (role === "seller") where.sellerId = session.user.id;
  else where.OR = [{ buyerId: session.user.id }, { sellerId: session.user.id }];

  const transactions = await prisma.escrowTransaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ transactions });
}

// POST /api/escrow — create escrow transaction
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = createSchema.parse(body);

  const { commission, netAmount } = computeCommission(data.type, data.amount);

  // Expiry: 30 days from creation
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const escrow = await prisma.escrowTransaction.create({
    data: {
      type: data.type as any,
      state: "CREATED",
      buyerId: session.user.id,
      sellerId: data.sellerId,
      amount: data.amount,
      commission,
      netAmount,
      currency: data.currency as any,
      propertyId: data.propertyId,
      bookingId: data.bookingId,
      paymentMethod: data.paymentMethod,
      expiresAt,
      stateHistory: [{ state: "CREATED", at: new Date().toISOString(), by: session.user.id }],
    },
  });

  // Notify seller
  await prisma.notification.create({
    data: {
      userId: data.sellerId,
      type: "payment",
      title: "Nouvelle transaction escrow",
      message: `Un acheteur a initié une transaction sécurisée de ${data.amount.toLocaleString("fr-FR")} ${data.currency}.`,
      href: "/dashboard",
    },
  });

  return NextResponse.json(escrow, { status: 201 });
}
