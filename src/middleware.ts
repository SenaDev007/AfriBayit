import { NextRequest, NextResponse } from 'next/server'

const TENANT_MAP: Record<string, string> = {
  bj: 'BENIN',
  ci: 'COTE_DIVOIRE',
  bf: 'BURKINA_FASO',
  tg: 'TOGO',
  sn: 'SENEGAL',
  ml: 'MALI'
}

function resolveTenant(hostname: string) {
  const normalized = hostname.split(':')[0].toLowerCase()
  const parts = normalized.split('.')
  const subdomain = parts.length > 2 ? parts[0] : ''
  return TENANT_MAP[subdomain] ?? 'GLOBAL'
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
  const tenant = resolveTenant(host)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-country', tenant)
  requestHeaders.set('x-tenant-host', host)

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
