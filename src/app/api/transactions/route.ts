import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const transactions = await prisma.transactions.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    const references = transactions.map((tx) => `TX-${tx.id}`)
    const txIds = transactions.map((tx) => tx.id)
    const escrows = references.length
      ? await prisma.escrow_transactions.findMany({
          where: { reference: { in: references } },
          select: { reference: true, state: true, updatedAt: true }
        })
      : []

    const escrowMap = new Map(escrows.map((e) => [e.reference, e]))
    const audits = txIds.length
      ? await prisma.audit_logs.findMany({
          where: {
            entity: 'TRANSACTION',
            entityId: { in: txIds }
          },
          orderBy: { createdAt: 'desc' },
          select: {
            entityId: true,
            action: true,
            createdAt: true
          }
        })
      : []

    const auditMap = new Map<string, Array<{ action: string; createdAt: Date }>>()
    for (const log of audits) {
      const key = log.entityId || ''
      if (!key) continue
      const current = auditMap.get(key) || []
      current.push({ action: log.action, createdAt: log.createdAt })
      auditMap.set(key, current)
    }

    const enrichedTransactions = transactions.map((tx) => {
      const escrow = escrowMap.get(`TX-${tx.id}`)
      return {
        ...tx,
        escrowState: escrow?.state || null,
        escrowUpdatedAt: escrow?.updatedAt || null,
        auditTrail: auditMap.get(tx.id) || []
      }
    })

    return NextResponse.json({ transactions: enrichedTransactions })
  } catch (error) {
    console.error('Transactions fetch error:', error)
    return NextResponse.json({ transactions: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.senderId || !body.receiverId || !body.amount) {
      return NextResponse.json(
        { message: 'senderId, receiverId et amount sont requis' },
        { status: 400 }
      )
    }

    const transaction = await prisma.transactions.create({
      data: {
        id: crypto.randomUUID(),
        bookingId: body.bookingId || null,
        senderId: body.senderId,
        receiverId: body.receiverId,
        amount: body.amount,
        commission: body.commission ?? 0,
        netAmount: body.netAmount ?? body.amount,
        currency: body.currency || 'XOF',
        type: body.type || 'PROPERTY_SALE',
        status: 'PENDING',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error('Transaction create error:', error)
    return NextResponse.json({ message: 'Erreur creation transaction' }, { status: 500 })
  }
}
