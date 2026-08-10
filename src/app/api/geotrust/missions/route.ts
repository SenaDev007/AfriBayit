import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';
import { geoServiceLabel } from '@/lib/geotrust/service-codes';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const geometerId = searchParams.get('geometerId');
    const status = searchParams.get('status');
    const serviceCode = searchParams.get('serviceCode');
    const country = searchParams.get('country');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (propertyId) where.propertyId = propertyId;
    if (geometerId) where.geometerId = geometerId;
    if (status) where.status = status;
    if (serviceCode) where.serviceCode = serviceCode;
    if (country) {
      where.property = { country };
    }

    const [missions, total] = await Promise.all([
      db.geometerMission.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          geometer: { select: { id: true, licenseNumber: true, specialities: true, rating: true } },
          property: { select: { id: true, title: true, city: true, country: true } },
          report: true,
        },
      }),
      db.geometerMission.count({ where }),
    ]);

    // Add human-readable service labels to mission data
    const missionsWithLabels = missions.map((mission) => ({
      ...mission,
      serviceLabel: geoServiceLabel(mission.serviceCode),
    }));

    return NextResponse.json({
      missions: missionsWithLabels,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Geotrust missions API error:', error);
    return NextResponse.json({ error: 'Failed to fetch geometer missions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    const mission = await db.geometerMission.create({
      data: {
        propertyId: body.propertyId,
        geometerId: body.geometerId,
        serviceCode: body.serviceCode,
        status: 'requested',
        price: body.price,
        currency: body.currency || 'XOF',
        notes: body.notes,
      },
    });

    return NextResponse.json(mission, { status: 201 });
  } catch (error) {
    console.error('Geotrust mission creation error:', error);
    return NextResponse.json({ error: 'Failed to create geometer mission' }, { status: 500 });
  }
}
