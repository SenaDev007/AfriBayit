import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

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

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { profile: true }
        })

        if (!user) {
            return NextResponse.json(
                { message: 'Utilisateur non trouvé' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileType: user.profileType,
            avatarUrl: user.avatarUrl,
            isVerified: user.isVerified,
            isPremium: user.isPremium,
            reputationScore: user.reputationScore,
            profile: user.profile
        })

    } catch (error) {
        console.error('Get user error:', error)
        return NextResponse.json(
            { message: 'Token invalide' },
            { status: 401 }
        )
    }
}
