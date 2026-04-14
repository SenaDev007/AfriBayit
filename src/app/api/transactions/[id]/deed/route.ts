import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type RouteContext = {
  params: { id: string }
}

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const tx = await prisma.transactions.findUnique({
      where: { id: context.params.id },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        amount: true,
        commission: true,
        netAmount: true,
        currency: true
      }
    })

    if (!tx) {
      return NextResponse.json({ message: 'Transaction introuvable' }, { status: 404 })
    }

    await prisma.escrow_transactions.upsert({
      where: { reference: `TX-${context.params.id}` },
      create: {
        id: crypto.randomUUID(),
        reference: `TX-${context.params.id}`,
        type: 'PROPERTY_SALE',
        state: 'DEED_SIGNED',
        buyerId: tx.senderId,
        sellerId: tx.receiverId,
        amount: tx.amount,
        commission: tx.commission,
        netAmount: tx.netAmount,
        currency: tx.currency,
        deedSignedAt: new Date(),
        updatedAt: new Date(),
        stateHistory: [{ at: new Date().toISOString(), to: 'DEED_SIGNED' }]
      },
      update: {
        state: 'DEED_SIGNED',
        deedSignedAt: new Date(),
        updatedAt: new Date()
      }
    })

    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        action: 'DEED_SIGNED',
        entity: 'TRANSACTION',
        entityId: context.params.id,
        metadata: { reference: `TX-${context.params.id}` },
        createdAt: new Date()
      }
    })

    return NextResponse.json({ transactionId: context.params.id, escrowState: 'DEED_SIGNED' })
  } catch (error) {
    return NextResponse.json({ message: 'Erreur signature acte' }, { status: 500 })
  }
}
