import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiPost } from '@/lib/api-client';

/** List the current user's leases (as tenant or owner) */
export function useLeases(role: 'tenant' | 'owner' | 'all' = 'all', page = 1, limit = 20) {
  const params = new URLSearchParams();
  params.set('role', role);
  params.set('page', String(page));
  params.set('limit', String(limit));
  return useQuery({
    queryKey: ['leases', role, page, limit],
    queryFn: () => api.get<{ leases: any[]; pagination: any }>(`/api/leases?${params.toString()}`),
  });
}

/** Get a single lease with full details (property, parties, documents, inventories, rentPayments) */
export function useLease(leaseId: string | null) {
  return useQuery({
    queryKey: ['lease', leaseId],
    queryFn: () => api.get<any>(`/api/leases/${leaseId}`),
    enabled: !!leaseId,
  });
}

/** Generate the OHADA lease contract PDF */
export function useGenerateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leaseId: string) =>
      apiPost<{ document: any; leaseStatus: string; message: string }>(
        `/api/leases/${leaseId}/generate-contract`,
        {},
      ),
    onSuccess: (_data, leaseId) => {
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      queryClient.invalidateQueries({ queryKey: ['leases'] });
    },
  });
}

/** Sign the lease contract electronically */
export function useSignLease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { leaseId: string; signatureData: string; ipAddress?: string; userAgent?: string }) =>
      apiPost<{ document: any; lease: any; bothSigned: boolean; message: string }>(
        `/api/leases/${data.leaseId}/sign`,
        { signatureData: data.signatureData, ipAddress: data.ipAddress, userAgent: data.userAgent },
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lease', variables.leaseId] });
      queryClient.invalidateQueries({ queryKey: ['leases'] });
    },
  });
}

/** Create an inventory (in/out) */
export function useCreateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      leaseId: string;
      type: 'in' | 'out';
      items?: Array<{ room: string; condition: string; observations?: string; photos?: string[] }>;
      photos?: string[];
      conductedAt?: string;
    }) =>
      apiPost<any>(`/api/leases/${data.leaseId}/inventories`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lease', variables.leaseId] });
      queryClient.invalidateQueries({ queryKey: ['leases'] });
    },
  });
}

/** Sign an inventory electronically */
export function useSignInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { leaseId: string; inventoryId: string; signatureData: string }) =>
      apiPost<{ inventory: any; bothSigned: boolean; message: string }>(
        `/api/leases/${data.leaseId}/inventories/${data.inventoryId}/sign`,
        { signatureData: data.signatureData },
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lease', variables.leaseId] });
      queryClient.invalidateQueries({ queryKey: ['leases'] });
    },
  });
}

/** Record damages on the inventory-out (owner only) */
export function useRecordDamages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      leaseId: string;
      inventoryId: string;
      damages: Array<{ room: string; description: string; estimatedCost: number }>;
    }) =>
      apiPost<{ inventory: any; totalDamages: number; depositDeduction: number; message: string }>(
        `/api/leases/${data.leaseId}/inventories/${data.inventoryId}/damages`,
        { damages: data.damages },
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lease', variables.leaseId] });
      queryClient.invalidateQueries({ queryKey: ['leases'] });
    },
  });
}

/** List rent payments for a lease */
export function useRentPayments(leaseId: string | null) {
  return useQuery({
    queryKey: ['rent-payments', leaseId],
    queryFn: () => api.get<{ rentPayments: any[] }>(`/api/leases/${leaseId}/rent-payments`),
    enabled: !!leaseId,
  });
}

/**
 * Initiate payment for a monthly rent.
 * Returns the FedaPay/Stripe redirect URL — the tenant is redirected
 * to the provider to confirm the payment. On success, the webhook
 * releases the funds to the owner's wallet.
 */
export function usePayRent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      leaseId: string;
      paymentId: string;
      method: string;       // 'orange_money' | 'mtn_momo' | 'moov_money' | 'wave' | 'card'
      provider?: string;    // 'fedapay' | 'stripe'
    }) =>
      apiPost<{
        payment: any;
        walletTransaction: any;
        provider: string;
        providerResponse: any;
        message: string;
      }>(`/api/leases/${data.leaseId}/rent-payments/${data.paymentId}/pay`, {
        method: data.method,
        provider: data.provider,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rent-payments', variables.leaseId] });
      queryClient.invalidateQueries({ queryKey: ['lease', variables.leaseId] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

/** Owner rental dashboard — KPIs, revenue series, upcoming rents, vacancies (CDC §5.1.3) */
export function useOwnerDashboard() {
  return useQuery({
    queryKey: ['owner-dashboard'],
    queryFn: () => api.get<{
      kpis: {
        totalProperties: number;
        occupiedCount: number;
        vacancyCount: number;
        occupancyRate: number;
        theoreticalMonthlyRent: number;
        collectedThisMonth: number;
        outstandingAmount: number;
        overdueAmount: number;
      };
      revenueSeries: Array<{ month: string; label: string; amount: number }>;
      upcomingPayments: Array<{
        id: string;
        dueDate: string;
        amountDue: number;
        currency: string;
        status: string;
        lease: any;
      }>;
      vacantProperties: Array<any>;
      activeLeases: Array<any>;
    }>(`/api/leases/owner/dashboard`),
    staleTime: 60 * 1000, // refresh every minute
  });
}
