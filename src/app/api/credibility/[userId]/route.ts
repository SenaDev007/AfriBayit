// GET /api/credibility/[userId] — Score de crédibilité

import { NextRequest, NextResponse } from 'next/server';
import { calculateCredibilityScore, updateCredibilityScore } from '@/lib/credibility';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const breakdown = await calculateCredibilityScore(userId);

    // Mettre à jour le score en base de manière asynchrone
    updateCredibilityScore(userId).catch(() => {
      // Ne pas bloquer la réponse
    });

    return NextResponse.json(breakdown);
  } catch (error) {
    console.error('Erreur score crédibilité:', error);
    return NextResponse.json(
      { error: 'Erreur lors du calcul du score de crédibilité.' },
      { status: 500 }
    );
  }
}
