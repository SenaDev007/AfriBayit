import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
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

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        })

        if (!user) {
            return NextResponse.json(
                { message: 'Utilisateur non trouvé' },
                { status: 404 }
            )
        }

        // Generate new JWT token
        const newToken = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        )

        // Update session in database
        await prisma.session.updateMany({
            where: {
                userId: user.id,
                token: token
            },
            data: {
                token: newToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        })

        return NextResponse.json({
            token: newToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        })

    } catch (error) {
        console.error('Refresh token error:', error)
        return NextResponse.json(
            { message: 'Token invalide' },
            { status: 401 }
        )
    }
}
