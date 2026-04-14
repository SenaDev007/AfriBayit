import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'
import { SecurityService } from '@/lib/security'

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
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

        // Generate 2FA secret
        const secret = SecurityService.generate2FASecret()

        // Save 2FA secret to database
        await prisma.twoFactorAuth.upsert({
            where: { userId: decoded.userId },
            update: { secret },
            create: {
                userId: decoded.userId,
                secret,
                isEnabled: false
            }
        })

        return NextResponse.json({
            secret,
            qrCode: `otpauth://totp/AfriBayit:${decoded.userId}?secret=${secret}&issuer=AfriBayit`
        })

    } catch (error) {
        console.error('2FA setup error:', error)
        return NextResponse.json(
            { message: 'Erreur lors de la configuration 2FA' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'Token d\'authentification requis' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
        const { code } = await request.json()

        // Get 2FA secret
        const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
            where: { userId: decoded.userId }
        })

        if (!twoFactorAuth) {
            return NextResponse.json(
                { message: '2FA non configuré' },
                { status: 400 }
            )
        }

        // Verify TOTP code
        const isValid = SecurityService.verifyTOTP(twoFactorAuth.secret, code)

        if (!isValid) {
            return NextResponse.json(
                { message: 'Code 2FA invalide' },
                { status: 400 }
            )
        }

        // Enable 2FA
        await prisma.twoFactorAuth.update({
            where: { userId: decoded.userId },
            data: { isEnabled: true }
        })

        return NextResponse.json({
            message: '2FA activé avec succès'
        })

    } catch (error) {
        console.error('2FA enable error:', error)
        return NextResponse.json(
            { message: 'Erreur lors de l\'activation 2FA' },
            { status: 500 }
        )
    }
}
