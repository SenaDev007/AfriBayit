import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  uploadFile,
  generateStorageKey,
  isValidFileType,
  isValidFileSize,
} from '@/lib/storage/r2';

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

/**
 * POST /api/storage/upload
 * Upload a file to Cloudflare R2 storage
 * Accepts multipart/form-data with a 'file' field
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const prefix = (formData.get('prefix') as string) || 'uploads';

    if (!file) {
      return NextResponse.json(
        { error: 'Fichier requis' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isValidFileType(file.type, ALLOWED_TYPES)) {
      return NextResponse.json(
        { error: `Type de fichier non supporté. Types acceptés: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (!isValidFileSize(file.size, MAX_FILE_SIZE_MB)) {
      return NextResponse.json(
        { error: `Fichier trop volumineux. Taille maximale: ${MAX_FILE_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    // Generate unique key
    const key = generateStorageKey(`${prefix}/${userId}`, file.name);

    // Upload to R2
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadFile(key, buffer, file.type);

    return NextResponse.json({
      url,
      key,
      contentType: file.type,
      size: file.size,
      message: 'Fichier uploadé avec succès',
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du fichier' },
      { status: 500 }
    );
  }
}
