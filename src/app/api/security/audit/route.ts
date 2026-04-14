import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminPermission } from '@/lib/auth/admin'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'audit:read')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)))
    const action = searchParams.get('action')
    const skip = (page - 1) * limit

    const where: { action?: string } = {}
    if (action) where.action = action

    const [auditLogs, total] = await Promise.all([
      prisma.audit_logs.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.audit_logs.count({ where })
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
      { message: "Erreur lors de la recuperation des logs d'audit" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'audit:write')
    if ('error' in auth) return auth.error

    const { action, entity, entityId, metadata } = await request.json()
    if (!action) {
      return NextResponse.json({ message: 'action requise' }, { status: 400 })
    }

    const auditLog = await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId: auth.user.id,
        action,
        entity,
        entityId,
        metadata: metadata ?? null,
        ip: request.headers.get('x-forwarded-for') ?? null,
        userAgent: request.headers.get('user-agent') ?? null,
        createdAt: new Date()
      }
    })

    return NextResponse.json({ message: "Log d'audit cree", auditLog })
  } catch (error) {
    console.error('Create audit log error:', error)
    return NextResponse.json(
      { message: "Erreur lors de la creation du log d'audit" },
      { status: 500 }
    )
  }
}
