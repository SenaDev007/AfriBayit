// AfriBayit — OTA Orchestrator
// Main entry point for OTA channel integration

export * from './types';
export { BaseOTAProvider } from './providers/base-provider';
export { BookingComProvider } from './providers/booking-com';
export { ExpediaProvider } from './providers/expedia';
export { BookingComAdapter } from './adapters/booking-com-adapter';
export { ExpediaAdapter } from './adapters/expedia-adapter';
export {
  syncAllProviders,
  syncSingleProvider,
  pushAvailabilityToAllChannels,
  pushRatesToAllChannels,
  checkOverbookingAcrossChannels,
  distributeAvailability,
  reconcileBookings,
  getUnifiedCalendar,
  createProvider,
} from './channel-manager';
export {
  syncAllChannels,
  handleIncomingReservation,
  detectRateParityViolation,
} from './channel-sync-engine';
export { validateRates, suggestParityRates, flagViolations } from './rate-parity';
export { checkAvailability, reserveRoom, releaseRoom } from './overbooking-guard';
