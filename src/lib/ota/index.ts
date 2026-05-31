// AfriBayit — OTA Orchestrator
// Point d'entrée principal pour l'intégration OTA

export * from './types';
export { BaseOTAProvider } from './providers/base-provider';
export { BookingComProvider } from './providers/booking-com';
export { ExpediaProvider } from './providers/expedia';
export {
  syncAllProviders,
  distributeAvailability,
  reconcileBookings,
  getUnifiedCalendar,
  createProvider,
} from './channel-manager';
export { validateRates, suggestParityRates, flagViolations } from './rate-parity';
export { checkAvailability, reserveRoom, releaseRoom } from './overbooking-guard';
