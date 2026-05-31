'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DisputeResolution from '@/components/afribayit/DisputeResolution';
import EscrowDashboard from '@/components/afribayit/EscrowDashboard';
import EnhancedSearchResults from '@/components/afribayit/EnhancedSearchResults';
import NotaryModule from '@/components/afribayit/NotaryModule';
import {
  ShieldAlert, Lock, Search, Scale,
  Globe, BadgeCheck, Star, ChevronRight,
  Shield, Gavel, FileText, Bot, Fingerprint, SlidersHorizontal
} from 'lucide-react';

type FeatureTab = 'dispute' | 'escrow' | 'search' | 'notary';

const FEATURE_TABS: { key: FeatureTab; label: string; icon: React.ReactNode; description: string; color: string; cdc: string }[] = [
  { key: 'dispute', label: 'Résolution Litiges', icon: <ShieldAlert className="w-5 h-5" />, description: 'Arbitrage 6 étapes CDC 7B.3.3', color: '#D93025', cdc: '7B.3.3' },
  { key: 'escrow', label: 'Escrow Dashboard', icon: <Lock className="w-5 h-5" />, description: 'Machine à 12 états CDC 7B.3-7B.5', color: '#003087', cdc: '7B.3-7B.5' },
  { key: 'search', label: 'Recherche Avancée', icon: <Search className="w-5 h-5" />, description: '25+ filtres CDC 5.1.1', color: '#009CDE', cdc: '5.1.1' },
  { key: 'notary', label: 'Module Notarial', icon: <Scale className="w-5 h-5" />, description: 'Espace Notaire CDC 5.0bis', color: '#D4AF37', cdc: '5.0bis' },
];

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState<FeatureTab>('dispute');

  const easeOut = [0.16, 1, 0.3, 1] as const;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header Section */}
      <section className="relative bg-gradient-to-br from-[#003087] via-[#0047b3] to-[#009CDE] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#D4AF37] rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-[#009CDE] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm font-semibold mb-6">
              <Globe className="w-4 h-4" /> AfriBayit — CDC Critical Gaps Demo
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Modules <span className="text-[#D4AF37]">CDC</span> Renforcés
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto text-lg mb-8">
              Résolution de litiges, Escrow 12 états, Recherche avancée 25+ filtres, et Module notarial complet.
            </p>
          </motion.div>

          {/* Feature Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {FEATURE_TABS.map((tab, i) => (
              <motion.button
                key={tab.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, ease: easeOut }}
                onClick={() => setActiveFeature(tab.key)}
                className={`p-4 rounded-2xl text-center transition-all ${
                  activeFeature === tab.key
                    ? 'bg-white text-[#003087] shadow-xl scale-[1.02]'
                    : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
                }`}
              >
                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2 ${
                  activeFeature === tab.key ? 'bg-[#003087]/10' : 'bg-white/10'
                }`}>{tab.icon}</span>
                <p className="text-sm font-bold">{tab.label}</p>
                <p className={`text-[10px] ${activeFeature === tab.key ? 'text-gray-500' : 'text-white/60'}`}>{tab.description}</p>
                <span className={`inline-flex items-center gap-0.5 mt-1 text-[9px] px-1.5 py-0.5 rounded-full ${
                  activeFeature === tab.key ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-white/10 text-white/50'
                }`}>
                  CDC {tab.cdc}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-gray-50 py-4 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {[
              { label: '6-Step Arbitration', icon: <Gavel className="w-3.5 h-3.5" /> },
              { label: '12-State Machine', icon: <Shield className="w-3.5 h-3.5" /> },
              { label: '25+ Filters', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
              { label: 'AI Deed Drafting', icon: <Bot className="w-3.5 h-3.5" /> },
              { label: 'Crypto Log', icon: <Fingerprint className="w-3.5 h-3.5" /> },
              { label: '2FA Release', icon: <Lock className="w-3.5 h-3.5" /> },
              { label: 'E-Signature', icon: <FileText className="w-3.5 h-3.5" /> },
              { label: 'Voice Search', icon: <Search className="w-3.5 h-3.5" /> },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border shadow-sm shrink-0">
                <span className="text-[#003087]">{item.icon}</span>
                <span className="text-[10px] font-medium text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Content */}
      <main className="flex-1">
        {activeFeature === 'dispute' && (
          <div className="py-8">
            <DisputeResolution
              disputeId="disp_demo_001"
              transactionRef="TXN-2025-001"
              amount={15000000}
              buyerName="Amadou Diallo"
              sellerName="Marie Koffi"
              currentStep={3}
              isAdmin={true}
            />
          </div>
        )}
        {activeFeature === 'escrow' && (
          <EscrowDashboard
            transactionId="txn_demo_001"
            userRole="admin"
          />
        )}
        {activeFeature === 'search' && (
          <EnhancedSearchResults
            onSelectProperty={(id) => console.log('Selected property:', id)}
          />
        )}
        {activeFeature === 'notary' && (
          <NotaryModule />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#003087] text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-[#D4AF37]" />
            <span className="font-display text-lg font-bold">AfriBayit</span>
          </div>
          <p className="text-white/50 text-sm mb-4">
            Plateforme Immobiliere Pan-Africaine de Nouvelle Generation
          </p>
          <div className="flex items-center justify-center gap-4">
            <span className="inline-flex items-center gap-1 text-[10px] text-[#D4AF37]">
              <BadgeCheck className="w-3 h-3" /> CDC V3.1 Compliant
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-white/40">
              <Star className="w-3 h-3" /> v2.0
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
