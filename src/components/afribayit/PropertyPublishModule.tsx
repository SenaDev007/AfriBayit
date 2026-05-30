'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateProperty } from '@/hooks/useProperties';

interface ModuleProps {
  onNavigate?: (section: string) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

// Static config — property types
const propertyTypes = [
  { value: 'villa', label: 'Villa', icon: '🏡' },
  { value: 'appartement', label: 'Appartement', icon: '🏢' },
  { value: 'terrain', label: 'Terrain', icon: '🗺️' },
  { value: 'bureau', label: 'Bureau', icon: '🏛️' },
  { value: 'commerce', label: 'Commerce', icon: '🏪' },
  { value: 'chambre', label: 'Studio/Chambre', icon: '🛏️' },
];

// Static config — transaction types
const transactionTypes = [
  { value: 'achat', label: 'À vendre', icon: '💰' },
  { value: 'location', label: 'À louer', icon: '🔑' },
  { value: 'investissement', label: 'Investissement', icon: '📈' },
];

// Static config — cities
const cities = [
  { value: 'cotonou', label: 'Cotonou', country: 'Bénin' },
  { value: 'abidjan', label: 'Abidjan', country: "Côte d'Ivoire" },
  { value: 'lome', label: 'Lomé', country: 'Togo' },
  { value: 'ouagadougou', label: 'Ouagadougou', country: 'Burkina Faso' },
  { value: 'porto-novo', label: 'Porto-Novo', country: 'Bénin' },
  { value: 'yamoussoukro', label: 'Yamoussoukro', country: "Côte d'Ivoire" },
];

// Static config — features list
const featuresList = [
  'Piscine', 'Jardin', 'Climatisation', 'Garage', 'Alarme', 'Wi-Fi',
  'Meublé', 'Vue panoramique', 'Parking', 'Sécurité 24/7',
  'Cuisine équipée', 'Terrasse', 'Balcon', 'Forage', 'Dépendance',
];

// Static config — legal docs by country
const legalDocsByCountry: Record<string, { value: string; label: string; required: boolean }[]> = {
  'Bénin': [
    { value: 'titre_foncier', label: 'Titre Foncier', required: true },
    { value: 'acd', label: 'ACD (Arrêté de Concession Définitive)', required: false },
    { value: 'permis_construire', label: 'Permis de Construire', required: false },
    { value: 'certificat_urbanisme', label: "Certificat d'Urbanisme", required: false },
  ],
  "Côte d'Ivoire": [
    { value: 'titre_foncier', label: 'Titre Foncier', required: true },
    { value: 'jugement_hommologation', label: "Jugement d'Homologation", required: false },
    { value: 'permis_construire', label: 'Permis de Construire', required: false },
    { value: 'certificat_conformite', label: 'Certificat de Conformité', required: false },
  ],
  'Togo': [
    { value: 'titre_foncier', label: 'Titre Foncier', required: true },
    { value: 'convention_bail', label: 'Convention de Bail', required: false },
    { value: 'permis_construire', label: 'Permis de Construire', required: false },
  ],
  'Burkina Faso': [
    { value: 'titre_foncier', label: 'Titre Foncier', required: true },
    { value: 'acf', label: 'ACF (Arrêté de Concession Foncière)', required: false },
    { value: 'permis_construire', label: 'Permis de Construire', required: false },
    { value: 'plan_parcellaire', label: 'Plan Parcellaire', required: false },
  ],
};

// Static config — publish steps
const publishSteps = [
  { step: 1, title: 'Informations', desc: 'Type, prix, surface, localisation', icon: '📋' },
  { step: 2, title: 'Description', desc: 'Texte et caractéristiques', icon: '✍️' },
  { step: 3, title: 'Photos', desc: "Jusqu'à 20 photos", icon: '📸' },
  { step: 4, title: 'Documents', desc: 'Titres et documents légaux', icon: '📄' },
  { step: 5, title: 'Validation', desc: 'Révision et soumission', icon: '✅' },
];

// Static config — validation status
const validationStatus = [
  { step: 'Soumission', status: 'completed', date: '12 Mar 2025 14:30' },
  { step: 'Vérification IA documents', status: 'in_progress', date: '' },
  { step: 'Validation humaine', status: 'pending', date: '' },
  { step: 'Publication', status: 'pending', date: '' },
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
  legalDocs: { type: string; file: string }[];
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
  const selectedCountry = selectedCity?.country || '';
  const legalDocs = legalDocsByCountry[selectedCountry] || [];

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
    const mockUrl = `https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&q=${Math.random()}`;
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.length < 20 ? [...prev.photos, mockUrl] : prev.photos,
    }));
  }, []);

  const addLegalDoc = useCallback((docType: string) => {
    setFormData(prev => ({
      ...prev,
      legalDocs: prev.legalDocs.find(d => d.type === docType)
        ? prev.legalDocs
        : [...prev.legalDocs, { type: docType, file: 'uploaded' }],
    }));
  }, []);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: return !!(formData.propertyType && formData.transactionType && formData.price && formData.surface && formData.city);
      case 2: return !!(formData.title && formData.description);
      case 3: return formData.photos.length > 0;
      case 4: return formData.legalDocs.length > 0;
      case 5: return true;
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
        country: selectedCountry,
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
              Votre bien est en cours de vérification. Vous serez notifié une fois publié.
            </p>

            {/* Validation Timeline */}
            <div className="text-left space-y-3 mb-6">
              {validationStatus.map((vs, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                    vs.status === 'completed' ? 'bg-[#00A651] text-white' :
                    vs.status === 'in_progress' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {vs.status === 'completed' ? '✓' : vs.status === 'in_progress' ? '⏳' : (i + 1)}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${vs.status === 'pending' ? 'text-gray-400' : 'text-[#2C2E2F]'}`}>{vs.step}</p>
                    {vs.date && <p className="text-[10px] text-gray-400">{vs.date}</p>}
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
            📝 Publier un bien — CDC §5.0
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2C2E2F] mb-2">
            Nouvelle <span className="text-[#003087]">Annonce</span>
          </h1>
        </motion.div>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-8">
          {publishSteps.map((s, i) => (
            <div key={s.step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  currentStep > s.step ? 'bg-[#00A651] text-white' :
                  currentStep === s.step ? 'bg-[#003087] text-white' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {currentStep > s.step ? '✓' : s.step}
                </div>
                <p className={`text-[9px] font-medium mt-1 text-center ${
                  currentStep >= s.step ? 'text-[#003087]' : 'text-gray-400'
                }`}>
                  {s.title}
                </p>
              </div>
              {i < publishSteps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 rounded ${
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
                        <span className="text-xl block mb-1">{pt.icon}</span>
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
                        <span className="text-lg block mb-1">{tt.icon}</span>
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
                        <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
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

            {/* Step 4: Legal Documents */}
            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#2C2E2F] mb-1">Documents légaux</h2>
                  <p className="text-xs text-gray-500">
                    {selectedCountry
                      ? `Documents requis pour ${selectedCountry}`
                      : "Sélectionnez d'abord une ville pour voir les documents requis"}
                  </p>
                </div>

                {selectedCountry ? (
                  <div className="space-y-3">
                    {legalDocs.map(doc => {
                      const isUploaded = formData.legalDocs.find(d => d.type === doc.value);
                      return (
                        <div key={doc.value} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isUploaded ? 'bg-[#00A651]/10' : 'bg-gray-100'
                            }`}>
                              <span className="text-sm">{isUploaded ? '✅' : '📄'}</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#2C2E2F]">{doc.label}</p>
                              <p className="text-[10px] text-gray-400">
                                {doc.required ? 'Obligatoire' : 'Recommandé'} · PDF, JPG, PNG (max 10 Mo)
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => addLegalDoc(doc.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                              isUploaded ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-[#003087] text-white hover:bg-[#0047b3]'
                            }`}
                          >
                            {isUploaded ? '✓ Ajouté' : 'Ajouter'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-gray-50 rounded-2xl">
                    <p className="text-sm text-gray-400">Veuillez d&apos;abord sélectionner une ville à l&apos;étape 1</p>
                  </div>
                )}

                {/* AI Verification Status */}
                <div className="p-4 bg-[#009CDE]/5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🤖</span>
                    <p className="text-sm font-semibold text-[#009CDE]">Vérification IA automatique</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Nos algorithmes vérifieront automatiquement l&apos;authenticité de vos documents après soumission.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 5: Review & Submit */}
            {currentStep === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#2C2E2F] mb-1">Révision & Soumission</h2>
                  <p className="text-xs text-gray-500">Vérifiez les informations avant de publier</p>
                </div>

                {/* Error */}
                {submitError && (
                  <div className="p-3 bg-[#D93025]/5 rounded-2xl flex items-center gap-2">
                    <span className="text-sm">⚠️</span>
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
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-400">Documents légaux</p>
                      <p className="text-sm font-bold text-[#2C2E2F]">{formData.legalDocs.length} fichier(s)</p>
                    </div>
                  </div>
                </div>

                {/* Publication Timeline */}
                <div className="p-4 bg-[#003087]/5 rounded-2xl">
                  <p className="text-xs font-semibold text-[#003087] mb-2">Processus après soumission</p>
                  <div className="space-y-2">
                    {validationStatus.map((vs, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs">{vs.step === 'Vérification IA documents' ? '🤖' : vs.step === 'Validation humaine' ? '👤' : vs.step === 'Soumission' ? '📤' : '🎉'}</span>
                        <span className="text-xs text-gray-600">{vs.step}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
                if (currentStep < 5) setCurrentStep(currentStep + 1);
                else handleSubmit();
              }}
              disabled={!canProceed() || createPropertyMutation.isPending}
              className="flex-1 py-2.5 bg-[#003087] text-white rounded-full font-semibold text-sm hover:bg-[#0047b3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createPropertyMutation.isPending
                ? 'Soumission en cours...'
                : currentStep === 5 ? "Soumettre l'annonce" : 'Continuer'
              }
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}
