'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { useCreateProperty } from '@/hooks/useProperties';
import { Home, Building2, Map, Landmark, Store, BedDouble, Coins, Key, TrendingUp, ClipboardList, PenTool, Camera, FileText, Bot, CheckCircle, PartyPopper, Send, User, Hourglass, Check, X, Lightbulb, AlertTriangle } from 'lucide-react';
import { getRequiredDocs, getDocLabel, getDocDescription, normalizeCountryCode, COUNTRY_NAMES } from '@/lib/constants';

interface ModuleProps {
  onNavigate?: (section: string) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

// Static config — property types
const propertyTypes = [
  { value: 'villa', label: 'Villa', icon: <Home className="w-5 h-5" /> },
  { value: 'appartement', label: 'Appartement', icon: <Building2 className="w-5 h-5" /> },
  { value: 'terrain', label: 'Terrain', icon: <Map className="w-5 h-5" /> },
  { value: 'bureau', label: 'Bureau', icon: <Landmark className="w-5 h-5" /> },
  { value: 'commerce', label: 'Commerce', icon: <Store className="w-5 h-5" /> },
  { value: 'chambre', label: 'Studio/Chambre', icon: <BedDouble className="w-5 h-5" /> },
];

// Static config — transaction types
const transactionTypes = [
  { value: 'achat', label: 'À vendre', icon: <Coins className="w-5 h-5" /> },
  { value: 'location', label: 'À louer', icon: <Key className="w-5 h-5" /> },
  { value: 'investissement', label: 'Investissement', icon: <TrendingUp className="w-5 h-5" /> },
];

// Static config — cities with country codes
const cities = [
  { value: 'cotonou', label: 'Cotonou', countryCode: 'BJ', country: 'Bénin' },
  { value: 'abidjan', label: 'Abidjan', countryCode: 'CI', country: "Côte d'Ivoire" },
  { value: 'lome', label: 'Lomé', countryCode: 'TG', country: 'Togo' },
  { value: 'ouagadougou', label: 'Ouagadougou', countryCode: 'BF', country: 'Burkina Faso' },
  { value: 'porto-novo', label: 'Porto-Novo', countryCode: 'BJ', country: 'Bénin' },
  { value: 'yamoussoukro', label: 'Yamoussoukro', countryCode: 'CI', country: "Côte d'Ivoire" },
];

// Static config — features list
const featuresList = [
  'Piscine', 'Jardin', 'Climatisation', 'Garage', 'Alarme', 'Wi-Fi',
  'Meublé', 'Vue panoramique', 'Parking', 'Sécurité 24/7',
  'Cuisine équipée', 'Terrasse', 'Balcon', 'Forage', 'Dépendance',
];

// Publish steps: Saisie → Upload Documents → Vérification IA → Validation → Publication
const publishSteps = [
  { step: 1, title: 'Saisie', desc: 'Type, prix, surface, localisation', icon: <ClipboardList className="w-4 h-4" /> },
  { step: 2, title: 'Description', desc: 'Texte et caractéristiques', icon: <PenTool className="w-4 h-4" /> },
  { step: 3, title: 'Photos', desc: "Jusqu'à 20 photos", icon: <Camera className="w-4 h-4" /> },
  { step: 4, title: 'Documents', desc: 'Upload documents légaux requis', icon: <FileText className="w-4 h-4" /> },
  { step: 5, title: 'Vérification IA', desc: 'Validation automatique des documents', icon: <Bot className="w-4 h-4" /> },
  { step: 6, title: 'Validation', desc: 'Révision et soumission', icon: <CheckCircle className="w-4 h-4" /> },
  { step: 7, title: 'Publication', desc: 'Mise en ligne du bien', icon: <PartyPopper className="w-4 h-4" /> },
];

interface FormData {
  propertyType: string;
  transactionType: string;
  price: string;
  surface: string;
  rooms: string;
  bedrooms: string;
  bathrooms: string;
  city: string;
  quartier: string;
  title: string;
  description: string;
  features: string[];
  photos: string[];
  legalDocs: { type: string; file: string; status: string }[];
}

const initialFormData: FormData = {
  propertyType: '',
  transactionType: '',
  price: '',
  surface: '',
  rooms: '',
  bedrooms: '',
  bathrooms: '',
  city: '',
  quartier: '',
  title: '',
  description: '',
  features: [],
  photos: [],
  legalDocs: [],
};

export default function PropertyPublishModule({ onNavigate }: ModuleProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createPropertyMutation = useCreateProperty();

  const selectedCity = cities.find(c => c.value === formData.city);
  const selectedCountryCode = selectedCity?.countryCode || '';
  const selectedCountryName = selectedCity?.country || '';

  // Use legal-docs.ts to get required docs based on country + property type
  const requiredDocs = useMemo(() => {
    if (!selectedCountryCode || !formData.propertyType) return [];
    return getRequiredDocs(selectedCountryCode, formData.propertyType);
  }, [selectedCountryCode, formData.propertyType]);

  const updateField = useCallback((field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleFeature = useCallback((feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature],
    }));
  }, []);

  const addPhoto = useCallback(() => {
    // SECURITY FIX (P3.6 — juillet 2026) : Replaced Unsplash mock URL injection
    // with a real <input type="file"> picker that uploads to Cloudflare R2.
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/heic';
    input.multiple = true;
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      if (!files || files.length === 0) return;

      for (const file of Array.from(files)) {
        // 20-photo limit
        if (formData.photos.length >= 20) {
          alert('Vous avez atteint la limite de 20 photos par annonce.');
          break;
        }

        // 10 MB max per photo
        if (file.size > 10 * 1024 * 1024) {
          alert(`La photo "${file.name}" dépasse 10 Mo et n'a pas été ajoutée.`);
          continue;
        }

        try {
          // 1. Get a signed PUT URL from our storage API
          const signedUrlRes = await fetch('/api/storage/signed-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: `properties/${Date.now()}-${file.name}`,
              contentType: file.type,
            }),
          });
          if (!signedUrlRes.ok) throw new Error('Failed to get signed URL');
          const { url: uploadUrl, publicUrl } = await signedUrlRes.json();

          // 2. Upload file directly to R2 via PUT
          const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
          });
          if (!uploadRes.ok) throw new Error('Upload failed');

          // 3. Add public URL to form data
          setFormData(prev => ({
            ...prev,
            photos: [...prev.photos, publicUrl],
          }));
        } catch (err) {
          console.error('[PropertyPublish] Photo upload failed:', err);
          alert(`Échec de l'upload de "${file.name}". Réessayez.`);
        }
      }
    };
    input.click();
  }, [formData.photos.length]);

  const addLegalDoc = useCallback((docType: string) => {
    setFormData(prev => ({
      ...prev,
      legalDocs: prev.legalDocs.find(d => d.type === docType)
        ? prev.legalDocs
        : [...prev.legalDocs, { type: docType, file: 'uploaded', status: 'pending_verification' }],
    }));
  }, []);

  const removeLegalDoc = useCallback((docType: string) => {
    setFormData(prev => ({
      ...prev,
      legalDocs: prev.legalDocs.filter(d => d.type !== docType),
    }));
  }, []);

  // Check if all required docs are uploaded
  const allRequiredDocsUploaded = useMemo(() => {
    if (requiredDocs.length === 0) return false;
    return requiredDocs.every(docType =>
      formData.legalDocs.some(d => d.type === docType)
    );
  }, [requiredDocs, formData.legalDocs]);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: return !!(formData.propertyType && formData.transactionType && formData.price && formData.surface && formData.city);
      case 2: return !!(formData.title && formData.description);
      case 3: return formData.photos.length > 0;
      case 4: return allRequiredDocsUploaded;
      case 5: return true; // AI verification is automatic
      case 6: return true; // Review step
      case 7: return true; // Publication
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      await createPropertyMutation.mutateAsync({
        propertyType: formData.propertyType,
        transactionType: formData.transactionType,
        price: Number(formData.price),
        surface: Number(formData.surface),
        rooms: Number(formData.rooms) || 0,
        bedrooms: Number(formData.bedrooms) || 0,
        bathrooms: Number(formData.bathrooms) || 0,
        city: selectedCity?.label || formData.city,
        country: selectedCountryName,
        quartier: formData.quartier,
        title: formData.title,
        description: formData.description,
        features: formData.features,
        images: formData.photos,
        legalDocs: formData.legalDocs,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erreur lors de la soumission');
    }
  };

  if (submitted) {
    return (
      <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 shadow-sm border text-center mt-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-[#00A651] flex items-center justify-center mx-auto mb-4"
            >
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h3 className="font-display text-2xl font-bold text-[#2C2E2F] mb-2">Annonce soumise !</h3>
            <p className="text-sm text-gray-500 mb-6">
              Votre bien est en cours de vérification IA. Vous serez notifié une fois publié.
            </p>

            {/* Publication Timeline */}
            <div className="text-left space-y-3 mb-6">
              {[
                { step: 'Soumission', status: 'completed', icon: <Send className="w-4 h-4" /> },
                { step: 'Vérification IA documents', status: 'in_progress', icon: <Bot className="w-4 h-4" /> },
                { step: 'Validation humaine', status: 'pending', icon: <User className="w-4 h-4" /> },
                { step: 'Publication', status: 'pending', icon: <PartyPopper className="w-4 h-4" /> },
              ].map((vs, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                    vs.status === 'completed' ? 'bg-[#00A651] text-white' :
                    vs.status === 'in_progress' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {vs.status === 'completed' ? <Check className="w-3 h-3" /> : vs.status === 'in_progress' ? <Hourglass className="w-3 h-3" /> : (i + 1)}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${vs.status === 'pending' ? 'text-gray-400' : 'text-[#2C2E2F]'}`}>
                      {vs.icon} {vs.step}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setSubmitted(false); setCurrentStep(1); setFormData(initialFormData); }}
              className="px-6 py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors"
            >
              Publier un autre bien
            </button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#003087]/10 text-[#003087] text-sm font-semibold mb-4">
            <PenTool className="w-4 h-4" /> Publier un bien
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2C2E2F] mb-2">
            Nouvelle <span className="text-[#003087]">Annonce</span>
          </h1>
        </motion.div>

        {/* Stepper — Updated with 7 steps per CDC §5.0.2 */}
        <div className="flex items-center gap-0.5 mb-8 overflow-x-auto pb-2">
          {publishSteps.map((s, i) => (
            <div key={s.step} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  currentStep > s.step ? 'bg-[#00A651] text-white' :
                  currentStep === s.step ? 'bg-[#003087] text-white' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {currentStep > s.step ? <Check className="w-3 h-3" /> : s.step}
                </div>
                <p className={`text-[8px] sm:text-[9px] font-medium mt-1 text-center leading-tight ${
                  currentStep >= s.step ? 'text-[#003087]' : 'text-gray-400'
                }`}>
                  {s.title}
                </p>
              </div>
              {i < publishSteps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-0.5 rounded ${
                  currentStep > s.step ? 'bg-[#00A651]' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border">
          <AnimatePresence mode="wait">
            {/* Step 1: Property Info */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#2C2E2F] mb-1">Informations du bien</h2>
                  <p className="text-xs text-gray-500">Type de bien, transaction, prix et localisation</p>
                </div>

                {/* Property Type */}
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Type de bien *</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {propertyTypes.map(pt => (
                      <button
                        key={pt.value}
                        onClick={() => updateField('propertyType', pt.value)}
                        className={`p-3 rounded-2xl border-2 text-center transition-all ${
                          formData.propertyType === pt.value ? 'border-[#003087] bg-[#003087]/5' : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <span className="flex items-center justify-center mb-1">{pt.icon}</span>
                        <span className="text-[10px] font-medium">{pt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transaction Type */}
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Type de transaction *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {transactionTypes.map(tt => (
                      <button
                        key={tt.value}
                        onClick={() => updateField('transactionType', tt.value)}
                        className={`p-3 rounded-2xl border-2 text-center transition-all ${
                          formData.transactionType === tt.value ? 'border-[#003087] bg-[#003087]/5' : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <span className="flex items-center justify-center mb-1">{tt.icon}</span>
                        <span className="text-xs font-medium">{tt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price & Surface */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Prix (FCFA) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={e => updateField('price', e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono font-bold focus:outline-none focus:border-[#003087]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Surface (m²) *</label>
                    <input
                      type="number"
                      value={formData.surface}
                      onChange={e => updateField('surface', e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono font-bold focus:outline-none focus:border-[#003087]"
                    />
                  </div>
                </div>

                {/* Rooms */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Pièces</label>
                    <input type="number" value={formData.rooms} onChange={e => updateField('rooms', e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#003087]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Chambres</label>
                    <input type="number" value={formData.bedrooms} onChange={e => updateField('bedrooms', e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#003087]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">SDB</label>
                    <input type="number" value={formData.bathrooms} onChange={e => updateField('bathrooms', e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#003087]" />
                  </div>
                </div>

                {/* City & Quartier */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Ville *</label>
                    <select value={formData.city} onChange={e => updateField('city', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#003087] bg-white">
                      <option value="">Sélectionner</option>
                      {cities.map(c => <option key={c.value} value={c.value}>{c.label} ({c.country})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Quartier</label>
                    <input type="text" value={formData.quartier} onChange={e => updateField('quartier', e.target.value)} placeholder="Ex: Ganhi" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#003087]" />
                  </div>
                </div>

                {/* Legal doc preview */}
                {selectedCountryCode && formData.propertyType && (
                  <div className="p-3 bg-[#D4AF37]/5 rounded-xl">
                    <p className="text-xs font-semibold text-[#D4AF37] mb-1 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Documents requis détectés</p>
                    <p className="text-[10px] text-gray-500">
                      Pour {COUNTRY_NAMES[selectedCountryCode] || selectedCountryCode} — {propertyTypes.find(p => p.value === formData.propertyType)?.label} :
                      {' '}{requiredDocs.map(d => getDocLabel(d)).join(', ')}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">Vous pourrez les télécharger à l&apos;étape 4</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Description & Features */}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#2C2E2F] mb-1">Description & Caractéristiques</h2>
                  <p className="text-xs text-gray-500">Décrivez votre bien et sélectionnez ses atouts</p>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Titre de l&apos;annonce *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => updateField('title', e.target.value)}
                    placeholder="Ex: Villa Prestige Les Cocotiers"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#003087]"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Description détaillée *</label>
                  <textarea
                    value={formData.description}
                    onChange={e => updateField('description', e.target.value)}
                    placeholder="Décrivez votre bien en détail..."
                    rows={5}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#003087] resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Caractéristiques</label>
                  <div className="flex flex-wrap gap-2">
                    {featuresList.map(feature => (
                      <button
                        key={feature}
                        onClick={() => toggleFeature(feature)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          formData.features.includes(feature)
                            ? 'bg-[#003087] text-white'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {feature}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Photos */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#2C2E2F] mb-1">Photos du bien</h2>
                  <p className="text-xs text-gray-500">Ajoutez jusqu&apos;à 20 photos. La première sera la photo principale.</p>
                </div>

                {/* Drop Zone */}
                <button
                  onClick={addPhoto}
                  disabled={formData.photos.length >= 20}
                  className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[#003087]/30 hover:bg-[#003087]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m-4 4h8m-9 6h14a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-semibold text-gray-600">Glissez-déposez vos photos ici</p>
                  <p className="text-xs text-gray-400 mt-1">ou cliquez pour sélectionner · {formData.photos.length}/20</p>
                </button>

                {/* Photo Grid */}
                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {formData.photos.map((photo, i) => (
                      <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                        <ImageWithFallback src={photo} alt={`Photo ${i + 1}`} className="w-full h-full" fallbackType="property" />
                        {i === 0 && <span className="absolute top-1 left-1 px-2 py-0.5 bg-[#D4AF37] text-white text-[8px] font-bold rounded-full">Principale</span>}
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, idx) => idx !== i) }))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Legal Documents — Using legal-docs.ts */}
            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#2C2E2F] mb-1">Documents légaux requis</h2>
                  <p className="text-xs text-gray-500">
                    {selectedCountryCode && formData.propertyType
                      ? `Documents requis pour ${COUNTRY_NAMES[selectedCountryCode] || selectedCountryName} — ${propertyTypes.find(p => p.value === formData.propertyType)?.label}`
                      : "Sélectionnez d'abord une ville et un type de bien"}
                  </p>
                </div>

                {selectedCountryCode && formData.propertyType ? (
                  <>
                    {/* Required docs list */}
                    <div className="space-y-3">
                      {requiredDocs.map((docType, i) => {
                        const isUploaded = formData.legalDocs.find(d => d.type === docType);
                        const docLabel = getDocLabel(docType);
                        const docDesc = getDocDescription(docType);
                        return (
                          <motion.div
                            key={docType}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`p-4 rounded-2xl border-2 transition-all ${
                              isUploaded ? 'border-[#00A651]/30 bg-[#00A651]/5' : 'border-gray-100'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                isUploaded ? 'bg-[#00A651]/10' : 'bg-gray-100'
                              }`}>
                                {isUploaded ? (
                                  <svg className="w-5 h-5 text-[#00A651]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-[#2C2E2F]">{docLabel}</p>
                                  <span className="px-1.5 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[8px] font-bold rounded-full">REQUIS</span>
                                </div>
                                {docDesc && <p className="text-[10px] text-gray-400 mt-0.5">{docDesc}</p>}
                                <p className="text-[10px] text-gray-400 mt-0.5">PDF, JPG, PNG — max 10 Mo</p>
                                {/* Upload zone */}
                                {!isUploaded ? (
                                  <button
                                    onClick={() => addLegalDoc(docType)}
                                    className="mt-2 px-4 py-2 bg-[#003087] text-white rounded-lg text-xs font-semibold hover:bg-[#0047b3] transition-colors"
                                  >
                                    <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Télécharger le document</span>
                                  </button>
                                ) : (
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-semibold rounded-full">
                                      <span className="flex items-center gap-1"><Hourglass className="w-3 h-3" /> Documents en attente de vérification</span>
                                    </span>
                                    <button
                                      onClick={() => removeLegalDoc(docType)}
                                      className="text-[10px] text-[#D93025] hover:underline"
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Upload progress summary */}
                    <div className={`p-4 rounded-2xl ${
                      allRequiredDocsUploaded ? 'bg-[#00A651]/5' : 'bg-[#D4AF37]/5'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm font-semibold ${
                          allRequiredDocsUploaded ? 'text-[#00A651]' : 'text-[#D4AF37]'
                        }`}>
                          {allRequiredDocsUploaded ? <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Tous les documents requis sont téléchargés</span> : <span className="flex items-center gap-1"><Hourglass className="w-3.5 h-3.5" /> Documents en attente de vérification</span>}
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            allRequiredDocsUploaded ? 'bg-[#00A651]' : 'bg-[#D4AF37]'
                          }`}
                          style={{ width: `${(formData.legalDocs.filter(d => requiredDocs.includes(d.type)).length / Math.max(requiredDocs.length, 1)) * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {formData.legalDocs.filter(d => requiredDocs.includes(d.type)).length} / {requiredDocs.length} documents requis
                      </p>
                    </div>

                    {/* AI Verification Notice */}
                    <div className="p-4 bg-[#009CDE]/5 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-5 h-5 text-[#009CDE]" />
                        <p className="text-sm font-semibold text-[#009CDE]">Vérification IA automatique</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        Après soumission, nos algorithmes vérifieront automatiquement l&apos;authenticité
                        et la conformité de vos documents selon les exigences légales de {COUNTRY_NAMES[selectedCountryCode] || selectedCountryName}.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-8 bg-gray-50 rounded-2xl">
                    <p className="text-sm text-gray-400">Veuillez d&apos;abord sélectionner une ville et un type de bien aux étapes précédentes</p>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="mt-3 px-4 py-2 bg-[#003087] text-white rounded-full text-xs font-semibold"
                    >
                      Retour à l&apos;étape 1
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 5: AI Verification (auto) */}
            {currentStep === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#2C2E2F] mb-1">Vérification IA des documents</h2>
                  <p className="text-xs text-gray-500">Nos algorithmes analysent vos documents en temps réel</p>
                </div>

                {/* Simulated AI verification */}
                <div className="space-y-3">
                  {requiredDocs.map((docType, i) => {
                    const doc = formData.legalDocs.find(d => d.type === docType);
                    const isVerified = doc?.status === 'ai_verified';
                    // Simulate AI verification progress
                    const simulatedScore = 70 + Math.floor(Math.random() * 28);
                    return (
                      <div key={docType} className="p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-[#2C2E2F]">{getDocLabel(docType)}</p>
                          {doc ? (
                            <span className="px-2 py-0.5 bg-[#009CDE]/10 text-[#009CDE] text-[10px] font-semibold rounded-full">
                              {isVerified ? <span className="flex items-center gap-0.5"><Check className="w-3 h-3" /> Vérifié</span> : <span className="flex items-center gap-0.5"><Hourglass className="w-3 h-3" /> En attente</span>}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[10px] rounded-full">Manquant</span>
                          )}
                        </div>
                        {doc && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-[#009CDE] transition-all"
                                style={{ width: `${simulatedScore}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono">{simulatedScore}%</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-[#009CDE]/5 rounded-xl text-xs text-[#009CDE]">
                  <span className="flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5" /> La vérification IA analyse l&apos;authenticité des documents, la cohérence des données,</span>
                  et la conformité avec les exigences légales locales. Une validation humaine suivra.
                </div>
              </motion.div>
            )}

            {/* Step 6: Validation / Review */}
            {currentStep === 6 && (
              <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#2C2E2F] mb-1">Révision & Validation</h2>
                  <p className="text-xs text-gray-500">Vérifiez les informations avant de publier</p>
                </div>

                {/* Error */}
                {submitError && (
                  <div className="p-3 bg-[#D93025]/5 rounded-2xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#D93025]" />
                    <p className="text-xs text-[#D93025]">{submitError}</p>
                  </div>
                )}

                {/* Summary */}
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] text-gray-400 mb-1">Bien</p>
                    <p className="text-sm font-bold text-[#2C2E2F]">{formData.title || 'Sans titre'}</p>
                    <p className="text-xs text-gray-500">
                      {propertyTypes.find(p => p.value === formData.propertyType)?.label} ·
                      {' '}{transactionTypes.find(t => t.value === formData.transactionType)?.label}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-gray-50 rounded-xl text-center">
                      <p className="text-[10px] text-gray-400">Prix</p>
                      <p className="font-mono text-sm font-bold text-[#D4AF37]">{formData.price ? new Intl.NumberFormat('fr-FR').format(Number(formData.price)) : '—'} FCFA</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl text-center">
                      <p className="text-[10px] text-gray-400">Surface</p>
                      <p className="font-mono text-sm font-bold text-[#2C2E2F]">{formData.surface || '—'} m²</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl text-center">
                      <p className="text-[10px] text-gray-400">Localisation</p>
                      <p className="text-sm font-bold text-[#2C2E2F]">{selectedCity?.label || '—'}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[10px] text-gray-400 mb-1">Description</p>
                    <p className="text-xs text-gray-600 line-clamp-3">{formData.description || 'Aucune description'}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.features.map(f => (
                      <span key={f} className="px-2 py-0.5 bg-[#009CDE]/5 text-[#009CDE] rounded-full text-[10px] font-medium">{f}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-400">Photos</p>
                      <p className="text-sm font-bold text-[#2C2E2F]">{formData.photos.length}/20</p>
                    </div>
                    <div className={`p-3 rounded-xl ${allRequiredDocsUploaded ? 'bg-[#00A651]/5' : 'bg-[#D4AF37]/5'}`}>
                      <p className="text-[10px] text-gray-400">Documents légaux</p>
                      <p className={`text-sm font-bold ${allRequiredDocsUploaded ? 'text-[#00A651]' : 'text-[#D4AF37]'}`}>
                        {formData.legalDocs.length} / {requiredDocs.length} requis
                      </p>
                    </div>
                  </div>
                  {/* Legal docs detail */}
                  {selectedCountryCode && (
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-400 mb-2">Documents légaux — {COUNTRY_NAMES[selectedCountryCode] || selectedCountryName}</p>
                      <div className="space-y-1.5">
                        {requiredDocs.map(docType => {
                          const isUploaded = formData.legalDocs.some(d => d.type === docType);
                          return (
                            <div key={docType} className="flex items-center gap-2 text-xs">
                              <span className={isUploaded ? 'text-[#00A651]' : 'text-[#D93025]'}>
                                {isUploaded ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              </span>
                              <span className={isUploaded ? 'text-[#2C2E2F]' : 'text-gray-400'}>{getDocLabel(docType)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Publication Timeline */}
                <div className="p-4 bg-[#003087]/5 rounded-2xl">
                  <p className="text-xs font-semibold text-[#003087] mb-2">Processus après soumission</p>
                  <div className="space-y-2">
                    {[
                      { icon: <Send className="w-4 h-4" />, text: 'Soumission de l\'annonce' },
                      { icon: <Bot className="w-4 h-4" />, text: 'Vérification IA documents' },
                      { icon: <User className="w-4 h-4" />, text: 'Validation humaine' },
                      { icon: <PartyPopper className="w-4 h-4" />, text: 'Publication' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs">{item.icon}</span>
                        <span className="text-xs text-gray-600">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 7: Publication Confirmation */}
            {currentStep === 7 && (
              <motion.div key="step7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center py-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-[#003087]/10 flex items-center justify-center mx-auto mb-4"
                >
                  <svg className="w-10 h-10 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                </motion.div>
                <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-2">Prêt à publier ?</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Votre annonce sera soumise pour vérification IA puis validation humaine avant publication.
                </p>
                {allRequiredDocsUploaded ? (
                  <div className="p-3 bg-[#00A651]/5 rounded-xl mb-4">
                    <p className="text-xs text-[#00A651] font-semibold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Tous les documents légaux requis sont fournis</p>
                  </div>
                ) : (
                  <div className="p-3 bg-[#D4AF37]/5 rounded-xl mb-4">
                    <p className="text-xs text-[#D4AF37] font-semibold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Certains documents requis sont manquants</p>
                    <p className="text-[10px] text-gray-500 mt-1">Vous pouvez quand même soumettre, mais la publication sera retardée</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-5 py-2.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                if (currentStep < 7) setCurrentStep(currentStep + 1);
                else handleSubmit();
              }}
              disabled={!canProceed() || createPropertyMutation.isPending}
              className="flex-1 py-2.5 bg-[#003087] text-white rounded-full font-semibold text-sm hover:bg-[#0047b3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createPropertyMutation.isPending
                ? 'Soumission en cours...'
                : currentStep === 7 ? "Soumettre l'annonce" : 'Continuer'
              }
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}
