import { NextRequest, NextResponse } from 'next/server'

const tenantMap: Record<string, string> = {
  bj: 'BENIN',
  ci: 'COTE_DIVOIRE',
  bf: 'BURKINA_FASO',
  tg: 'TOGO'
}

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const subdomain = host.split('.')[0]
  const tenant = tenantMap[subdomain] || 'GLOBAL'
  return NextResponse.json({ tenant, host })
}
