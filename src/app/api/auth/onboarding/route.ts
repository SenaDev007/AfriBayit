import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: "Token d'authentification requis" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body = await request.json()

    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        profileType: body.profileType,
        profile: {
          upsert: {
            create: {
              onboardingCompleted: true,
              onboardingData: {
                step: 'completed',
                selectedProfileType: body.profileType,
                completedAt: new Date().toISOString()
              }
            },
            update: {
              onboardingCompleted: true,
              onboardingData: {
                step: 'completed',
                selectedProfileType: body.profileType,
                completedAt: new Date().toISOString()
              }
            }
          }
        }
      },
      include: { profile: true }
    })

    return NextResponse.json({
      message: 'Onboarding termine avec succes',
      user
    })
  } catch (error) {
    console.error('Onboarding API error:', error)
    return NextResponse.json(
      { message: "Erreur lors de la finalisation de l'onboarding" },
      { status: 500 }
    )
  }
}
