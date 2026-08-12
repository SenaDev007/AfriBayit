// AfriBayit — Booking.com Connectivity API Adapter
// Real Booking.com API integration with sandbox/test mode support
// Supports: list rooms, update availability, update rates, get reservations
// Rate limited: 1 request/second as per Booking.com API guidelines

import {
  OTABooking,
  AvailabilityUpdate,
  RateUpdate,
  DateRange,
  OTAProviderConfig,
  OTARoom,
} from '../types';
import { BaseOTAProvider } from './base-provider';

// ─── Booking.com API Types ────────────────────────────────────────────────

interface BookingComReservation {
  reservation_id: number;
  status: string;
  guest: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
    country?: string;
  };
  room_details: {
    room_id: number;
    room_name: string;
    rate_plan_id?: string;
    number_of_rooms?: number;
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
  created_at?: string;
  modified_at?: string;
}

interface BookingComRoom {
  room_id: number;
  room_name: string;
  max_occupancy: number;
  amenities?: string[];
}

interface BookingComApiResponse {
  data?: unknown;
  errors?: { code: string; message: string }[];
  meta?: { request_id: string; ruid: string };
}

// ─── Rate Limiter ─────────────────────────────────────────────────────────

class RateLimiter {
  private lastRequestAt = 0;
  private minInterval: number;

  constructor(requestsPerSecond: number = 1) {
    this.minInterval = 1000 / requestsPerSecond;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestAt;
    if (elapsed < this.minInterval) {
      await new Promise((resolve) => setTimeout(resolve, this.minInterval - elapsed));
    }
    this.lastRequestAt = Date.now();
  }
}

// ─── Booking.com Provider ─────────────────────────────────────────────────

export class BookingComProvider extends BaseOTAProvider {
  private readonly apiBase: string;
  private readonly apiKey: string;
  private readonly hotelId: string;
  private readonly sandbox: boolean;
  private readonly rateLimiter: RateLimiter;

  constructor(config: OTAProviderConfig) {
    super(config);
    this.sandbox = process.env.OTA_SANDBOX_MODE !== 'false'; // Default: sandbox
    this.apiBase = this.sandbox
      ? 'https://supply-xml.booking.com/sandbox'
      : 'https://supply-xml.booking.com';
    this.apiKey = config.apiKey || process.env.BOOKING_COM_API_KEY || '';
    this.hotelId = config.hotelId || process.env.BOOKING_COM_HOTEL_ID || '';
    this.rateLimiter = new RateLimiter(1); // 1 request per second
  }

  get providerName(): string {
    return 'Booking.com';
  }

  get isSandbox(): boolean {
    return this.sandbox;
  }

  /** List all rooms configured for this hotel on Booking.com */
  async listRooms(hotelId: string): Promise<OTARoom[]> {
    try {
      await this.rateLimiter.wait();

      const response = await this.apiRequest('GET', '/json/roomTypes', {
        hotel_id: this.mapHotelId(hotelId),
      });

      const rooms = (response?.data as BookingComRoom[]) || [];

      return rooms.map((room) => ({
        providerId: String(room.room_id),
        roomTypeId: this.mapRoomType(String(room.room_id)) || String(room.room_id),
        ratePlanId: `rp_${room.room_id}`,
        maxOccupancy: room.max_occupancy,
        amenities: room.amenities || [],
      }));
    } catch (error) {
      this.logError('listRooms', error);
      return [];
    }
  }

  /** Fetch reservations from Booking.com */
  async fetchBookings(hotelId: string, dateRange: DateRange): Promise<OTABooking[]> {
    try {
      await this.rateLimiter.wait();

      const response = await this.apiRequest('POST', '/json/bookings', {
        hotel_id: this.mapHotelId(hotelId),
        checkin_from: dateRange.start,
        checkout_to: dateRange.end,
        include_out_of_bookable_period: false,
      });

      const reservations: BookingComReservation[] = (response?.data as BookingComReservation[]) || [];

      return reservations.map((res) => this.mapReservationToOTA(res, hotelId));
    } catch (error) {
      this.logError('fetchBookings', error);
      return [];
    }
  }

  /** Push availability updates to Booking.com */
  async pushAvailability(
    hotelId: string,
    availability: AvailabilityUpdate[]
  ): Promise<{ success: boolean; errors: string[] }> {
    try {
      await this.rateLimiter.wait();

      // Booking.com expects OTA_HotelRatePlanNotifRQ XML format or JSON
      // Using JSON format for the modern API
      const payload = {
        hotel_id: this.mapHotelId(hotelId),
        availabilities: availability.map((a) => ({
          room_id: this.mapRoomTypeToProvider(a.roomTypeId),
          date: a.date,
          availability: a.availableCount,
        })),
      };

      await this.apiRequest('POST', '/json/availability', payload);

      return { success: true, errors: [] };
    } catch (error) {
      return { success: false, errors: [this.logError('pushAvailability', error)] };
    }
  }

  /** Push rate updates to Booking.com */
  async pushRates(
    hotelId: string,
    rates: RateUpdate[]
  ): Promise<{ success: boolean; errors: string[] }> {
    try {
      await this.rateLimiter.wait();

      const payload = {
        hotel_id: this.mapHotelId(hotelId),
        rates: rates.map((r) => ({
          room_id: this.mapRoomTypeToProvider(r.roomTypeId),
          date: r.date,
          rate: r.rate,
          currency: r.currency,
        })),
      };

      await this.apiRequest('POST', '/json/rates', payload);

      return { success: true, errors: [] };
    } catch (error) {
      return { success: false, errors: [this.logError('pushRates', error)] };
    }
  }

  /** Confirm a Booking.com reservation */
  async confirmBooking(bookingId: string): Promise<{ success: boolean }> {
    try {
      await this.rateLimiter.wait();

      await this.apiRequest('POST', '/json/reservations/confirm', {
        reservation_id: parseInt(bookingId),
      });

      return { success: true };
    } catch (error) {
      this.logError('confirmBooking', error);
      return { success: false };
    }
  }

  /** Cancel a Booking.com reservation */
  async cancelBooking(bookingId: string, reason: string): Promise<{ success: boolean }> {
    try {
      await this.rateLimiter.wait();

      await this.apiRequest('POST', '/json/reservations/cancel', {
        reservation_id: parseInt(bookingId),
        cancellation_reason: reason,
      });

      return { success: true };
    } catch (error) {
      this.logError('cancelBooking', error);
      return { success: false };
    }
  }

  /** Test connection to Booking.com */
  async testConnection(): Promise<{ connected: boolean; message: string }> {
    if (!this.apiKey || !this.hotelId) {
      return {
        connected: false,
        message: `Identifiants Booking.com non configurés${this.sandbox ? ' (mode sandbox)' : ''}`,
      };
    }

    try {
      await this.rateLimiter.wait();

      const response = await this.apiRequest('GET', '/json/hotelDetails', {
        hotel_id: this.hotelId,
      });

      return {
        connected: !!response?.data,
        message: response?.data
          ? `Connexion Booking.com réussie${this.sandbox ? ' (sandbox)' : ''}`
          : 'Hôtel non trouvé sur Booking.com',
      };
    } catch (error) {
      return {
        connected: false,
        message: `Échec de connexion: ${this.logError('testConnection', error)}`,
      };
    }
  }

  /** Map Booking.com room type ID to AfriBayit room type */
  mapRoomType(providerRoomTypeId: string): string | null {
    const mapping: Record<string, string> = {
      '1': 'single',
      '2': 'double',
      '3': 'suite',
      '4': 'deluxe',
      '5': 'family',
      '6': 'studio',
      '7': 'penthouse',
    };
    return mapping[providerRoomTypeId] || null;
  }

  // ── OTA XML Format Support ───────────────────────────────────────────

  /**
   * Generate OTA_HotelAvailNotifRQ XML for availability push.
   * Used for the legacy XML API endpoint if JSON API is not available.
   */
  generateAvailabilityXml(hotelId: string, updates: AvailabilityUpdate[]): string {
    const mappedHotelId = this.mapHotelId(hotelId);
    const date = new Date().toISOString().split('T')[0];

    const availEntries = updates.map((u) => `
      <AvailStatusMessages HotelCode="${mappedHotelId}">
        <AvailStatusMessage BookingLimit="${u.availableCount}" BookingLimitMessageType="SetLimit">
          <StatusApplicationControl Start="${u.date}" End="${u.date}" InvTypeCode="${this.mapRoomTypeToProvider(u.roomTypeId)}" RatePlanCode="BAR"/>
        </AvailStatusMessage>
      </AvailStatusMessages>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelAvailNotifRQ xmlns="http://www.opentravel.org/OTA/2003/05" Version="1.0" TimeStamp="${date}">
  <POS>
    <Source>
      <RequestorID Type="4" ID="${this.hotelId}" MessagePassword="${this.apiKey}"/>
    </Source>
  </POS>
  ${availEntries}
</OTA_HotelAvailNotifRQ>`;
  }

  /**
   * Generate OTA_HotelRateNotifRQ XML for rate push.
   */
  generateRateXml(hotelId: string, rates: RateUpdate[]): string {
    const mappedHotelId = this.mapHotelId(hotelId);
    const date = new Date().toISOString().split('T')[0];

    const rateEntries = rates.map((r) => `
      <RateAmountMessages HotelCode="${mappedHotelId}">
        <RateAmountMessage>
          <StatusApplicationControl Start="${r.date}" End="${r.date}" InvTypeCode="${this.mapRoomTypeToProvider(r.roomTypeId)}" RatePlanCode="BAR"/>
          <Rates>
            <Rate>
              <BaseByGuestAmts>
                <BaseByGuestAmt AmountAfterTax="${r.rate}" CurrencyCode="${r.currency}"/>
              </BaseByGuestAmts>
            </Rate>
          </Rates>
        </RateAmountMessage>
      </RateAmountMessages>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelRateNotifRQ xmlns="http://www.opentravel.org/OTA/2003/05" Version="1.0" TimeStamp="${date}">
  <POS>
    <Source>
      <RequestorID Type="4" ID="${this.hotelId}" MessagePassword="${this.apiKey}"/>
    </Source>
  </POS>
  ${rateEntries}
</OTA_HotelRateNotifRQ>`;
  }

  // ── Private Helpers ──────────────────────────────────────────────────

  /** Make an API request to Booking.com */
  private async apiRequest(
    method: string,
    endpoint: string,
    data?: Record<string, unknown>
  ): Promise<BookingComApiResponse> {
    const url = `${this.apiBase}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${this.hotelId}:${this.apiKey}`).toString('base64')}`,
        'User-Agent': 'AfriBayit/1.0',
      },
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(30_000), // 30 second timeout
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(
        `Booking.com API ${response.status}: ${response.statusText}${errorBody ? ` — ${errorBody}` : ''}`
      );
    }

    return response.json();
  }

  /** Map an AfriBayit hotelId to Booking.com hotel_id */
  private mapHotelId(hotelId: string): string {
    return this.hotelId || hotelId;
  }

  /** Map an AfriBayit roomTypeId to Booking.com room_id */
  private mapRoomTypeToProvider(roomTypeId: string): string {
    const reverseMapping: Record<string, string> = {
      single: '1',
      double: '2',
      suite: '3',
      deluxe: '4',
      family: '5',
      studio: '6',
      penthouse: '7',
    };
    return reverseMapping[roomTypeId] || roomTypeId;
  }

  /** Map a Booking.com reservation to OTABooking */
  private mapReservationToOTA(res: BookingComReservation, hotelId: string): OTABooking {
    const totalAmount = res.price_details.total_price ||
      res.price_details.nightly_prices.reduce((sum, p) => sum + p, 0);

    return {
      provider: 'booking_com',
      bookingId: String(res.reservation_id),
      guestName: `${res.guest.first_name} ${res.guest.last_name}`,
      guestEmail: res.guest.email,
      guestPhone: res.guest.phone || '',
      checkIn: res.date_range.checkin,
      checkOut: res.date_range.checkout,
      roomTypeId: this.mapRoomType(String(res.room_details.room_id)) || String(res.room_details.room_id),
      numberOfRooms: res.room_details.number_of_rooms || 1,
      totalAmount,
      currency: res.price_details.currency || 'XOF',
      status: this.mapStatus(res.status),
      specialRequests: res.remarks,
    };
  }

  /** Map Booking.com status to AfriBayit status */
  private mapStatus(status: string): OTABooking['status'] {
    const mapping: Record<string, OTABooking['status']> = {
      new: 'pending',
      confirmed: 'confirmed',
      checked_in: 'checked_in',
      checked_out: 'checked_out',
      cancelled: 'cancelled',
      no_show: 'no_show',
      modified: 'pending', // Modified reservations need re-review
    };
    return mapping[status] || 'pending';
  }
}
