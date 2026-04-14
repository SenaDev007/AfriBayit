import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { emailService } from '@/lib/services/emailService'

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { message: 'Email requis' },
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

        // Generate a new verification code
        const newCode = Math.floor(100000 + Math.random() * 900000).toString()


        // Invalidate existing codes for this email/type
        try {
            await prisma.verificationCode.deleteMany({ where: { email, type: 'PASSWORD_RESET' } })
        } catch (e) {
        }

        // Persist the new code with 10 minutes expiry
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
        await prisma.verificationCode.create({
            data: {
                email,
                code: newCode,
                type: 'PASSWORD_RESET',
                isUsed: false,
                expiresAt
            }
        })

        // Send verification code via email (non-blocking)
        emailService.sendVerificationCode(
            email,
            newCode,
            user.firstName || undefined
        ).catch(() => {
            // Don't fail the request if email sending fails
        })

        return NextResponse.json({
            message: 'Nouveau code de vérification envoyé'
        })

    } catch (error) {
        console.error('Resend code error:', error)
        return NextResponse.json(
            { message: 'Erreur interne du serveur' },
            { status: 500 }
        )
    }
}
