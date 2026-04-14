import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = body.userId as string | undefined
    const documentId = body.documentId as string | undefined

    if (!userId && !documentId) {
      return NextResponse.json(
        { message: 'userId ou documentId requis' },
        { status: 400 }
      )
    }

    let targetDocumentId = documentId

    if (!targetDocumentId && userId) {
      const latestDoc = await prisma.kyc_documents.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true }
      })

      if (!latestDoc) {
        const created = await prisma.kyc_documents.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            docType: 'CNI',
            url: 'verified://manual-dev-validation',
            isVerified: true,
            verifiedAt: new Date()
          }
        })
        targetDocumentId = created.id
      } else {
        targetDocumentId = latestDoc.id
      }
    }

    const updated = await prisma.kyc_documents.update({
      where: { id: targetDocumentId! },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        rejectedAt: null,
        rejectReason: null
      }
    })

    await prisma.users.updateMany({
      where: { id: updated.userId },
      data: {
        kycStatus: 'VERIFIED'
      }
    })

    return NextResponse.json({
      message: 'KYC verifie avec succes',
      documentId: updated.id,
      userId: updated.userId
    })
  } catch (error) {
    return NextResponse.json({ message: 'Erreur verification KYC' }, { status: 500 })
  }
}
