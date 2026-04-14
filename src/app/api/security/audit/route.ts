import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
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

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { profileType: true }
        })

        if (user?.profileType !== 'AGENCY' && user?.profileType !== 'DEVELOPER') {
            return NextResponse.json(
                { message: 'Accès non autorisé' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const type = searchParams.get('type')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        const skip = (page - 1) * limit

        // Build where clause
        const where: any = {}

        if (type) {
            where.type = type
        }

        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        }

        // Get audit logs
        const [auditLogs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.auditLog.count({ where })
        ])

        return NextResponse.json({
            auditLogs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                hasMore: page * limit < total
            }
        })

    } catch (error) {
        console.error('Audit logs error:', error)
        return NextResponse.json(
            { message: 'Erreur lors de la récupération des logs d\'audit' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const { action, resource, details, userId } = await request.json()

        // Create audit log entry
        const auditLog = await prisma.auditLog.create({
            data: {
                userId,
                action,
                resource,
                details,
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown'
            }
        })

        return NextResponse.json({
            message: 'Log d\'audit créé',
            auditLog
        })

    } catch (error) {
        console.error('Create audit log error:', error)
        return NextResponse.json(
            { message: 'Erreur lors de la création du log d\'audit' },
            { status: 500 }
        )
    }
}
