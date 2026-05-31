// POST /api/ambassador/commissions/calculate — Calculer la commission pour une transaction filleul
// CDC §5.7.5 — Ambassador Commission System

import { NextRequest, NextResponse } from 'next/server';
import { calculateCommission, recordReferralCommission } from '@/lib/ambassador/commission-engine';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ambassadorId, filleulUserId, transactionId, transactionAmount, currency, record = false } = body;

    // Validate required fields
    if (!ambassadorId) {
      return NextResponse.json(
        { error: 'ambassadorId est requis.' },
        { status: 400 }
      );
    }

    if (!filleulUserId) {
      return NextResponse.json(
        { error: 'filleulUserId est requis.' },
        { status: 400 }
      );
    }

    if (!transactionId) {
      return NextResponse.json(
        { error: 'transactionId est requis.' },
        { status: 400 }
      );
    }

    if (!transactionAmount || transactionAmount <= 0) {
      return NextResponse.json(
        { error: 'transactionAmount doit être un nombre positif.' },
        { status: 400 }
      );
    }

    // Verify the ambassador exists
    const ambassador = await db.ambassador.findUnique({
      where: { id: ambassadorId },
    });

    if (!ambassador) {
      return NextResponse.json(
        { error: 'Ambassadeur introuvable.' },
        { status: 404 }
      );
    }

    // Verify the ambassador is active
    if (ambassador.status !== 'active') {
      return NextResponse.json(
        { error: 'Ambassadeur inactif — impossible de calculer la commission.' },
        { status: 400 }
      );
    }

    // Verify the filleul exists
    const filleul = await db.user.findUnique({
      where: { id: filleulUserId },
    });

    if (!filleul) {
      return NextResponse.json(
        { error: 'Utilisateur filleul introuvable.' },
        { status: 404 }
      );
    }

    // Verify the transaction exists
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction introuvable.' },
        { status: 404 }
      );
    }

    // Calculate or record the commission
    let result;
    if (record) {
      result = await recordReferralCommission(
        ambassadorId,
        filleulUserId,
        transactionId,
        transactionAmount,
        currency || 'XOF'
      );
    } else {
      result = await calculateCommission(
        ambassadorId,
        filleulUserId,
        transactionId,
        transactionAmount,
        currency || 'XOF'
      );
    }

    return NextResponse.json({
      success: true,
      calculation: result,
      recorded: record,
    });
  } catch (error) {
    console.error('Erreur calcul commission ambassadeur:', error);
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// GET /api/ambassador/commissions/calculate — Prévisualiser le calcul de commission
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ambassadorId = searchParams.get('ambassadorId');
    const transactionAmount = parseFloat(searchParams.get('transactionAmount') || '0');

    if (!ambassadorId) {
      return NextResponse.json(
        { error: 'ambassadorId est requis.' },
        { status: 400 }
      );
    }

    if (!transactionAmount || transactionAmount <= 0) {
      return NextResponse.json(
        { error: 'transactionAmount doit être un nombre positif.' },
        { status: 400 }
      );
    }

    // Verify the ambassador exists
    const ambassador = await db.ambassador.findUnique({
      where: { id: ambassadorId },
    });

    if (!ambassador) {
      return NextResponse.json(
        { error: 'Ambassadeur introuvable.' },
        { status: 404 }
      );
    }

    const tier = ambassador.tier as 'bronze' | 'silver' | 'gold';
    const commissionRate = ambassador.commissionRate;
    const commissionAmount = Math.round(transactionAmount * commissionRate);

    return NextResponse.json({
      ambassadorId,
      tier,
      commissionRate,
      transactionAmount,
      commissionAmount,
      currency: ambassador.commissionRate ? 'XOF' : 'XOF',
      breakdown: [
        {
          label: `Commission ${tier} (${(commissionRate * 100).toFixed(0)}%)`,
          rate: commissionRate,
          amount: commissionAmount,
        },
      ],
    });
  } catch (error) {
    console.error('Erreur prévisualisation commission:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la prévisualisation de la commission.' },
      { status: 500 }
    );
  }
}
