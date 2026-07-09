import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiPost } from '@/lib/api-client';

/** List user's transactions (as buyer/tenant or seller/owner — CDC §5.1.3) */
export function useTransactions(userId?: string, country?: string, page = 1, limit = 20) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (country) params.set('country', country);
  params.set('page', String(page));
  params.set('limit', String(limit));

  // Use the new user-scoped endpoint /properties/me/transactions when no userId
  // filter is provided (the common case — the JWT identifies the user).
  const endpoint = userId
    ? `/api/transactions?${params.toString()}`
    : `/api/properties/me/transactions?${params.toString()}`;

  return useQuery({
    queryKey: ['transactions', userId, country, page, limit],
    queryFn: () => api.get<{ transactions: any[]; pagination: any }>(endpoint),
  });
}

/** Initiate a purchase on a property — creates Transaction + EscrowAccount */
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { propertyId: string }) =>
      apiPost<{ transaction: any; escrow: any; message: string; nextStep: string; paymentUrl: string }>(
        `/api/properties/${data.propertyId}/purchase`,
        {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['escrow'] });
    },
  });
}

/**
 * Initiate a long-term rental on a property (CDC §5.1.3 / §6.2 / §7B.3).
 *
 * Creates on the backend:
 *   1. A Transaction (status=CREATED) funding the initial payment
 *      (first month's rent + security deposit).
 *   2. An EscrowAccount tied to that transaction.
 *   3. A Lease (status=DRAFT) capturing the rental terms.
 *   4. A first RentPayment row (status=PENDING, isInitial=true).
 *
 * The caller is then redirected to /escrow?transactionId=... to fund the
 * escrow via FedaPay / Stripe.
 */
export function useInitiateRent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      propertyId: string;
      leaseTermMonths?: number;
      securityDepositMonths?: number;
      startDate?: string;
      furnished?: boolean;
      chargesIncluded?: boolean;
      notes?: string;
    }) =>
      apiPost<{
        transaction: any;
        escrow: any;
        lease: any;
        rentPayment: any;
        message: string;
        nextStep: string;
        paymentUrl: string;
      }>(`/api/properties/${data.propertyId}/rent`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['escrow'] });
      queryClient.invalidateQueries({ queryKey: ['leases'] });
    },
  });
}

/**
 * Create a property visit appointment (CDC §5.1.3 — Gestion calendrier des visites).
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      propertyId: string;
      scheduledAt: string;
      duration?: number;
      notes?: string;
    }) => apiPost<any>(`/api/appointments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

/** List the current user's appointments (as visitor or agent) */
export function useAppointments(role: 'visitor' | 'agent' | 'all' = 'all', page = 1, limit = 20) {
  const params = new URLSearchParams();
  params.set('role', role);
  params.set('page', String(page));
  params.set('limit', String(limit));
  return useQuery({
    queryKey: ['appointments', role, page, limit],
    queryFn: () => api.get<{ appointments: any[]; pagination: any }>(`/api/appointments?${params.toString()}`),
  });
}
