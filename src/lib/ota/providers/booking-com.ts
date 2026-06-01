// AfriBayit — Booking.com Demand API Adapter
// Adaptateur pour l'API XML Booking.com Supply

import { BaseOTAProvider } from './base-provider';
import {
  OTABooking,
  AvailabilityUpdate,
  RateUpdate,
  DateRange,
  OTAProviderConfig,
} from '../types';

interface BookingComReservation {
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
  };
  date_range: {
    checkin: string;
    checkout: string;
  };
  price_details: {
    nightly_prices: number[];
    currency: string;
  };
  remarks?: string;
}

export class BookingComProvider extends BaseOTAProvider {
  private readonly apiBase = 'https://supply-xml.booking.com';
  private readonly apiKey: string;
  private readonly hotelId: string;

  constructor(config: OTAProviderConfig) {
    super(config);
    this.apiKey = config.apiKey || process.env.BOOKING_COM_API_KEY || '';
    this.hotelId = config.hotelId || process.env.BOOKING_COM_HOTEL_ID || '';
  }

  get providerName(): string {
    return 'Booking.com';
  }

  /** Récupérer les réservations depuis Booking.com */
  async fetchBookings(hotelId: string, dateRange: DateRange): Promise<OTABooking[]> {
    try {
      const response = await this.apiRequest('/bookings/getReservations', {
        hotel_id: this.mapHotelId(hotelId),
        checkin_from: dateRange.start,
        checkout_to: dateRange.end,
      });

      const reservations: BookingComReservation[] = response?.data?.reservations || [];

      return reservations.map((res) => this.mapReservationToOTA(res, hotelId));
    } catch (error) {
      this.logError('fetchBookings', error);
      return [];
    }
  }

  /** Pousser les disponibilités vers Booking.com */
  async pushAvailability(
    hotelId: string,
    availability: AvailabilityUpdate[]
  ): Promise<{ success: boolean; errors: string[] }> {
    try {
      const payload = availability.map((a) => ({
        room_id: this.mapRoomTypeToProvider(a.roomTypeId),
        date: a.date,
        availability: a.availableCount,
      }));

      await this.apiRequest('/availability/update', {
        hotel_id: this.mapHotelId(hotelId),
        availabilities: payload,
      });

      return { success: true, errors: [] };
    } catch (error) {
      return { success: false, errors: [this.logError('pushAvailability', error)] };
    }
  }

  /** Pousser les tarifs vers Booking.com */
  async pushRates(
    hotelId: string,
    rates: RateUpdate[]
  ): Promise<{ success: boolean; errors: string[] }> {
    try {
      const payload = rates.map((r) => ({
        room_id: this.mapRoomTypeToProvider(r.roomTypeId),
        date: r.date,
        rate: r.rate,
        currency: r.currency,
      }));

      await this.apiRequest('/rates/update', {
        hotel_id: this.mapHotelId(hotelId),
        rates: payload,
      });

      return { success: true, errors: [] };
    } catch (error) {
      return { success: false, errors: [this.logError('pushRates', error)] };
    }
  }

  /** Confirmer une réservation Booking.com */
  async confirmBooking(bookingId: string): Promise<{ success: boolean }> {
    try {
      await this.apiRequest('/bookings/confirm', {
        reservation_id: parseInt(bookingId),
      });
      return { success: true };
    } catch (error) {
      this.logError('confirmBooking', error);
      return { success: false };
    }
  }

  /** Annuler une réservation Booking.com */
  async cancelBooking(bookingId: string, reason: string): Promise<{ success: boolean }> {
    try {
      await this.apiRequest('/bookings/cancel', {
        reservation_id: parseInt(bookingId),
        cancellation_reason: reason,
      });
      return { success: true };
    } catch (error) {
      this.logError('cancelBooking', error);
      return { success: false };
    }
  }

  /** Tester la connexion Booking.com */
  async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      const response = await this.apiRequest('/hotel/details', {
        hotel_id: this.hotelId,
      });
      return {
        connected: !!response?.data,
        message: response?.data ? 'Connexion Booking.com réussie' : 'Hôtel non trouvé',
      };
    } catch (error) {
      return {
        connected: false,
        message: this.logError('testConnection', error),
      };
    }
  }

  /** Mapper le type de chambre Booking.com → AfriBayit */
  mapRoomType(providerRoomTypeId: string): string | null {
    const mapping: Record<string, string> = {
      '1': 'single',
      '2': 'double',
      '3': 'suite',
      '4': 'deluxe',
      '5': 'family',
    };
    return mapping[providerRoomTypeId] || null;
  }

  // ── Private helpers ─────────────────────────────────────────

  /** Effectuer une requête API vers Booking.com */
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

  /** Mapper un hotelId AfriBayit vers Booking.com hotel_id */
  private mapHotelId(hotelId: string): string {
    // En production, on ferait une lookup dans la table Hotel.otaRefs
    return this.hotelId || hotelId;
  }

  /** Mapper un roomTypeId AfriBayit vers Booking.com room_id */
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

  /** Mapper une réservation Booking.com vers OTABooking */
  private mapReservationToOTA(res: BookingComReservation, hotelId: string): OTABooking {
    const totalAmount = res.price_details.nightly_prices.reduce((sum, p) => sum + p, 0);
    return {
      provider: 'booking_com',
      bookingId: String(res.reservation_id),
      guestName: `${res.guest.first_name} ${res.guest.last_name}`,
      guestEmail: res.guest.email,
      guestPhone: res.guest.phone || '',
      checkIn: res.date_range.checkin,
      checkOut: res.date_range.checkout,
      roomTypeId: this.mapRoomType(String(res.room_details.room_id)) || String(res.room_details.room_id),
      numberOfRooms: 1,
      totalAmount,
      currency: res.price_details.currency || 'XOF',
      status: this.mapStatus(res.status),
      specialRequests: res.remarks,
    };
  }

  /** Mapper le statut Booking.com → AfriBayit */
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
