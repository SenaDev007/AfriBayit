// GET /api/ambassador/commissions — Historique des commissions

import { NextRequest, NextResponse } from 'next/server';
import { getCommissionHistory } from '@/lib/ambassador';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis.' },
        { status: 400 }
      );
    }

    const commissions = await getCommissionHistory(userId, { limit, offset });

    return NextResponse.json({ commissions });
  } catch (error) {
    console.error('Erreur commissions:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des commissions.' },
      { status: 500 }
    );
  }
}
