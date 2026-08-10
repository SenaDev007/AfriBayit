import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getSignedUploadUrl,
  getSignedDownloadUrl,
  generateStorageKey,
} from '@/lib/storage/r2';
import { z } from 'zod';

const signedUrlSchema = z.object({
  operation: z.enum(['upload', 'download']),
  key: z.string().optional(),
  filename: z.string().optional(),
  prefix: z.string().optional(),
  contentType: z.string().optional(),
  expiresIn: z.number().min(60).max(3600).optional(),
});

/**
 * POST /api/storage/signed-url
 * Generate a signed URL for direct client-side upload or download
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    const body = await request.json();
    const validation = signedUrlSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { operation, key, filename, prefix, contentType, expiresIn } = validation.data;

    if (operation === 'upload') {
      if (!filename || !contentType) {
        return NextResponse.json(
          { error: 'filename et contentType requis pour l\'upload' },
          { status: 400 }
        );
      }

      const storageKey = generateStorageKey(
        `${prefix || 'uploads'}/${userId}`,
        filename
      );

      const url = await getSignedUploadUrl(storageKey, contentType, expiresIn);

      return NextResponse.json({
        url,
        key: storageKey,
        operation: 'upload',
        expiresIn: expiresIn || 900,
      });
    }

    if (operation === 'download') {
      if (!key) {
        return NextResponse.json(
          { error: 'key requis pour le téléchargement' },
          { status: 400 }
        );
      }

      const url = await getSignedDownloadUrl(key, expiresIn);

      return NextResponse.json({
        url,
        key,
        operation: 'download',
        expiresIn: expiresIn || 900,
      });
    }

    return NextResponse.json({ error: 'Opération non supportée' }, { status: 400 });
  } catch (error) {
    console.error('Signed URL error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de l\'URL signée' },
      { status: 500 }
    );
  }
}
