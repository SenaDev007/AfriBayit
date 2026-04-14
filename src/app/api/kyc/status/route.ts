import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        kyc: { status: 'UNAUTHENTICATED' },
        message: 'Token requis'
      })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

    const latestDoc = await prisma.kyc_documents.findFirst({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' }
    })

    const kyc = latestDoc
      ? {
          status: latestDoc.isVerified ? 'VERIFIED' : 'PENDING',
          documentId: latestDoc.id,
          documentType: latestDoc.docType,
          submittedAt: latestDoc.createdAt
        }
      : { status: 'NOT_SUBMITTED' }
    return NextResponse.json({ kyc })
  } catch (error) {
    console.error('KYC status error:', error)
    return NextResponse.json({ message: 'Erreur KYC' }, { status: 500 })
  }
}
