import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  if (!forwarded) return null
  return forwarded.split(',')[0]?.trim() || null
}

export function getAuditRequestContext(request: NextRequest) {
  return {
    ip: getClientIp(request),
    userAgent: request.headers.get('user-agent') ?? null,
    tenantCountry: request.headers.get('x-tenant-country') ?? 'GLOBAL',
    tenantHost: request.headers.get('x-tenant-host') ?? request.headers.get('host') ?? null
  }
}

export async function logAdminAudit(params: {
  actorUserId: string
  action: string
  entity?: string | null
  entityId?: string | null
  metadata?: Record<string, unknown> | null
  request: NextRequest
}) {
  const ctx = getAuditRequestContext(params.request)
  return prisma.audit_logs.create({
    data: {
      id: crypto.randomUUID(),
      userId: params.actorUserId,
      action: params.action,
      entity: params.entity ?? null,
      entityId: params.entityId ?? null,
      metadata: {
        ...(params.metadata ?? {}),
        actorUserId: params.actorUserId,
        tenantCountry: ctx.tenantCountry,
        tenantHost: ctx.tenantHost
      },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      createdAt: new Date()
    }
  })
}
