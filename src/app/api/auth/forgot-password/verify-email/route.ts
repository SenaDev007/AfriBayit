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
            where: { email },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                createdAt: true,
                lastLoginAt: true
            }
        })

        if (!user) {
            return NextResponse.json(
                { message: 'Aucun compte associé à cet email' },
                { status: 404 }
            )
        }

        // Generate a verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

        console.log(`Verification code for ${email}: ${verificationCode}`)

        // Invalidate any previous codes for this email/type
        try {
            await prisma.verificationCode.deleteMany({
                where: { email, type: 'PASSWORD_RESET' }
            })
        } catch (e) {
            console.warn('Cleanup previous verification codes failed (verify-email):', e)
        }

        // Persist the new code with 10 minutes expiry
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
        await prisma.verificationCode.create({
            data: {
                email,
                code: verificationCode,
                type: 'PASSWORD_RESET',
                isUsed: false,
                expiresAt
            }
        })

        // Send verification code via email (non-blocking)
        emailService.sendVerificationCode(
            email,
            verificationCode,
            user.firstName || undefined
        ).catch(() => {
            // Don't fail the request if email sending fails
        })

        return NextResponse.json({
            message: 'Code de vérification envoyé à votre email',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        })

    } catch (error) {
        console.error('Email verification error:', error)
        return NextResponse.json(
            { message: 'Erreur interne du serveur' },
            { status: 500 }
        )
    }
}
