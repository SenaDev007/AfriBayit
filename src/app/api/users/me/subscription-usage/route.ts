// GET /api/users/me/subscription-usage — Real usage counts (CDC §5.5b)
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id || '';

    const [annonces, photos, conversations] = await Promise.all([
      db.property.count({ where: { owner: { id: userId }, status: 'published' as const } }).catch(() => 0),
      (db as unknown as { propertyImage?: { count: (args: unknown) => Promise<number> } }).propertyImage?.count?.({ where: { property: { ownerId: userId } } })?.catch?.(() => 0) ?? 0,
      (db as unknown as { conversation?: { count: (args: unknown) => Promise<number> } }).conversation?.count?.({ where: { participants: { some: { userId } } } })?.catch?.(() => 0) ?? 0,
    ]);

    return NextResponse.json({ annonces, photos, inmail: conversations });
  } catch (error) {
    console.error('[users/me/subscription-usage] Error:', error);
    return NextResponse.json({ annonces: 0, photos: 0, inmail: 0 });
  }
}
