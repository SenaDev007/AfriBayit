import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, rememberMe } = body

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { message: 'Identifiants invalides' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Identifiants invalides' },
        { status: 401 }
      )
    }

    // Set token expiration based on rememberMe
    const tokenExpiration = rememberMe ? '30d' : '24h' // 30 days if remember me, 24 hours otherwise
    const sessionExpiration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 30 days or 24 hours in milliseconds

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, profileType: user.profileType },
      process.env.JWT_SECRET!,
      { expiresIn: tokenExpiration }
    )

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + sessionExpiration)
      }
    })

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    const response = NextResponse.json({
      user: {
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
      },
      session: {
        id: session.id,
        token: session.token,
        expiresAt: session.expiresAt
      },
      token
    })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
