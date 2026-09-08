// POST /api/chat/conversations/:id/stop-typing (CDC §5.7)
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPusherServer } from '@/lib/realtime/pusher-server';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const pusher = getPusherServer();
    if (pusher) {
      await pusher.trigger(`private-conversation-${params.id}`, 'stop-typing', {
        userId: (session.user as { id?: string }).id || '',
      });
    }
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ success: true }); }
}
