'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MapPin, Home, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

/**
 * Formulaire de contact — portage du design Win-Agro LeadForm.tsx :
 * layout 5/7 (copy + ancres de contact à gauche, formulaire glass-panel
 * à droite), champs labellisés uppercase, CTA shimmer pulsé, état de
 * succès animé. La soumission ouvre un e-mail pré-rempli vers
 * contact@afribayit.com (équivalent du redirect WhatsApp Win-Agro).
 */

const SERVICE_OPTIONS = [
  { value: 'achat', label: 'Acheter un bien' },
  { value: 'location', label: 'Louer un bien' },
  { value: 'investissement', label: 'Investir / Rendement' },
  { value: 'sejour', label: 'Réserver un séjour' },
  { value: 'vendre', label: 'Vendre / Publier une annonce' },
  { value: 'services_pro', label: 'Services pro (artisan, notaire…)' },
  { value: 'autre', label: 'Autre demande spécifique' },
];

export default function LeadForm() {
  const [isSubmittingState, setIsSubmittingState] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Champs du formulaire
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('achat');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});

  const validate = () => {
    const next: { fullName?: string; phone?: string } = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      next.fullName = 'Indique ton prénom et ton nom.';
    }
    if (!phone.trim() || phone.replace(/[^0-9+]/g, '').length < 8) {
      next.phone = 'Indique un numéro de téléphone valide.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const serviceLabel = SERVICE_OPTIONS.find((o) => o.value === service)?.label ?? 'Acheter un bien';

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmittingState(true);

    // E-mail pré-rempli structuré — équivalent du WhatsApp Win-Agro
    const rawMessageContent = message.trim() ? `\n"${message.trim()}"` : '';
    const emailBody = `Bonjour AfriBayit,

Je m'appelle ${fullName.trim()}.
Je suis intéressé(e) par : ${serviceLabel}.${rawMessageContent}

Mon numéro : ${phone.trim()}

Cordialement,`;
    const mailtoUrl = `mailto:contact@afribayit.com?subject=${encodeURIComponent(
      `Demande — ${serviceLabel}`
    )}&body=${encodeURIComponent(emailBody)}`;

    setSubmitSuccess(true);
    setTimeout(() => {
      window.location.href = mailtoUrl;
      setIsSubmittingState(false);
      setSubmitSuccess(false);
    }, 1500);
  };

  const inputClass = (hasError?: string) =>
    `w-full px-4 py-3.5 rounded-xl border bg-white focus:outline-none focus:ring-2 transition-all font-sans text-sm ${
      hasError
        ? 'border-red-500 focus:ring-red-200'
        : 'border-primary-pale focus:ring-primary-pale focus:border-primary-green'
    }`;

  return (
    <section id="contact" className="py-24 bg-white relative overflow-hidden">
      {/* Flou décoratif */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-primary-pale rounded-full blur-[100px] opacity-40 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
          {/* 1. Contenu (5 colonnes) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 rounded-full bg-primary-pale text-primary-deep text-xs font-sans font-bold uppercase tracking-wider mb-2">
                Nous Contacter
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-primary-deep leading-tight">
                Tu as un projet immobilier ? Ne reste pas bloqué.
              </h2>

              <p className="font-sans text-sm sm:text-base text-gray-text leading-relaxed">
                Remplis ce formulaire en 30 secondes pour qualifier ton projet, ou écris-nous directement.{' '}
                <strong className="text-primary-deep">Notre équipe répond sous 24h</strong>, et Rebecca notre IA peut
                te répondre instantanément, jour et nuit.
              </p>

              <div className="w-16 h-1 bg-accent-yellow rounded-full" />
            </div>

            {/* Ancres de contact direct */}
            <div className="space-y-4 pt-4 border-t border-primary-pale">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-primary-pale flex items-center justify-center text-primary-green">
                  <Mail className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-xs text-gray-400 font-sans uppercase font-bold tracking-wider">
                    E-mail principal
                  </p>
                  <a
                    href="mailto:contact@afribayit.com"
                    className="text-base sm:text-lg font-bold text-primary-deep hover:text-primary-green transition-colors font-sans"
                  >
                    contact@afribayit.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-primary-pale flex items-center justify-center text-primary-green">
                  <MapPin className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-xs text-gray-400 font-sans uppercase font-bold tracking-wider">
                    Bureaux — marchés pionniers
                  </p>
                  <p className="text-base sm:text-lg font-bold text-primary-deep font-sans">
                    Cotonou · Abidjan · Ouagadougou · Lomé
                  </p>
                </div>
              </div>
            </div>

            {/* CTA inscription direct */}
            <div className="pt-4">
              <motion.a
                href="/auth/register"
                whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(0, 156, 222, 0.3)' }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary-green hover:bg-primary-deep text-white font-sans font-bold text-base shadow-md cursor-pointer btn-shimmer"
              >
                <Home className="w-5 h-5 shrink-0" /> Créer mon compte gratuit
              </motion.a>
            </div>
          </div>

          {/* 2. Formulaire interactif (7 colonnes) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl glass-panel border border-primary-pale shadow-2xl p-8 sm:p-10 relative overflow-hidden h-full flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {submitSuccess ? (
                  // État de succès animé
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12 flex flex-col items-center justify-center"
                  >
                    <CheckCircle2 className="w-16 h-16 text-primary-green mb-6 animate-bounce" />
                    <h3 className="font-serif text-2xl font-black text-primary-deep mb-4 leading-tight">
                      Ta demande est prête !
                    </h3>
                    <p className="font-sans text-sm text-gray-text max-w-sm mb-6 leading-relaxed">
                      Ouverture de ta messagerie avec le message pré-rempli vers l&apos;équipe AfriBayit…
                    </p>
                    <div className="w-12 h-12 rounded-full border-4 border-primary-pale border-t-primary-green animate-spin" />
                  </motion.div>
                ) : (
                  // Formulaire actif
                  <motion.form key="form" onSubmit={onSubmit} className="space-y-6">
                    <div>
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-primary-deep leading-tight">
                        Ou remplis ce formulaire — on te rappelle.
                      </h3>
                      <p className="text-xs text-gray-400 font-sans mt-1">
                        Les champs marqués d&apos;une étoile (*) sont obligatoires.
                      </p>
                    </div>

                    <div className="w-full h-px bg-primary-pale" />

                    {/* Nom complet */}
                    <div className="space-y-1">
                      <label
                        htmlFor="fullName"
                        className="block text-xs font-bold text-primary-deep uppercase tracking-wider font-sans"
                      >
                        Ton prénom et ton nom *
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        placeholder="Ex: Kofi Mensah"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={inputClass(errors.fullName)}
                      />
                      {errors.fullName && (
                        <p className="text-xs font-bold text-red-500 mt-1 font-sans flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" /> {errors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Téléphone */}
                    <div className="space-y-1">
                      <label
                        htmlFor="phone"
                        className="block text-xs font-bold text-primary-deep uppercase tracking-wider font-sans"
                      >
                        Ton numéro WhatsApp / Tél *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        placeholder="Ex: +229 01 23 45 67"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={inputClass(errors.phone)}
                      />
                      {errors.phone && (
                        <p className="text-xs font-bold text-red-500 mt-1 font-sans flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" /> {errors.phone}
                        </p>
                      )}
                    </div>

                    {/* Sélection du service */}
                    <div className="space-y-1">
                      <label
                        htmlFor="service"
                        className="block text-xs font-bold text-primary-deep uppercase tracking-wider font-sans"
                      >
                        Ce qui t&apos;intéresse *
                      </label>
                      <select
                        id="service"
                        value={service}
                        onChange={(e) => setService(e.target.value)}
                        className={inputClass()}
                      >
                        {SERVICE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Message libre */}
                    <div className="space-y-1">
                      <label
                        htmlFor="message"
                        className="block text-xs font-bold text-primary-deep uppercase tracking-wider font-sans"
                      >
                        Décris ton projet en quelques mots (facultatif)
                      </label>
                      <textarea
                        id="message"
                        rows={3}
                        placeholder="Budget, ville ciblée, type de bien, délais…"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className={`${inputClass()} resize-none`}
                      />
                    </div>

                    {/* CTA de soumission */}
                    <motion.button
                      type="submit"
                      disabled={isSubmittingState}
                      whileHover={{ scale: 1.03, boxShadow: '0 10px 20px rgba(0, 156, 222, 0.3)' }}
                      whileTap={{ scale: 0.98 }}
                      animate={isSubmittingState ? {} : { scale: [1, 1.02, 1] }}
                      transition={
                        isSubmittingState ? {} : { scale: { repeat: Infinity, duration: 3.0, ease: 'easeInOut' } }
                      }
                      className="w-full py-4 rounded-full bg-primary-green hover:bg-primary-deep text-white font-sans font-bold text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer btn-shimmer"
                    >
                      {isSubmittingState ? (
                        <>
                          <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Transmission en cours...
                        </>
                      ) : (
                        <>
                          Envoyer ma demande <ArrowRight className="w-5 h-5 shrink-0" />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
