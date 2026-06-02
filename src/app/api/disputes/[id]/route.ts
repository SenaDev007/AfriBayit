// AfriBayit — GET/PATCH /api/disputes/[id]
// Get dispute details and advance step

import { NextResponse } from 'next/server';

// Demo dispute data
function getDispute(id: string) {
  return {
    id,
    transactionId: 'txn_demo_001',
    transactionRef: 'TXN-2025-001',
    amount: 15000000,
    currency: 'XOF',
    buyerId: 'user_buyer_1',
    buyerName: 'Amadou Diallo',
    sellerId: 'user_seller_1',
    sellerName: 'Marie Koffi',
    currentStep: 3,
    status: 'mediation' as const,
    reason: 'Description du bien non conforme aux photos de l\'annonce',
    evidence: [
      { id: 'ev_1', party: 'buyer' as const, fileName: 'contrat_achat.pdf', uploadedAt: '2025-12-14T10:00:00Z', type: 'Contrat', fileSize: 245000, mimeType: 'application/pdf' },
      { id: 'ev_2', party: 'seller' as const, fileName: 'rapport_inspection.jpg', uploadedAt: '2025-12-14T12:00:00Z', type: 'Photo', fileSize: 1800000, mimeType: 'image/jpeg' },
      { id: 'ev_3', party: 'buyer' as const, fileName: 'releve_bancaire.pdf', uploadedAt: '2025-12-14T14:00:00Z', type: 'Financier', fileSize: 89000, mimeType: 'application/pdf' },
    ],
    messages: [
      { id: 'msg_1', sender: 'system' as const, content: 'Litige ouvert automatiquement. Les fonds sont gelés en escrow.', timestamp: '2025-12-14T09:00:00Z', type: 'message' as const },
      { id: 'msg_2', sender: 'buyer' as const, content: 'Je conteste l\'état du bien. Les photos ne correspondent pas à la description.', timestamp: '2025-12-14T09:15:00Z', type: 'message' as const },
      { id: 'msg_3', sender: 'seller' as const, content: 'Le bien était en bon état lors de la visite. Les photos sont anciennes.', timestamp: '2025-12-14T09:30:00Z', type: 'message' as const },
    ],
    mediationProposal: {
      proposedBy: 'system' as const,
      buyerPercentage: 60,
      sellerPercentage: 40,
      message: 'Proposition de médiation automatique basée sur l\'analyse des preuves.',
      status: 'pending' as const,
    },
    timeline: [
      { step: 1, label: 'Déclaration', completedAt: '2025-12-14T09:00:00Z', isActive: false },
      { step: 2, label: 'Collection de preuves', completedAt: '2025-12-14T14:00:00Z', isActive: false },
      { step: 3, label: 'Tentative de médiation', isActive: true },
      { step: 4, label: 'Intervention admin pays' },
      { step: 5, label: 'Décision d\'arbitrage' },
      { step: 6, label: 'Exécution' },
    ],
    createdAt: '2025-12-14T09:00:00Z',
    updatedAt: '2025-12-14T14:00:00Z',
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dispute = getDispute(id);
    if (!dispute) {
      return NextResponse.json({ error: 'Litige non trouvé' }, { status: 404 });
    }
    return NextResponse.json(dispute);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch dispute';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { currentStep, metadata } = body as {
      currentStep?: number;
      metadata?: Record<string, unknown>;
    };

    const dispute = getDispute(id);
    if (!dispute) {
      return NextResponse.json({ error: 'Litige non trouvé' }, { status: 404 });
    }

    if (currentStep && currentStep > dispute.currentStep) {
      dispute.currentStep = currentStep;
      dispute.updatedAt = new Date().toISOString();

      const stepStatuses = ['open', 'open', 'mediation', 'admin_review', 'decided', 'executed'] as const;
      dispute.status = stepStatuses[Math.min(currentStep - 1, stepStatuses.length - 1)];

      // Update timeline
      dispute.timeline = dispute.timeline.map((t, i) => ({
        ...t,
        completedAt: i < currentStep ? t.completedAt || new Date().toISOString() : undefined,
        isActive: i + 1 === currentStep,
      }));

      if (currentStep === 6) {
        dispute.executionLog = {
          hash: `sha256:${Buffer.from(JSON.stringify({ id, step: currentStep, metadata, ts: Date.now() })).toString('base64').slice(0, 40)}`,
          signedAt: new Date().toISOString(),
          signedBy: 'system_afrbayit',
          algorithm: 'SHA-256',
        };
      }
    }

    return NextResponse.json({ success: true, dispute });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update dispute';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
