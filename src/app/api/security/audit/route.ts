import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminPermission } from '@/lib/auth/admin'
import { getAuditRequestContext, logAdminAudit } from '@/lib/audit/adminAudit'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminPermission(request, 'audit:read')
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)))
    const action = searchParams.get('action')
    const skip = (page - 1) * limit

    const entity = searchParams.get('entity')
    const actorUserId = searchParams.get('actorUserId')

    const where: { action?: string; entity?: string; userId?: string } = {}
    if (action) where.action = action
    if (entity) where.entity = entity
    if (actorUserId) where.userId = actorUserId

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

    const requestCtx = getAuditRequestContext(request)
    const auditLog = await logAdminAudit({
      actorUserId: auth.user.id,
      action,
      entity,
      entityId,
      request,
      metadata: {
        ...(metadata ?? {}),
        source: 'admin-api'
      }
    })

    return NextResponse.json({ message: "Log d'audit cree", auditLog, context: requestCtx })
  } catch (error) {
    console.error('Create audit log error:', error)
    return NextResponse.json(
      { message: "Erreur lors de la creation du log d'audit" },
      { status: 500 }
    )
  }
}
