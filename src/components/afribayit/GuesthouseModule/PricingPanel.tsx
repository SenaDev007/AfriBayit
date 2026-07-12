'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { BarChart3, X } from 'lucide-react';
import { easeOut, pricingPeriodOptions } from './constants';
import {
  formatModifier,
  formatPeriodDates,
  periodLabel,
  getPricingPeriodColor,
  getPricingPeriodIcon,
} from './utils';
import { PricingCardSkeleton } from './Skeletons';
import type { GuesthouseDetail, GuesthouseListItem } from './types';

interface PricingFormState {
  name: string;
  period: string;
  multiplier: number;
  startDate: string;
  endDate: string;
  eventName: string;
}

interface PricingPanelProps {
  guesthousesList: GuesthouseListItem[];
  effectiveGhId: string | null;
  setSelectedGhId: (id: string) => void;
  detailLoadingState: boolean;
  activeDetail: GuesthouseDetail | undefined;
  pricingForm: PricingFormState;
  setPricingForm: React.Dispatch<React.SetStateAction<PricingFormState>>;
  pricingSubmitting: boolean;
  setPricingSubmitting: (v: boolean) => void;
}

export default function PricingPanel({
  guesthousesList,
  effectiveGhId,
  setSelectedGhId,
  detailLoadingState,
  activeDetail,
  pricingForm,
  setPricingForm,
  pricingSubmitting,
  setPricingSubmitting,
}: PricingPanelProps) {
  const handleAddRule = async () => {
    if (!pricingForm.name.trim()) { toast.error('Le nom de la règle est requis'); return; }
    if (!effectiveGhId) return;
    setPricingSubmitting(true);
    try {
      const resp = await fetch(`/api/guesthouses/${effectiveGhId}/pricing-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pricingForm.name,
          period: pricingForm.period,
          multiplier: pricingForm.multiplier,
          startDate: pricingForm.startDate || null,
          endDate: pricingForm.endDate || null,
          eventName: pricingForm.eventName || null,
        }),
      });
      if (resp.ok) {
        toast.success('Règle tarifaire ajoutée', { description: `${pricingForm.name} — ${formatModifier(pricingForm.multiplier)}` });
        setPricingForm({ name: '', period: 'high_season', multiplier: 1.5, startDate: '', endDate: '', eventName: '' });
      } else {
        toast.error('Erreur lors de l\'ajout de la règle');
      }
    } catch {
      toast.error('Erreur réseau lors de l\'ajout');
    }
    setPricingSubmitting(false);
  };

  const handleDeleteRule = async (ruleId: string, ruleName: string) => {
    if (!effectiveGhId) return;
    try {
      const resp = await fetch(`/api/guesthouses/${effectiveGhId}/pricing-rules/${ruleId}`, { method: 'DELETE' });
      if (resp.ok) {
        toast.success('Règle tarifaire supprimée', { description: ruleName });
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch {
      toast.error('Erreur réseau lors de la suppression');
    }
  };

  return (
    <motion.div
      key="pricing"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: easeOut }}
    >
      {/* Guesthouse selector */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <select
          value={effectiveGhId || ''}
          onChange={e => setSelectedGhId(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm bg-white"
        >
          {guesthousesList.map(gh => <option key={gh.id} value={gh.id}>{gh.name}</option>)}
        </select>
      </div>

      {/* Add Pricing Rule Form */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
        <h4 className="font-display text-sm font-bold text-[#0a2a5e] mb-3">Ajouter une règle de tarification saisonnière</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Nom de la règle *</label>
            <input
              type="text"
              placeholder="Ex: Fêtes de fin d'année"
              value={pricingForm.name}
              onChange={e => setPricingForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Période *</label>
            <select
              value={pricingForm.period}
              onChange={e => setPricingForm(prev => ({ ...prev, period: e.target.value }))}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
            >
              {pricingPeriodOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Multiplicateur *</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="5"
              value={pricingForm.multiplier}
              onChange={e => setPricingForm(prev => ({ ...prev, multiplier: parseFloat(e.target.value) || 1 }))}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
            />
            <p className="text-[9px] text-gray-400 mt-0.5">{formatModifier(pricingForm.multiplier)} du prix de base</p>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Date début</label>
            <input
              type="date"
              value={pricingForm.startDate}
              onChange={e => setPricingForm(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Date fin</label>
            <input
              type="date"
              value={pricingForm.endDate}
              onChange={e => setPricingForm(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddRule}
              disabled={pricingSubmitting || !pricingForm.name.trim()}
              className="w-full px-3 py-2 bg-[#00A651] text-white rounded-xl text-sm font-semibold hover:bg-[#008f47] transition-colors disabled:opacity-50"
            >
              {pricingSubmitting ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </div>
        {/* Event name field for event period */}
        {(pricingForm.period === 'event' || pricingForm.period === 'holiday') && (
          <div className="mt-3">
            <label className="text-[10px] text-gray-500 block mb-1">Nom de l&apos;événement</label>
            <input
              type="text"
              placeholder="Ex: Festival Vodoun, Fêtes de fin d'année"
              value={pricingForm.eventName}
              onChange={e => setPricingForm(prev => ({ ...prev, eventName: e.target.value }))}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
            />
          </div>
        )}
      </div>

      {detailLoadingState ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <PricingCardSkeleton key={i} />
          ))}
        </div>
      ) : activeDetail?.pricingRules && activeDetail.pricingRules.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {activeDetail.pricingRules.map((pr, i) => {
            const color = getPricingPeriodColor(pr.period);
            return (
              <motion.div
                key={pr.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, ease: easeOut }}
                className="bg-white rounded-xl p-5 shadow-sm border text-center relative group/pricing"
              >
                <button
                  onClick={() => handleDeleteRule(pr.id, pr.name)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-gray-100 hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover/pricing:opacity-100 transition-all"
                  title="Supprimer cette règle"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="mb-2 mx-auto w-fit" style={{ color }}>{getPricingPeriodIcon(pr.period)}</div>
                <h4 className="font-display text-sm font-bold text-[#0a2a5e] mb-0.5">{pr.name}</h4>
                <p className="text-[10px] text-gray-400 mb-1">{periodLabel(pr.period)}</p>
                <p className="font-mono text-2xl font-bold mb-1" style={{ color }}>{formatModifier(pr.multiplier)}</p>
                <p className="text-xs text-gray-500">{formatPeriodDates(pr.startDate, pr.endDate, pr.event_name)}</p>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune règle tarifaire définie pour cette guesthouse.</p>
        </div>
      )}
    </motion.div>
  );
}
