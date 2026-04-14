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

        // Delete session from database
        await prisma.session.deleteMany({
            where: {
                userId: decoded.userId,
                token: token
            }
        })

        return NextResponse.json({
            message: 'Déconnexion réussie'
        })

    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json(
            { message: 'Erreur lors de la déconnexion' },
            { status: 500 }
        )
    }
}
