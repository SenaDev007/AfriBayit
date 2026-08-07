'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Coins, Crown, FileText, Link, Loader2, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { api, ApiError } from '@/lib/api-client';
import { ambassadorTiers, easeOut } from './constants';

interface AmbassadorPanelProps {
  isAuth: boolean;
}

interface AmbassadorApplicationPayload {
  motivation: string;
  city: string;
  socialLinks: string;
}

export default function AmbassadorPanel({ isAuth }: AmbassadorPanelProps) {
  // Application form state — CDC §5.7.5
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [motivation, setMotivation] = useState('');
  const [city, setCity] = useState('');
  const [socialLinks, setSocialLinks] = useState('');

  const resetForm = () => {
    setMotivation('');
    setCity('');
    setSocialLinks('');
  };

  const handleOpenForm = () => {
    if (!isAuth) {
      toast({
        title: 'Connexion requise',
        description: 'Veuillez vous connecter pour devenir ambassadeur.',
      });
      window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    if (submitting) return; // Don't allow closing mid-submission.
    setShowForm(false);
  };

  // CDC §5.7.5 — Submit ambassador application to the backend.
  // The backend stores the application and notifies the ambassador team
  // for review (48h SLA per the program charter).
  const handleSubmit = async () => {
    // Basic client-side validation.
    if (!motivation.trim()) {
      toast({
        title: 'Motivation requise',
        description: 'Expliquez en quelques mots pourquoi vous souhaitez devenir ambassadeur AfriBayit.',
        variant: 'destructive',
      });
      return;
    }
    if (!city.trim()) {
      toast({
        title: 'Ville requise',
        description: 'Indiquez votre ville pour que nous puissions vous affecter à la bonne zone.',
        variant: 'destructive',
      });
      return;
    }
    if (motivation.trim().length < 30) {
      toast({
        title: 'Motivation trop courte',
        description: 'Développez votre motivation (au moins 30 caractères).',
        variant: 'destructive',
      });
      return;
    }

    const payload: AmbassadorApplicationPayload = {
      motivation: motivation.trim(),
      city: city.trim(),
      socialLinks: socialLinks.trim(),
    };

    setSubmitting(true);
    try {
      await api.post('/community/ambassador/applications', payload);
      toast({
        title: 'Candidature envoyée',
        description: 'Votre demande sera examinée sous 48h. Vous recevrez un email avec la décision.',
      });
      setShowForm(false);
      resetForm();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          toast({
            title: 'Session expirée',
            description: 'Votre session a expiré. Reconnectez-vous pour soumettre votre candidature.',
            variant: 'destructive',
          });
          window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          return;
        }
        if (err.statusCode === 409) {
          toast({
            title: 'Candidature déjà envoyée',
            description: 'Vous avez déjà soumis une candidature ambassadeur. Notre équipe vous recontactera bientôt.',
            variant: 'destructive',
          });
          setShowForm(false);
          return;
        }
        toast({
          title: 'Erreur lors de la soumission',
          description: err.message || 'Le serveur a refusé la candidature. Réessayez plus tard.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erreur réseau',
          description: err instanceof Error ? err.message : 'Impossible de soumettre la candidature. Vérifiez votre connexion et réessayez.',
          variant: 'destructive',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="bg-gradient-to-r from-[#003087] to-[#0047b3] rounded-xl p-6 text-white text-center">
        <Crown className="w-10 h-10 mx-auto mb-2 text-[#D4AF37]" />
        <h3 className="font-display text-xl font-bold mb-2">Programme Ambassadeur</h3>
        <p className="text-sm text-white/70 mb-4">
          Représentez AfriBayit dans votre communauté et gagnez des commissions sur chaque filleul.
        </p>
        <button
          onClick={handleOpenForm}
          className="px-6 py-2.5 bg-[#D4AF37] text-[#003087] rounded-lg text-sm font-bold hover:bg-[#e5c349] transition-colors"
        >
          Devenir Ambassadeur
        </button>
      </div>

      {/* Tiers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ambassadorTiers.map((tier, i) => (
          <motion.div
            key={tier.tier}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, ease: easeOut }}
            className="bg-white rounded-xl p-5 shadow-sm border text-center"
          >
            <span className="flex items-center justify-center mb-2">{tier.icon}</span>
            <h4 className="font-bold text-[#0a2a5e] mb-1">{tier.tier}</h4>
            <p className="text-lg font-mono font-bold mb-3" style={{ color: tier.color }}>{tier.commission}</p>
            <div className="space-y-1.5">
              {tier.benefits.map(b => (
                <p key={b} className="text-xs text-gray-500 flex items-center gap-1 justify-center">
                  <CheckCircle className="w-3 h-3 text-[#00A651] shrink-0" /> {b}
                </p>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="font-display text-base font-bold text-[#0a2a5e] mb-4">Comment ça marche ?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Inscrivez-vous', desc: 'Remplissez le formulaire de candidature ambassadeur', icon: <FileText className="w-6 h-6" /> },
            { step: '2', title: 'Partagez votre lien', desc: 'Diffusez votre lien de parrainage unique', icon: <Link className="w-6 h-6" /> },
            { step: '3', title: 'Gagnez des commissions', desc: 'Recevez des commissions sur chaque filleul actif', icon: <Coins className="w-6 h-6" /> },
          ].map(s => (
            <div key={s.step} className="text-center p-4 bg-gray-50 rounded-2xl">
              <span className="flex items-center justify-center mb-2 text-[#003087]">{s.icon}</span>
              <div className="w-8 h-8 rounded-lg bg-[#003087] text-white text-sm font-bold flex items-center justify-center mx-auto mb-2">{s.step}</div>
              <p className="text-sm font-semibold text-[#0a2a5e] mb-1">{s.title}</p>
              <p className="text-xs text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Application form modal — CDC §5.7.5 */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
            onClick={handleCloseForm}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ambassador-form-title"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Form header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 id="ambassador-form-title" className="font-display text-lg font-bold text-[#0a2a5e] flex items-center gap-2">
                    <Crown className="w-5 h-5 text-[#D4AF37]" />
                    Candidature Ambassadeur
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Réponse sous 48h ouvrées</p>
                </div>
                <button
                  onClick={handleCloseForm}
                  disabled={submitting}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Fermer le formulaire"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Form body */}
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label htmlFor="amb-city" className="text-xs font-semibold text-gray-700 mb-1.5 block">
                    Ville <span className="text-[#D93025]">*</span>
                  </label>
                  <input
                    id="amb-city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="ex: Cotonou"
                    disabled={submitting}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#003087] transition-colors disabled:opacity-60"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Nous l&apos;utilisons pour vous affecter à la zone géographique la plus pertinente.
                  </p>
                </div>

                <div>
                  <label htmlFor="amb-social" className="text-xs font-semibold text-gray-700 mb-1.5 block">
                    Liens sociaux <span className="text-gray-400 font-normal">(optionnel)</span>
                  </label>
                  <input
                    id="amb-social"
                    type="text"
                    value={socialLinks}
                    onChange={(e) => setSocialLinks(e.target.value)}
                    placeholder="ex: @mon_insta, linkedin.com/in/moi, +229 00 00 00 00"
                    disabled={submitting}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#003087] transition-colors disabled:opacity-60"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Aidez-nous à évaluer votre audience et votre capacité de propagation.
                  </p>
                </div>

                <div>
                  <label htmlFor="amb-motivation" className="text-xs font-semibold text-gray-700 mb-1.5 block">
                    Votre motivation <span className="text-[#D93025]">*</span>
                  </label>
                  <textarea
                    id="amb-motivation"
                    rows={5}
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    placeholder="Expliquez pourquoi vous souhaitez représenter AfriBayit, votre expérience en immobilier, et comment vous comptez recruter des filleuls..."
                    disabled={submitting}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#003087] transition-colors resize-none disabled:opacity-60"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    {motivation.trim().length} caractères (minimum 30)
                  </p>
                </div>

                <div className="bg-[#003087]/5 border border-[#003087]/10 rounded-lg p-3 text-[11px] text-gray-600">
                  <p className="font-semibold text-[#003087] mb-1">En soumettant, vous acceptez :</p>
                  <ul className="space-y-0.5 ml-3 list-disc">
                    <li>Le <strong>règlement du programme ambassadeur</strong> (CDC §5.7.5).</li>
                    <li>Les commissions de <strong>2% / 3% / 4%</strong> selon le tier atteint.</li>
                    <li>Un audit trimestriel de vos filleuls actifs.</li>
                  </ul>
                </div>
              </div>

              {/* Form footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
                <button
                  onClick={handleCloseForm}
                  disabled={submitting}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !motivation.trim() || !city.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-60 disabled:cursor-wait"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Envoi…
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4" />
                      Soumettre
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
