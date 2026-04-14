import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

const ADMIN_TYPES = new Set(['AGENCY', 'DEVELOPER'])

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ message: "Token d'authentification requis" }, { status: 401 }) }
  }

  try {
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: { id: true, userType: true }
    })

    if (!user || !ADMIN_TYPES.has(user.userType)) {
      return { error: NextResponse.json({ message: 'Acces non autorise' }, { status: 403 }) }
    }

    return { user }
  } catch {
    return { error: NextResponse.json({ message: 'Token invalide' }, { status: 401 }) }
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
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
    const auth = await requireAdmin(request)
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
      select: { id: true, userId: true }
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

    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId: auth.user.id,
        action: isVerify ? 'KYC_VERIFIED' : 'KYC_REJECTED',
        entity: 'KYC_DOCUMENT',
        entityId: updatedDoc.id,
        metadata: {
          targetUserId: existing.userId,
          rejectReason
        },
        createdAt: new Date()
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
