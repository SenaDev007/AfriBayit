import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'Endpoint desactive en production' },
        { status: 403 }
      )
    }

    await prisma.notifications.deleteMany()
    await prisma.sessions.deleteMany()

    return NextResponse.json({
      success: true,
      message: 'Sessions et notifications reinitialisees'
    })
  } catch (error) {
    console.error('Simple reset error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la reinitialisation simple',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
