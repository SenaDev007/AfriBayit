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
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-primary-pale"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-serif text-xl font-bold text-primary-deep mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-green-600" /> Créer un groupe</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">Nom du groupe</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ex: Investisseurs Lomé"
              className="w-full px-4 py-3.5 rounded-xl border border-primary-pale bg-white text-sm outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Décrivez l'objectif du groupe..."
              className="w-full px-4 py-3.5 rounded-xl border border-primary-pale bg-white text-sm outline-none resize-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">Type</label>
            <select
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="w-full px-4 py-3.5 rounded-xl border border-primary-pale bg-white text-sm outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-all"
            >
              <option value="Privé">Privé</option>
              <option value="Public">Public</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">Ville</label>
            <input
              type="text"
              value={form.city}
              onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
              placeholder="Ville ou En ligne"
              className="w-full px-4 py-3.5 rounded-xl border border-primary-pale bg-white text-sm outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-all"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-full border border-primary-deep/20 text-primary-deep text-sm font-bold hover:bg-primary-pale transition-all">Annuler</button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-full bg-primary-green text-white text-sm font-bold shadow-md hover:bg-primary-deep hover:shadow-lg transition-all"
            >
              Créer le groupe
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
