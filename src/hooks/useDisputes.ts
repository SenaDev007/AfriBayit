import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPatch } from '@/lib/api';

export interface DisputeEvidence {
  id: string;
  party: 'buyer' | 'seller';
  fileName: string;
  uploadedAt: string;
  type: string;
  fileSize?: number;
  mimeType?: string;
}

export interface DisputeMessage {
  id: string;
  sender: 'buyer' | 'seller' | 'admin' | 'system';
  content: string;
  timestamp: string;
  type?: 'message' | 'proposal' | 'counter_proposal' | 'acceptance';
}

export interface DisputeDecision {
  type: 'total_release' | 'partial_release' | 'full_refund';
  buyerPercentage: number;
  sellerPercentage: number;
  reason: string;
  decidedAt: string;
  decidedBy: string;
  executionHash?: string;
  immutable: boolean;
}

export interface DisputeData {
  id: string;
  transactionId: string;
  transactionRef: string;
  amount: number;
  currency: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  currentStep: number;
  status: 'open' | 'mediation' | 'admin_review' | 'decided' | 'executed' | 'appealed';
  reason: string;
  evidence: DisputeEvidence[];
  messages: DisputeMessage[];
  decision?: DisputeDecision;
  mediationProposal?: {
    proposedBy: 'buyer' | 'seller' | 'system';
    buyerPercentage: number;
    sellerPercentage: number;
    message: string;
    status: 'pending' | 'accepted' | 'rejected';
  };
  timeline: {
    step: number;
    label: string;
    completedAt?: string;
    isActive: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
  executionLog?: {
    hash: string;
    signedAt: string;
    signedBy: string;
    algorithm: string;
  };
}

export function useDispute(disputeId: string) {
  return useQuery({
    queryKey: ['dispute', disputeId],
    queryFn: () => apiFetch<DisputeData>(`/api/disputes/${disputeId}`),
    enabled: !!disputeId,
  });
}

export function useDisputes(status?: string) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  return useQuery({
    queryKey: ['disputes', status],
    queryFn: () => apiFetch<{ disputes: DisputeData[] }>(`/api/disputes?${params.toString()}`),
  });
}

export function useUploadEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ disputeId, file, party, type }: {
      disputeId: string;
      file: File;
      party: 'buyer' | 'seller';
      type: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('party', party);
      formData.append('type', type);
      const res = await fetch(`/api/disputes/${disputeId}/evidence`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(err.message || 'Upload failed');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dispute', variables.disputeId] });
    },
  });
}

export function useSubmitMediation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, buyerPercentage, sellerPercentage, message }: {
      disputeId: string;
      buyerPercentage: number;
      sellerPercentage: number;
      message: string;
    }) => apiPost(`/api/disputes/${disputeId}/mediation`, {
      buyerPercentage,
      sellerPercentage,
      message,
    }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dispute', variables.disputeId] });
    },
  });
}

export function useSubmitDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, type, buyerPercentage, sellerPercentage, reason }: {
      disputeId: string;
      type: 'total_release' | 'partial_release' | 'full_refund';
      buyerPercentage: number;
      sellerPercentage: number;
      reason: string;
    }) => apiPost(`/api/disputes/${disputeId}/decision`, {
      type,
      buyerPercentage,
      sellerPercentage,
      reason,
    }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dispute', variables.disputeId] });
    },
  });
}

export function useAdvanceDisputeStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ disputeId, step, metadata }: {
      disputeId: string;
      step: number;
      metadata?: Record<string, unknown>;
    }) => apiPatch(`/api/disputes/${disputeId}`, { currentStep: step, metadata }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dispute', variables.disputeId] });
    },
  });
}
