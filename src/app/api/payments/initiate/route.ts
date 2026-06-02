// AfriBayit — POST /api/payments/initiate
// Initiate a payment through the Payment Abstraction Layer
// Supports: Mobile Money (MTN, Orange, Moov), Visa/Mastercard
// Creates Transaction + EscrowAccount records and returns FedaPay checkout URL

import { NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';
import { db } from '@/lib/db';
import { initiatePayment, selectBestProvider, getAvailableMethods } from '@/lib/payments';
import type { PaymentProvider, PaymentMethod } from '@/lib/payments/types';

/** Map simplified payment method names to our PaymentMethod type */
function resolvePaymentMethod(method: string, _countryCode: string): PaymentMethod {
  // Handle simplified names from the frontend
  switch (method) {
    case 'mobile_money':
    case 'mobile_money_mtn':
      // Default Mobile Money to MTN for the country
      return 'mobile_money_mtn';
    case 'mobile_money_orange':
      return 'mobile_money_orange';
    case 'mobile_money_moov':
      return 'mobile_money_moov';
    case 'mobile_money_wave':
      return 'mobile_money_wave';
    case 'card':
    case 'card_visa':
      return 'card_visa';
    case 'card_mastercard':
      return 'card_mastercard';
    default:
      return method as PaymentMethod;
  }
}

interface PropertyInfo {
  id: string;
  title: string;
  type: string;
  transaction: string;
  price: number;
  currency: string;
  country: string;
  city: string;
  agentId: string;
}

export async function POST(request: Request) {
  try {
    const auth = await authGuard({ requireKycLevel: 1 });
    if (!auth.success) return auth.response;

    const body = await request.json();
    const {
      propertyId,
      amount,
      currency = 'XOF',
      provider,
      method: rawMethod = 'mobile_money',
      paymentMethod, // alternative field name
      reference,
      metadata,
      customerEmail,
      customerPhone,
      countryCode: bodyCountryCode,
      description,
    } = body as {
      propertyId?: string;
      amount: number;
      currency?: string;
      provider?: PaymentProvider;
      method?: string;
      paymentMethod?: string; // alternative: 'mobile_money' or 'card'
      reference?: string;
      metadata?: Record<string, unknown>;
      customerEmail?: string;
      customerPhone?: string;
      countryCode?: string;
      description?: string;
    };

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    // Resolve payment method (support both 'method' and 'paymentMethod' fields)
    const methodInput = rawMethod || paymentMethod || 'mobile_money';

    // Determine country code
    let countryCode = bodyCountryCode || auth.country || 'BJ';

    // If propertyId is provided, look up the property for additional context
    let property: PropertyInfo | null = null;
    let sellerId: string | undefined;
    let transactionId: string | undefined = reference;

    if (propertyId) {
      property = await db.property.findUnique({
        where: { id: propertyId },
        select: {
          id: true,
          title: true,
          type: true,
          transaction: true,
          price: true,
          currency: true,
          country: true,
          city: true,
          agentId: true,
        },
      });

      if (!property) {
        return NextResponse.json(
          { error: 'Propriété introuvable' },
          { status: 404 }
        );
      }

      // Use property's country if not provided
      if (!bodyCountryCode && property.country) {
        countryCode = property.country;
      }

      // The seller is the property owner/agent
      sellerId = property.agentId;
    }

    // Resolve to a proper PaymentMethod
    const method = resolvePaymentMethod(methodInput, countryCode);

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

    // Get user info for customer data
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { email: true, phone: true, name: true, firstName: true, lastName: true },
    });

    // Create or find the Transaction record
    if (propertyId && sellerId) {
      // Check for existing transaction
      const existingTransaction = reference
        ? await db.transaction.findUnique({ where: { id: reference } })
        : null;

      if (existingTransaction) {
        transactionId = existingTransaction.id;
      } else {
        // Create new transaction
        const newTransaction = await db.transaction.create({
          data: {
            propertyId,
            buyerId: auth.userId,
            sellerId,
            amount,
            commission: 0, // Will be calculated by escrow engine on release
            currency,
            country: countryCode,
            status: 'CREATED',
            paymentProvider: selectedProvider,
          },
        });
        transactionId = newTransaction.id;

        // Create escrow account for this transaction
        await db.escrowAccount.create({
          data: {
            transactionId: newTransaction.id,
            balance: 0,
            heldAmount: 0,
            releasedAmount: 0,
            refundedAmount: 0,
            currency,
            status: 'EMPTY',
          },
        });

        console.log(`[Payment] Transaction ${transactionId} created for property ${propertyId} with escrow account`);
      }
    }

    // Build description
    const paymentDescription = description || (property
      ? `Achat ${property.title} - AfriBayit`
      : `Paiement AfriBayit - ${amount} ${currency}`);

    // Initiate payment through PAL
    const result = await initiatePayment({
      amount,
      currency,
      provider: selectedProvider,
      method,
      reference: transactionId || `pay_${Date.now()}`,
      metadata: {
        ...metadata,
        userId: auth.userId,
        propertyId: propertyId || undefined,
        transactionId: transactionId || undefined,
        customerFirstName: user?.firstName || user?.name?.split(' ')[0] || '',
        customerLastName: user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '',
      },
      customerEmail: customerEmail || user?.email || '',
      customerPhone: customerPhone || user?.phone || undefined,
      countryCode,
      description: paymentDescription,
    });

    // Update the Transaction record with payment reference
    if (transactionId) {
      await db.transaction.update({
        where: { id: transactionId },
        data: {
          paymentProvider: selectedProvider,
          paymentRef: result.providerRef,
          escrowReference: result.paymentId,
        },
      }).catch(() => {
        // Transaction record might not exist for non-property payments
      });
    }

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
          reference: transactionId,
          propertyId: propertyId || undefined,
          transactionId: transactionId || undefined,
          redirectUrl: result.redirectUrl,
          countryCode,
        }),
      },
    });

    console.log(`[Payment] Payment initiated: ${result.paymentId}, provider: ${selectedProvider}, method: ${method}`);

    return NextResponse.json({
      success: result.success,
      paymentId: result.paymentId,
      providerRef: result.providerRef,
      redirectUrl: result.redirectUrl,
      status: result.status,
      provider: selectedProvider,
      method,
      transactionId: transactionId || null,
      currency,
      amount,
    }, { status: 201 });
  } catch (error) {
    console.error('Payment initiation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to initiate payment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
