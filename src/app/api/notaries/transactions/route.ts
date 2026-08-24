// GET /api/notaries/transactions — Get notary-assigned transactions (CDC §5.0bis)
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const userId = (session.user as any).id;
    let transactions: any[] = [];

    try {
      transactions = await (db as any).transaction.findMany({
        where: { notaryId: userId, status: { in: ['NOTARY_ASSIGNED', 'NOTARY_IN_PROGRESS', 'DEED_SIGNED', 'ANDF_REGISTERED'] } },
        include: { property: { select: { title: true, city: true, country: true } }, buyer: { select: { name: true } }, seller: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }) ?? [];
    } catch {}

    return NextResponse.json({ transactions: transactions.map(t => ({
      id: t.id, propertyTitle: t.property?.title || 'Bien', buyer: t.buyer?.name || 'N/A',
      seller: t.seller?.name || 'N/A', amount: t.amount, status: t.status,
      country: t.property?.country || 'BJ', createdAt: t.createdAt?.toISOString(),
      notaryStartedAt: t.notaryStartedAt?.toISOString() || t.updatedAt?.toISOString(),
    }))});
  } catch { return NextResponse.json({ transactions: [] }); }
}
