import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminPermission } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'audit:read')
    if ('error' in auth) return auth.error

    const [pendingKyc, disputedTransactions, unreconciledEscrows, recentCriticalLogs] = await Promise.all([
      prisma.kyc_documents.count({
        where: { isVerified: false, rejectedAt: null }
      }),
      prisma.transactions.count({
        where: { status: 'DISPUTED' }
      }),
      prisma.escrow_transactions.count({
        where: { state: 'DISPUTED' }
      }),
      prisma.audit_logs.findMany({
        where: {
          action: {
            in: ['KYC_REJECTED', 'ESCROW_RELEASED', 'SYSTEM_RESET_FULL', 'SYSTEM_RESET_SIMPLE']
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          action: true,
          entity: true,
          createdAt: true,
          metadata: true
        }
      })
    ])

    return NextResponse.json({
      summary: {
        pendingKyc,
        disputedTransactions,
        unreconciledEscrows
      },
      recentCriticalLogs
    })
  } catch (error) {
    console.error('Admin alerts error:', error)
    return NextResponse.json(
      { message: "Erreur lors de la recuperation des alertes admin" },
      { status: 500 }
    )
  }
}
