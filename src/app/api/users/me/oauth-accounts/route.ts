// GET /api/users/me/oauth-accounts — List linked OAuth accounts (CDC §4.1)
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
    const user = await db.user.findUnique({ where: { id: userId } });

    // Check if Account model exists (NextAuth stores OAuth accounts there)
    let accounts: any[] = [];
    try {
      accounts = await (db as unknown as { account: { findMany: (a: unknown) => Promise<unknown[]> } }).account.findMany({ where: { userId } });
    } catch {
      // Account model might not exist
    }

    const providers = ['google', 'facebook', 'apple'];
    const linked = new Map(accounts.map((a: any) => [a.provider, a]));

    return NextResponse.json({
      google: { linked: linked.has('google'), linkedAt: linked.get('google')?.createdAt?.toISOString() || null },
      facebook: { linked: linked.has('facebook'), linkedAt: linked.get('facebook')?.createdAt?.toISOString() || null },
      apple: { linked: linked.has('apple'), linkedAt: linked.get('apple')?.createdAt?.toISOString() || null },
      hasPassword: !!user?.password,
      canUnlink: accounts.length > 0 || !!user?.password,
    });
  } catch (error) {
    console.error('[users/me/oauth-accounts] Error:', error);
    return NextResponse.json({
      google: { linked: false, linkedAt: null },
      facebook: { linked: false, linkedAt: null },
      apple: { linked: false, linkedAt: null },
      hasPassword: true,
      canUnlink: false,
    }, { status: 200 });
  }
}
