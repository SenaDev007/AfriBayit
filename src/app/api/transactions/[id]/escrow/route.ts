import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

type RouteContext = {
  params: { id: string }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const body = await request.json()
    const requestedStatus = String(body.status || '').toUpperCase()
    const normalizedStatus = requestedStatus === 'COMPLETED' ? 'RELEASED' : requestedStatus
    const targetStatus = normalizedStatus as
      | 'PENDING'
      | 'ESCROW'
      | 'RELEASED'
      | 'CANCELLED'
      | 'DISPUTED'

    if (!targetStatus) {
      return NextResponse.json({ message: 'status requis' }, { status: 400 })
    }

    if (!['PENDING', 'ESCROW', 'RELEASED', 'CANCELLED', 'DISPUTED'].includes(targetStatus)) {
      return NextResponse.json({ message: 'status invalide' }, { status: 400 })
    }

    const existingTransaction = await prisma.transactions.findUnique({
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

    if (!existingTransaction) {
      return NextResponse.json(
        { message: 'Transaction introuvable' },
        { status: 404 }
      )
    }

    const transaction = await prisma.transactions.update({
      where: { id: context.params.id },
      data: { status: targetStatus }
    })

    if (targetStatus === 'ESCROW') {
      const [buyerKyc, sellerKyc] = await Promise.all([
        prisma.kyc_documents.findFirst({
          where: {
            userId: transaction.senderId,
            isVerified: true
          },
          select: { id: true }
        }),
        prisma.kyc_documents.findFirst({
          where: {
            userId: transaction.receiverId,
            isVerified: true
          },
          select: { id: true }
        })
      ])

      if (!buyerKyc || !sellerKyc) {
        await prisma.transactions.update({
          where: { id: context.params.id },
          data: { status: 'PENDING' }
        })

        await prisma.escrow_transactions.updateMany({
          where: { reference: `TX-${context.params.id}` },
          data: {
            state: 'CREATED',
            fundedAt: null,
            updatedAt: new Date()
          }
        })

        return NextResponse.json(
          { message: 'KYC non verifie pour les deux parties. Escrow refuse.' },
          { status: 409 }
        )
      }

      await prisma.escrow_transactions.upsert({
        where: { reference: `TX-${context.params.id}` },
        create: {
          id: crypto.randomUUID(),
          reference: `TX-${context.params.id}`,
          type: 'PROPERTY_SALE',
          state: 'FUNDED',
          buyerId: transaction.senderId,
          sellerId: transaction.receiverId,
          amount: transaction.amount,
          commission: transaction.commission,
          netAmount: transaction.netAmount,
          currency: transaction.currency,
          fundedAt: new Date(),
          updatedAt: new Date(),
          stateHistory: [{ at: new Date().toISOString(), to: 'FUNDED' }]
        },
        update: {
          state: 'FUNDED',
          fundedAt: new Date(),
          updatedAt: new Date()
        }
      })

      await prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          action: 'ESCROW_FUNDED',
          entity: 'TRANSACTION',
          entityId: context.params.id,
          metadata: {
            targetStatus,
            reference: `TX-${context.params.id}`
          },
          createdAt: new Date()
        }
      })
    }

    if (targetStatus === 'RELEASED') {
      const escrow = await prisma.escrow_transactions.findUnique({
        where: { reference: `TX-${context.params.id}` },
        select: { state: true }
      })

      if (!escrow || escrow.state !== 'DEED_SIGNED') {
        return NextResponse.json(
          { message: 'Release refuse: acte notarie non signe (DEED_SIGNED requis).' },
          { status: 409 }
        )
      }

      await prisma.escrow_transactions.updateMany({
        where: { reference: `TX-${context.params.id}` },
        data: { state: 'RELEASED', releasedAt: new Date(), updatedAt: new Date() }
      })

      await prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          action: 'ESCROW_RELEASED',
          entity: 'TRANSACTION',
          entityId: context.params.id,
          metadata: {
            targetStatus,
            reference: `TX-${context.params.id}`
          },
          createdAt: new Date()
        }
      })
    }

    return NextResponse.json({ transactionId: context.params.id, status: targetStatus })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Transaction introuvable' },
        { status: 404 }
      )
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P1001') {
      return NextResponse.json(
        { message: 'Base de donnees temporairement indisponible' },
        { status: 503 }
      )
    }

    console.error('Escrow transition error:', error)
    return NextResponse.json({ message: 'Erreur transition escrow' }, { status: 500 })
  }
}
