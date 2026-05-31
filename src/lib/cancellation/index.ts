// AfriBayit — Cancellation Policy Engine
// Point d'entrée principal pour le moteur de politiques d'annulation

export {
  FLEXIBLE_POLICY,
  MODERATE_POLICY,
  STRICT_POLICY,
  CANCELLATION_POLICIES,
  calculateRefund,
  getDefaultPolicy,
} from './policies';
export type { CancellationPolicyType, CancellationPolicy } from './policies';
