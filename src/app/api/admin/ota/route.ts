import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    // 🔒 P1.3 — Admin authGuard (defense in depth)
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'providers';
    const search = searchParams.get('search') || '';
    const hotelId = searchParams.get('hotelId') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    if (tab === 'sync-logs') {
      const where: Record<string, unknown> = {};
      if (hotelId) where.hotelId = hotelId;
      if (status) where.status = status;

      if (search) {
        where.OR = [
          { ota: { contains: search, mode: 'insensitive' } },
          { operation: { contains: search, mode: 'insensitive' } },
          { errorMessage: { contains: search, mode: 'insensitive' } },
          { hotel: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [syncLogs, total] = await Promise.all([
        db.otaSyncLog.findMany({
          where,
          include: {
            hotel: { select: { id: true, name: true, country: true } },
          },
          skip,
          take: limit,
          orderBy: { executedAt: 'desc' },
        }),
        db.otaSyncLog.count({ where }),
      ]);

      const [totalProviders, totalSyncLogs, lastSyncResult, parityViolations] = await Promise.all([
        2, // Hardcoded: Booking.com + Expedia
        db.otaSyncLog.count(),
        db.otaSyncLog.findFirst({ where: { status: 'success' }, orderBy: { executedAt: 'desc' }, select: { executedAt: true } }),
        0, // Computed below
      ]);

      const lastSyncAt = lastSyncResult?.executedAt || null;

      return NextResponse.json({
        syncLogs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        summary: { totalProviders, totalSyncLogs, lastSyncAt, parityViolations },
      });
    }

    if (tab === 'mappings') {
      const where: Record<string, unknown> = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [hotels, total] = await Promise.all([
        db.hotel.findMany({
          where,
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
            otaRefs: true,
            channelInventory: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        db.hotel.count({ where }),
      ]);

      const [totalProviders, totalSyncLogs, lastSyncResult] = await Promise.all([
        2,
        db.otaSyncLog.count(),
        db.otaSyncLog.findFirst({ where: { status: 'success' }, orderBy: { executedAt: 'desc' }, select: { executedAt: true } }),
      ]);

      const lastSyncAt = lastSyncResult?.executedAt || null;

      return NextResponse.json({
        hotels,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        summary: { totalProviders, totalSyncLogs, lastSyncAt, parityViolations: 0 },
      });
    }

    if (tab === 'parity') {
      // Compute rate parity violations from ChannelInventory
      const channelInventory = await db.channelInventory.findMany({
        include: {
          room: { select: { id: true, type: true, hotelId: true } },
          hotel: { select: { id: true, name: true, country: true } },
        },
      });

      // Group by room to detect price differences across channels
      const roomRates = new Map<string, { hotel: { id: string; name: string; country: string }; room: { id: string; type: string }; rates: { ota: string; rateXof: number | null }[] }>();
      for (const ci of channelInventory) {
        const key = ci.roomId;
        if (!roomRates.has(key)) {
          roomRates.set(key, {
            hotel: { id: ci.hotel.id, name: ci.hotel.name, country: ci.hotel.country },
            room: { id: ci.room.id, type: ci.room.type },
            rates: [],
          });
        }
        roomRates.get(key)!.rates.push({ ota: ci.ota, rateXof: ci.rateXof });
      }

      const violations: { roomId: string; roomType: string; hotelId: string; hotelName: string; country: string; rates: { ota: string; rateXof: number | null }[] }[] = [];
      for (const [roomId, data] of roomRates) {
        const validRates = data.rates.filter((r) => r.rateXof !== null);
        if (validRates.length < 2) continue;
        const prices = validRates.map((r) => r.rateXof!);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        // More than 5% difference = parity violation
        if (max - min > min * 0.05) {
          violations.push({
            roomId,
            roomType: data.room.type,
            hotelId: data.hotel.id,
            hotelName: data.hotel.name,
            country: data.hotel.country,
            rates: data.rates,
          });
        }
      }

      const [totalProviders, totalSyncLogs, lastSyncResult] = await Promise.all([
        2,
        db.otaSyncLog.count(),
        db.otaSyncLog.findFirst({ where: { status: 'success' }, orderBy: { executedAt: 'desc' }, select: { executedAt: true } }),
      ]);

      const lastSyncAt = lastSyncResult?.executedAt || null;

      return NextResponse.json({
        violations,
        pagination: { page, limit, total: violations.length, pages: Math.ceil(violations.length / limit) },
        summary: { totalProviders, totalSyncLogs, lastSyncAt, parityViolations: violations.length },
      });
    }

    // Default: tab === 'providers'
    // Hardcoded providers since there's no OTAProvider model
    const providers = [
      {
        id: 'booking_com',
        name: 'Booking.com',
        status: 'active',
        hotelsConnected: await db.hotel.count({ where: { otaRefs: { contains: 'booking_com' } } }),
        lastSync: (await db.otaSyncLog.findFirst({ where: { ota: 'booking_com', status: 'success' }, orderBy: { executedAt: 'desc' }, select: { executedAt: true } }))?.executedAt || null,
      },
      {
        id: 'expedia',
        name: 'Expedia',
        status: 'active',
        hotelsConnected: await db.hotel.count({ where: { otaRefs: { contains: 'expedia' } } }),
        lastSync: (await db.otaSyncLog.findFirst({ where: { ota: 'expedia', status: 'success' }, orderBy: { executedAt: 'desc' }, select: { executedAt: true } }))?.executedAt || null,
      },
    ];

    const [totalSyncLogs, lastSyncResult, parityViolations] = await Promise.all([
      db.otaSyncLog.count(),
      db.otaSyncLog.findFirst({ where: { status: 'success' }, orderBy: { executedAt: 'desc' }, select: { executedAt: true } }),
      0,
    ]);

    const lastSyncAt = lastSyncResult?.executedAt || null;

    return NextResponse.json({
      providers,
      summary: { totalProviders: providers.length, totalSyncLogs, lastSyncAt, parityViolations },
    });
  } catch (error) {
    console.error('Admin OTA error:', error);
    return NextResponse.json({ error: 'Failed to fetch OTA data' }, { status: 500 });
  }
}
