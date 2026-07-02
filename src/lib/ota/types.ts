// AfriBayit — OTA Types & Interfaces
// Shared types for OTA channel integration

export type OTAProvider = 'booking_com' | 'expedia' | 'airbnb';
export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'out_of_order';
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export interface OTARoom {
  providerId: string;
  roomTypeId: string;
  ratePlanId: string;
  maxOccupancy: number;
  amenities: string[];
}

export interface OTAAvailability {
  hotelId: string;
  roomTypeId: string;
  date: string; // YYYY-MM-DD
  availableCount: number;
  rate: number; // en XOF
  currency: string;
}

export interface OTABooking {
  provider: OTAProvider;
  bookingId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  roomTypeId: string;
  numberOfRooms: number;
  totalAmount: number;
  currency: string;
  status: BookingStatus;
  specialRequests?: string;
  hotelId?: string;
}

export interface SyncResult {
  provider: OTAProvider;
  success: boolean;
  bookingsImported: number;
  availabilityUpdated: number;
  errors: string[];
}

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface RateUpdate {
  roomTypeId: string;
  date: string;
  rate: number;
  currency: string;
}

export interface AvailabilityUpdate {
  roomTypeId: string;
  date: string;
  availableCount: number;
}

export interface OTAProviderConfig {
  provider: OTAProvider;
  apiKey: string;
  hotelId: string;
  enabled: boolean;
}

export interface ChannelAllocation {
  ota: OTAProvider | 'direct';
  allocatedRooms: number;
  rate: number;
  currency: string;
}

export interface ParityViolation {
  roomTypeId: string;
  providerA: OTAProvider;
  rateA: number;
  providerB: OTAProvider;
  rateB: number;
  discrepancy: number;
  discrepancyPct: number;
}

export interface UnifiedCalendarDay {
  date: string;
  totalRooms: number;
  availableRooms: number;
  bookedRooms: number;
  maintenanceRooms: number;
  rate: number;
  currency: string;
  bookings: {
    id: string;
    source: OTAProvider | 'direct';
    guestName: string;
    status: BookingStatus;
  }[];
}

// ─── Webhook Event Types ──────────────────────────────────────────────────

export interface OTAWebhookEvent {
  provider: OTAProvider;
  eventType: 'new_booking' | 'modification' | 'cancellation' | 'availability_change' | 'rate_change';
  hotelId: string;
  reservationId?: string;
  payload: Record<string, unknown>;
  receivedAt: string;
}

// ─── Sync Configuration ───────────────────────────────────────────────────

export interface OTASyncConfig {
  /** Maximum number of concurrent sync operations */
  maxConcurrentSyncs: number;
  /** Timeout for individual provider API calls (ms) */
  apiTimeout: number;
  /** Whether to enforce rate parity before pushing rates */
  enforceRateParity: boolean;
  /** Whether to check for overbooking before confirming reservations */
  preventOverbooking: boolean;
  /** Channels to sync (empty = all configured) */
  channels: OTAProvider[];
}
