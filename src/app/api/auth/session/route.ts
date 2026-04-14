import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'Token d\'authentification requis' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

        // Get session from database
        const session = await prisma.session.findFirst({
            where: {
                userId: decoded.userId,
                token: token,
                expiresAt: {
                    gt: new Date()
                }
            }
        })

        if (!session) {
            return NextResponse.json(
                { message: 'Session expirée' },
                { status: 401 }
            )
        }

        return NextResponse.json({
            id: session.id,
            token: session.token,
            expiresAt: session.expiresAt
        })

    } catch (error) {
        console.error('Get session error:', error)
        return NextResponse.json(
            { message: 'Session invalide' },
            { status: 401 }
        )
    }
}
