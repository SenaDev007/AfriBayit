import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, profileType, phone, country } = await request.json()

    console.log('Registration request received:', {
      email,
      firstName,
      lastName,
      profileType,
      phone,
      country,
      hasPassword: !!password
    })

    if (!email || !password || !firstName || !lastName || !profileType || !phone || !country) {
      return NextResponse.json(
        { message: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'L\'adresse email n\'est pas valide' },
        { status: 400 }
      )
    }

    // Password strength validation
    if (password.length < 12) {
      return NextResponse.json(
        { message: 'Le mot de passe doit contenir au moins 12 caractères' },
        { status: 400 }
      )
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { message: 'Le mot de passe doit contenir au moins une lettre majuscule' },
        { status: 400 }
      )
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { message: 'Le mot de passe doit contenir au moins une lettre minuscule' },
        { status: 400 }
      )
    }

    if (!/\d/.test(password)) {
      return NextResponse.json(
        { message: 'Le mot de passe doit contenir au moins un chiffre' },
        { status: 400 }
      )
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return NextResponse.json(
        { message: 'Le mot de passe doit contenir au moins un caractère spécial' },
        { status: 400 }
      )
    }

    if (/\s/.test(password)) {
      return NextResponse.json(
        { message: 'Le mot de passe ne doit pas contenir d\'espaces' },
        { status: 400 }
      )
    }

    // Phone validation based on country
    const phoneDigits = phone.replace(/\D/g, '') // Remove all non-digits

    if (country === 'Bénin') {
      // Extract digits after country code for Benin
      // The phone format is: +229 01 XX XX XX XX
      // We need to extract just the digits after +229
      const phoneWithoutCountryCode = phone.replace(/^\+229\s?/, '') // Remove +229 and optional space
      const phoneDigitsAfterCountry = phoneWithoutCountryCode.replace(/\D/g, '') // Remove all non-digits

      console.log('Benin phone validation:', {
        originalPhone: phone,
        phoneWithoutCountryCode,
        phoneDigitsAfterCountry,
        startsWith01: phoneDigitsAfterCountry.startsWith('01'),
        length: phoneDigitsAfterCountry.length
      })

      if (!phoneDigitsAfterCountry.startsWith('01')) {
        return NextResponse.json(
          { message: 'Le numéro de téléphone pour le Bénin doit commencer par "01". Format attendu : +229 01 XX XX XX XX' },
          { status: 400 }
        )
      }
      if (phoneDigitsAfterCountry.length !== 10) { // 10 digits total including 01 prefix
        return NextResponse.json(
          { message: 'Le numéro de téléphone doit contenir exactement 10 chiffres pour le Bénin. Format attendu : +229 01 XX XX XX XX' },
          { status: 400 }
        )
      }
    } else {
      // Basic phone validation for other countries
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        return NextResponse.json(
          { message: 'Le numéro de téléphone doit contenir entre 7 et 15 chiffres' },
          { status: 400 }
        )
      }
    }

    // Name validation (letters only)
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/
    if (!nameRegex.test(firstName)) {
      return NextResponse.json(
        { message: 'Le prénom ne peut contenir que des lettres' },
        { status: 400 }
      )
    }

    if (!nameRegex.test(lastName)) {
      return NextResponse.json(
        { message: 'Le nom de famille ne peut contenir que des lettres' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Un utilisateur avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        profileType,
        phone,
        countryCode: country, // Use countryCode instead of country
        preferredLanguage: 'fr',
        preferredCurrency: 'XOF',
        profile: {
          create: {
            bio: '',
            preferredLocations: [],
            propertyTypes: [],
            onboardingCompleted: false
          }
        }
      },
      include: { profile: true }
    })

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set')
      return NextResponse.json(
        { message: 'Configuration du serveur manquante' },
        { status: 500 }
      )
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    })

    return NextResponse.json({
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

  } catch (error) {
    console.error('Registration error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
