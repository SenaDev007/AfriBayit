import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const level = searchParams.get('level')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = { isPublished: true }

    if (category) {
      where.category = category
    }

    if (level) {
      where.level = level
    }

    // Get courses with pagination
    const [courses, total] = await Promise.all([
      prisma.courses.findMany({
        where,
        include: {
          course_modules: {
            orderBy: { order: 'asc' }
          },
          _count: {
            select: {
              enrollments: true,
              course_modules: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.courses.count({ where })
    ])

    return NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    })

  } catch (error) {
    console.error('Courses fetch error:', error)
    return NextResponse.json(
      { message: 'Erreur lors de la récupération des cours' },
      { status: 500 }
    )
  }
}
