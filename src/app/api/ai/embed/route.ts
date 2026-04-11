import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { embedProperty } from "@/lib/embeddings";

/**
 * POST /api/ai/embed
 * Génère et stocke l'embedding d'une annonce (owner ou admin uniquement).
 * Appelé automatiquement lors de la publication (status ACTIVE).
 *
 * Body: { propertyId: string }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { propertyId } = await req.json();
  if (!propertyId) {
    return NextResponse.json({ error: "propertyId requis" }, { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { ownerId: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }

  const isAdmin = (session.user as { role?: string }).role === "ADMIN";
  if (property.ownerId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY non configurée — embeddings désactivés" },
      { status: 503 }
    );
  }

  const ok = await embedProperty(propertyId);
  if (!ok) {
    return NextResponse.json({ error: "Échec de la génération d'embedding" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * POST /api/ai/embed/batch  (admin only)
 * Regénère les embeddings de toutes les annonces ACTIVE sans embedding.
 */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin requis" }, { status: 403 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY non configurée" }, { status: 503 });
  }

  // Get properties without embedding
  const properties = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM properties
    WHERE status = 'ACTIVE' AND embedding IS NULL
    LIMIT 100
  `;

  let embedded = 0;
  for (const { id } of properties) {
    const ok = await embedProperty(id);
    if (ok) embedded++;
  }

  return NextResponse.json({ total: properties.length, embedded });
}
