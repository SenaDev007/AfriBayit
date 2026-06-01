// AfriBayit — Expedia EPS Adapter (Stub)
// Adaptateur pour l'API Expedia EPS — version stub pour développement

import { BaseOTAProvider } from './base-provider';
import {
  OTABooking,
  AvailabilityUpdate,
  RateUpdate,
  DateRange,
  OTAProviderConfig,
} from '../types';

export class ExpediaProvider extends BaseOTAProvider {
  private readonly apiBase = 'https://services.expediapartnercentral.com';
  private readonly apiKey: string;
  private readonly hotelId: string;

  constructor(config: OTAProviderConfig) {
    super(config);
    this.apiKey = config.apiKey || process.env.EXPEDIA_API_KEY || '';
    this.hotelId = config.hotelId || process.env.EXPEDIA_HOTEL_ID || '';
  }

  get providerName(): string {
    return 'Expedia';
  }

  async fetchBookings(_hotelId: string, _dateRange: DateRange): Promise<OTABooking[]> {
    // Stub: retourner un tableau vide
    // En production, appeler l'API Expedia EPS
    console.info('[OTA:Expedia] fetchBookings — stub, pas de données réelles');
    return [];
  }

  async pushAvailability(
    _hotelId: string,
    _availability: AvailabilityUpdate[]
  ): Promise<{ success: boolean; errors: string[] }> {
    console.info('[OTA:Expedia] pushAvailability — stub');
    return { success: true, errors: [] };
  }

  async pushRates(
    _hotelId: string,
    _rates: RateUpdate[]
  ): Promise<{ success: boolean; errors: string[] }> {
    console.info('[OTA:Expedia] pushRates — stub');
    return { success: true, errors: [] };
  }

  async confirmBooking(_bookingId: string): Promise<{ success: boolean }> {
    console.info('[OTA:Expedia] confirmBooking — stub');
    return { success: true };
  }

  async cancelBooking(_bookingId: string, _reason: string): Promise<{ success: boolean }> {
    console.info('[OTA:Expedia] cancelBooking — stub');
    return { success: true };
  }

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    if (!this.apiKey || !this.hotelId) {
      return { connected: false, message: 'Identifiants Expedia non configurés' };
    }
    return { connected: false, message: 'Expedia EPS — adaptateur stub, connexion non testée' };
  }

  mapRoomType(providerRoomTypeId: string): string | null {
    const mapping: Record<string, string> = {
      '2001': 'single',
      '2002': 'double',
      '2003': 'suite',
      '2004': 'deluxe',
      '2005': 'family',
    };
    return mapping[providerRoomTypeId] || null;
  }
}
