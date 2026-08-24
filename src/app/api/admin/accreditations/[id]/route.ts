import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';
const ADMIN_ROLES = ['SUPER_ADMIN', 'COUNTRY_ADMIN'] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authGuard(request, { requiredRoles: [...ADMIN_ROLES] });
    if (!auth.success) return auth.response;
    const { id } = await params;
    const body = await request.json();
    const { role, active, expiresAt, country: targetCountry } = body;
    if (auth.role === 'COUNTRY_ADMIN') {
      if (role === 'SUPER_ADMIN') return NextResponse.json({ error: 'Seul un SUPER_ADMIN peut accorder SUPER_ADMIN', code: 'FORBIDDEN' }, { status: 403 });
      if (targetCountry && auth.country && targetCountry !== auth.country) return NextResponse.json({ error: 'Hors périmètre pays', code: 'CROSS_TENANT_FORBIDDEN' }, { status: 403 });
    }
    const existing = await db.countryAccreditation.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Accreditation not found' }, { status: 404 });
    if (auth.role === 'COUNTRY_ADMIN' && existing.country !== auth.country) return NextResponse.json({ error: 'Hors périmètre pays', code: 'CROSS_TENANT_FORBIDDEN' }, { status: 403 });
    const data: Record<string, unknown> = {};
    if (role !== undefined) data.role = role;
    if (active !== undefined) data.active = active;
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (targetCountry !== undefined) data.country = targetCountry;
    const updated = await db.countryAccreditation.update({ where: { id }, data, include: { user: { select: { id: true, name: true, email: true, avatar: true, role: true } } } });
    return NextResponse.json({ data: updated });
  } catch (error) { console.error('Update accreditation error:', error); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authGuard(request, { requiredRoles: [...ADMIN_ROLES] });
    if (!auth.success) return auth.response;
    const { id } = await params;
    const existing = await db.countryAccreditation.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (auth.role === 'COUNTRY_ADMIN' && existing.country !== auth.country) return NextResponse.json({ error: 'Hors périmètre pays', code: 'CROSS_TENANT_FORBIDDEN' }, { status: 403 });
    await db.countryAccreditation.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ success: true });
  } catch (error) { console.error('Delete accreditation error:', error); return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
