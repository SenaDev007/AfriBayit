// AfriBayit — POST /api/payments/initiate
// Initiates a payment for a transaction using the appropriate provider
// Routes to FedaPay (BJ/CI/TG/BF) or Stripe (others)

import { NextRequest, NextResponse } from 'next/server';
import { initiatePayment, getAvailablePaymentMethods } from '@/lib/payments/provider-router';
import { db } from '@/lib/db';
import type { PaymentProvider, PaymentMethod } from '@/lib/payments/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      transactionId,
      amount,
      currency = 'XOF',
      country = 'BJ',
      method,
      customerEmail,
      customerPhone,
      customerFirstName,
      customerLastName,
      customerId,
      description,
      returnUrl,
    } = body;

    // Validate required fields
    if (!transactionId && !amount) {
      return NextResponse.json(
        { error: 'transactionId or amount is required' },
        { status: 400 }
      );
    }

    // If transactionId provided, fetch transaction details
    let paymentAmount = amount;
    let paymentCurrency = currency;
    let paymentCountry = country;
    let paymentDescription = description;
    let paymentCustomerId = customerId;
    let buyerEmail = customerEmail || '';
    let buyerPhone = customerPhone;
    let buyerFirstName = customerFirstName;
    let buyerLastName = customerLastName;
    let transactionRecord: any = null;

    if (transactionId) {
      transactionRecord = await db.transaction.findUnique({
        where: { id: transactionId },
        include: {
          buyer: { select: { email: true, phone: true, firstName: true, lastName: true } },
          property: { select: { title: true, country: true } },
        },
      });

      if (!transactionRecord) {
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        );
      }

      paymentAmount = transactionRecord.amount;
      paymentCurrency = transactionRecord.currency;
      paymentCountry = transactionRecord.country || country;
      paymentDescription = description || `AfriBayit — ${transactionRecord.property?.title || 'Transaction'}`;
      paymentCustomerId = transactionRecord.buyerId;
      buyerEmail = transactionRecord.buyer?.email || customerEmail || '';
      buyerPhone = transactionRecord.buyer?.phone || customerPhone;
      buyerFirstName = transactionRecord.buyer?.firstName || customerFirstName;
      buyerLastName = transactionRecord.buyer?.lastName || customerLastName;

      // Check if transaction can be funded
      if (transactionRecord.status !== 'CREATED') {
        return NextResponse.json(
          { error: `Transaction cannot be funded in status: ${transactionRecord.status}` },
          { status: 400 }
        );
      }
    }

    if (!buyerEmail) {
      return NextResponse.json(
        { error: 'Customer email is required' },
        { status: 400 }
      );
    }

    // Initiate payment via provider router
    const result = await initiatePayment(
      paymentAmount,
      paymentCurrency,
      paymentCountry,
      {
        email: buyerEmail,
        phone: buyerPhone,
        firstName: buyerFirstName,
        lastName: buyerLastName,
        id: paymentCustomerId,
      },
      {
        transactionId: transactionId || undefined,
        method: method as PaymentMethod | undefined,
        description: paymentDescription,
        returnUrl,
      }
    );

    // If transactionId provided and payment was initiated, update the transaction
    if (transactionId && result.success) {
      await db.transaction.update({
        where: { id: transactionId },
        data: {
          paymentProvider: result.provider,
          paymentRef: result.transactionId,
        },
      });
    }

    return NextResponse.json({
      success: result.success,
      provider: result.provider,
      transactionId: result.transactionId,
      checkoutUrl: result.checkoutUrl,
      clientSecret: result.clientSecret,
      status: result.status,
      error: result.error,
    });
  } catch (error) {
    console.error('POST /api/payments/initiate error:', error);
    return NextResponse.json(
      { error: 'Payment initiation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET: Return available payment methods for a country
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country') || 'BJ';

  const result = getAvailablePaymentMethods(country);

  return NextResponse.json(result);
}
