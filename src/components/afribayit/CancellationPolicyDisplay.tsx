'use client';

/**
 * CancellationPolicyDisplay — CDC §7D.7
 * Displays the 4 cancellation policies with refund rules.
 * Used on hotel/guesthouse detail pages and booking confirmation.
 */

import { motion } from 'framer-motion';
import { Shield, Clock, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

const easeOut = [0.16, 1, 0.3, 1] as const;
const NAVY = '#003087';
const GREEN = '#00A651';
const GOLD = '#D4AF37';
const RED = '#D93025';

const POLICIES = [
  {
    key: 'flexible',
    name: 'Flexible',
    icon: CheckCircle,
    color: GREEN,
    rules: [
      { condition: 'Plus de 24h avant check-in', refund: '100% remboursé' },
      { condition: 'Moins de 24h avant check-in', refund: 'Aucun remboursement' },
    ],
    commission: '0% de commission AfriBayit',
    description: 'Idéal pour les voyageurs flexibles. Annulez jusqu\'à 24h avant l\'arrivée sans frais.',
  },
  {
    key: 'moderate',
    name: 'Modérée',
    icon: Clock,
    color: NAVY,
    rules: [
      { condition: 'Plus de 5 jours avant check-in', refund: '100% remboursé' },
      { condition: 'Moins de 5 jours avant check-in', refund: '50% remboursé' },
    ],
    commission: '5% de commission si annulation tardive',
    description: 'Équilibre entre flexibilité et engagement. Annulation gratuite jusqu\'à 5 jours avant.',
  },
  {
    key: 'strict',
    name: 'Stricte',
    icon: AlertTriangle,
    color: GOLD,
    rules: [
      { condition: 'Plus de 7 jours avant check-in', refund: '50% remboursé' },
      { condition: 'Moins de 7 jours avant check-in', refund: 'Aucun remboursement' },
    ],
    commission: '10% de commission si annulation tardive',
    description: 'Pour les établissements avec forte demande. Engagement plus important du voyageur.',
  },
  {
    key: 'non_refundable',
    name: 'Non remboursable',
    icon: XCircle,
    color: RED,
    rules: [
      { condition: 'À tout moment', refund: 'Aucun remboursement' },
    ],
    commission: '15% de commission — prix réduit affiché',
    description: 'Tarif le plus avantageux en échange d\'un engagement total. Aucune annulation possible.',
  },
];

interface CancellationPolicyDisplayProps {
  /** Show only the selected policy, or all 4 if not specified */
  selectedPolicy?: string;
  compact?: boolean;
}

export default function CancellationPolicyDisplay({
  selectedPolicy,
  compact = false,
}: CancellationPolicyDisplayProps) {
  const policies = selectedPolicy
    ? POLICIES.filter((p) => p.key === selectedPolicy)
    : POLICIES;

  return (
    <div className={compact ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'}>
      {policies.map((policy, i) => (
        <motion.div
          key={policy.key}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.08, ease: easeOut }}
          className={`rounded-2xl border-2 p-5 ${
            selectedPolicy === policy.key
              ? 'bg-white'
              : 'bg-white border-gray-100'
          }`}
          style={selectedPolicy === policy.key ? { borderColor: policy.color } : {}}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${policy.color}15` }}>
              <policy.icon className="w-4 h-4" style={{ color: policy.color }} />
            </div>
            <h4 className="text-sm font-bold text-gray-900">{policy.name}</h4>
          </div>

          {/* Description */}
          {!compact && (
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              {policy.description}
            </p>
          )}

          {/* Rules */}
          <div className="space-y-2 mb-3">
            {policy.rules.map((rule, j) => (
              <div key={j} className="flex items-start gap-2 text-xs">
                <span className="text-gray-400 shrink-0">
                  {rule.refund.includes('100%') ? '✓' : rule.refund.includes('Aucun') ? '✗' : '•'}
                </span>
                <div>
                  <p className="text-gray-600">{rule.condition}</p>
                  <p className="font-semibold" style={{ color: rule.refund.includes('100%') ? GREEN : rule.refund.includes('Aucun') ? RED : NAVY }}>
                    {rule.refund}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Commission */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {policy.commission}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
