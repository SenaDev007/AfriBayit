// /api/ambassador — GET: statut ambassadeur ; POST: candidater

import { NextRequest, NextResponse } from 'next/server';
import { getAmbassadorStatus, applyAsAmbassador } from '@/lib/ambassador';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis.' },
        { status: 400 }
      );
    }

    const status = await getAmbassadorStatus(userId);

    return NextResponse.json({
      isAmbassador: !!status,
      ambassador: status,
    });
  } catch (error) {
    console.error('Erreur statut ambassadeur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du statut ambassadeur.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body as { userId: string };

    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis.' },
        { status: 400 }
      );
    }

    const status = await applyAsAmbassador(userId);

    return NextResponse.json({
      success: true,
      ambassador: status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'inscription ambassadeur.';
    console.error('Erreur inscription ambassadeur:', error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
