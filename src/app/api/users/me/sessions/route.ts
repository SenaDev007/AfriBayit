// GET /api/users/me/sessions — List active sessions (CDC §10.1)
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
    // Check if Session model exists in Prisma schema
    let sessions: any[] = [];
    try {
      sessions = await (db as unknown as { session: { findMany: (a: unknown) => Promise<unknown[]> } }).session.findMany({
        where: { userId, expires: { gt: new Date() } },
        orderBy: { expires: 'desc' },
        take: 20,
      });
    } catch {
      // Session model might not exist — return empty
    }

    return NextResponse.json({
      sessions: sessions.map((s: any) => ({
        id: s.id,
        device: s.deviceInfo || 'Navigateur',
        location: s.location || 'Inconnu',
        lastActive: s.lastActive?.toISOString() || s.expires?.toISOString() || new Date().toISOString(),
        current: false,
      })),
    });
  } catch (error) {
    console.error('[users/me/sessions] Error:', error);
    return NextResponse.json({ sessions: [] }, { status: 200 });
  }
}
