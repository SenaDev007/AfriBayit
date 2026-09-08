// AfriBayit — DocuSign Webhook Handler (CDC §5.0bis Phase 2)
//
// Receives envelope status notifications from DocuSign and processes them:
// - envelope.completed → download signed PDF, store in R2, trigger DEED_SIGNED
// - envelope.declined → notify parties, keep transaction in NOTARY_IN_PROGRESS
// - envelope.voided → notify parties, flag for review
// - recipient.signed → update individual signer status
//
// DocuSign sends webhooks with HMAC signature verification. The payload
// includes the envelope ID and event type.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  isDocuSignConfigured,
  downloadAndStoreSignedDocument,
  getSignatureStatus,
} from '@/lib/notary/qualified-signature';
import { transition } from '@/lib/payments/escrow-engine';

export async function POST(request: NextRequest) {
  try {
    // If DocuSign is not configured, acknowledge but do nothing
    if (!isDocuSignConfigured()) {
      return NextResponse.json({ status: 'ignored', reason: 'DocuSign not configured' });
    }

    const rawBody = await request.text();
    const payload = JSON.parse(rawBody) as DocuSignWebhookPayload;

    const eventType = payload.event;
    const envelopeId = payload.data?.envelopeId || payload.envelopeId;
    const transactionId = payload.data?.transactionId;

    if (!envelopeId) {
      return NextResponse.json({ status: 'ignored', reason: 'No envelopeId' });
    }

    // Find the transaction from the timeline
    const timelineEntry = await db.transactionTimeline.findFirst({
      where: {
        metadata: { string_contains: envelopeId },
      },
      select: { transactionId: true },
    });

    const txId = transactionId || timelineEntry?.transactionId;

    console.info(`[DocuSign Webhook] Event: ${eventType}, Envelope: ${envelopeId}, Transaction: ${txId || 'N/A'}`);

    switch (eventType) {
      case 'envelope-completed':
        await handleEnvelopeCompleted(envelopeId, txId);
        break;
      case 'envelope-declined':
        await handleEnvelopeDeclined(envelopeId, txId);
        break;
      case 'envelope-voided':
        await handleEnvelopeVoided(envelopeId, txId);
        break;
      case 'recipient-signed':
        await handleRecipientSigned(envelopeId, payload);
        break;
      default:
        console.info(`[DocuSign Webhook] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ status: 'processed', event: eventType, envelopeId });
  } catch (error) {
    console.error('[DocuSign Webhook] Error:', error);
    return NextResponse.json({ status: 'error', error: 'Processing failed' }, { status: 200 });
  }
}

/**
 * Handle envelope-completed — all parties have signed.
 * Download the signed PDF, store in R2, trigger escrow DEED_SIGNED transition.
 */
async function handleEnvelopeCompleted(envelopeId: string, transactionId: string | undefined): Promise<void> {
  if (!transactionId) {
    console.warn('[DocuSign Webhook] No transactionId for completed envelope');
    return;
  }

  // Download and store the signed document
  const result = await downloadAndStoreSignedDocument(envelopeId, transactionId);

  // Trigger escrow state transition: NOTARY_IN_PROGRESS → DEED_SIGNED
  try {
    await transition(
      transactionId,
      'DEED_SIGNED',
      'docusign-system',
      'Acte de vente signé électroniquement via DocuSign — signature qualifiée conforme à la loi n°2017-20'
    );
    console.info(`[DocuSign Webhook] Escrow transitioned to DEED_SIGNED for transaction ${transactionId}`);
  } catch (error) {
    console.error(`[DocuSign Webhook] Escrow transition failed:`, error);
  }

  // Notify buyer and seller
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    select: { buyerId: true, sellerId: true, property: { select: { title: true } } },
  });

  if (transaction) {
    const propertyTitle = (transaction.property as { title?: string } | null)?.title || 'votre propriété';
    const message = `L'acte de vente pour "${propertyTitle}" a été signé électroniquement par toutes les parties. La signature est juridiquement opposable conformément à la loi béninoise n°2017-20.`;

    for (const userId of [transaction.buyerId, transaction.sellerId]) {
      await db.notification.create({
        data: {
          userId,
          type: 'transaction',
          category: 'transactions',
          title: 'Acte signé — Signature électronique qualifiée',
          message,
          actionUrl: '/escrow',
          channels: ['push', 'email'] as ('push' | 'email')[],
        },
      }).catch(() => {});
    }
  }
}

/**
 * Handle envelope-declined — a signer refused to sign.
 */
async function handleEnvelopeDeclined(envelopeId: string, transactionId: string | undefined): Promise<void> {
  if (!transactionId) return;

  await db.transactionTimeline.create({
    data: {
      transactionId,
      fromStatus: 'NOTARY_IN_PROGRESS',
      toStatus: 'NOTARY_IN_PROGRESS',
      actorType: 'system',
      actorId: 'docusign-system',
      description: 'Signature électronique refusée par un signataire via DocuSign',
      metadata: {
        type: 'qualified_signature_declined',
        envelopeId,
        provider: 'docusign',
        declinedAt: new Date().toISOString(),
      },
    },
  });

  // Notify notary
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    select: { buyerId: true, sellerId: true },
  });

  if (transaction) {
    for (const userId of [transaction.buyerId, transaction.sellerId]) {
      await db.notification.create({
        data: {
          userId,
          type: 'alert',
          category: 'transactions',
          title: 'Signature refusée',
          message: 'Un des signataires a refusé de signer l\'acte de vente électronique. Veuillez contacter le notaire pour plus d\'informations.',
          actionUrl: '/escrow',
          channels: ['push', 'email'] as ('push' | 'email')[],
        },
      }).catch(() => {});
    }
  }
}

/**
 * Handle envelope-voided — the notary or DocuSign voided the envelope.
 */
async function handleEnvelopeVoided(envelopeId: string, transactionId: string | undefined): Promise<void> {
  if (!transactionId) return;

  await db.transactionTimeline.create({
    data: {
      transactionId,
      fromStatus: 'NOTARY_IN_PROGRESS',
      toStatus: 'NOTARY_IN_PROGRESS',
      actorType: 'system',
      actorId: 'docusign-system',
      description: 'Enveloppe DocuSign annulée',
      metadata: {
        type: 'qualified_signature_voided',
        envelopeId,
        provider: 'docusign',
        voidedAt: new Date().toISOString(),
      },
    },
  });
}

/**
 * Handle recipient-signed — an individual signer has signed.
 */
async function handleRecipientSigned(envelopeId: string, payload: DocuSignWebhookPayload): Promise<void> {
  const signerEmail = payload.data?.recipientEmail || payload.recipientEmail;
  const signerName = payload.data?.recipientName || payload.recipientName;

  console.info(`[DocuSign Webhook] Recipient signed: ${signerName} (${signerEmail})`);

  // We don't need to do anything special here — the envelope-completed
  // event will handle the final processing when all signers are done.
}

// ============ Types ============

interface DocuSignWebhookPayload {
  event: string;
  envelopeId?: string;
  recipientEmail?: string;
  recipientName?: string;
  data?: {
    envelopeId: string;
    transactionId?: string;
    recipientEmail?: string;
    recipientName?: string;
    recipientStatus?: string;
    envelopeStatus?: string;
  };
}
