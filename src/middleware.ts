import { NextRequest, NextResponse } from 'next/server'

const TENANT_MAP: Record<string, string> = {
  bj: 'BENIN',
  ci: 'COTE_DIVOIRE',
  bf: 'BURKINA_FASO',
  tg: 'TOGO',
  sn: 'SENEGAL',
  ml: 'MALI'
}
const ADMIN_TYPES = new Set(['AGENCY', 'DEVELOPER'])

function resolveTenant(hostname: string) {
  const normalized = hostname.split(':')[0].toLowerCase()
  const parts = normalized.split('.')
  const subdomain = parts.length > 2 ? parts[0] : ''
  return TENANT_MAP[subdomain] ?? 'GLOBAL'
}

function getTokenFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return request.cookies.get('auth_token')?.value ?? null
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(normalized)
    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
  const tenant = resolveTenant(host)
  const { pathname, search } = request.nextUrl

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-country', tenant)
  requestHeaders.set('x-tenant-host', host)
  requestHeaders.set('x-rbac-checked', 'true')

  const isAdminPage = pathname.startsWith('/admin')
  const isAdminApi = pathname.startsWith('/api/admin/')
  const requiresAdmin = isAdminPage || isAdminApi

  if (requiresAdmin) {
    const token = getTokenFromRequest(request)
    if (!token) {
      if (isAdminApi) {
        return NextResponse.json({ message: "Token d'authentification requis" }, { status: 401 })
      }
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/auth/login'
      loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`
      return NextResponse.redirect(loginUrl)
    }

    const payload = decodeJwtPayload(token)
    const profileType = typeof payload?.profileType === 'string' ? payload.profileType : null
    // Backward compatibility: older tokens without role claim are still allowed;
    // server routes continue to enforce strict DB-backed authorization.
    if (profileType && !ADMIN_TYPES.has(profileType)) {
      if (isAdminApi) {
        return NextResponse.json({ message: 'Acces non autorise' }, { status: 403 })
      }
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = '/dashboard'
      dashboardUrl.search = ''
      return NextResponse.redirect(dashboardUrl)
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
