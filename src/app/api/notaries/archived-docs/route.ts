// GET /api/notaries/archived-docs (CDC §5.0bis)
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const userId = (session.user as { id?: string }).id || '';
    let docs: any[] = [];

    try {
      docs = await (db as unknown as { notarialDocument: { findMany: (a: unknown) => Promise<unknown[]> } }).notarialDocument.findMany({
        where: { notaryId: userId }, orderBy: { createdAt: 'desc' }, take: 50,
      }) ?? [];
    } catch {}

    return NextResponse.json({ docs: docs.map(d => ({
      id: d.id, name: d.fileName, date: d.createdAt?.toISOString().split('T')[0], hash: d.hash,
    }))});
  } catch { return NextResponse.json({ docs: [] }); }
}
