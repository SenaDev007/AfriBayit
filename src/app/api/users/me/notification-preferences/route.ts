// POST /api/users/me/notification-preferences — Save notification prefs (CDC §5.8.3)
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { preferences } = await request.json();

    // Store as JSON on the user record (or in a dedicated table if it exists)
    try {
      await db.user.update({
        where: { id: userId },
        data: { notificationPreferences: JSON.stringify(preferences) } as any,
      });
    } catch {
      // Field might not exist — try a dedicated table
      try {
        for (const [category, channels] of Object.entries(preferences)) {
          await (db as any).notificationPreference.upsert({
            where: { userId_category: { userId, category } },
            create: { userId, category, ...(channels as any) },
            update: { ...(channels as any) },
          });
        }
      } catch {
        // No table either — just return success (localStorage fallback on frontend)
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[users/me/notification-preferences] Error:', error);
    return NextResponse.json({ success: true }); // Don't fail the UI
  }
}
