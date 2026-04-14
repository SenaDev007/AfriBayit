import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const { email, code } = await request.json()

        if (!email || !code) {
            return NextResponse.json(
                { message: 'Code de vérification requis' },
                { status: 400 }
            )
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return NextResponse.json(
                { message: 'Aucun compte trouvé avec cet email' },
                { status: 404 }
            )
        }

        // Basic format validation: must be exactly 6 digits
        if (!/^\d{6}$/.test(code)) {
            return NextResponse.json(
                { message: 'Code de vérification invalide. Le code que vous avez saisi ne correspond pas à celui envoyé. Veuillez réessayer !' },
                { status: 400 }
            )
        }

        // Fetch the latest active code for this email
        const record = await prisma.verificationCode.findFirst({
            where: {
                email,
                type: 'PASSWORD_RESET',
                isUsed: false,
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        })

        if (!record || record.code !== code) {
            return NextResponse.json(
                { message: 'Code de vérification invalide. Le code que vous avez saisi ne correspond pas à celui envoyé. Veuillez réessayer !' },
                { status: 400 }
            )
        }

        // 4. Return success

        return NextResponse.json({
            message: 'Code vérifié avec succès',
            verified: true
        })

    } catch (error) {
        console.error('Code verification error:', error)
        return NextResponse.json(
            { message: 'Erreur interne du serveur' },
            { status: 500 }
        )
    }
}
