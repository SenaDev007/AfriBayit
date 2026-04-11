import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { sendKYCStatusEmail } from "@/lib/email";

const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectReason: z.string().optional(),
});

/**
 * PATCH /api/admin/kyc/[id]
 * Approve or reject a KYC document — ADMIN only
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { userType: true },
  });

  if (admin?.userType !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = actionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { action, rejectReason } = parsed.data;

  const doc = await prisma.kYCDocument.findUnique({
    where: { id },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!doc) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  const now = new Date();

  if (action === "approve") {
    await prisma.kYCDocument.update({
      where: { id },
      data: {
        isVerified: true,
        verifiedAt: now,
        verifiedBy: session.user.id,
        rejectedAt: null,
        rejectReason: null,
      },
    });

    // Recompute user KYC level
    const verifiedDocs = await prisma.kYCDocument.findMany({
      where: { userId: doc.userId, isVerified: true },
    });

    let newKycStatus: "VERIFIED" | "PENDING" = "PENDING";
    if (
      verifiedDocs.some((d) => d.docType === "CNI" || d.docType === "PASSPORT") &&
      verifiedDocs.some((d) => d.docType === "SELFIE")
    ) {
      newKycStatus = "VERIFIED";
    }

    await prisma.user.update({
      where: { id: doc.userId },
      data: { kycStatus: newKycStatus },
    });

    // In-app notification
    await prisma.notification.create({
      data: {
        userId: doc.userId,
        type: "SYSTEM",
        title: "Document KYC validé",
        message: `Votre document ${doc.docType} a été validé. Votre niveau KYC a été mis à jour.`,
        href: "/kyc",
      },
    });

    // Email (non-bloquant)
    if (doc.user?.email) {
      sendKYCStatusEmail(doc.user.email, doc.user.name ?? doc.user.email, "approved", doc.docType).catch(() => {});
    }

    return NextResponse.json({ ok: true, action: "approved" });
  }

  // Reject
  if (!rejectReason) {
    return NextResponse.json(
      { error: "La raison du rejet est obligatoire" },
      { status: 400 }
    );
  }

  await prisma.kYCDocument.update({
    where: { id },
    data: {
      isVerified: false,
      rejectedAt: now,
      rejectReason,
      verifiedAt: null,
      verifiedBy: null,
    },
  });

  // In-app notification
  await prisma.notification.create({
    data: {
      userId: doc.userId,
      type: "SYSTEM",
      title: "Document KYC refusé",
      message: `Votre document ${doc.docType} a été refusé. Raison : ${rejectReason}`,
      href: "/kyc",
    },
  });

  // Email (non-bloquant)
  if (doc.user?.email) {
    sendKYCStatusEmail(doc.user.email, doc.user.name ?? doc.user.email, "rejected", doc.docType, rejectReason).catch(() => {});
  }

  return NextResponse.json({ ok: true, action: "rejected" });
}
