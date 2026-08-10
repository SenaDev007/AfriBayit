// AfriBayit — API Client (CDC §3.1.2 — frontend calls NestJS backend)
// This module replaces the old apiFetch helper that called Next.js API routes.
// All requests now go to the separate NestJS backend (afribayit-api on Fly.io).

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Token Management ────────────────────────────────────────────────────

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('afribayit_access_token', token);
    } else {
      localStorage.removeItem('afribayit_access_token');
    }
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('afribayit_access_token');
    if (stored) {
      accessToken = stored;
      return stored;
    }
  }
  return null;
}

// ─── API Client ──────────────────────────────────────────────────────────

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  auth?: boolean; // Include Authorization header (default: true)
  formData?: boolean; // Don't set Content-Type JSON (for file uploads)
  body?: BodyInit | Record<string, unknown> | null;
  /**
   * Internal: when set, skip the 401 refresh+retry loop (used by the
   * retry itself to avoid infinite recursion).
   */
  _retried?: boolean;
}

export async function apiFetch<T = any>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { auth = true, formData, _retried: _skipRetry, ...fetchOptions } = options;
  void _skipRetry; // reserved for future retry-loop support

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Add country header for multitenancy (CDC §3.2)
  if (typeof window !== 'undefined') {
    const country = localStorage.getItem('afribayit_country') || 'BJ';
    headers['X-Country-Code'] = country;
  }

  // Add auth header
  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Set Content-Type for JSON (skip for FormData)
  if (!formData && !headers['Content-Type'] && fetchOptions.body) {
    headers['Content-Type'] = 'application/json';
  }

  // Ensure body is stringified if it's a plain object (NOT Blob/FormData/
  // URLSearchParams/ArrayBuffer). The widened ApiOptions.body type accepts
  // plain objects for ergonomic `apiFetch(path, { body: { foo: 1 } })` calls.
  let body: BodyInit | null | undefined = fetchOptions.body as BodyInit | null | undefined;
  if (
    fetchOptions.body &&
    typeof fetchOptions.body === 'object' &&
    !formData &&
    !(fetchOptions.body instanceof FormData) &&
    !(fetchOptions.body instanceof Blob) &&
    !(fetchOptions.body instanceof URLSearchParams) &&
    !(fetchOptions.body instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(fetchOptions.body)
  ) {
    body = JSON.stringify(fetchOptions.body);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    body,
    headers,
  });

  // Handle 401 — token expired, try refresh or redirect to login
  if (response.status === 401 && auth) {
    setAccessToken(null);
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
      window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
    }
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  // Parse response
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || data.message || 'Une erreur est survenue',
        response.status,
        data,
      );
    }

    return data as T;
  }

  if (!response.ok) {
    throw new ApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
    );
  }

  return response.text() as unknown as T;
}

// ─── API Error ───────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Convenience Methods ──────────────────────────────────────────────────

export const api = {
  get: <T = any>(path: string, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),

  post: <T = any>(path: string, body?: any, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),

  patch: <T = any>(path: string, body?: any, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),

  put: <T = any>(path: string, body?: any, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: 'PUT', body }),

  delete: <T = any>(path: string, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),

  upload: <T = any>(path: string, formData: FormData, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: 'POST', body: formData, formData: true }),

  /**
   * Download a binary file (PDF, image, …) and trigger a browser save
   * dialog. Uses the same auth + country headers as apiFetch.
   */
  async downloadBlob(path: string, filename?: string): Promise<void> {
    const headers: Record<string, string> = {
      Accept: 'application/octet-stream,*/*;q=0.8',
    };
    const country = readCountryCode();
    if (country) headers['X-Country-Code'] = country;
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${rewritePath(path)}`, { headers });
    if (!res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const data = await res.json().catch(() => ({}));
        throw new ApiError(
          (data && (data.error || data.message)) ||
            `HTTP ${res.status}: ${res.statusText}`,
          res.status,
          data,
        );
      }
      throw new ApiError(
        `HTTP ${res.status}: ${res.statusText}`,
        res.status,
      );
    }
    const blob = await res.blob();
    const cd = res.headers.get('content-disposition') || '';
    const cdMatch = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i);
    const finalName =
      filename ||
      (cdMatch ? decodeURIComponent(cdMatch[1]) : path.split('/').pop() || 'download');

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};

// ─── Auth Helpers ─────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }, { auth: false }),

  login2FA: (userId: string, otpCode: string) =>
    api.post('/auth/login/2fa', { userId, otpCode }, { auth: false }),

  register: (data: { email: string; password: string; name: string; phone?: string; country?: string }) =>
    api.post('/auth/register', data, { auth: false }),

  me: () => api.get('/auth/me'),

  setup2FA: () => api.post('/auth/2fa/setup'),
  enable2FA: (otpCode: string) => api.post('/auth/2fa/enable', { otpCode }),
  disable2FA: (password: string) => api.post('/auth/2fa/disable', { password }),

  sendOTP: (identifier: string) => api.post('/auth/otp/send', { identifier }, { auth: false }),
  verifyOTP: (identifier: string, code: string) =>
    api.post('/auth/otp/verify', { identifier, code }, { auth: false }),

  /** True reset-password endpoint — accepts OTP + new password. */
  resetPassword: (email: string, otpCode: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, otpCode, newPassword }, { auth: false }),

  /** Logout — invalidate the refresh token server-side. */
  logout: () => api.post('/auth/logout', {}),
};

// ─── Properties Helpers ───────────────────────────────────────────────────

export const propertiesApi = {
  list: (params?: Record<string, any>) =>
    api.get(`/properties?${new URLSearchParams(params).toString()}`),

  featured: (country?: string, limit?: number) =>
    api.get(`/properties/featured?${new URLSearchParams({ ...(country ? { country } : {}), ...(limit ? { limit: String(limit) } : {}) }).toString()}`),

  get: (id: string) => api.get(`/properties/${id}`),

  create: (data: any) => api.post('/properties', data),
  update: (id: string, data: any) => api.patch(`/properties/${id}`, data),
  delete: (id: string) => api.delete(`/properties/${id}`),
};

// ─── Escrow Helpers ───────────────────────────────────────────────────────

export const escrowApi = {
  fund: (transactionId: string, amount: number) =>
    api.post(`/escrow/${transactionId}/fund`, { amount }),

  release: (transactionId: string) =>
    api.post(`/escrow/${transactionId}/release`),

  dispute: (transactionId: string, reason: string, description: string) =>
    api.post(`/escrow/${transactionId}/dispute`, { reason, description }),

  ledger: (transactionId: string) =>
    api.get(`/escrow/${transactionId}/ledger`),
};

// ─── Payments Helpers ─────────────────────────────────────────────────────

export const paymentsApi = {
  initiate: (data: { transactionId: string; amount: number; currency: string; method: string }) =>
    api.post('/payments/initiate', data),

  verify: (reference: string) =>
    api.get(`/payments/verify?reference=${encodeURIComponent(reference)}`),
};

// ─── Users Helpers ────────────────────────────────────────────────────────

export const usersApi = {
  me: () => api.get('/users/me'),
  updateProfile: (data: any) => api.patch('/users/me', data),
  wallet: () => api.get('/users/me/wallet'),
};

// ─── KYC Helpers ──────────────────────────────────────────────────────────

export const kycApi = {
  submit: (data: { documentType: string; docUrl: string; country?: string }) =>
    api.post('/kyc/submit', data),

  list: () => api.get('/kyc'),

  validate: (docId: string, decision: 'approved' | 'rejected', reason?: string) =>
    api.post(`/kyc/${docId}/validate`, { decision, reason }),
};

// ─── Rebecca IA Helpers ───────────────────────────────────────────────────

export const rebeccaApi = {
  chat: (messages: any[], sessionId?: string, country?: string, city?: string) =>
    api.post('/rebecca/chat', { messages, sessionId, country, city }),

  agent: (query: string, sessionId?: string) =>
    api.post('/rebecca/agent', { query, sessionId }),

  functions: () => api.get('/rebecca/functions'),

  analyzeDocument: (documentBase64: string, documentType: string) =>
    api.post('/rebecca/analyze-document', { documentBase64, documentType }),
};

// ─── Community Helpers ────────────────────────────────────────────────────

export const communityApi = {
  posts: (params?: any) => api.get(`/community/posts?${new URLSearchParams(params).toString()}`),
  createPost: (data: any) => api.post('/community/posts', data),
  getPost: (id: string) => api.get(`/community/posts/${id}`),
  likePost: (id: string) => api.post(`/community/posts/${id}/like`),
  replyPost: (id: string, data: any) => api.post(`/community/posts/${id}/replies`, data),

  groups: (params?: any) => api.get(`/community/groups?${new URLSearchParams(params).toString()}`),
  createGroup: (data: any) => api.post('/community/groups', data),
  getGroup: (id: string) => api.get(`/community/groups/${id}`),
  joinGroup: (id: string) => api.post(`/community/groups/${id}/members`),

  events: (params?: any) => api.get(`/community/events?${new URLSearchParams(params).toString()}`),
  registerEvent: (id: string) => api.post(`/community/events/${id}/register`),
};

// ─── Academy Helpers ──────────────────────────────────────────────────────

export const academyApi = {
  courses: (params?: any) => api.get(`/academy/courses?${new URLSearchParams(params).toString()}`),
  createCourse: (data: any) => api.post('/academy/courses', data),
  getCourse: (id: string) => api.get(`/academy/courses/${id}`),
  enroll: (id: string) => api.post(`/academy/courses/${id}/enroll`),
  getQuiz: (id: string) => api.get(`/academy/courses/${id}/quiz`),
  submitQuiz: (data: any) => api.post('/academy/quiz/attempt', data),
  generateCertificate: (data: any) => api.post('/academy/certificates/generate', data),
  verifyCertificate: (certificateId: string) => api.get(`/academy/certificates/verify/${certificateId}`),
  enrollments: () => api.get('/academy/enrollments'),
};

// ─── Hospitality Helpers ──────────────────────────────────────────────────

export const hospitalityApi = {
  // Hotels
  hotels: (params?: any) => api.get(`/hotels?${new URLSearchParams(params).toString()}`),
  hotel: (id: string) => api.get(`/hotels/${id}`),
  hotelRooms: (id: string) => api.get(`/hotels/${id}/rooms`),
  hotelBookings: (id: string) => api.get(`/hotels/${id}/bookings`),
  createHotelBooking: (id: string, data: any) => api.post(`/hotels/${id}/bookings`, data),
  hotelCheckin: (bookingId: string) => api.post(`/hotels/${bookingId}/checkin`),
  hotelReviews: (id: string) => api.get(`/hotels/${id}/reviews`),
  calculatePricing: (data: any) => api.post('/hotels/pricing/calculate', data),
  cancelBooking: (bookingId: string) => api.post('/hotels/cancellation', { bookingId }),

  // Guesthouses
  guesthouses: (params?: any) => api.get(`/guesthouses?${new URLSearchParams(params).toString()}`),
  guesthouse: (id: string) => api.get(`/guesthouses/${id}`),

  // Short-term
  shortTerm: (params?: any) => api.get(`/short-term?${new URLSearchParams(params).toString()}`),
  shortTermDetail: (id: string) => api.get(`/short-term/${id}`),
  shortTermAvailability: (id: string, checkIn?: string, checkOut?: string) =>
    api.get(`/short-term/${id}/availability?${new URLSearchParams({ ...(checkIn ? { checkIn } : {}), ...(checkOut ? { checkOut } : {}) }).toString()}`),
  createShortTermBooking: (id: string, data: any) => api.post(`/short-term/${id}/bookings`, data),
};

// ─── Search Helpers ───────────────────────────────────────────────────────

export const searchApi = {
  search: (query: string, filters?: any) =>
    api.get(`/search?q=${encodeURIComponent(query)}&${new URLSearchParams(filters).toString()}`),
  voiceSearch: (audioData: string) => api.post('/search/voice-search', { audioData }),
};

// ─── Admin Helpers ────────────────────────────────────────────────────────

export const adminApi = {
  users: (params?: any) => api.get(`/admin/users?${new URLSearchParams(params).toString()}`),
  userDetail: (id: string) => api.get(`/admin/users/${id}`),
  properties: (params?: any) => api.get(`/admin/properties?${new URLSearchParams(params).toString()}`),
  transactions: (params?: any) => api.get(`/admin/transactions?${new URLSearchParams(params).toString()}`),
  transactionDetail: (id: string) => api.get(`/admin/transactions/${id}`),
  bookings: (params?: any) => api.get(`/admin/bookings?${new URLSearchParams(params).toString()}`),
  kyc: (params?: any) => api.get(`/admin/kyc?${new URLSearchParams(params).toString()}`),
  escrow: (params?: any) => api.get(`/admin/escrow?${new URLSearchParams(params).toString()}`),
  payouts: (params?: any) => api.get(`/admin/payouts?${new URLSearchParams(params).toString()}`),
  revenue: (params?: any) => api.get(`/admin/revenue?${new URLSearchParams(params).toString()}`),
  disputes: (params?: any) => api.get(`/admin/disputes?${new URLSearchParams(params).toString()}`),
  disputeDetail: (id: string) => api.get(`/admin/disputes/${id}`),
  reviews: (params?: any) => api.get(`/admin/reviews?${new URLSearchParams(params).toString()}`),
  stats: () => api.get('/admin/stats'),
  analytics: (params?: any) => api.get(`/admin/analytics?${new URLSearchParams(params).toString()}`),
  auditLogs: (params?: any) => api.get(`/admin/audit-logs?${new URLSearchParams(params).toString()}`),
  countries: () => api.get('/admin/countries'),
};

// ─── Export ───────────────────────────────────────────────────────────────

export default api;

// ─── Cookie / Country helpers (multi-tenant X-Country-Code header) ─────────

/**
 * Read a cookie by name from `document.cookie`. Returns the decoded value
 * or `null` if not found / not in browser.
 */
export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [rawKey, ...rawValueParts] = cookie.trim().split('=');
      if (rawKey === name) {
        const value = rawValueParts.join('=');
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      }
    }
  } catch {
    // document not available
  }
  return null;
}

/**
 * Resolve the current country code for the X-Country-Code header.
 * Priority: `afribayit_selected_country` → `afribayit_country` (legacy)
 *           → cookie → default `'BJ'`.
 */
function readCountryCode(): string {
  if (typeof window !== 'undefined') {
    try {
      const fromSelected = localStorage.getItem('afribayit_selected_country');
      if (fromSelected && /^[A-Z]{2}$/.test(fromSelected)) return fromSelected;
      const fromLegacy = localStorage.getItem('afribayit_country');
      if (fromLegacy && /^[A-Z]{2}$/.test(fromLegacy)) return fromLegacy;
    } catch {
      // localStorage not available
    }
    const fromCookie = readCookie('afribayit_country');
    if (fromCookie && /^[A-Z]{2}$/.test(fromCookie)) return fromCookie;
  }
  return 'BJ';
}

/**
 * Public alias for readCountryCode (used by other modules to know the
 * current tenant country without re-implementing the priority chain).
 */
export function getCountryCode(): string {
  return readCountryCode();
}

// ─── Legacy compatibility exports ─────────────────────────────────────────
// These wrap the api object to match the old apiFetch/apiPost/apiPatch/apiDelete
// signatures used by hooks still on the legacy pattern. Paths starting with
// /api/ are rewritten to remove the /api/ prefix (backend doesn't use it).

function rewritePath(path: string): string {
  // Remove /api/ prefix if present (old Next.js API routes → backend API)
  if (path.startsWith('/api/')) return path.replace('/api/', '/');
  return path;
}

export const apiGet = <T = any>(path: string) => api.get<T>(rewritePath(path));
export const apiPost = <T = any>(path: string, body?: any) =>
  api.post<T>(rewritePath(path), body);
export const apiPatch = <T = any>(path: string, body?: any) =>
  api.patch<T>(rewritePath(path), body);
export const apiPut = <T = any>(path: string, body?: any) =>
  api.put<T>(rewritePath(path), body);
export const apiDelete = <T = any>(path: string) =>
  api.delete<T>(rewritePath(path));

/**
 * Parse a fetch Response into the requested type. JSON responses are
 * parsed; text responses are returned as-is; non-OK responses throw an
 * `ApiError` carrying the parsed body. Re-exported here for legacy
 * consumers that imported it from this module.
 */
export async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new ApiError(
        (data && (data.error || data.message)) ||
          `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        data,
      );
    }
    return data as T;
  }
  if (!response.ok) {
    throw new ApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
    );
  }
  return (await response.text()) as unknown as T;
}
