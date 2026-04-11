import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// KYC Level limits (CDC §7B.8)
const KYC_LIMITS: Record<string, number> = {
  NONE: 0,
  PENDING: 0,
  VERIFIED: 5_000_000, // KYC1 threshold; actual level depends on documents
  REJECTED: 0,
};

// GET /api/kyc — get user KYC status and documents
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { kycStatus: true },
  });

  const documents = await prisma.kYCDocument.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  // Determine KYC level based on verified documents
  const verifiedDocs = documents.filter((d) => d.isVerified);
  let kycLevel = "KYC0";
  let monthlyLimit = 0;

  if (verifiedDocs.some((d) => d.docType === "CNI" || d.docType === "PASSPORT")) {
    if (verifiedDocs.some((d) => d.docType === "SELFIE")) {
      kycLevel = "KYC1";
      monthlyLimit = 500_000;
    }
  }
  if (verifiedDocs.length >= 3) {
    kycLevel = "KYC2";
    monthlyLimit = 5_000_000;
  }
  if (verifiedDocs.length >= 5) {
    kycLevel = "KYC3";
    monthlyLimit = -1; // unlimited
  }

  return NextResponse.json({
    kycStatus: user?.kycStatus,
    kycLevel,
    monthlyLimit,
    documents: documents.map((d) => ({
      id: d.id,
      docType: d.docType,
      isVerified: d.isVerified,
      createdAt: d.createdAt,
    })),
  });
}
