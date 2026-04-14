'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

type Language = 'fr' | 'en' | 'ar' | 'pt' | 'es'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, options?: any) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation resources
const resources = {
  fr: {
    translation: {
      // Navigation
      'nav.home': 'Accueil',
      'nav.properties': 'Propriétés',
      'nav.hotels': 'Hôtels',
      'nav.learning': 'Formation',
      'nav.community': 'Communauté',
      'nav.about': 'À propos',
      'nav.contact': 'Contact',
      'nav.login': 'Connexion',
      'nav.register': 'S\'inscrire',
      'nav.dashboard': 'Tableau de bord',
      'nav.profile': 'Profil',
      'nav.logout': 'Déconnexion',
      
      // Hero Section
      'hero.title': 'Découvrez Votre Prochaine Propriété en Afrique',
      'hero.subtitle': 'La plateforme immobilière la plus avancée d\'Afrique avec IA, visites virtuelles et écosystème complet',
      'hero.search.placeholder': 'Rechercher par ville, quartier, type de propriété...',
      'hero.search.button': 'Rechercher',
      'hero.stats.properties': 'Propriétés',
      'hero.stats.users': 'Utilisateurs',
      'hero.stats.countries': 'Pays',
      'hero.stats.transactions': 'Transactions',
      
      // Search
      'search.title': 'Recherche Intelligente',
      'search.subtitle': 'Trouvez la propriété parfaite avec notre IA avancée',
      'search.filters.type': 'Type de propriété',
      'search.filters.price': 'Prix',
      'search.filters.location': 'Localisation',
      'search.filters.features': 'Caractéristiques',
      'search.results.found': 'propriétés trouvées',
      'search.results.sort': 'Trier par',
      
      // Properties
      'property.featured': 'Propriétés en vedette',
      'property.view': 'Voir la propriété',
      'property.favorite': 'Ajouter aux favoris',
      'property.share': 'Partager',
      'property.contact': 'Contacter',
      'property.price': 'Prix',
      'property.surface': 'Surface',
      'property.bedrooms': 'Chambres',
      'property.bathrooms': 'Salles de bain',
      'property.parking': 'Parking',
      
      // Services
      'services.title': 'Nos Services',
      'services.subtitle': 'Un écosystème complet pour tous vos besoins immobiliers',
      'services.property.title': 'Recherche de Propriétés',
      'services.property.description': 'IA avancée, visites virtuelles 360°, et recommandations personnalisées',
      'services.hotel.title': 'Réservation Hôtelière',
      'services.hotel.description': 'Hôtels de luxe et hébergements locaux avec réservation instantanée',
      'services.learning.title': 'Académie Immobilière',
      'services.learning.description': 'Formations certifiantes et conseils d\'experts pour investir intelligemment',
      'services.community.title': 'Communauté',
      'services.community.description': 'Réseau d\'experts, forums et événements de networking',
      
      // Testimonials
      'testimonials.title': 'Ce que disent nos clients',
      'testimonials.subtitle': 'Découvrez les témoignages de nos utilisateurs satisfaits',
      
      // Newsletter
      'newsletter.title': 'Restez informé',
      'newsletter.subtitle': 'Recevez les dernières actualités et opportunités immobilières',
      'newsletter.placeholder': 'Votre adresse email',
      'newsletter.button': 'S\'abonner',
      
      // Footer
      'footer.description': 'La plateforme immobilière révolutionnaire qui transforme l\'expérience d\'achat et de location en Afrique.',
      'footer.quick.links': 'Liens rapides',
      'footer.services': 'Services',
      'footer.support': 'Support',
      'footer.legal': 'Légal',
      'footer.social': 'Suivez-nous',
      'footer.copyright': '© 2025 AfriBayit. Tous droits réservés.',
      
      // Common
      'common.loading': 'Chargement...',
      'common.error': 'Une erreur est survenue',
      'common.success': 'Succès',
      'common.cancel': 'Annuler',
      'common.save': 'Enregistrer',
      'common.edit': 'Modifier',
      'common.delete': 'Supprimer',
      'common.view': 'Voir',
      'common.close': 'Fermer',
      'common.next': 'Suivant',
      'common.previous': 'Précédent',
      'common.more': 'En savoir plus',
      'common.learn.more': 'Découvrir',
    }
  },
  en: {
    translation: {
      // Navigation
      'nav.home': 'Home',
      'nav.properties': 'Properties',
      'nav.hotels': 'Hotels',
      'nav.learning': 'Learning',
      'nav.community': 'Community',
      'nav.about': 'About',
      'nav.contact': 'Contact',
      'nav.login': 'Login',
      'nav.register': 'Register',
      'nav.dashboard': 'Dashboard',
      'nav.profile': 'Profile',
      'nav.logout': 'Logout',
      
      // Hero Section
      'hero.title': 'Discover Your Next Property in Africa',
      'hero.subtitle': 'The most advanced real estate platform in Africa with AI, virtual tours and complete ecosystem',
      'hero.search.placeholder': 'Search by city, neighborhood, property type...',
      'hero.search.button': 'Search',
      'hero.stats.properties': 'Properties',
      'hero.stats.users': 'Users',
      'hero.stats.countries': 'Countries',
      'hero.stats.transactions': 'Transactions',
      
      // Search
      'search.title': 'Smart Search',
      'search.subtitle': 'Find the perfect property with our advanced AI',
      'search.filters.type': 'Property type',
      'search.filters.price': 'Price',
      'search.filters.location': 'Location',
      'search.filters.features': 'Features',
      'search.results.found': 'properties found',
      'search.results.sort': 'Sort by',
      
      // Properties
      'property.featured': 'Featured Properties',
      'property.view': 'View Property',
      'property.favorite': 'Add to Favorites',
      'property.share': 'Share',
      'property.contact': 'Contact',
      'property.price': 'Price',
      'property.surface': 'Surface',
      'property.bedrooms': 'Bedrooms',
      'property.bathrooms': 'Bathrooms',
      'property.parking': 'Parking',
      
      // Services
      'services.title': 'Our Services',
      'services.subtitle': 'A complete ecosystem for all your real estate needs',
      'services.property.title': 'Property Search',
      'services.property.description': 'Advanced AI, 360° virtual tours, and personalized recommendations',
      'services.hotel.title': 'Hotel Booking',
      'services.hotel.description': 'Luxury hotels and local accommodations with instant booking',
      'services.learning.title': 'Real Estate Academy',
      'services.learning.description': 'Certifying training and expert advice to invest smartly',
      'services.community.title': 'Community',
      'services.community.description': 'Expert network, forums and networking events',
      
      // Testimonials
      'testimonials.title': 'What our clients say',
      'testimonials.subtitle': 'Discover testimonials from our satisfied users',
      
      // Newsletter
      'newsletter.title': 'Stay informed',
      'newsletter.subtitle': 'Receive the latest real estate news and opportunities',
      'newsletter.placeholder': 'Your email address',
      'newsletter.button': 'Subscribe',
      
      // Footer
      'footer.description': 'The revolutionary real estate platform that transforms the buying and renting experience in Africa.',
      'footer.quick.links': 'Quick links',
      'footer.services': 'Services',
      'footer.support': 'Support',
      'footer.legal': 'Legal',
      'footer.social': 'Follow us',
      'footer.copyright': '© 2025 AfriBayit. All rights reserved.',
      
      // Common
      'common.loading': 'Loading...',
      'common.error': 'An error occurred',
      'common.success': 'Success',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
      'common.edit': 'Edit',
      'common.delete': 'Delete',
      'common.view': 'View',
      'common.close': 'Close',
      'common.next': 'Next',
      'common.previous': 'Previous',
      'common.more': 'More',
      'common.learn.more': 'Learn more',
    }
  },
  ar: {
    translation: {
      // Navigation
      'nav.home': 'الرئيسية',
      'nav.properties': 'العقارات',
      'nav.hotels': 'الفنادق',
      'nav.learning': 'التعليم',
      'nav.community': 'المجتمع',
      'nav.about': 'حولنا',
      'nav.contact': 'اتصل بنا',
      'nav.login': 'تسجيل الدخول',
      'nav.register': 'إنشاء حساب',
      'nav.dashboard': 'لوحة التحكم',
      'nav.profile': 'الملف الشخصي',
      'nav.logout': 'تسجيل الخروج',
      
      // Hero Section
      'hero.title': 'اكتشف عقارك القادم في أفريقيا',
      'hero.subtitle': 'منصة العقارات الأكثر تطوراً في أفريقيا مع الذكاء الاصطناعي والجولات الافتراضية',
      'hero.search.placeholder': 'البحث بالمدينة، الحي، نوع العقار...',
      'hero.search.button': 'بحث',
      'hero.stats.properties': 'عقارات',
      'hero.stats.users': 'مستخدمين',
      'hero.stats.countries': 'دول',
      'hero.stats.transactions': 'معاملات',
      
      // Common
      'common.loading': 'جاري التحميل...',
      'common.error': 'حدث خطأ',
      'common.success': 'نجح',
      'common.cancel': 'إلغاء',
      'common.save': 'حفظ',
      'common.edit': 'تعديل',
      'common.delete': 'حذف',
      'common.view': 'عرض',
      'common.close': 'إغلاق',
      'common.next': 'التالي',
      'common.previous': 'السابق',
      'common.more': 'المزيد',
      'common.learn.more': 'تعلم المزيد',
    }
  },
  pt: {
    translation: {
      // Navigation
      'nav.home': 'Início',
      'nav.properties': 'Propriedades',
      'nav.hotels': 'Hotéis',
      'nav.learning': 'Aprendizado',
      'nav.community': 'Comunidade',
      'nav.about': 'Sobre',
      'nav.contact': 'Contato',
      'nav.login': 'Entrar',
      'nav.register': 'Registrar',
      'nav.dashboard': 'Painel',
      'nav.profile': 'Perfil',
      'nav.logout': 'Sair',
      
      // Hero Section
      'hero.title': 'Descubra Sua Próxima Propriedade na África',
      'hero.subtitle': 'A plataforma imobiliária mais avançada da África com IA, tours virtuais e ecossistema completo',
      'hero.search.placeholder': 'Pesquisar por cidade, bairro, tipo de propriedade...',
      'hero.search.button': 'Pesquisar',
      'hero.stats.properties': 'Propriedades',
      'hero.stats.users': 'Usuários',
      'hero.stats.countries': 'Países',
      'hero.stats.transactions': 'Transações',
      
      // Common
      'common.loading': 'Carregando...',
      'common.error': 'Ocorreu um erro',
      'common.success': 'Sucesso',
      'common.cancel': 'Cancelar',
      'common.save': 'Salvar',
      'common.edit': 'Editar',
      'common.delete': 'Excluir',
      'common.view': 'Ver',
      'common.close': 'Fechar',
      'common.next': 'Próximo',
      'common.previous': 'Anterior',
      'common.more': 'Mais',
      'common.learn.more': 'Saiba mais',
    }
  },
  es: {
    translation: {
      // Navigation
      'nav.home': 'Inicio',
      'nav.properties': 'Propiedades',
      'nav.hotels': 'Hoteles',
      'nav.learning': 'Aprendizaje',
      'nav.community': 'Comunidad',
      'nav.about': 'Acerca de',
      'nav.contact': 'Contacto',
      'nav.login': 'Iniciar sesión',
      'nav.register': 'Registrarse',
      'nav.dashboard': 'Panel',
      'nav.profile': 'Perfil',
      'nav.logout': 'Cerrar sesión',
      
      // Hero Section
      'hero.title': 'Descubre Tu Próxima Propiedad en África',
      'hero.subtitle': 'La plataforma inmobiliaria más avanzada de África con IA, tours virtuales y ecosistema completo',
      'hero.search.placeholder': 'Buscar por ciudad, barrio, tipo de propiedad...',
      'hero.search.button': 'Buscar',
      'hero.stats.properties': 'Propiedades',
      'hero.stats.users': 'Usuarios',
      'hero.stats.countries': 'Países',
      'hero.stats.transactions': 'Transacciones',
      
      // Common
      'common.loading': 'Cargando...',
      'common.error': 'Ocurrió un error',
      'common.success': 'Éxito',
      'common.cancel': 'Cancelar',
      'common.save': 'Guardar',
      'common.edit': 'Editar',
      'common.delete': 'Eliminar',
      'common.view': 'Ver',
      'common.close': 'Cerrar',
      'common.next': 'Siguiente',
      'common.previous': 'Anterior',
      'common.more': 'Más',
      'common.learn.more': 'Saber más',
    }
  }
}

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr',
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
  })

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('fr')

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage) {
      setLanguage(savedLanguage)
      i18n.changeLanguage(savedLanguage)
    }
  }, [])

  const handleSetLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage)
    i18n.changeLanguage(newLanguage)
    localStorage.setItem('language', newLanguage)
  }

  const t = (key: string, options?: any) => {
    return i18n.t(key, options)
  }

  const value: LanguageContextType = {
    language,
    setLanguage: handleSetLanguage,
    t,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
