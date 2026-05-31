// AfriBayit — POST /api/payments/initiate
// Initiate a payment through the Payment Abstraction Layer

import { NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';
import { db } from '@/lib/db';
import { initiatePayment, selectBestProvider, getAvailableMethods } from '@/lib/payments';
import type { PaymentProvider, PaymentMethod } from '@/lib/payments/types';

export async function POST(request: Request) {
  try {
    const auth = await authGuard({ requireKycLevel: 1 });
    if (!auth.success) return auth.response;

    const body = await request.json();
    const {
      amount,
      currency = 'XOF',
      provider,
      method,
      reference,
      metadata,
      customerEmail,
      customerPhone,
      countryCode,
      description,
    } = body as {
      amount: number;
      currency?: string;
      provider?: PaymentProvider;
      method: PaymentMethod;
      reference: string;
      metadata?: Record<string, unknown>;
      customerEmail?: string;
      customerPhone?: string;
      countryCode: string;
      description?: string;
    };

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    if (!method) {
      return NextResponse.json({ error: 'Moyen de paiement requis' }, { status: 400 });
    }

    if (!reference) {
      return NextResponse.json({ error: 'Référence de transaction requise' }, { status: 400 });
    }

    if (!countryCode) {
      return NextResponse.json({ error: 'Code pays requis' }, { status: 400 });
    }

    // Validate payment method availability
    const availableMethods = getAvailableMethods(countryCode);
    if (!availableMethods.includes(method)) {
      return NextResponse.json(
        { error: 'Moyen de paiement non disponible dans ce pays', availableMethods },
        { status: 400 }
      );
    }

    // Auto-select provider if not specified
    const selectedProvider = provider || selectBestProvider(countryCode, method);

    // Get user email if not provided
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { email: true, phone: true, name: true },
    });

    // Initiate payment through PAL
    const result = await initiatePayment({
      amount,
      currency,
      provider: selectedProvider,
      method,
      reference,
      metadata: {
        ...metadata,
        userId: auth.userId,
      },
      customerEmail: customerEmail || user?.email || '',
      customerPhone: customerPhone || user?.phone || undefined,
      countryCode,
      description,
    });

    // Create a wallet transaction record for tracking
    await db.walletTransaction.create({
      data: {
        userId: auth.userId,
        type: 'escrow_fund',
        amount: -amount, // Debit from wallet perspective
        balanceAfter: 0, // Will be updated by webhook
        currency,
        status: 'pending',
        providerRef: result.providerRef,
        metadata: JSON.stringify({
          paymentId: result.paymentId,
          provider: selectedProvider,
          method,
          reference,
          countryCode,
          redirectUrl: result.redirectUrl,
        }),
      },
    });

    return NextResponse.json({
      success: result.success,
      paymentId: result.paymentId,
      providerRef: result.providerRef,
      redirectUrl: result.redirectUrl,
      status: result.status,
      provider: selectedProvider,
    }, { status: 201 });
  } catch (error) {
    console.error('Payment initiation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to initiate payment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
