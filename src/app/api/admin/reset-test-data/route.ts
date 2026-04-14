import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminPermission } from '@/lib/auth/admin'
import { logAdminAudit } from '@/lib/audit/adminAudit'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'system:reset')
    if ('error' in auth) return auth.error

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'Endpoint desactive en production' },
        { status: 403 }
      )
    }

    await prisma.audit_logs.deleteMany()
    await prisma.notifications.deleteMany()
    await prisma.kyc_documents.deleteMany()
    await prisma.escrow_transactions.deleteMany()
    await prisma.transactions.deleteMany()
    await prisma.property_images.deleteMany()
    await prisma.properties.deleteMany()
    await prisma.sessions.deleteMany()

    await logAdminAudit({
      actorUserId: auth.user.id,
      action: 'SYSTEM_RESET_FULL',
      entity: 'SYSTEM',
      entityId: null,
      request,
      metadata: {
        resetScope: [
          'audit_logs',
          'notifications',
          'kyc_documents',
          'escrow_transactions',
          'transactions',
          'property_images',
          'properties',
          'sessions'
        ]
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Jeu de test nettoye (transactions/proprietes/sessions)'
    })
  } catch (error) {
    console.error('Reset test data error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la reinitialisation des donnees de test',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
