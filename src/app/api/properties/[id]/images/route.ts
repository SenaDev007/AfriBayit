import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const MAX_IMAGES = 15;

/**
 * POST /api/properties/[id]/images
 * Upload up to 15 photos for a property listing.
 * Multipart: file (required), isPrimary (optional, "true")
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    select: { ownerId: true, _count: { select: { images: true } } },
  });

  if (!property) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }

  if (property.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (property._count.images >= MAX_IMAGES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_IMAGES} photos par annonce.` },
      { status: 409 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Multipart invalide" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const isPrimary = formData.get("isPrimary") === "true";

  if (!file) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      { error: "Format non supporté. Utilisez JPEG, PNG ou WEBP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Photo trop volumineuse (max 8 Mo)." },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.type.split("/")[1];
  const filename = `${randomUUID()}.${ext}`;

  let url: string;

  if (process.env.UPLOAD_PROVIDER === "r2") {
    // TODO: Cloudflare R2
    return NextResponse.json({ error: "R2 non configuré." }, { status: 501 });
  } else {
    const uploadDir = join(process.cwd(), "public", "uploads", "properties", id);
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), buffer);
    url = `/uploads/properties/${id}/${filename}`;
  }

  // If this is primary, unset existing primary
  if (isPrimary) {
    await prisma.propertyImage.updateMany({
      where: { propertyId: id, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const currentCount = property._count.images;

  const image = await prisma.propertyImage.create({
    data: {
      propertyId: id,
      url,
      isPrimary: isPrimary || currentCount === 0, // First image is always primary
      order: currentCount,
    },
  });

  return NextResponse.json({ id: image.id, url: image.url, isPrimary: image.isPrimary }, { status: 201 });
}

/**
 * GET /api/properties/[id]/images
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const images = await prisma.propertyImage.findMany({
    where: { propertyId: id },
    orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
  });

  return NextResponse.json({ images });
}

/**
 * DELETE /api/properties/[id]/images?imageId=xxx
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const imageId = request.nextUrl.searchParams.get("imageId");

  if (!imageId) {
    return NextResponse.json({ error: "imageId requis" }, { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id },
    select: { ownerId: true },
  });

  if (!property || property.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  await prisma.propertyImage.delete({ where: { id: imageId } });

  return NextResponse.json({ ok: true });
}
