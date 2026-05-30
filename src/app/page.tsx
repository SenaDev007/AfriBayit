'use client';

import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Components
import Navbar from '@/components/afribayit/Navbar';
import HeroSection from '@/components/afribayit/HeroSection';
import TrustSection from '@/components/afribayit/TrustSection';
import FeaturedProperties from '@/components/afribayit/FeaturedProperties';
import Footer from '@/components/afribayit/Footer';
import SearchResults from '@/components/afribayit/SearchResults';
import PropertyDetail from '@/components/afribayit/PropertyDetail';
import AuthPages from '@/components/afribayit/AuthPages';
import UserDashboard from '@/components/afribayit/UserDashboard';
import AgentDashboard from '@/components/afribayit/AgentDashboard';
import RebeccaChat from '@/components/afribayit/RebeccaChat';
import EscrowFlow from '@/components/afribayit/EscrowFlow';
import GeoTrustModule from '@/components/afribayit/GeoTrustModule';
import ArtisansMarketplace from '@/components/afribayit/ArtisansMarketplace';
import HospitalityModule from '@/components/afribayit/HospitalityModule';
import AcademyModule from '@/components/afribayit/AcademyModule';
import CommunityModule from '@/components/afribayit/CommunityModule';
import NotificationsCenter from '@/components/afribayit/NotificationsCenter';
import AnalyticsDashboard from '@/components/afribayit/AnalyticsDashboard';
import NotaryModule from '@/components/afribayit/NotaryModule';
import GuesthouseModule from '@/components/afribayit/GuesthouseModule';
import WalletModule from '@/components/afribayit/WalletModule';
import ProfessionalProfileModule from '@/components/afribayit/ProfessionalProfileModule';
import SubscriptionsModule from '@/components/afribayit/SubscriptionsModule';
import PropertyPublishModule from '@/components/afribayit/PropertyPublishModule';

type Section =
  | 'home'
  | 'search'
  | 'search-rent'
  | 'search-invest'
  | 'property'
  | 'dashboard'
  | 'agent-dashboard'
  | 'artisans'
  | 'geotrust'
  | 'escrow'
  | 'hospitality'
  | 'academy'
  | 'community'
  | 'analytics'
  | 'notary'
  | 'guesthouse'
  | 'wallet'
  | 'profile'
  | 'subscriptions'
  | 'publish';

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function AfriBayitApp() {
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRebeccaOpen, setIsRebeccaOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotifications] = useState(3);

  const handleNavigate = useCallback((section: string) => {
    setActiveSection(section as Section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectProperty = useCallback((id: string) => {
    setSelectedPropertyId(id);
    setActiveSection('property');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBackFromProperty = useCallback(() => {
    setActiveSection('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLogin = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setActiveSection('home');
  }, []);

  const getSearchTab = () => {
    if (activeSection === 'search-rent') return 'location';
    if (activeSection === 'search-invest') return 'investissement';
    return 'achat';
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'home':
        return (
          <>
            <HeroSection onNavigate={handleNavigate} onOpenRebecca={() => setIsRebeccaOpen(true)} />
            <TrustSection />
            <FeaturedProperties onSelectProperty={handleSelectProperty} onNavigate={handleNavigate} />
          </>
        );

      case 'search':
      case 'search-rent':
      case 'search-invest':
        return (
          <SearchResults
            initialTab={getSearchTab()}
            onSelectProperty={handleSelectProperty}
          />
        );

      case 'property':
        return selectedPropertyId ? (
          <PropertyDetail
            propertyId={selectedPropertyId}
            onBack={handleBackFromProperty}
            onNavigate={handleNavigate}
          />
        ) : null;

      case 'dashboard':
        return isLoggedIn ? (
          <UserDashboard onNavigate={handleNavigate} onLogout={handleLogout} />
        ) : (
          <div className="min-h-screen pt-20 flex items-center justify-center">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold text-gray-400 mb-4">Connectez-vous</h2>
              <button
                onClick={() => setAuthMode('login')}
                className="px-6 py-3 bg-[#003087] text-white rounded-full text-sm font-semibold"
              >
                Se connecter
              </button>
            </div>
          </div>
        );

      case 'agent-dashboard':
        return isLoggedIn ? (
          <AgentDashboard onLogout={handleLogout} />
        ) : (
          <div className="min-h-screen pt-20 flex items-center justify-center">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold text-gray-400 mb-4">Accès réservé aux agents</h2>
              <button
                onClick={() => setAuthMode('login')}
                className="px-6 py-3 bg-[#003087] text-white rounded-full text-sm font-semibold"
              >
                Se connecter
              </button>
            </div>
          </div>
        );

      case 'artisans':
        return <ArtisansMarketplace onNavigate={handleNavigate} />;

      case 'geotrust':
        return <GeoTrustModule />;

      case 'escrow':
        return <EscrowFlow onNavigate={handleNavigate} />;

      case 'hospitality':
        return <HospitalityModule />;

      case 'academy':
        return <AcademyModule />;

      case 'community':
        return <CommunityModule />;

      case 'analytics':
        return <AnalyticsDashboard />;

      case 'notary':
        return <NotaryModule onNavigate={handleNavigate} />;

      case 'guesthouse':
        return <GuesthouseModule onNavigate={handleNavigate} />;

      case 'wallet':
        return isLoggedIn ? (
          <WalletModule onNavigate={handleNavigate} />
        ) : (
          <div className="min-h-screen pt-20 flex items-center justify-center">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold text-gray-400 mb-4">Connectez-vous</h2>
              <button
                onClick={() => setAuthMode('login')}
                className="px-6 py-3 bg-[#003087] text-white rounded-full text-sm font-semibold"
              >
                Se connecter
              </button>
            </div>
          </div>
        );

      case 'profile':
        return <ProfessionalProfileModule onNavigate={handleNavigate} />;

      case 'subscriptions':
        return <SubscriptionsModule onNavigate={handleNavigate} />;

      case 'publish':
        return isLoggedIn ? (
          <PropertyPublishModule onNavigate={handleNavigate} />
        ) : (
          <div className="min-h-screen pt-20 flex items-center justify-center">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold text-gray-400 mb-4">Réservé aux agents certifiés</h2>
              <button
                onClick={() => setAuthMode('login')}
                className="px-6 py-3 bg-[#003087] text-white rounded-full text-sm font-semibold"
              >
                Se connecter
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onOpenAuth={(mode) => setAuthMode(mode)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        notificationCount={unreadNotifications}
        isLoggedIn={isLoggedIn}
      />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: easeOut }}
          >
            {renderSection()}
          </motion.div>
        </AnimatePresence>
      </main>

      {activeSection === 'home' && <Footer />}

      {/* Auth Modal */}
      {authMode && (
        <AuthPages
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSwitch={(mode) => setAuthMode(mode)}
          onLogin={handleLogin}
        />
      )}

      {/* Rebecca Chat Widget */}
      <RebeccaChat isOpen={isRebeccaOpen} onClose={() => setIsRebeccaOpen(false)} />

      {/* Rebecca FAB Button */}
      {!isRebeccaOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsRebeccaOpen(true)}
          className="fixed bottom-24 sm:bottom-8 right-4 sm:right-6 z-40 w-14 h-14 bg-[#003087] rounded-full flex items-center justify-center shadow-xl navy-shadow hover:shadow-2xl transition-shadow"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D4AF37] rounded-full flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">IA</span>
          </span>
        </motion.button>
      )}

      {/* Notifications Panel */}
      <NotificationsCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
}
