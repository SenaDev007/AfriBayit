import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_DOC_TYPES = [
  "CNI",
  "PASSPORT",
  "PERMIS",
  "RCCM",
  "PATENTE",
  "SELFIE",
  "UTILITY_BILL",
] as const;

type DocType = (typeof ALLOWED_DOC_TYPES)[number];

/**
 * POST /api/kyc/upload
 * Multipart form: file + docType
 * Stores file locally (dev) or Cloudflare R2 (prod via UPLOAD_PROVIDER=r2)
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const docType = formData.get("docType") as string | null;

  if (!file || !docType) {
    return NextResponse.json(
      { error: "Champs requis manquants : file, docType" },
      { status: 400 }
    );
  }

  // Validate docType
  if (!ALLOWED_DOC_TYPES.includes(docType as DocType)) {
    return NextResponse.json(
      { error: `Type de document invalide. Valeurs acceptées : ${ALLOWED_DOC_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate MIME
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      { error: "Format non supporté. Utilisez JPEG, PNG, WEBP ou PDF." },
      { status: 400 }
    );
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (max 10 Mo)." },
      { status: 400 }
    );
  }

  // Check if this docType already has a pending/verified document
  const existing = await prisma.kYCDocument.findFirst({
    where: {
      userId: session.user.id,
      docType: docType as any,
      isVerified: true,
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Ce type de document est déjà vérifié pour votre compte." },
      { status: 409 }
    );
  }

  // Save file — use Cloudflare R2 in prod (UPLOAD_PROVIDER=r2)
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
  const filename = `${randomUUID()}.${ext}`;
  let fileUrl: string;

  if (process.env.UPLOAD_PROVIDER === "r2") {
    // TODO: Cloudflare R2 upload — requires @aws-sdk/client-s3 + R2 credentials
    // const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    // ...
    return NextResponse.json(
      { error: "Fournisseur R2 non encore configuré." },
      { status: 501 }
    );
  } else {
    // Local storage — dev only
    const uploadDir = join(process.cwd(), "public", "uploads", "kyc", session.user.id);
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), buffer);
    fileUrl = `/uploads/kyc/${session.user.id}/${filename}`;
  }

  // Create KYCDocument record
  const doc = await prisma.kYCDocument.create({
    data: {
      userId: session.user.id,
      docType: docType as any,
      url: fileUrl,
      fileSize: file.size,
      mimeType: file.type,
    },
  });

  // Update user kycStatus to PENDING if it was NONE
  await prisma.user.updateMany({
    where: { id: session.user.id, kycStatus: "NONE" },
    data: { kycStatus: "PENDING" },
  });

  // Notify admin (create notification for ADMIN users)
  const admins = await prisma.user.findMany({
    where: { userType: "ADMIN" },
    select: { id: true },
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: "SYSTEM",
        title: "Nouveau document KYC à valider",
        message: `Un utilisateur a soumis un document ${docType} en attente de validation.`,
        href: `/admin/kyc`,
      })),
    });
  }

  return NextResponse.json(
    {
      id: doc.id,
      docType: doc.docType,
      url: doc.url,
      message: "Document soumis avec succès. En attente de validation.",
    },
    { status: 201 }
  );
}
