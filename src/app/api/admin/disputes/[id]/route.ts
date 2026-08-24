import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';
const ADMIN_ROLES = ['SUPER_ADMIN', 'COUNTRY_ADMIN'] as const;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authGuard(request, { requiredRoles: [...ADMIN_ROLES] });
    if (!auth.success) return auth.response;
    const { id } = await params;
    const transaction = await db.transaction.findUnique({ where: { id }, include: { property: { select: { id: true, title: true, city: true, country: true, agentId: true } }, buyer: { select: { id: true, name: true, email: true, avatar: true } }, escrowAccount: { include: { ledger: true } }, timelineEvents: { orderBy: { createdAt: 'desc' } } } });
    if (!transaction || !transaction.disputeReason) return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    if (auth.role === 'COUNTRY_ADMIN' && transaction.property?.country && transaction.property.country !== auth.country) return NextResponse.json({ error: 'Hors périmètre pays', code: 'CROSS_TENANT_FORBIDDEN' }, { status: 403 });
    let seller: { id: string; name: string; email: string; avatar: string | null } | null = null;
    if (transaction.property?.agentId) seller = await db.user.findUnique({ where: { id: transaction.property.agentId }, select: { id: true, name: true, email: true, avatar: true } });
    return NextResponse.json({ dispute: { ...transaction, seller } });
  } catch (error) { console.error('Admin dispute detail error:', error); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authGuard(request, { requiredRoles: [...ADMIN_ROLES] });
    if (!auth.success) return auth.response;
    const { id } = await params;
    const body = await request.json();
    const { action, resolution, splitBuyer, splitSeller } = body;
    if (!action || !['escalate', 'resolve'].includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    const transaction = await db.transaction.findUnique({ where: { id }, include: { property: { select: { country: true } }, escrowAccount: true } });
    if (!transaction || !transaction.disputeReason) return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    if (auth.role === 'COUNTRY_ADMIN' && transaction.property?.country && transaction.property.country !== auth.country) return NextResponse.json({ error: 'Hors périmètre pays', code: 'CROSS_TENANT_FORBIDDEN' }, { status: 403 });
    if (action === 'escalate') {
      const updated = await db.transaction.update({ where: { id }, data: { status: 'NOTARY_IN_PROGRESS' }, include: { property: { select: { id: true, title: true, city: true, country: true } }, buyer: { select: { id: true, name: true, email: true } }, escrowAccount: true } });
      return NextResponse.json({ success: true, transaction: updated });
    }
    const updateData: Record<string, unknown> = { status: 'REFUNDED' };
    if (resolution) updateData.disputeReason = `${transaction.disputeReason} [RESOLVED: ${resolution}]`;
    if (splitBuyer !== undefined && splitSeller !== undefined && transaction.escrowAccount) {
      const totalHeld = Number(transaction.escrowAccount.heldAmount);
      const buyerAmount = totalHeld * (splitBuyer / 100);
      const sellerAmount = totalHeld * (splitSeller / 100);
      await db.escrowAccount.update({ where: { id: transaction.escrowAccount.id }, data: { releasedAmount: buyerAmount, refundedAmount: sellerAmount, status: 'PARTIAL_RELEASE' } });
    }
    const updated = await db.transaction.update({ where: { id }, data: updateData, include: { property: { select: { id: true, title: true, city: true, country: true } }, buyer: { select: { id: true, name: true, email: true } }, escrowAccount: true } });
    return NextResponse.json({ success: true, transaction: updated });
  } catch (error) { console.error('Admin dispute update error:', error); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
