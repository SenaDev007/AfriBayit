import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/analytics/export?format=csv
 * Exports user analytics data as CSV (PDF via print dialog on frontend)
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const format = request.nextUrl.searchParams.get("format") ?? "csv";
  const userId = session.user.id;

  const [properties, escrows, user] = await Promise.all([
    prisma.property.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        title: true,
        type: true,
        listingType: true,
        status: true,
        price: true,
        currency: true,
        city: true,
        country: true,
        viewCount: true,
        createdAt: true,
        publishedAt: true,
        legalDocStatus: true,
      },
    }),
    prisma.escrowTransaction.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      orderBy: { createdAt: "desc" },
      select: {
        reference: true,
        type: true,
        state: true,
        amount: true,
        commission: true,
        netAmount: true,
        currency: true,
        buyerId: true,
        createdAt: true,
        releasedAt: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, loyaltyPoints: true, kycStatus: true },
    }),
  ]);

  if (format === "csv") {
    const lines: string[] = [];

    // Header info
    lines.push(`AfriBayit — Export Analytics`);
    lines.push(`Utilisateur,${user?.name ?? ""},${user?.email ?? ""}`);
    lines.push(`Date export,${new Date().toLocaleDateString("fr-FR")}`);
    lines.push(`KYC Status,${user?.kycStatus ?? ""}`);
    lines.push(`Points fidélité,${user?.loyaltyPoints ?? 0}`);
    lines.push(``);

    // Properties section
    lines.push(`=== ANNONCES (${properties.length}) ===`);
    lines.push(`Titre,Type,Annonce,Statut,Prix,Devise,Ville,Pays,Vues,Publié le,Doc Legal`);
    for (const p of properties) {
      lines.push(
        [
          `"${p.title}"`,
          p.type,
          p.listingType,
          p.status,
          p.price,
          p.currency,
          `"${p.city}"`,
          p.country,
          p.viewCount,
          p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("fr-FR") : "Non publié",
          p.legalDocStatus,
        ].join(",")
      );
    }
    lines.push(``);

    // Escrow section
    lines.push(`=== ESCROW (${escrows.length}) ===`);
    lines.push(`Référence,Type,État,Montant,Commission,Net,Devise,Rôle,Date création,Date libération`);
    for (const e of escrows) {
      lines.push(
        [
          e.reference,
          e.type,
          e.state,
          e.amount,
          e.commission,
          e.netAmount,
          e.currency,
          e.buyerId === userId ? "Acheteur" : "Vendeur",
          new Date(e.createdAt).toLocaleDateString("fr-FR"),
          e.releasedAt ? new Date(e.releasedAt).toLocaleDateString("fr-FR") : "—",
        ].join(",")
      );
    }

    const csv = lines.join("\n");
    const filename = `afribayit-analytics-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  // JSON fallback (for in-page display)
  return NextResponse.json({ properties, escrows, user });
}
