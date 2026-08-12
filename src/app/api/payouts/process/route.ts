// AfriBayit — POST /api/payouts/process
// Process a pending payout (admin only) — validates KYC and initiates transfer
// Supports: manual trigger, batch processing, status tracking, MoMo validation

import { NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';
import { db } from '@/lib/db';
import {
  processScheduledPayouts,
  processHeldPayouts,
  scheduleJ1Payout,
  getPayoutStatus,
  validateMobileMoneyNumber,
} from '@/lib/payments/payout';
import type { PaymentMethod } from '@/lib/payments/types';

export async function POST(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { payoutId, action, ...extra } = body as {
      payoutId?: string;
      action: 'approve' | 'reject' | 'batch_process' | 'process_held' | 'schedule_j1' | 'status';
      // For schedule_j1
      userId?: string;
      transactionId?: string;
      amount?: number;
      currency?: string;
      method?: string;
      destination?: string;
      countryCode?: string;
    };

    if (!action || !['approve', 'reject', 'batch_process', 'process_held', 'schedule_j1', 'status'].includes(action)) {
      return NextResponse.json(
        { error: 'Action invalide. Utilisez "approve", "reject", "batch_process", "process_held", "schedule_j1", ou "status"' },
        { status: 400 }
      );
    }

    // ── Batch processing: process all scheduled J+1 payouts ──
    if (action === 'batch_process') {
      const result = await processScheduledPayouts();
      return NextResponse.json({
        success: true,
        action: 'batch_process',
        ...result,
      });
    }

    // ── Process held payouts that have accumulated above minimum ──
    if (action === 'process_held') {
      const result = await processHeldPayouts();
      return NextResponse.json({
        success: true,
        action: 'process_held',
        ...result,
      });
    }

    // ── Schedule a new J+1 auto-payout ──
    if (action === 'schedule_j1') {
      const { userId, transactionId, amount, currency, method, destination, countryCode } = extra;
      if (!userId || !transactionId || !amount || !currency || !method || !destination || !countryCode) {
        return NextResponse.json(
          { error: 'Paramètres manquants pour schedule_j1 : userId, transactionId, amount, currency, method, destination, countryCode requis' },
          { status: 400 }
        );
      }

      // Validate Mobile Money number
      if (method.startsWith('mobile_money_')) {
        const validation = validateMobileMoneyNumber(destination, countryCode);
        if (!validation.valid) {
          return NextResponse.json(
            { error: `Numéro Mobile Money invalide : ${validation.error}` },
            { status: 400 }
          );
        }
      }

      const payout = await scheduleJ1Payout(
        userId,
        transactionId,
        amount,
        currency,
        method as PaymentMethod,
        destination,
        countryCode,
      );

      return NextResponse.json({
        success: true,
        action: 'schedule_j1',
        payout: {
          id: payout.id,
          amount: payout.amount,
          scheduledFor: payout.scheduledFor,
          status: payout.status,
          method: payout.method,
          destination: payout.destination,
        },
      });
    }

    // ── Get payout status ──
    if (action === 'status') {
      if (!payoutId) {
        return NextResponse.json(
          { error: 'payoutId requis pour l\'action status' },
          { status: 400 }
        );
      }

      const status = await getPayoutStatus(payoutId);
      if (!status) {
        return NextResponse.json({ error: 'Paiement non trouvé' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        action: 'status',
        payout: status,
      });
    }

    // ── Approve/Reject: original functionality ──
    if (!payoutId) {
      return NextResponse.json({ error: 'ID du paiement requis' }, { status: 400 });
    }

    // Find the pending wallet transaction
    const walletTx = await db.walletTransaction.findUnique({
      where: { id: payoutId },
    });

    if (!walletTx) {
      return NextResponse.json({ error: 'Paiement non trouvé' }, { status: 404 });
    }

    if (walletTx.status !== 'pending') {
      return NextResponse.json(
        { error: `Ce paiement n'est plus en attente (statut: ${walletTx.status})` },
        { status: 422 }
      );
    }

    if (walletTx.type !== 'payout' && walletTx.type !== 'withdrawal') {
      return NextResponse.json(
        { error: 'Ce n\'est pas une demande de paiement' },
        { status: 400 }
      );
    }

    if (action === 'reject') {
      // Reject the payout and refund the wallet
      await db.$transaction(async (tx) => {
        // Update wallet transaction
        await tx.walletTransaction.update({
          where: { id: payoutId },
          data: { status: 'failed' },
        });

        // Refund the user's wallet
        const metadata = walletTx.metadata
          ? JSON.parse(walletTx.metadata as string) as Record<string, unknown>
          : {};
        const userId = walletTx.userId;
        const refundAmount = Math.abs(walletTx.amount);

        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { walletBalance: true, pendingPayout: true },
        });

        if (user) {
          await tx.user.update({
            where: { id: userId },
            data: {
              walletBalance: user.walletBalance + refundAmount,
              pendingPayout: Math.max(0, user.pendingPayout - refundAmount),
            },
          });
        }
      });

      return NextResponse.json({
        success: true,
        action: 'rejected',
        payoutId,
      });
    }

    // Approve: validate KYC level
    const user = await db.user.findUnique({
      where: { id: walletTx.userId },
      select: { kycLevel: true, name: true, email: true },
    });

    if (!user || user.kycLevel < 2) {
      return NextResponse.json(
        { error: 'KYC niveau 2 requis pour approuver ce paiement' },
        { status: 422 }
      );
    }

    // Mark as completed (actual transfer would happen via provider)
    await db.walletTransaction.update({
      where: { id: payoutId },
      data: {
        status: 'completed',
        metadata: JSON.stringify({
          ...(walletTx.metadata ? JSON.parse(walletTx.metadata as string) as Record<string, unknown> : {}),
          approvedBy: auth.userId,
          approvedAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      action: 'approved',
      payoutId,
    });
  } catch (error) {
    console.error('Payout process error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process payout';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/payouts/process
 * Get pending payouts and batch status (admin only)
 */
export async function GET(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'pending';

    if (type === 'scheduled') {
      // Get all scheduled J+1 payouts
      const scheduled = await db.walletTransaction.findMany({
        where: { type: 'auto_payout_scheduled', status: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return NextResponse.json({
        type: 'scheduled',
        count: scheduled.length,
        payouts: scheduled.map(tx => ({
          id: tx.id,
          userId: tx.userId,
          amount: Math.abs(tx.amount),
          currency: tx.currency,
          status: tx.status,
          createdAt: tx.createdAt,
          metadata: tx.metadata ? JSON.parse(tx.metadata as string) : null,
        })),
      });
    }

    if (type === 'held') {
      // Get all held payouts
      const held = await db.walletTransaction.findMany({
        where: { type: 'payout_held', status: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return NextResponse.json({
        type: 'held',
        count: held.length,
        payouts: held.map(tx => ({
          id: tx.id,
          userId: tx.userId,
          amount: Math.abs(tx.amount),
          currency: tx.currency,
          createdAt: tx.createdAt,
          metadata: tx.metadata ? JSON.parse(tx.metadata as string) : null,
        })),
      });
    }

    // Default: get pending payouts
    const pending = await db.walletTransaction.findMany({
      where: { type: { in: ['payout', 'withdrawal'] }, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      type: 'pending',
      count: pending.length,
      payouts: pending.map(tx => ({
        id: tx.id,
        userId: tx.userId,
        amount: Math.abs(tx.amount),
        currency: tx.currency,
        status: tx.status,
        createdAt: tx.createdAt,
        metadata: tx.metadata ? JSON.parse(tx.metadata as string) : null,
      })),
    });
  } catch (error) {
    console.error('Payout GET error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch payouts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
