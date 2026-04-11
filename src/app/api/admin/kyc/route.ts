import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/admin/kyc
 * Returns all pending KYC documents with user info — ADMIN only
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Check admin role
  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { userType: true },
  });

  if (admin?.userType !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const filter = searchParams.get("filter") ?? "pending"; // pending | verified | rejected | all

  const where: Record<string, unknown> = {};
  if (filter === "pending") {
    where.isVerified = false;
    where.rejectedAt = null;
  } else if (filter === "verified") {
    where.isVerified = true;
  } else if (filter === "rejected") {
    where.rejectedAt = { not: null };
  }
  // "all" → no filter

  const docs = await prisma.kYCDocument.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          userType: true,
          kycStatus: true,
          country: true,
          createdAt: true,
        },
      },
    },
  });

  const counts = await prisma.kYCDocument.groupBy({
    by: ["isVerified"],
    _count: true,
  });

  return NextResponse.json({ docs, counts });
}
