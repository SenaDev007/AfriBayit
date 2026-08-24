import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';
const ADMIN_ROLES = ['SUPER_ADMIN', 'COUNTRY_ADMIN'] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authGuard(request, { requiredRoles: [...ADMIN_ROLES] });
    if (!auth.success) return auth.response;
    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;
    if (!action || !['flag', 'escalate', 'unflag'].includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    const transaction = await db.transaction.findUnique({ where: { id }, include: { property: { select: { id: true, title: true, city: true, country: true } }, buyer: { select: { id: true, name: true, email: true } }, escrowAccount: true } });
    if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    if (auth.role === 'COUNTRY_ADMIN' && transaction.property?.country && transaction.property.country !== auth.country) return NextResponse.json({ error: 'Hors périmètre pays', code: 'CROSS_TENANT_FORBIDDEN' }, { status: 403 });
    if (action === 'flag') {
      const updated = await db.transaction.update({ where: { id }, data: { disputeReason: reason ? `[FLAGGED] ${reason}` : '[FLAGGED] Flagged' }, include: { property: { select: { id: true, title: true, city: true, country: true } }, buyer: { select: { id: true, name: true, email: true } }, escrowAccount: true } });
      return NextResponse.json({ success: true, transaction: updated });
    }
    if (action === 'escalate') {
      const updated = await db.transaction.update({ where: { id }, data: { status: 'DISPUTED', disputeReason: transaction.disputeReason ? `${transaction.disputeReason} [ESCALATED${reason ? ': ' + reason : ''}]` : `[ESCALATED${reason ? ': ' + reason : ''}]` }, include: { property: { select: { id: true, title: true, city: true, country: true } }, buyer: { select: { id: true, name: true, email: true } }, escrowAccount: true } });
      if (transaction.escrowAccount) await db.escrowAccount.update({ where: { id: transaction.escrowAccount.id }, data: { status: 'DISPUTED' } });
      return NextResponse.json({ success: true, transaction: updated });
    }
    const updated = await db.transaction.update({ where: { id }, data: { disputeReason: null, status: transaction.status === 'DISPUTED' ? 'FUNDED' : transaction.status }, include: { property: { select: { id: true, title: true, city: true, country: true } }, buyer: { select: { id: true, name: true, email: true } }, escrowAccount: true } });
    if (transaction.escrowAccount && transaction.escrowAccount.status === 'DISPUTED') await db.escrowAccount.update({ where: { id: transaction.escrowAccount.id }, data: { status: 'FUNDED' } });
    return NextResponse.json({ success: true, transaction: updated });
  } catch (error) { console.error('Admin transaction update error:', error); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
