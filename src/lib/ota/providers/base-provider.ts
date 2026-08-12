// AfriBayit — OTA Base Provider (Abstract)
// Base class for all OTA provider adapters
// Includes common functionality and interface contract

import {
  OTABooking,
  AvailabilityUpdate,
  RateUpdate,
  DateRange,
  OTAProviderConfig,
  OTARoom,
} from '../types';

export abstract class BaseOTAProvider {
  protected config: OTAProviderConfig;

  constructor(config: OTAProviderConfig) {
    this.config = config;
  }

  /** Fetch reservations from the OTA provider */
  abstract fetchBookings(hotelId: string, dateRange: DateRange): Promise<OTABooking[]>;

  /** Push availability to the provider */
  abstract pushAvailability(hotelId: string, availability: AvailabilityUpdate[]): Promise<{ success: boolean; errors: string[] }>;

  /** Push rates to the provider */
  abstract pushRates(hotelId: string, rates: RateUpdate[]): Promise<{ success: boolean; errors: string[] }>;

  /** Confirm a reservation */
  abstract confirmBooking(bookingId: string): Promise<{ success: boolean }>;

  /** Cancel a reservation */
  abstract cancelBooking(bookingId: string, reason: string): Promise<{ success: boolean }>;

  /** Test connection to the provider */
  abstract testConnection(): Promise<{ connected: boolean; message: string }>;

  /** Map provider room type ID to AfriBayit room type */
  abstract mapRoomType(providerRoomTypeId: string): string | null;

  /** Human-readable provider name */
  abstract get providerName(): string;

  /** List rooms configured on the provider (optional, with default) */
  async listRooms(_hotelId: string): Promise<OTARoom[]> {
    return [];
  }

  /** Provider identifier */
  get providerId(): string {
    return this.config.provider;
  }

  /** Check if the provider is enabled */
  get isEnabled(): boolean {
    return this.config.enabled;
  }

  /** Check if the provider is in sandbox/test mode */
  get isSandbox(): boolean {
    return process.env.OTA_SANDBOX_MODE !== 'false';
  }

  /** Log an OTA error and return the message */
  protected logError(operation: string, error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[OTA:${this.providerName}] ${operation} failed:`, message);
    return message;
  }
}
