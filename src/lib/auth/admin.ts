import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

export type AdminPermission =
  | 'audit:read'
  | 'audit:write'
  | 'kyc:review'
  | 'system:reset'

const PERMISSIONS: Record<string, AdminPermission[]> = {
  AGENCY: ['audit:read', 'audit:write', 'kyc:review'],
  DEVELOPER: ['audit:read', 'audit:write', 'kyc:review', 'system:reset']
}

function getToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7)
  return request.cookies.get('auth_token')?.value ?? null
}

export async function requireAdminPermission(
  request: NextRequest,
  permission: AdminPermission
) {
  const token = getToken(request)
  if (!token) {
    return {
      error: NextResponse.json(
        { message: "Token d'authentification requis" },
        { status: 401 }
      )
    }
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: { id: true, userType: true }
    })

    if (!user) {
      return {
        error: NextResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 })
      }
    }

    const allowed = PERMISSIONS[user.userType] || []
    if (!allowed.includes(permission)) {
      return {
        error: NextResponse.json({ message: 'Acces non autorise' }, { status: 403 })
      }
    }

    return { user }
  } catch {
    return {
      error: NextResponse.json({ message: 'Token invalide' }, { status: 401 })
    }
  }
}
