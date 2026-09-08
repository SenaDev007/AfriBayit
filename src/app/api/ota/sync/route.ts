import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { syncAllProviders, syncSingleProvider, pushAvailabilityToAllChannels, pushRatesToAllChannels } from '@/lib/ota/channel-manager';
import { apiResponse, apiError } from '@/lib/api/middleware';
import { authGuard } from '@/lib/auth-guard';
import type { OTAProvider, AvailabilityUpdate, RateUpdate } from '@/lib/ota/types';

const ALLOWED_ROLES = ['HOTELIER', 'SUPER_ADMIN', 'COUNTRY_ADMIN'] as const;

async function verifyHotelOwnership(hotelId: string, auth: { userId: string; role: string; country: string | null }) {
  const hotel = await db.hotel.findUnique({ where: { id: hotelId }, select: { ownerId: true, country: true } });
  if (!hotel) return { ok: false as const, status: 404, code: 'HOTEL_NOT_FOUND' };
  if (auth.role === 'SUPER_ADMIN') return { ok: true as const, hotel };
  if (auth.role === 'COUNTRY_ADMIN' && hotel.country && auth.country && hotel.country !== auth.country) return { ok: false as const, status: 403, code: 'CROSS_TENANT_FORBIDDEN' };
  if (hotel.ownerId !== auth.userId) return { ok: false as const, status: 403, code: 'NOT_HOTEL_OWNER' };
  return { ok: true as const, hotel };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authGuard(request, { requiredRoles: [...ALLOWED_ROLES] });
    if (!auth.success) return auth.response;
    const body = await request.json();
    const { hotelId, startDate, endDate, channel, availability, rates } = body;
    if (!hotelId) return apiError('hotelId requis', 400, 'MISSING_HOTEL_ID');
    const ownership = await verifyHotelOwnership(hotelId, auth);
    if (!ownership.ok) return apiError(ownership.code === 'HOTEL_NOT_FOUND' ? 'Hôtel non trouvé' : 'Accès refusé', ownership.status, ownership.code);
    const now = new Date();
    const defaultEnd = new Date(now); defaultEnd.setDate(defaultEnd.getDate() + 30);
    const dateRange = { start: startDate || now.toISOString().split('T')[0], end: endDate || defaultEnd.toISOString().split('T')[0] };
    if (availability && Array.isArray(availability) && availability.length > 0) {
      const updates: AvailabilityUpdate[] = availability.map((a: Record<string, unknown>) => ({ roomTypeId: String(a.roomTypeId), date: String(a.date), availableCount: Number(a.availableCount) }));
      const results = await pushAvailabilityToAllChannels(hotelId, updates);
      return apiResponse({ hotelId, operation: 'push_availability', dateRange, results, syncedAt: new Date().toISOString() });
    }
    if (rates && Array.isArray(rates) && rates.length > 0) {
      const rateUpdates: RateUpdate[] = rates.map((r: Record<string, unknown>) => ({ roomTypeId: String(r.roomTypeId), date: String(r.date), rate: Number(r.rate), currency: String(r.currency || 'XOF') }));
      const results = await pushRatesToAllChannels(hotelId, rateUpdates);
      return apiResponse({ hotelId, operation: 'push_rates', dateRange, results, syncedAt: new Date().toISOString() });
    }
    let results;
    if (channel) results = [await syncSingleProvider(hotelId, channel as OTAProvider, dateRange)];
    else results = await syncAllProviders(hotelId, dateRange);
    return apiResponse({ hotelId, operation: channel ? 'single_channel_sync' : 'full_sync', channel: channel || 'all', dateRange, results, syncedAt: new Date().toISOString() });
  } catch (error) { console.error('OTA Sync error:', error); return apiError('Erreur OTA', 500, 'SYNC_ERROR'); }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authGuard(request, { requiredRoles: [...ALLOWED_ROLES] });
    if (!auth.success) return auth.response;
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    if (!hotelId) return apiError('hotelId requis', 400, 'MISSING_HOTEL_ID');
    const ownership = await verifyHotelOwnership(hotelId, auth);
    if (!ownership.ok) return apiError(ownership.code === 'HOTEL_NOT_FOUND' ? 'Hôtel non trouvé' : 'Accès refusé', ownership.status, ownership.code);
    const recentSyncs = await db.otaSyncLog.findMany({ where: { hotelId }, orderBy: { executedAt: 'desc' }, take: 20 });
    const hotel = await db.hotel.findUnique({ where: { id: hotelId }, select: { otaRefs: true, name: true } });
    let configuredChannels: string[] = [];
    if (hotel?.otaRefs) { try { const refs = hotel.otaRefs as Record<string, string>; configuredChannels = Object.keys(refs).filter((k) => refs[k]); } catch { configuredChannels = []; } }
    return apiResponse({ hotelId, hotelName: hotel?.name, configuredChannels, recentSyncs, lastSyncAt: recentSyncs[0]?.executedAt?.toISOString() || null });
  } catch (error) { console.error('OTA Sync status error:', error); return apiError('Erreur', 500, 'SYNC_STATUS_ERROR'); }
}
