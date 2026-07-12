'use client';

import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { NewGroupFormState } from '../types';

interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
  form: NewGroupFormState;
  setForm: React.Dispatch<React.SetStateAction<NewGroupFormState>>;
}

export default function CreateGroupDialog({ open, onClose, form, setForm }: CreateGroupDialogProps) {
  if (!open) return null;

  const handleSubmit = () => {
    if (!form.name) { toast({ title: 'Nom requis' }); return; }
    toast({ title: 'Groupe créé', description: 'Votre groupe a été créé avec succès.' });
    onClose();
    setForm({ name: '', description: '', type: 'Privé', city: '' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-bold text-[#0a2a5e] mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-[#00A651]" /> Créer un groupe</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nom du groupe</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ex: Investisseurs Lomé"
              className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Décrivez l'objectif du groupe..."
              className="w-full px-4 py-3 rounded-2xl border text-sm outline-none resize-none focus:border-[#003087] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Type</label>
            <select
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors"
            >
              <option value="Privé">Privé</option>
              <option value="Public">Public</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Ville</label>
            <input
              type="text"
              value={form.city}
              onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
              placeholder="Ville ou En ligne"
              className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border rounded-lg text-sm font-semibold text-gray-600">Annuler</button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 bg-[#00A651] text-white rounded-lg text-sm font-semibold hover:bg-[#008f47] transition-colors"
            >
              Créer le groupe
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
