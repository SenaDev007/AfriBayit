'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { User, Users } from 'lucide-react';
import { easeOut, roleIconMap, staffRoleOptions, staffSchedulePresets } from './constants';
import { parseSchedule, getRoleLabel } from './utils';
import { StaffRowSkeleton } from './Skeletons';
import type { GuesthouseDetail, GuesthouseListItem } from './types';

interface StaffFormState {
  name: string;
  role: string;
  phone: string;
  schedule: string;
}

interface StaffPanelProps {
  guesthousesList: GuesthouseListItem[];
  effectiveGhId: string | null;
  setSelectedGhId: (id: string) => void;
  detailLoadingState: boolean;
  activeDetail: GuesthouseDetail | undefined;
  staffForm: StaffFormState;
  setStaffForm: React.Dispatch<React.SetStateAction<StaffFormState>>;
  staffSubmitting: boolean;
  setStaffSubmitting: (v: boolean) => void;
}

export default function StaffPanel({
  guesthousesList,
  effectiveGhId,
  setSelectedGhId,
  detailLoadingState,
  activeDetail,
  staffForm,
  setStaffForm,
  staffSubmitting,
  setStaffSubmitting,
}: StaffPanelProps) {
  const handleAddStaff = async () => {
    if (!staffForm.name.trim()) { toast.error('Le nom est requis'); return; }
    if (!effectiveGhId) return;
    setStaffSubmitting(true);
    try {
      const resp = await fetch(`/api/guesthouses/${effectiveGhId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: staffForm.name,
          role: staffForm.role,
          phone: staffForm.phone || null,
          schedule: staffForm.schedule ? JSON.stringify({ shift: staffForm.schedule }) : null,
        }),
      });
      if (resp.ok) {
        toast.success('Personnel ajouté', { description: `${staffForm.name} ajouté(e) comme ${staffRoleOptions.find(r => r.value === staffForm.role)?.label}` });
        setStaffForm({ name: '', role: 'receptionist', phone: '', schedule: '' });
      } else {
        toast.error('Erreur lors de l\'ajout');
      }
    } catch {
      toast.error('Erreur réseau lors de l\'ajout');
    }
    setStaffSubmitting(false);
  };

  const handleRemoveStaff = async (staffId: string, staffName: string) => {
    if (!effectiveGhId) return;
    try {
      const resp = await fetch(`/api/guesthouses/${effectiveGhId}/staff/${staffId}`, { method: 'DELETE' });
      if (resp.ok) {
        toast.success('Personnel retiré', { description: `${staffName} a été retiré(e)` });
      } else {
        toast.error('Erreur lors du retrait');
      }
    } catch {
      toast.error('Erreur réseau lors du retrait');
    }
  };

  return (
    <motion.div
      key="staff"
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

      {/* Add Staff Form */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
        <h4 className="font-display text-sm font-bold text-[#0a2a5e] mb-3">Ajouter un membre du personnel</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Nom complet *</label>
            <input
              type="text"
              placeholder="Ex: Aminata Dossou"
              value={staffForm.name}
              onChange={e => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Rôle *</label>
            <select
              value={staffForm.role}
              onChange={e => setStaffForm(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
            >
              {staffRoleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Téléphone</label>
            <input
              type="tel"
              placeholder="Ex: +229 90 00 00 00"
              value={staffForm.phone}
              onChange={e => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Horaires</label>
            <select
              value={staffForm.schedule}
              onChange={e => setStaffForm(prev => ({ ...prev, schedule: e.target.value }))}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
            >
              <option value="">-- Sélectionner --</option>
              {staffSchedulePresets.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddStaff}
              disabled={staffSubmitting || !staffForm.name.trim()}
              className="w-full px-3 py-2 bg-[#00A651] text-white rounded-xl text-sm font-semibold hover:bg-[#008f47] transition-colors disabled:opacity-50"
            >
              {staffSubmitting ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>

      {detailLoadingState ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StaffRowSkeleton key={i} />
          ))}
        </div>
      ) : activeDetail?.staff && activeDetail.staff.length > 0 ? (
        <div className="space-y-3">
          {activeDetail.staff.map((s, i) => {
            const schedule = parseSchedule(s.schedule);
            const icon = roleIconMap[s.role] || <User className="w-4 h-4" />;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, ease: easeOut }}
                className="bg-white rounded-2xl p-4 shadow-sm border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center text-[#003087]">
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0a2a5e]">{s.name}</p>
                    <p className="text-xs text-gray-500">{getRoleLabel(s.role)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {schedule && (
                    <span className="px-3 py-1 bg-gray-50 rounded-lg text-xs font-medium text-gray-600">{schedule}</span>
                  )}
                  <button
                    onClick={() => handleRemoveStaff(s.id, s.name)}
                    className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Retirer
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucun personnel enregistré pour cette guesthouse.</p>
        </div>
      )}
    </motion.div>
  );
}
