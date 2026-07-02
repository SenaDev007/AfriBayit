'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Coins, Crown, FileText, Link } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ambassadorTiers, easeOut } from './constants';

interface AmbassadorPanelProps {
  isAuth: boolean;
}

export default function AmbassadorPanel({ isAuth }: AmbassadorPanelProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="bg-gradient-to-r from-[#003087] to-[#0047b3] rounded-3xl p-6 text-white text-center">
        <Crown className="w-10 h-10 mx-auto mb-2 text-[#D4AF37]" />
        <h3 className="font-display text-xl font-bold mb-2">Programme Ambassadeur</h3>
        <p className="text-sm text-white/70 mb-4">Représentez AfriBayit dans votre communauté et gagnez des commissions sur chaque filleul.</p>
        <button
          onClick={() => {
            if (!isAuth) { toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour devenir ambassadeur.' }); return; }
            toast({ title: 'Candidature envoyée', description: 'Votre demande sera examinée sous 48h.' });
          }}
          className="px-6 py-2.5 bg-[#D4AF37] text-[#003087] rounded-full text-sm font-bold hover:bg-[#e5c349] transition-colors"
        >
          Devenir Ambassadeur
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ambassadorTiers.map((tier, i) => (
          <motion.div
            key={tier.tier}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, ease: easeOut }}
            className="bg-white rounded-3xl p-5 shadow-sm border text-center"
          >
            <span className="flex items-center justify-center mb-2">{tier.icon}</span>
            <h4 className="font-bold text-[#2C2E2F] mb-1">{tier.tier}</h4>
            <p className="text-lg font-mono font-bold mb-3" style={{ color: tier.color }}>{tier.commission}</p>
            <div className="space-y-1.5">
              {tier.benefits.map(b => (
                <p key={b} className="text-xs text-gray-500 flex items-center gap-1 justify-center"><CheckCircle className="w-3 h-3 text-[#00A651]" /> {b}</p>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="bg-white rounded-3xl p-5 shadow-sm border">
        <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4">Comment ça marche ?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Inscrivez-vous', desc: 'Remplissez le formulaire de candidature ambassadeur', icon: <FileText className="w-6 h-6" /> },
            { step: '2', title: 'Partagez votre lien', desc: 'Diffusez votre lien de parrainage unique', icon: <Link className="w-6 h-6" /> },
            { step: '3', title: 'Gagnez des commissions', desc: 'Recevez des commissions sur chaque filleul actif', icon: <Coins className="w-6 h-6" /> },
          ].map(s => (
            <div key={s.step} className="text-center p-4 bg-gray-50 rounded-2xl">
              <span className="flex items-center justify-center mb-2 text-[#003087]">{s.icon}</span>
              <div className="w-8 h-8 rounded-full bg-[#003087] text-white text-sm font-bold flex items-center justify-center mx-auto mb-2">{s.step}</div>
              <p className="text-sm font-semibold text-[#2C2E2F] mb-1">{s.title}</p>
              <p className="text-xs text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
