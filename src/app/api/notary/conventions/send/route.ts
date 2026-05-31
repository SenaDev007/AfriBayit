import { NextRequest, NextResponse } from 'next/server';

interface ConventionRequest {
  transactionId: string;
  notaryId: string;
  conventionType: string;
  signers: { id: string; fullName: string; email: string; role: string }[];
}

// In-memory store for demo
const conventions = new Map<string, {
  id: string;
  transactionId: string;
  notaryId: string;
  conventionType: string;
  status: 'sent' | 'viewed' | 'signed' | 'expired';
  signers: { id: string; fullName: string; role: string; status: string; signedAt?: string }[];
  sentAt: string;
  expiresAt: string;
}>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ConventionRequest;
    const { transactionId, notaryId, conventionType, signers } = body;

    if (!transactionId || !notaryId || !signers?.length) {
      return NextResponse.json(
        { error: 'transactionId, notaryId et signers sont requis' },
        { status: 400 }
      );
    }

    const id = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const convention = {
      id,
      transactionId,
      notaryId,
      conventionType: conventionType || 'convention_notariale',
      status: 'sent' as const,
      signers: signers.map(s => ({
        id: s.id,
        fullName: s.fullName,
        role: s.role,
        status: 'pending',
      })),
      sentAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    conventions.set(id, convention);

    return NextResponse.json({
      success: true,
      convention: {
        id: convention.id,
        transactionId: convention.transactionId,
        type: convention.conventionType,
        status: convention.status,
        signers: convention.signers,
        sentAt: convention.sentAt,
        expiresAt: convention.expiresAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'envoi de la convention';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
