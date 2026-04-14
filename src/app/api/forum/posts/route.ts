import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (categoryId) {
      where.category = categoryId as any
    }

    // Get forum posts with pagination
    const [posts, total] = await Promise.all([
      prisma.forum_posts.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              image: true,
              reputationScore: true
            }
          },
          _count: {
            select: {
              forum_replies: true
            }
          }
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.forum_posts.count({ where })
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    })

  } catch (error) {
    console.error('Forum posts fetch error:', error)
    return NextResponse.json(
      { message: 'Erreur lors de la récupération des posts du forum' },
      { status: 500 }
    )
  }
}
