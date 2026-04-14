import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminPermission } from '@/lib/auth/admin'
import { logAdminAudit } from '@/lib/audit/adminAudit'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'kyc:review')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const status = (searchParams.get('status') || 'PENDING').toUpperCase()

    const where =
      status === 'VERIFIED'
        ? { isVerified: true }
        : status === 'REJECTED'
          ? { rejectedAt: { not: null } }
          : { isVerified: false, rejectedAt: null }

    const documents = await prisma.kyc_documents.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            userType: true,
            kycStatus: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({
      kycDocuments: documents
    })
  } catch (error) {
    console.error('Admin KYC list error:', error)
    return NextResponse.json({ message: 'Erreur chargement KYC admin' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'kyc:review')
    if ('error' in auth) return auth.error

    const body = await request.json()
    const documentId = String(body.documentId || '')
    const action = String(body.action || '').toUpperCase()
    const rejectReason = body.rejectReason ? String(body.rejectReason) : null

    if (!documentId || !['VERIFY', 'REJECT'].includes(action)) {
      return NextResponse.json({ message: 'documentId et action requis (VERIFY|REJECT)' }, { status: 400 })
    }

    const existing = await prisma.kyc_documents.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        userId: true,
        isVerified: true,
        verifiedAt: true,
        rejectedAt: true,
        rejectReason: true
      }
    })

    if (!existing) {
      return NextResponse.json({ message: 'Document KYC introuvable' }, { status: 404 })
    }

    const isVerify = action === 'VERIFY'
    const updatedDoc = await prisma.kyc_documents.update({
      where: { id: documentId },
      data: {
        isVerified: isVerify,
        verifiedAt: isVerify ? new Date() : null,
        rejectedAt: isVerify ? null : new Date(),
        rejectReason: isVerify ? null : rejectReason,
        verifiedBy: auth.user.id
      }
    })

    await prisma.users.update({
      where: { id: existing.userId },
      data: {
        kycStatus: isVerify ? 'VERIFIED' : 'REJECTED'
      }
    })

    await logAdminAudit({
      actorUserId: auth.user.id,
      action: isVerify ? 'KYC_VERIFIED' : 'KYC_REJECTED',
      entity: 'KYC_DOCUMENT',
      entityId: updatedDoc.id,
      request,
      metadata: {
        targetUserId: existing.userId,
        reason: rejectReason,
        before: {
          isVerified: existing.isVerified,
          verifiedAt: existing.verifiedAt,
          rejectedAt: existing.rejectedAt,
          rejectReason: existing.rejectReason
        },
        after: {
          isVerified: updatedDoc.isVerified,
          verifiedAt: updatedDoc.verifiedAt,
          rejectedAt: updatedDoc.rejectedAt,
          rejectReason: updatedDoc.rejectReason
        }
      }
    })

    return NextResponse.json({
      message: isVerify ? 'KYC valide' : 'KYC rejete',
      kycDocument: updatedDoc
    })
  } catch (error) {
    console.error('Admin KYC update error:', error)
    return NextResponse.json({ message: 'Erreur mise a jour KYC' }, { status: 500 })
  }
}
