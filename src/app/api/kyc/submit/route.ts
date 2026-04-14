import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Token requis' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body = await request.json()

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 })
    }

    const document = await prisma.kyc_documents.create({
      data: {
        id: crypto.randomUUID(),
        userId: decoded.userId,
        docType: body.documentType || 'CNI',
        url: body.documentUrl || 'pending://upload',
        mimeType: body.mimeType,
        fileSize: body.fileSize
      }
    })

    return NextResponse.json({
      message: 'Demande KYC enregistree',
      kyc: {
        status: 'PENDING',
        documentId: document.id,
        documentType: document.docType
      }
    })
  } catch (error) {
    console.error('KYC submit error:', error)
    return NextResponse.json({ message: 'Erreur KYC' }, { status: 500 })
  }
}
