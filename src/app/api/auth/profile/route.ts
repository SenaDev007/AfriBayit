import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

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
        const data = await request.json()

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

        // Update user profile
        const user = await prisma.user.update({
            where: { id: decoded.userId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                countryCode: data.countryCode,
                preferredLanguage: data.preferredLanguage,
                preferredCurrency: data.preferredCurrency,
                avatarUrl: data.avatarUrl,
                profileType: data.profileType,
                profile: {
                    upsert: {
                        create: {
                            bio: data.bio,
                            investmentBudgetMin: data.investmentBudgetMin,
                            investmentBudgetMax: data.investmentBudgetMax,
                            preferredLocations: data.preferredLocations || [],
                            propertyTypes: data.propertyTypes || [],
                            preferences: data.preferences,
                            onboardingCompleted: Boolean(data.onboardingCompleted),
                            onboardingData: data.onboardingData
                        },
                        update: {
                            bio: data.bio,
                            investmentBudgetMin: data.investmentBudgetMin,
                            investmentBudgetMax: data.investmentBudgetMax,
                            preferredLocations: data.preferredLocations,
                            propertyTypes: data.propertyTypes,
                            preferences: data.preferences,
                            onboardingCompleted: data.onboardingCompleted,
                            onboardingData: data.onboardingData
                        }
                    }
                }
            },
            include: { profile: true }
        })

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
        console.error('Update profile error:', error)
        return NextResponse.json(
            { message: 'Erreur lors de la mise à jour du profil' },
            { status: 500 }
        )
    }
}
