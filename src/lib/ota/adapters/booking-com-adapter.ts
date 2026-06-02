// AfriBayit — Booking.com Demand API v2 Adapter
// Full implementation: availability, rates, inventory, webhooks, reservations

import crypto from 'crypto';
import {
  OTABooking,
  OTAAvailability,
  AvailabilityUpdate,
  RateUpdate,
  OTAProviderConfig,
} from '../types';

// ── Response Types ──────────────────────────────────────────

interface AdapterResponse<T> {
  success: boolean;
  data?: T;
  errors?: string[];
  providerRef?: string;
}

interface AvailabilityData {
  hotelId: string;
  roomTypeId: string;
  date: string;
  availableCount: number;
  rate: number;
  currency: string;
}

interface BookingComReservationV2 {
  reservation_id: number;
  status: string;
  guest: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  room_details: {
    room_id: number;
    room_name: string;
    rate_plan_id?: string;
  };
  date_range: {
    checkin: string;
    checkout: string;
  };
  price_details: {
    nightly_prices: number[];
    currency: string;
    total_price?: number;
  };
  remarks?: string;
  commission?: {
    amount: number;
    currency: string;
  };
}

// ── Booking.com Adapter v2 ──────────────────────────────────

export class BookingComAdapter {
  private readonly apiBase: string;
  private readonly apiKey: string;
  private readonly hotelId: string;
  private readonly webhookSecret: string;
  private readonly enabled: boolean;

  constructor(config?: Partial<OTAProviderConfig>) {
    this.apiBase = 'https://supply-xml.booking.com';
    this.apiKey = config?.apiKey || process.env.BOOKING_COM_API_KEY || '';
    this.hotelId = config?.hotelId || process.env.BOOKING_COM_HOTEL_ID || '';
    this.webhookSecret = process.env.BOOKING_COM_WEBHOOK_SECRET || '';
    this.enabled = config?.enabled ?? !!this.apiKey;
  }

  get providerName(): string {
    return 'Booking.com';
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  // ── Fetch Availability ──────────────────────────────────

  async fetchAvailability(
    hotelId: string,
    checkIn: string,
    checkOut: string
  ): Promise<AdapterResponse<AvailabilityData[]>> {
    try {
      const response = await this.apiRequest('/availability/v2', {
        hotel_id: this.mapHotelId(hotelId),
        checkin: checkIn,
        checkout: checkOut,
      });

      const availabilities: AvailabilityData[] = (response?.data?.rooms || []).map(
        (room: Record<string, unknown>) => ({
          hotelId,
          roomTypeId: this.mapRoomType(String(room.room_id)),
          date: checkIn,
          availableCount: Number(room.availability) || 0,
          rate: Number(room.rate) || 0,
          currency: String(room.currency || 'XOF'),
        })
      );

      return { success: true, data: availabilities };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[OTA:BookingCom] fetchAvailability failed:', message);
      return { success: false, errors: [message] };
    }
  }

  // ── Sync Rates ──────────────────────────────────────────

  async syncRates(
    hotelId: string,
    rates: RateUpdate[]
  ): Promise<AdapterResponse<{ updated: number }>> {
    try {
      const payload = rates.map((r) => ({
        room_id: this.mapRoomTypeToProvider(r.roomTypeId),
        date: r.date,
        rate: r.rate,
        currency: r.currency,
      }));

      const response = await this.apiRequest('/rates/v2/update', {
        hotel_id: this.mapHotelId(hotelId),
        rates: payload,
      });

      return {
        success: true,
        data: { updated: rates.length },
        providerRef: response?.data?.request_id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[OTA:BookingCom] syncRates failed:', message);
      return { success: false, errors: [message] };
    }
  }

  // ── Sync Inventory ──────────────────────────────────────

  async syncInventory(
    hotelId: string,
    rooms: AvailabilityUpdate[]
  ): Promise<AdapterResponse<{ synced: number }>> {
    try {
      const payload = rooms.map((r) => ({
        room_id: this.mapRoomTypeToProvider(r.roomTypeId),
        date: r.date,
        availability: r.availableCount,
      }));

      const response = await this.apiRequest('/availability/v2/update', {
        hotel_id: this.mapHotelId(hotelId),
        availabilities: payload,
      });

      return {
        success: true,
        data: { synced: rooms.length },
        providerRef: response?.data?.request_id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[OTA:BookingCom] syncInventory failed:', message);
      return { success: false, errors: [message] };
    }
  }

  // ── Handle Webhook ──────────────────────────────────────

  async handleWebhook(
    payload: string,
    signature: string
  ): Promise<AdapterResponse<{ eventType: string; reservationId?: string }>> {
    try {
      // Verify HMAC signature
      if (this.webhookSecret && !this.verifySignature(payload, signature)) {
        return { success: false, errors: ['Invalid webhook signature'] };
      }

      const body = JSON.parse(payload);
      const { event_type, reservation_id, hotel_id } = body;

      if (!event_type || !hotel_id) {
        return { success: false, errors: ['Missing required webhook fields'] };
      }

      return {
        success: true,
        data: {
          eventType: event_type,
          reservationId: reservation_id ? String(reservation_id) : undefined,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[OTA:BookingCom] handleWebhook failed:', message);
      return { success: false, errors: [message] };
    }
  }

  // ── Create Reservation from OTA ─────────────────────────

  async createReservation(
    booking: OTABooking
  ): Promise<AdapterResponse<{ bookingRef: string }>> {
    try {
      // In the Booking.com flow, reservations come via webhook
      // This method confirms/acknowledges an incoming reservation
      const response = await this.apiRequest('/reservations/acknowledge', {
        reservation_id: parseInt(booking.bookingId),
        status: 'confirmed',
      });

      return {
        success: true,
        data: { bookingRef: booking.bookingId },
        providerRef: response?.data?.confirmation_id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[OTA:BookingCom] createReservation failed:', message);
      return { success: false, errors: [message] };
    }
  }

  // ── Fetch Bookings ──────────────────────────────────────

  async fetchBookings(
    hotelId: string,
    dateRange: { start: string; end: string }
  ): Promise<AdapterResponse<OTABooking[]>> {
    try {
      const response = await this.apiRequest('/reservations/v2', {
        hotel_id: this.mapHotelId(hotelId),
        checkin_from: dateRange.start,
        checkout_to: dateRange.end,
      });

      const reservations: BookingComReservationV2[] =
        response?.data?.reservations || [];

      const bookings = reservations.map((res) =>
        this.mapReservationToOTA(res, hotelId)
      );

      return { success: true, data: bookings };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[OTA:BookingCom] fetchBookings failed:', message);
      return { success: false, errors: [message] };
    }
  }

  // ── Test Connection ─────────────────────────────────────

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      if (!this.apiKey || !this.hotelId) {
        return { connected: false, message: 'Booking.com credentials not configured' };
      }
      const response = await this.apiRequest('/hotel/details', {
        hotel_id: this.hotelId,
      });
      return {
        connected: !!response?.data,
        message: response?.data ? 'Booking.com connection successful' : 'Hotel not found',
      };
    } catch (error) {
      return {
        connected: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  // ── Private Helpers ─────────────────────────────────────

  private verifySignature(payload: string, signature: string): boolean {
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  }

  private async apiRequest(endpoint: string, data: Record<string, unknown>) {
    const url = `${this.apiBase}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${this.hotelId}:${this.apiKey}`).toString('base64')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Booking.com API ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private mapHotelId(hotelId: string): string {
    return this.hotelId || hotelId;
  }

  private mapRoomType(providerRoomTypeId: string): string {
    const mapping: Record<string, string> = {
      '1': 'single',
      '2': 'double',
      '3': 'suite',
      '4': 'deluxe',
      '5': 'family',
    };
    return mapping[providerRoomTypeId] || providerRoomTypeId;
  }

  private mapRoomTypeToProvider(roomTypeId: string): string {
    const reverseMapping: Record<string, string> = {
      single: '1',
      double: '2',
      suite: '3',
      deluxe: '4',
      family: '5',
    };
    return reverseMapping[roomTypeId] || roomTypeId;
  }

  private mapReservationToOTA(
    res: BookingComReservationV2,
    hotelId: string
  ): OTABooking {
    const totalAmount =
      res.price_details.total_price ||
      res.price_details.nightly_prices.reduce((sum, p) => sum + p, 0);

    return {
      provider: 'booking_com',
      bookingId: String(res.reservation_id),
      guestName: `${res.guest.first_name} ${res.guest.last_name}`,
      guestEmail: res.guest.email,
      guestPhone: res.guest.phone || '',
      checkIn: res.date_range.checkin,
      checkOut: res.date_range.checkout,
      roomTypeId: this.mapRoomType(String(res.room_details.room_id)),
      numberOfRooms: 1,
      totalAmount,
      currency: res.price_details.currency || 'XOF',
      status: this.mapStatus(res.status),
      specialRequests: res.remarks,
    };
  }

  private mapStatus(status: string): OTABooking['status'] {
    const mapping: Record<string, OTABooking['status']> = {
      new: 'pending',
      confirmed: 'confirmed',
      checked_in: 'checked_in',
      checked_out: 'checked_out',
      cancelled: 'cancelled',
      no_show: 'no_show',
    };
    return mapping[status] || 'pending';
  }
}
