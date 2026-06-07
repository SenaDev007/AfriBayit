'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Loader2, MapPin, Mail } from 'lucide-react';

const COUNTRIES = [
  { value: 'BJ', label: 'Bénin', flag: '🇧🇯' },
  { value: 'CI', label: "Côte d'Ivoire", flag: '🇨🇮' },
  { value: 'BF', label: 'Burkina Faso', flag: '🇧🇫' },
  { value: 'TG', label: 'Togo', flag: '🇹🇬' },
  { value: 'SN', label: 'Sénégal', flag: '🇸🇳' },
];

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  BJ: ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Bohicon'],
  CI: ['Abidjan', 'Bouaké', 'Daloa', 'San-Pédro', 'Yamoussoukro'],
  BF: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya'],
  TG: ['Lomé', 'Sokodé', 'Kara', 'Atakpamé', 'Dapaong'],
  SN: ['Dakar', 'Saint-Louis', 'Thiès', 'Kaolack', 'Ziguinchor'],
};

// Placeholder email pattern used when Facebook OAuth doesn't return an email
const PLACEHOLDER_EMAIL_SUFFIX = '@placeholder.afribayit.com';

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function CompleteProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [needsEmail, setNeedsEmail] = useState(false);

  // If user is not authenticated or already has a country, redirect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      const userCountry = (session?.user as Record<string, unknown>)?.country as string | null;
      const needsCompletion = (session?.user as Record<string, unknown>)?.needsProfileCompletion as boolean;
      const userEmail = session?.user?.email || '';

      // Check if the user has a placeholder email (from Facebook without email scope)
      const hasPlaceholderEmail = userEmail.endsWith(PLACEHOLDER_EMAIL_SUFFIX);
      setNeedsEmail(hasPlaceholderEmail);

      // If user already has a country set and no placeholder email, go to dashboard
      if (userCountry && !needsCompletion && !hasPlaceholderEmail) {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (needsEmail && !email.trim()) {
      setError("L'adresse email est requise");
      return;
    }

    // Basic email validation
    if (needsEmail && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError("Format d'email invalide");
        return;
      }
    }

    if (!selectedCountry) {
      setError('Veuillez sélectionner votre pays');
      return;
    }

    if (!selectedCity) {
      setError('Veuillez sélectionner votre ville');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: selectedCountry,
          city: selectedCity,
          phone: phone.trim() || undefined,
          email: needsEmail ? email.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la mise à jour');
        setLoading(false);
        return;
      }

      // Update the NextAuth session to reflect the new country and email
      await update();

      // Redirect to dashboard
      router.push('/dashboard');
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#003087] via-[#001f5c] to-[#003087] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003087] via-[#001f5c] to-[#003087] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#003087]/10 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-[#003087]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#2C2E2F] mb-2">
            Bienvenue sur AfriBayit !
          </h1>
          <p className="text-sm text-gray-500">
            Pour personnaliser votre expérience, veuillez indiquer votre pays de résidence.
            Cela nous permet de vous proposer les biens et services disponibles dans votre zone.
          </p>
        </div>

        {/* Welcome message with user name */}
        {session?.user?.name && (
          <div className="mb-4 p-3 rounded-2xl bg-[#003087]/5 border border-[#003087]/10">
            <p className="text-sm text-[#003087]">
              Bonjour <span className="font-semibold">{session.user.name}</span> ! Complétez votre profil pour commencer.
            </p>
          </div>
        )}

        {/* Facebook email notice */}
        {needsEmail && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-700">
              Votre connexion Facebook n&apos;a pas fourni d&apos;adresse email. Veuillez renseigner une adresse email pour continuer.
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-600"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email (required for Facebook users without email) */}
          {needsEmail && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                Adresse email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10"
                />
              </div>
            </motion.div>
          )}

          {/* Country Selection */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              Pays de résidence *
            </label>
            <div className="space-y-2">
              {COUNTRIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setSelectedCountry(c.value);
                    const cities = CITIES_BY_COUNTRY[c.value] || [];
                    setSelectedCity(cities[0] || '');
                    setError('');
                  }}
                  className={`w-full py-3 px-4 rounded-2xl border text-sm text-left transition-all flex items-center gap-3 ${
                    selectedCountry === c.value
                      ? 'border-[#003087] bg-[#003087]/5 ring-2 ring-[#003087]/20'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{c.flag}</span>
                  <span className="font-medium text-gray-700">{c.label}</span>
                  {selectedCountry === c.value && (
                    <Check className="w-4 h-4 text-[#003087] ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* City Selection */}
          {selectedCountry && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                Ville *
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10 bg-white"
              >
                <option value="">Sélectionnez votre ville</option>
                {(CITIES_BY_COUNTRY[selectedCountry] || []).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </motion.div>
          )}

          {/* Phone (optional) */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              Téléphone (optionnel)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+229 97 00 00 00"
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10"
            />
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.99 }}
            type="submit"
            disabled={loading || !selectedCountry || !selectedCity || (needsEmail && !email.trim())}
            className="w-full py-3.5 bg-[#003087] text-white rounded-full font-semibold text-sm hover:bg-[#0047b3] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Enregistrement...' : 'Commencer'}
          </motion.button>
        </form>

        {/* Info */}
        <p className="text-xs text-gray-400 text-center mt-4">
          Ces informations nous aident à vous proposer des biens et services adaptés à votre localisation.
        </p>
      </motion.div>
    </div>
  );
}
