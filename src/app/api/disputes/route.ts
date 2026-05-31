// AfriBayit — GET /api/disputes
// List disputes with optional status filter

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Demo disputes data
    const disputes = [
      {
        id: 'disp_demo_001',
        transactionId: 'txn_demo_001',
        transactionRef: 'TXN-2025-001',
        amount: 15000000,
        currency: 'XOF',
        buyerId: 'user_buyer_1',
        buyerName: 'Amadou Diallo',
        sellerId: 'user_seller_1',
        sellerName: 'Marie Koffi',
        currentStep: 3,
        status: 'mediation',
        reason: 'Description du bien non conforme aux photos de l\'annonce',
        evidence: [
          { id: 'ev_1', party: 'buyer', fileName: 'contrat_achat.pdf', uploadedAt: '2025-12-14T10:00:00Z', type: 'Contrat', fileSize: 245000, mimeType: 'application/pdf' },
          { id: 'ev_2', party: 'seller', fileName: 'rapport_inspection.jpg', uploadedAt: '2025-12-14T12:00:00Z', type: 'Photo', fileSize: 1800000, mimeType: 'image/jpeg' },
          { id: 'ev_3', party: 'buyer', fileName: 'releve_bancaire.pdf', uploadedAt: '2025-12-14T14:00:00Z', type: 'Financier', fileSize: 89000, mimeType: 'application/pdf' },
        ],
        messages: [
          { id: 'msg_1', sender: 'system', content: 'Litige ouvert automatiquement. Les fonds sont gelés en escrow.', timestamp: '2025-12-14T09:00:00Z', type: 'message' },
          { id: 'msg_2', sender: 'buyer', content: 'Je conteste l\'état du bien. Les photos ne correspondent pas à la description.', timestamp: '2025-12-14T09:15:00Z', type: 'message' },
          { id: 'msg_3', sender: 'seller', content: 'Le bien était en bon état lors de la visite. Les photos sont anciennes.', timestamp: '2025-12-14T09:30:00Z', type: 'message' },
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
      },
    ];

    const filtered = status ? disputes.filter(d => d.status === status) : disputes;
    return NextResponse.json({ disputes: filtered });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch disputes';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
