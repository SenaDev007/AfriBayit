import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        console.log('Starting simple reset...')

        // Just clear users and related data
        await prisma.notification.deleteMany()
        await prisma.session.deleteMany()
        await prisma.userProfile.deleteMany()
        await prisma.user.deleteMany()

        console.log('Simple reset completed!')

        return NextResponse.json({
            success: true,
            message: 'Données utilisateur réinitialisées avec succès'
        })

    } catch (error) {
        console.error('Simple reset error:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erreur lors de la réinitialisation simple',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
