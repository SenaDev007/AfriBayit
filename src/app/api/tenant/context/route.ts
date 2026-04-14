import { NextRequest, NextResponse } from 'next/server'

const tenantMap: Record<string, string> = {
  bj: 'BENIN',
  ci: 'COTE_DIVOIRE',
  bf: 'BURKINA_FASO',
  tg: 'TOGO',
  sn: 'SENEGAL',
  ml: 'MALI'
}

export async function GET(request: NextRequest) {
  const host = request.headers.get('x-tenant-host') || request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
  const normalized = host.split(':')[0]
  const segments = normalized.split('.')
  const subdomain = segments.length > 2 ? segments[0] : ''
  const tenant = tenantMap[subdomain] || 'GLOBAL'
  return NextResponse.json({ tenant, host, subdomain })
}
