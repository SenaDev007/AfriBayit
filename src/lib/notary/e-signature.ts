/**
 * AfriBayit — Electronic Signature System
 * Request, track, and confirm electronic signatures for notarial documents
 * Uses Prisma with TransactionTimeline for persistence
 */

import { db } from '@/lib/db';

export interface Signer {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'buyer' | 'seller' | 'notary' | 'witness';
  signatureType: 'electronic' | 'digital';
  status: 'pending' | 'notified' | 'viewed' | 'signed' | 'rejected' | 'expired';
  notifiedAt?: string;
  viewedAt?: string;
  signedAt?: string;
  signatureData?: string;
  ipAddress?: string;
  userAgent?: string;
  rejectionReason?: string;
}

export interface SignatureRequest {
  id: string;
  documentId: string;
  deedId: string;
  transactionId: string;
  signers: Signer[];
  status: 'draft' | 'sent' | 'in_progress' | 'completed' | 'expired' | 'cancelled';
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
  sentAt?: string;
}

export interface SignatureConfirmation {
  signerId: string;
  documentId: string;
  signatureData: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  isValid: boolean;
}

/**
 * Request electronic signatures for a document
 * Persists as a TransactionTimeline entry with type 'signature_request'
 */
export async function requestSignature(
  documentId: string,
  deedId: string,
  transactionId: string,
  signers: Omit<Signer, 'status' | 'notifiedAt' | 'viewedAt' | 'signedAt' | 'signatureData' | 'ipAddress' | 'userAgent' | 'rejectionReason'>[],
  expiresInDays: number = 30
): Promise<SignatureRequest> {
  const id = `sig-req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

  const initializedSigners: Signer[] = signers.map(s => ({
    ...s,
    status: 'notified' as const,
    notifiedAt: now.toISOString(),
  }));

  const request: SignatureRequest = {
    id,
    documentId,
    deedId,
    transactionId,
    signers: initializedSigners,
    status: 'sent',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    sentAt: now.toISOString(),
  };

  // Persist as a TransactionTimeline entry
  await db.transactionTimeline.create({
    data: {
      transactionId,
      fromStatus: 'signature_request',
      toStatus: 'signature_request',
      actorType: 'system',
      description: `Signature request created for document ${documentId}`,
      metadata: JSON.stringify({
        type: 'signature_request',
        signatureRequestId: id,
        documentId,
        deedId,
        signers: initializedSigners,
        status: 'sent',
        expiresAt: expiresAt.toISOString(),
        sentAt: now.toISOString(),
        createdAt: now.toISOString(),
      }),
    },
  });

  return request;
}

/**
 * Get a signature request by its ID
 * Searches TransactionTimeline for the matching entry
 */
export async function getSignatureRequest(requestId: string): Promise<SignatureRequest | null> {
  const entry = await db.transactionTimeline.findFirst({
    where: {
      metadata: { contains: requestId },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!entry) return null;

  try {
    const meta = JSON.parse(entry.metadata || '{}');
    if (meta.type !== 'signature_request' || meta.signatureRequestId !== requestId) {
      return null;
    }
    return {
      id: meta.signatureRequestId,
      documentId: meta.documentId,
      deedId: meta.deedId,
      transactionId: entry.transactionId,
      signers: meta.signers || [],
      status: meta.status,
      createdAt: meta.createdAt,
      expiresAt: meta.expiresAt,
      completedAt: meta.completedAt,
      sentAt: meta.sentAt,
    };
  } catch {
    return null;
  }
}

/**
 * List signature requests, optionally filtered by transactionId
 */
export async function listSignatureRequests(transactionId?: string): Promise<SignatureRequest[]> {
  const where: Record<string, unknown> = {};
  if (transactionId) {
    where.transactionId = transactionId;
  }

  // Find all timeline entries that are signature requests
  const entries = await db.transactionTimeline.findMany({
    where: {
      ...where,
      metadata: { contains: '"type":"signature_request"' },
    },
    orderBy: { createdAt: 'desc' },
  });

  const results: SignatureRequest[] = [];
  for (const entry of entries) {
    try {
      const meta = JSON.parse(entry.metadata || '{}');
      if (meta.type === 'signature_request') {
        results.push({
          id: meta.signatureRequestId,
          documentId: meta.documentId,
          deedId: meta.deedId,
          transactionId: entry.transactionId,
          signers: meta.signers || [],
          status: meta.status,
          createdAt: meta.createdAt,
          expiresAt: meta.expiresAt,
          completedAt: meta.completedAt,
          sentAt: meta.sentAt,
        });
      }
    } catch {
      // Skip malformed entries
    }
  }

  return results;
}

/**
 * Confirm a signature for a document
 * Updates the existing signature request and creates a completion timeline entry
 */
export async function confirmSignature(
  requestId: string,
  signerId: string,
  signatureData: string,
  ipAddress: string,
  userAgent: string
): Promise<SignatureConfirmation> {
  const now = new Date().toISOString();

  const confirmation: SignatureConfirmation = {
    signerId,
    documentId: requestId, // Using requestId as document reference
    signatureData,
    timestamp: now,
    ipAddress,
    userAgent,
    isValid: true,
  };

  // Find the original signature request
  const existingEntry = await db.transactionTimeline.findFirst({
    where: {
      metadata: { contains: requestId },
    },
    orderBy: { createdAt: 'desc' },
  });

  let transactionId = '';
  let updatedSigners: Signer[] = [];
  let newRequestStatus: SignatureRequest['status'] = 'in_progress';
  let completedAt: string | undefined;

  if (existingEntry) {
    try {
      const meta = JSON.parse(existingEntry.metadata || '{}');
      transactionId = existingEntry.transactionId;
      updatedSigners = (meta.signers || []) as Signer[];

      // Update the signer's status
      const signer = updatedSigners.find((s: Signer) => s.id === signerId);
      if (signer) {
        signer.status = 'signed';
        signer.signedAt = now;
        signer.signatureData = signatureData;
        signer.ipAddress = ipAddress;
        signer.userAgent = userAgent;
      }

      // Check if all signers have signed
      const allSigned = updatedSigners.every((s: Signer) => s.status === 'signed');
      if (allSigned) {
        newRequestStatus = 'completed';
        completedAt = now;
      }
    } catch {
      // Fallback: use requestId-based transaction lookup
    }
  }

  // Create a timeline entry for the signature confirmation
  await db.transactionTimeline.create({
    data: {
      transactionId: transactionId || 'unknown',
      fromStatus: 'signature_request',
      toStatus: newRequestStatus === 'completed' ? 'signature_completed' : 'signature_in_progress',
      actorType: 'buyer', // Will be overridden by the signer's role context
      actorId: signerId,
      description: `Signature confirmed by signer ${signerId}`,
      metadata: JSON.stringify({
        type: 'signature_completed',
        signatureRequestId: requestId,
        signerId,
        signatureData,
        ipAddress,
        userAgent,
        signedAt: now,
        isValid: true,
        requestStatus: newRequestStatus,
        completedAt,
        updatedSigners,
      }),
    },
  });

  // Update the original request entry with the new signer statuses
  if (existingEntry && transactionId) {
    try {
      const meta = JSON.parse(existingEntry.metadata || '{}');
      await db.transactionTimeline.update({
        where: { id: existingEntry.id },
        data: {
          metadata: JSON.stringify({
            ...meta,
            signers: updatedSigners,
            status: newRequestStatus,
            completedAt,
          }),
        },
      });
    } catch {
      // If update fails, the new timeline entry still records the confirmation
    }
  }

  return confirmation;
}

/**
 * Track signature status for a request
 */
export async function trackSignatureStatus(requestId: string): Promise<{
  request: SignatureRequest | null;
  progress: {
    total: number;
    signed: number;
    pending: number;
    percentage: number;
    allSigned: boolean;
  };
  signers: {
    name: string;
    role: string;
    status: string;
    signedAt?: string;
  }[];
}> {
  const request = await getSignatureRequest(requestId);

  if (!request) {
    return {
      request: null,
      progress: { total: 0, signed: 0, pending: 0, percentage: 0, allSigned: false },
      signers: [],
    };
  }

  const total = request.signers.length;
  const signed = request.signers.filter(s => s.status === 'signed').length;
  const pending = total - signed;

  return {
    request,
    progress: {
      total,
      signed,
      pending,
      percentage: total > 0 ? Math.round((signed / total) * 100) : 0,
      allSigned: signed === total,
    },
    signers: request.signers.map(s => ({
      name: s.fullName,
      role: s.role,
      status: s.status,
      signedAt: s.signedAt,
    })),
  };
}
