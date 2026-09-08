import { NextRequest, NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;
    const countryFilter = auth.role === 'COUNTRY_ADMIN' && auth.country ? auth.country : null;
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('section') || '';
    const country = searchParams.get('country') || countryFilter || '';
    const where: { section?: string; country?: { in: string[] } } = {};
    if (sectionId) where.section = sectionId;
    if (country) where.country = { in: ['*', country] };
    const items = await db.contentItem.findMany({ where, orderBy: [{ section: 'asc' }, { key: 'asc' }] });
    const sectionMap = new Map<string, { id: string; label: string; items: typeof items }>();
    for (const item of items) {
      if (!sectionMap.has(item.section)) sectionMap.set(item.section, { id: item.section, label: item.section, items: [] });
      sectionMap.get(item.section)!.items.push(item);
    }
    const sections = Array.from(sectionMap.values()).map((section) => {
      if (!country || country === '*') return section;
      const globalItems = section.items.filter((i) => i.country === '*');
      const countryItems = section.items.filter((i) => i.country === country);
      const merged = globalItems.map((g) => countryItems.find((c) => c.key === g.key) || g);
      const extra = countryItems.filter((c) => !globalItems.some((g) => g.key === c.key));
      return { ...section, items: [...merged, ...extra] };
    });
    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Admin content error:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;
    const body = await request.json();
    const { sectionId, itemKey, country, value, label } = body;
    if (!sectionId || !itemKey || !value) return NextResponse.json({ error: 'Missing required fields: sectionId, itemKey, value' }, { status: 400 });
    const effectiveCountry = auth.role === 'COUNTRY_ADMIN' && auth.country ? auth.country : (country || '*');
    const updated = await db.contentItem.upsert({
      where: { section_key_country: { section: sectionId, key: itemKey, country: effectiveCountry } },
      create: { section: sectionId, key: itemKey, label: label || itemKey, value, country: effectiveCountry },
      update: { value, ...(label ? { label } : {}) },
    });
    return NextResponse.json({ success: true, message: `Content item "${itemKey}" in section "${sectionId}" updated for country "${effectiveCountry}"`, updatedItem: updated });
  } catch (error) {
    console.error('Admin content update error:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
