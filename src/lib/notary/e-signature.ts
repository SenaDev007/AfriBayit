/**
 * AfriBayit — Electronic Signature System
 * Request, track, and confirm electronic signatures for notarial documents
 */

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

// In-memory store for demo (in production, use database)
const signatureRequests = new Map<string, SignatureRequest>();

/**
 * Request electronic signatures for a document
 */
export function requestSignature(
  documentId: string,
  deedId: string,
  transactionId: string,
  signers: Omit<Signer, 'status' | 'notifiedAt' | 'viewedAt' | 'signedAt' | 'signatureData' | 'ipAddress' | 'userAgent' | 'rejectionReason'>[],
  expiresInDays: number = 30
): SignatureRequest {
  const id = `sig-req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

  const request: SignatureRequest = {
    id,
    documentId,
    deedId,
    transactionId,
    signers: signers.map(s => ({
      ...s,
      status: 'pending',
    })),
    status: 'sent',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    sentAt: now.toISOString(),
  };

  signatureRequests.set(id, request);

  // Mark signers as notified
  request.signers.forEach(s => {
    s.status = 'notified';
    s.notifiedAt = now.toISOString();
  });

  return request;
}

/**
 * Track signature status for a document
 */
export function trackSignatureStatus(documentId: string): {
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
} {
  let request: SignatureRequest | null = null;

  for (const [, req] of signatureRequests) {
    if (req.documentId === documentId) {
      request = req;
      break;
    }
  }

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

/**
 * Confirm a signature for a document
 */
export function confirmSignature(
  documentId: string,
  signerId: string,
  signatureData: string,
  ipAddress: string,
  userAgent: string
): SignatureConfirmation {
  const now = new Date().toISOString();

  const confirmation: SignatureConfirmation = {
    signerId,
    documentId,
    signatureData,
    timestamp: now,
    ipAddress,
    userAgent,
    isValid: true,
  };

  // Update the signature request
  for (const [, req] of signatureRequests) {
    if (req.documentId === documentId) {
      const signer = req.signers.find(s => s.id === signerId);
      if (signer) {
        signer.status = 'signed';
        signer.signedAt = now;
        signer.signatureData = signatureData;
        signer.ipAddress = ipAddress;
        signer.userAgent = userAgent;
      }

      // Check if all signers have signed
      const allSigned = req.signers.every(s => s.status === 'signed');
      if (allSigned) {
        req.status = 'completed';
        req.completedAt = now;
      } else {
        req.status = 'in_progress';
      }
      break;
    }
  }

  return confirmation;
}

/**
 * Get all signature requests for a transaction
 */
export function getSignatureRequestsForTransaction(transactionId: string): SignatureRequest[] {
  const results: SignatureRequest[] = [];
  for (const [, req] of signatureRequests) {
    if (req.transactionId === transactionId) {
      results.push(req);
    }
  }
  return results;
}

/**
 * Check if a signer has already signed
 */
export function hasSignerSigned(documentId: string, signerId: string): boolean {
  for (const [, req] of signatureRequests) {
    if (req.documentId === documentId) {
      const signer = req.signers.find(s => s.id === signerId);
      return signer?.status === 'signed';
    }
  }
  return false;
}
