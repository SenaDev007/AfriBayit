import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const { email, code, newPassword } = await request.json()

        if (!email || !code || !newPassword) {
            return NextResponse.json(
                { message: 'Email, code et nouveau mot de passe requis' },
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

        // Validate the verification code against DB (latest, unexpired, unused)
        if (!/^\d{6}$/.test(code)) {
            return NextResponse.json(
                { message: 'Code de vérification invalide. Le code que vous avez saisi ne correspond pas à celui envoyé. Veuillez réessayer !' },
                { status: 400 }
            )
        }

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

        // Validate password strength
        if (newPassword.length < 12) {
            return NextResponse.json(
                { message: 'Le mot de passe doit contenir au moins 12 caractères' },
                { status: 400 }
            )
        }

        if (!/[A-Z]/.test(newPassword)) {
            return NextResponse.json(
                { message: 'Le mot de passe doit contenir au moins une lettre majuscule' },
                { status: 400 }
            )
        }

        if (!/[a-z]/.test(newPassword)) {
            return NextResponse.json(
                { message: 'Le mot de passe doit contenir au moins une lettre minuscule' },
                { status: 400 }
            )
        }

        if (!/\d/.test(newPassword)) {
            return NextResponse.json(
                { message: 'Le mot de passe doit contenir au moins un chiffre' },
                { status: 400 }
            )
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
            return NextResponse.json(
                { message: 'Le mot de passe doit contenir au moins un caractère spécial' },
                { status: 400 }
            )
        }

        if (/\s/.test(newPassword)) {
            return NextResponse.json(
                { message: 'Le mot de passe ne doit pas contenir d\'espaces' },
                { status: 400 }
            )
        }

        // Check if the new password is the same as the current password
        const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash)
        if (isSamePassword) {
            return NextResponse.json(
                { message: 'Vous ne pouvez pas réutiliser votre mot de passe actuel. Veuillez choisir un nouveau mot de passe.' },
                { status: 400 }
            )
        }

        // Hash the new password
        const passwordHash = await bcrypt.hash(newPassword, 12)

        // Update the user's password
        await prisma.user.update({
            where: { email },
            data: { passwordHash }
        })

        // Mark code as used
        await prisma.verificationCode.update({
            where: { id: record.id },
            data: { isUsed: true }
        })

        // In a real implementation, you would also:
        // 1. Invalidate the verification code
        // 2. Invalidate all existing sessions
        // 3. Send a confirmation email

        return NextResponse.json({
            message: 'Mot de passe réinitialisé avec succès'
        })

    } catch (error) {
        console.error('Password reset error:', error)
        return NextResponse.json(
            { message: 'Erreur interne du serveur' },
            { status: 500 }
        )
    }
}
