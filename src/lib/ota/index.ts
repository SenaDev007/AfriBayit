// AfriBayit — OTA Orchestrator
// Main entry point for OTA channel integration

export * from './types';
export { BaseOTAProvider } from './providers/base-provider';
export { BookingComProvider } from './providers/booking-com';
export { ExpediaProvider } from './providers/expedia';
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
export { validateRates, suggestParityRates, flagViolations } from './rate-parity';
export { checkAvailability, reserveRoom, releaseRoom } from './overbooking-guard';
