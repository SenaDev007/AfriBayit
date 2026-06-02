// AfriBayit — Expedia QuickConnect (EQC) Adapter
// Real Expedia API integration with sandbox mode
// Supports EQC XML protocol and JSON REST API
// Controlled by OTA_SANDBOX_MODE env var (default: sandbox)

import {
  OTABooking,
  AvailabilityUpdate,
  RateUpdate,
  DateRange,
  OTAProviderConfig,
  OTARoom,
} from '../types';
import { BaseOTAProvider } from './base-provider';

// ─── Expedia API Types ────────────────────────────────────────────────────

interface ExpediaReservation {
  orderId: string;
  itineraryNumber: string;
  status: string;
  guest: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  room: {
    roomId: string;
    roomName: string;
    ratePlanId: string;
    numberOfRooms: number;
  };
  dates: {
    checkin: string;
    checkout: string;
  };
  pricing: {
    nightlyRates: number[];
    totalRate: number;
    currency: string;
    commission?: { amount: number; currency: string };
  };
  specialRequests?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ExpediaRoom {
  roomId: string;
  roomName: string;
  maxOccupancy: number;
  bedTypes?: string[];
  amenities?: string[];
  ratePlans?: { ratePlanId: string; ratePlanName: string }[];
}

interface ExpediaApiResponse {
  entity?: unknown;
  errors?: { code: string; message: string; detail?: string }[];
}

// ─── Rate Limiter ─────────────────────────────────────────────────────────

class ExpediaRateLimiter {
  private lastRequestAt = 0;
  private minInterval: number;

  constructor(requestsPerSecond: number = 2) {
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

// ─── Expedia EQC Provider ─────────────────────────────────────────────────

export class ExpediaProvider extends BaseOTAProvider {
  private readonly apiBase: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly hotelId: string;
  private readonly sandbox: boolean;
  private readonly rateLimiter: ExpediaRateLimiter;

  constructor(config: OTAProviderConfig) {
    super(config);
    this.sandbox = process.env.OTA_SANDBOX_MODE !== 'false'; // Default: sandbox
    this.apiBase = this.sandbox
      ? 'https://api.sandbox.expedia.com/v2'
      : 'https://api.expediapartnercentral.com/v2';
    this.apiKey = config.apiKey || process.env.EXPEDIA_API_KEY || '';
    this.apiSecret = process.env.EXPEDIA_API_SECRET || '';
    this.hotelId = config.hotelId || process.env.EXPEDIA_HOTEL_ID || '';
    this.rateLimiter = new ExpediaRateLimiter(2); // 2 req/sec for Expedia
  }

  get providerName(): string {
    return 'Expedia';
  }

  get isSandbox(): boolean {
    return this.sandbox;
  }

  /** List all rooms configured for this hotel on Expedia */
  async listRooms(hotelId: string): Promise<OTARoom[]> {
    try {
      await this.rateLimiter.wait();

      const response = await this.apiRequest(
        'GET',
        `/properties/${this.mapHotelId(hotelId)}/rooms`
      );

      const rooms = (response?.entity as ExpediaRoom[]) || [];

      return rooms.map((room) => ({
        providerId: room.roomId,
        roomTypeId: this.mapRoomType(room.roomId) || room.roomId,
        ratePlanId: room.ratePlans?.[0]?.ratePlanId || `rp_${room.roomId}`,
        maxOccupancy: room.maxOccupancy,
        amenities: room.amenities || [],
      }));
    } catch (error) {
      this.logError('listRooms', error);
      return [];
    }
  }

  /** Fetch bookings/reservations from Expedia */
  async fetchBookings(hotelId: string, dateRange: DateRange): Promise<OTABooking[]> {
    try {
      await this.rateLimiter.wait();

      const response = await this.apiRequest(
        'GET',
        `/properties/${this.mapHotelId(hotelId)}/reservations?checkinFrom=${dateRange.start}&checkoutTo=${dateRange.end}`
      );

      const reservations = (response?.entity as ExpediaReservation[]) || [];

      return reservations.map((res) => this.mapReservationToOTA(res, hotelId));
    } catch (error) {
      this.logError('fetchBookings', error);
      return [];
    }
  }

  /** Push availability updates to Expedia */
  async pushAvailability(
    hotelId: string,
    availability: AvailabilityUpdate[]
  ): Promise<{ success: boolean; errors: string[] }> {
    try {
      await this.rateLimiter.wait();

      const mappedHotelId = this.mapHotelId(hotelId);

      // Expedia uses room-rate-level availability updates
      const updates = availability.map((a) => ({
        resourceId: this.mapRoomTypeToProvider(a.roomTypeId),
        date: a.date,
        available: a.availableCount,
      }));

      await this.apiRequest(
        'PUT',
        `/properties/${mappedHotelId}/availability`,
        { updates }
      );

      return { success: true, errors: [] };
    } catch (error) {
      return { success: false, errors: [this.logError('pushAvailability', error)] };
    }
  }

  /** Push rate updates to Expedia */
  async pushRates(
    hotelId: string,
    rates: RateUpdate[]
  ): Promise<{ success: boolean; errors: string[] }> {
    try {
      await this.rateLimiter.wait();

      const mappedHotelId = this.mapHotelId(hotelId);

      const rateUpdates = rates.map((r) => ({
        resourceId: this.mapRoomTypeToProvider(r.roomTypeId),
        date: r.date,
        amount: r.rate,
        currency: r.currency,
      }));

      await this.apiRequest(
        'PUT',
        `/properties/${mappedHotelId}/rates`,
        { rates: rateUpdates }
      );

      return { success: true, errors: [] };
    } catch (error) {
      return { success: false, errors: [this.logError('pushRates', error)] };
    }
  }

  /** Confirm a reservation on Expedia */
  async confirmBooking(bookingId: string): Promise<{ success: boolean }> {
    try {
      await this.rateLimiter.wait();

      await this.apiRequest(
        'PUT',
        `/reservations/${bookingId}/status`,
        { status: 'confirmed' }
      );

      return { success: true };
    } catch (error) {
      this.logError('confirmBooking', error);
      return { success: false };
    }
  }

  /** Cancel a reservation on Expedia */
  async cancelBooking(bookingId: string, reason: string): Promise<{ success: boolean }> {
    try {
      await this.rateLimiter.wait();

      await this.apiRequest(
        'PUT',
        `/reservations/${bookingId}/status`,
        { status: 'cancelled', cancellationReason: reason }
      );

      return { success: true };
    } catch (error) {
      this.logError('cancelBooking', error);
      return { success: false };
    }
  }

  /** Test connection to Expedia */
  async testConnection(): Promise<{ connected: boolean; message: string }> {
    if (!this.apiKey || !this.hotelId) {
      return {
        connected: false,
        message: `Identifiants Expedia non configurés${this.sandbox ? ' (mode sandbox)' : ''}`,
      };
    }

    try {
      await this.rateLimiter.wait();

      const response = await this.apiRequest(
        'GET',
        `/properties/${this.hotelId}`
      );

      return {
        connected: !!response?.entity,
        message: response?.entity
          ? `Connexion Expedia réussie${this.sandbox ? ' (sandbox)' : ''}`
          : 'Propriété non trouvée sur Expedia',
      };
    } catch (error) {
      return {
        connected: false,
        message: `Échec de connexion Expedia: ${this.logError('testConnection', error)}`,
      };
    }
  }

  /** Map Expedia room type ID to AfriBayit room type */
  mapRoomType(providerRoomTypeId: string): string | null {
    const mapping: Record<string, string> = {
      '2001': 'single',
      '2002': 'double',
      '2003': 'suite',
      '2004': 'deluxe',
      '2005': 'family',
      '2006': 'studio',
      '2007': 'penthouse',
    };
    return mapping[providerRoomTypeId] || null;
  }

  // ── EQC XML Protocol Support ─────────────────────────────────────────

  /**
   * Generate EQC XML for availability update (OTA_HotelAvailNotifRQ).
   * Used when the JSON API is not available or for legacy integrations.
   */
  generateEQCAvailabilityXml(hotelId: string, updates: AvailabilityUpdate[]): string {
    const mappedHotelId = this.mapHotelId(hotelId);
    const timestamp = new Date().toISOString();
    const messageId = `AFB-${Date.now()}`;

    const messages = updates.map((u) => `
    <AvailStatusMessage>
      <StatusApplicationControl InvTypeCode="${this.mapRoomTypeToProvider(u.roomTypeId)}" RatePlanCode="BAR" Start="${u.date}" End="${u.date}"/>
      <AvailStatusMinMax MessageStatusType="Open" MinMaxMessageStatus="Open" BookingLimit="${u.availableCount}"/>
    </AvailStatusMessage>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelAvailNotifRQ xmlns="http://www.opentravel.org/OTA/2003/05"
  TimeStamp="${timestamp}" Version="1.0" MessageContentCode="8" EchoToken="${messageId}">
  <POS>
    <Source>
      <RequestorID Type="4" ID="${this.apiKey}" MessagePassword="${this.apiSecret}"/>
      <BookingChannel Type="2" Primary="true">
        <CompanyName Code="AFB">AfriBayit</CompanyName>
      </BookingChannel>
    </Source>
  </POS>
  <AvailStatusMessages HotelCode="${mappedHotelId}">
    ${messages}
  </AvailStatusMessages>
</OTA_HotelAvailNotifRQ>`;
  }

  /**
   * Generate EQC XML for rate update (OTA_HotelRateNotifRQ).
   */
  generateEQCRateXml(hotelId: string, rates: RateUpdate[]): string {
    const mappedHotelId = this.mapHotelId(hotelId);
    const timestamp = new Date().toISOString();
    const messageId = `AFB-${Date.now()}`;

    const messages = rates.map((r) => `
    <RateAmountMessage>
      <StatusApplicationControl InvTypeCode="${this.mapRoomTypeToProvider(r.roomTypeId)}" RatePlanCode="BAR" Start="${r.date}" End="${r.date}"/>
      <Rates>
        <Rate>
          <BaseByGuestAmts>
            <BaseByGuestAmt AmountAfterTax="${r.rate}" CurrencyCode="${r.currency}"/>
          </BaseByGuestAmts>
        </Rate>
      </Rates>
    </RateAmountMessage>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelRateNotifRQ xmlns="http://www.opentravel.org/OTA/2003/05"
  TimeStamp="${timestamp}" Version="1.0" EchoToken="${messageId}">
  <POS>
    <Source>
      <RequestorID Type="4" ID="${this.apiKey}" MessagePassword="${this.apiSecret}"/>
      <BookingChannel Type="2" Primary="true">
        <CompanyName Code="AFB">AfriBayit</CompanyName>
      </BookingChannel>
    </Source>
  </POS>
  <RateAmountMessages HotelCode="${mappedHotelId}">
    ${messages}
  </RateAmountMessages>
</OTA_HotelRateNotifRQ>`;
  }

  /**
   * Parse EQC reservation notification XML.
   * Used for processing webhook notifications from Expedia.
   */
  static parseEQCReservationNotification(xmlBody: string): {
    hotelCode: string;
    reservations: {
      orderId: string;
      itineraryNumber: string;
      status: string;
    }[];
  } | null {
    try {
      // Simple XML parsing for the key fields
      // In production, use a proper XML parser library
      const hotelCodeMatch = xmlBody.match(/HotelCode="([^"]+)"/);
      const hotelCode = hotelCodeMatch?.[1] || '';

      const reservations: { orderId: string; itineraryNumber: string; status: string }[] = [];

      // Extract reservation references from OTA_HotelResNotifRQ
      const reservationMatches = xmlBody.matchAll(/<HotelReservation[^>]*>[\s\S]*?<\/HotelReservation>/g);
      for (const match of reservationMatches) {
        const resXml = match[0];
        const orderIdMatch = resXml.match(/ReservationID\s+Type="14"\s+Value="([^"]+)"/);
        const itineraryMatch = resXml.match(/ReservationID\s+Type="8"\s+Value="([^"]+)"/);
        const statusMatch = resXml.match(/ResStatus="([^"]+)"/);

        if (orderIdMatch) {
          reservations.push({
            orderId: orderIdMatch[1],
            itineraryNumber: itineraryMatch?.[1] || '',
            status: statusMatch?.[1] || 'Book',
          });
        }
      }

      return { hotelCode, reservations };
    } catch (error) {
      console.error('[OTA:Expedia] Failed to parse EQC notification:', error);
      return null;
    }
  }

  // ── Private Helpers ──────────────────────────────────────────────────

  /** Make an API request to Expedia */
  private async apiRequest(
    method: string,
    path: string,
    data?: Record<string, unknown>
  ): Promise<ExpediaApiResponse> {
    const url = `${this.apiBase}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'AfriBayit/1.0',
    };

    // Expedia uses API key in header
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // If we have both key and secret, use Basic auth
    if (this.apiKey && this.apiSecret) {
      headers['Authorization'] = `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(30_000), // 30 second timeout
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(
        `Expedia API ${response.status}: ${response.statusText}${errorBody ? ` — ${errorBody}` : ''}`
      );
    }

    return response.json();
  }

  /** Map an AfriBayit hotelId to Expedia property ID */
  private mapHotelId(hotelId: string): string {
    return this.hotelId || hotelId;
  }

  /** Map an AfriBayit roomTypeId to Expedia room ID */
  private mapRoomTypeToProvider(roomTypeId: string): string {
    const reverseMapping: Record<string, string> = {
      single: '2001',
      double: '2002',
      suite: '2003',
      deluxe: '2004',
      family: '2005',
      studio: '2006',
      penthouse: '2007',
    };
    return reverseMapping[roomTypeId] || roomTypeId;
  }

  /** Map an Expedia reservation to OTABooking */
  private mapReservationToOTA(res: ExpediaReservation, hotelId: string): OTABooking {
    return {
      provider: 'expedia',
      bookingId: res.orderId,
      guestName: `${res.guest.firstName} ${res.guest.lastName}`,
      guestEmail: res.guest.email || '',
      guestPhone: res.guest.phone || '',
      checkIn: res.dates.checkin,
      checkOut: res.dates.checkout,
      roomTypeId: this.mapRoomType(res.room.roomId) || res.room.roomId,
      numberOfRooms: res.room.numberOfRooms,
      totalAmount: res.pricing.totalRate,
      currency: res.pricing.currency || 'XOF',
      status: this.mapStatus(res.status),
      specialRequests: res.specialRequests,
    };
  }

  /** Map Expedia status to AfriBayit status */
  private mapStatus(status: string): OTABooking['status'] {
    const mapping: Record<string, OTABooking['status']> = {
      Book: 'pending',
      Confirm: 'confirmed',
      Cancel: 'cancelled',
      Modify: 'pending',
      checked_in: 'checked_in',
      checked_out: 'checked_out',
      no_show: 'no_show',
    };
    return mapping[status] || 'pending';
  }
}
