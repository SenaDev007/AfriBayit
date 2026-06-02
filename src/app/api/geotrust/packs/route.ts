import { NextRequest, NextResponse } from 'next/server';
import { CERTIFICATION_PACKS, getPackById } from '@/lib/geotrust/packs';

export async function GET() {
  return NextResponse.json({
    packs: CERTIFICATION_PACKS.map(p => ({
      id: p.id,
      name: p.name,
      nameFr: p.nameFr,
      price: p.price,
      currency: p.currency,
      features: p.features,
      icon: p.icon,
      color: p.color,
      popular: p.popular,
      turnaroundDays: p.turnaroundDays,
    })),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packId, propertyId, userId } = body as {
      packId: string;
      propertyId: string;
      userId: string;
    };

    if (!packId || !propertyId || !userId) {
      return NextResponse.json(
        { error: 'packId, propertyId et userId sont requis' },
        { status: 400 }
      );
    }

    const pack = getPackById(packId);
    if (!pack) {
      return NextResponse.json({ error: 'Pack non trouvé' }, { status: 404 });
    }

    // In production, would create payment and schedule inspection
    return NextResponse.json({
      success: true,
      purchase: {
        packId: pack.id,
        packName: pack.nameFr,
        price: pack.price,
        currency: pack.currency,
        propertyId,
        userId,
        status: 'pending_payment',
        estimatedDelivery: `${pack.turnaroundDays} jours ouvrés`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur d\'achat';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
