// AfriBayit — OTA Base Provider (Abstract)
// Classe de base pour tous les adaptateurs OTA

import {
  OTABooking,
  OTAAvailability,
  AvailabilityUpdate,
  RateUpdate,
  DateRange,
  OTAProviderConfig,
} from './types';

export abstract class BaseOTAProvider {
  protected config: OTAProviderConfig;

  constructor(config: OTAProviderConfig) {
    this.config = config;
  }

  /** Récupérer les réservations depuis le fournisseur OTA */
  abstract fetchBookings(hotelId: string, dateRange: DateRange): Promise<OTABooking[]>;

  /** Pousser les disponibilités vers le fournisseur */
  abstract pushAvailability(hotelId: string, availability: AvailabilityUpdate[]): Promise<{ success: boolean; errors: string[] }>;

  /** Pousser les tarifs vers le fournisseur */
  abstract pushRates(hotelId: string, rates: RateUpdate[]): Promise<{ success: boolean; errors: string[] }>;

  /** Confirmer une réservation */
  abstract confirmBooking(bookingId: string): Promise<{ success: boolean }>;

  /** Annuler une réservation */
  abstract cancelBooking(bookingId: string, reason: string): Promise<{ success: boolean }>;

  /** Vérifier la connexion au fournisseur */
  abstract testConnection(): Promise<{ connected: boolean; message: string }>;

  /** Mapper les types de chambre du fournisseur vers AfriBayit */
  abstract mapRoomType(providerRoomTypeId: string): string | null;

  /** Nom lisible du fournisseur */
  abstract get providerName(): string;

  /** Identifiant du fournisseur */
  get providerId(): string {
    return this.config.provider;
  }

  /** Vérifier si le fournisseur est activé */
  get isEnabled(): boolean {
    return this.config.enabled;
  }

  /** Logger une erreur OTA */
  protected logError(operation: string, error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[OTA:${this.providerName}] ${operation} failed:`, message);
    return message;
  }
}
