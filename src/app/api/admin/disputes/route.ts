import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminPermission } from '@/lib/auth/admin'
import { logAdminAudit } from '@/lib/audit/adminAudit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'escrow:resolve')
    if ('error' in auth) return auth.error

    const disputes = await prisma.transactions.findMany({
      where: { status: 'DISPUTED' },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        amount: true,
        currency: true,
        updatedAt: true
      }
    })

    const escrows = await prisma.escrow_transactions.findMany({
      where: { reference: { in: disputes.map((tx) => `TX-${tx.id}`) } },
      select: { reference: true, state: true, disputeReason: true }
    })
    const escrowMap = new Map(escrows.map((e) => [e.reference, e]))

    return NextResponse.json({
      disputes: disputes.map((tx) => ({
        ...tx,
        escrow: escrowMap.get(`TX-${tx.id}`) || null
      }))
    })
  } catch (error) {
    console.error('Admin disputes list error:', error)
    return NextResponse.json({ message: 'Erreur chargement litiges' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'escrow:resolve')
    if ('error' in auth) return auth.error

    const body = await request.json()
    const transactionId = String(body.transactionId || '')
    const resolution = String(body.resolution || '').toUpperCase()
    const note = body.note ? String(body.note) : null

    if (!transactionId || !['RELEASE', 'REFUND'].includes(resolution)) {
      return NextResponse.json(
        { message: 'transactionId et resolution(RELEASE|REFUND) requis' },
        { status: 400 }
      )
    }

    const tx = await prisma.transactions.findUnique({
      where: { id: transactionId },
      select: { id: true, status: true }
    })
    if (!tx) return NextResponse.json({ message: 'Transaction introuvable' }, { status: 404 })
    if (tx.status !== 'DISPUTED') {
      return NextResponse.json({ message: 'Transaction non en litige' }, { status: 409 })
    }

    const toStatus = resolution === 'RELEASE' ? 'RELEASED' : 'REFUNDED'
    const toEscrowState = resolution === 'RELEASE' ? 'RELEASED' : 'REFUNDED'
    await prisma.transactions.update({
      where: { id: transactionId },
      data: { status: toStatus, updatedAt: new Date() }
    })
    await prisma.escrow_transactions.updateMany({
      where: { reference: `TX-${transactionId}` },
      data: {
        state: toEscrowState,
        releasedAt: resolution === 'RELEASE' ? new Date() : null,
        refundedAt: resolution === 'REFUND' ? new Date() : null,
        updatedAt: new Date(),
        disputeReason: null
      }
    })

    await logAdminAudit({
      actorUserId: auth.user.id,
      action: resolution === 'RELEASE' ? 'DISPUTE_RESOLVED_RELEASE' : 'DISPUTE_RESOLVED_REFUND',
      entity: 'TRANSACTION',
      entityId: transactionId,
      request,
      metadata: {
        resolution,
        note,
        before: { status: 'DISPUTED' },
        after: { status: toStatus, escrowState: toEscrowState }
      }
    })

    return NextResponse.json({
      message: resolution === 'RELEASE' ? 'Litige resolu par release' : 'Litige resolu par remboursement',
      transactionId,
      status: toStatus
    })
  } catch (error) {
    console.error('Admin dispute resolution error:', error)
    return NextResponse.json({ message: 'Erreur resolution litige' }, { status: 500 })
  }
}
