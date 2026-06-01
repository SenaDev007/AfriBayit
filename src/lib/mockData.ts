// AfriBayit — Comprehensive Mock Data
// All prices in FCFA (XOF)

export interface Property {
  id: string;
  title: string;
  type: "villa" | "appartement" | "terrain" | "bureau" | "commerce" | "chambre";
  transaction: "achat" | "location" | "investissement";
  price: number;
  priceLabel: string;
  surface: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  country: string;
  quartier: string;
  description: string;
  images: string[];
  verified: boolean;
  geoTrust: boolean;
  premium: boolean;
  features: string[];
  agentId: string;
  lat: number;
  lng: number;
  createdAt: string;
  views: number;
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  company: string;
  city: string;
  country: string;
  certified: boolean;
  rating: number;
  reviews: number;
  listings: number;
  phone: string;
  premium: boolean;
}

export interface Artisan {
  id: string;
  name: string;
  avatar: string;
  trade: string;
  city: string;
  country: string;
  certified: boolean;
  rating: number;
  reviews: number;
  specialties: string[];
  available: boolean;
  emergency: boolean;
  priceRange: string;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  instructor: string;
  rating: number;
  students: number;
  duration: string;
  price: number;
  image: string;
  level: string;
  certificate: boolean;
}

export interface Transaction {
  id: string;
  propertyTitle: string;
  amount: number;
  status: "CREATED" | "FUNDED" | "IN_PROGRESS" | "NOTARY_ASSIGNED" | "DEED_SIGNED" | "RELEASED";
  date: string;
  buyer: string;
  seller: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  kycLevel: number;
  score: number;
  reputation: string;
  city: string;
  country: string;
  walletBalance: number;
  escrowHeld: number;
  pendingPayout: number;
}

export interface Notification {
  id: string;
  type: "transaction" | "message" | "alert" | "system" | "promotion";
  title: string;
  message: string;
  read: boolean;
  date: string;
}

export interface ForumPost {
  id: string;
  title: string;
  author: string;
  avatar: string;
  replies: number;
  views: number;
  category: string;
  lastActivity: string;
}

export interface Hotel {
  id: string;
  name: string;
  city: string;
  country: string;
  stars: number;
  rating: number;
  pricePerNight: number;
  image: string;
  amenities: string[];
  available: boolean;
}

// ============ PROPERTIES ============

export const properties: Property[] = [
  {
    id: "prop-001",
    title: "Villa Prestige Les Cocotiers",
    type: "villa",
    transaction: "achat",
    price: 85000000,
    priceLabel: "85 000 000 FCFA",
    surface: 350,
    rooms: 8,
    bedrooms: 5,
    bathrooms: 4,
    city: "Cotonou",
    country: "Bénin",
    quartier: "Ganhi",
    description: "Magnifique villa de standing avec piscine, jardin tropical et vue sur la lagune. Finitions haut de gamme, cuisine équipée, système de sécurité avancé. Terrain clôturé avec portail motorisé.",
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop"
    ],
    verified: true,
    geoTrust: true,
    premium: true,
    features: ["Piscine", "Jardin", "Climatisation", "Garage 2 voitures", "Alarme", "Vue lagune"],
    agentId: "agent-001",
    lat: 6.3703,
    lng: 2.3912,
    createdAt: "2025-01-15",
    views: 1240
  },
  {
    id: "prop-002",
    title: "Appartement Moderne Plateau",
    type: "appartement",
    transaction: "location",
    price: 350000,
    priceLabel: "350 000 FCFA/mois",
    surface: 120,
    rooms: 4,
    bedrooms: 3,
    bathrooms: 2,
    city: "Abidjan",
    country: "Côte d'Ivoire",
    quartier: "Plateau",
    description: "Bel appartement meublé au cœur du Plateau avec vue panoramique. Résidence sécurisée avec piscine commune et parking souterrain. Idéal pour expatriés et cadres.",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop"
    ],
    verified: true,
    geoTrust: false,
    premium: false,
    features: ["Meublé", "Vue panoramique", "Piscine commune", "Parking", "Sécurité 24/7"],
    agentId: "agent-002",
    lat: 5.3364,
    lng: -4.0267,
    createdAt: "2025-02-20",
    views: 890
  },
  {
    id: "prop-003",
    title: "Terrain Constructible Akodessewa",
    type: "terrain",
    transaction: "achat",
    price: 15000000,
    priceLabel: "15 000 000 FCFA",
    surface: 500,
    rooms: 0,
    bedrooms: 0,
    bathrooms: 0,
    city: "Lomé",
    country: "Togo",
    quartier: "Akodessewa",
    description: "Parcelle viabilisée de 500m² avec titre foncier certifié GeoTrust. Quartier en plein développement, proche des commodités. Idéal pour projet résidentiel.",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop"
    ],
    verified: true,
    geoTrust: true,
    premium: false,
    features: ["Titre foncier", "Viabilisé", "Clôturé", "Proche route goudronnée"],
    agentId: "agent-003",
    lat: 6.1726,
    lng: 1.2314,
    createdAt: "2025-01-28",
    views: 567
  },
  {
    id: "prop-004",
    title: "Villa F2 Ouaga 2000",
    type: "villa",
    transaction: "location",
    price: 250000,
    priceLabel: "250 000 FCFA/mois",
    surface: 180,
    rooms: 5,
    bedrooms: 3,
    bathrooms: 2,
    city: "Ouagadougou",
    country: "Burkina Faso",
    quartier: "Ouaga 2000",
    description: "Villa F2 dans le quartier diplomatique. Salon spacieux, cuisine américaine, jardin arboré. Quartier calme et sécurisé.",
    images: [
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop"
    ],
    verified: true,
    geoTrust: false,
    premium: false,
    features: ["Jardin", "Climatisation", "Garage", "Quartier diplomatique"],
    agentId: "agent-004",
    lat: 12.3209,
    lng: -1.5234,
    createdAt: "2025-03-05",
    views: 445
  },
  {
    id: "prop-005",
    title: "Penthouse Signature Cocody",
    type: "appartement",
    transaction: "achat",
    price: 120000000,
    priceLabel: "120 000 000 FCFA",
    surface: 220,
    rooms: 6,
    bedrooms: 4,
    bathrooms: 3,
    city: "Abidjan",
    country: "Côte d'Ivoire",
    quartier: "Cocody",
    description: "Penthouse d'exception avec terrasse panoramique vue sur la lagune Ébrié. Finitions luxueuses, domotique intégrée, piscine privée sur toiture. Un bien unique.",
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop"
    ],
    verified: true,
    geoTrust: true,
    premium: true,
    features: ["Terrasse panoramique", "Piscine privée", "Domotique", "Vue lagune", "2 parkings", "Concierge"],
    agentId: "agent-002",
    lat: 5.3499,
    lng: -3.9964,
    createdAt: "2025-01-10",
    views: 2100
  },
  {
    id: "prop-006",
    title: "Studio Meublé Fidjrossè",
    type: "chambre",
    transaction: "location",
    price: 120000,
    priceLabel: "120 000 FCFA/mois",
    surface: 45,
    rooms: 2,
    bedrooms: 1,
    bathrooms: 1,
    city: "Cotonou",
    country: "Bénin",
    quartier: "Fidjrossè",
    description: "Studio entièrement meublé et équipé, à 5 min de la plage. Idéal pour séjour professionnel ou étudiant. Connexion fibre optique.",
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop"
    ],
    verified: false,
    geoTrust: false,
    premium: false,
    features: ["Meublé", "Wi-Fi", "Proche plage", "Climatisation"],
    agentId: "agent-001",
    lat: 6.3500,
    lng: 2.3800,
    createdAt: "2025-03-12",
    views: 334
  },
  {
    id: "prop-007",
    title: "Bureau Commercial Haussmann",
    type: "bureau",
    transaction: "location",
    price: 500000,
    priceLabel: "500 000 FCFA/mois",
    surface: 200,
    rooms: 6,
    bedrooms: 0,
    bathrooms: 2,
    city: "Abidjan",
    country: "Côte d'Ivoire",
    quartier: "Plateau",
    description: "Espaces bureaux lumineux en open space + 3 bureaux fermés. Salle de réunion, cuisine partagée. Immeuble de standing avec sécurité.",
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop"
    ],
    verified: true,
    geoTrust: false,
    premium: false,
    features: ["Open space", "Salle réunion", "Climatisation", "Parking", "Sécurité"],
    agentId: "agent-002",
    lat: 5.3399,
    lng: -4.0267,
    createdAt: "2025-02-14",
    views: 678
  },
  {
    id: "prop-008",
    title: "Villa Jardin Kpalimé",
    type: "villa",
    transaction: "achat",
    price: 45000000,
    priceLabel: "45 000 000 FCFA",
    surface: 280,
    rooms: 7,
    bedrooms: 4,
    bathrooms: 3,
    city: "Lomé",
    country: "Togo",
    quartier: "Kpalimé",
    description: "Charmante villa avec jardin tropical au pied des montagnes de Kpalimé. Cadre verdoyant et paisible. Piscine, terrasse couverte, dépendance.",
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop"
    ],
    verified: true,
    geoTrust: true,
    premium: false,
    features: ["Piscine", "Jardin tropical", "Dépendance", "Terrasse couverte", "Vue montagne"],
    agentId: "agent-003",
    lat: 6.1250,
    lng: 0.6000,
    createdAt: "2025-01-22",
    views: 512
  },
  {
    id: "prop-009",
    title: "Commerce Emplacement N°1",
    type: "commerce",
    transaction: "location",
    price: 800000,
    priceLabel: "800 000 FCFA/mois",
    surface: 150,
    rooms: 3,
    bedrooms: 0,
    bathrooms: 1,
    city: "Cotonou",
    country: "Bénin",
    quartier: "Dantokpa",
    description: "Local commercial stratégique face au marché Dantokpa. Forte affluence, idéale pour commerce, restaurant ou showroom. Store front + étage.",
    images: [
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop"
    ],
    verified: true,
    geoTrust: false,
    premium: false,
    features: ["Emplacement stratégique", "Store front", "Étage", "Forte affluence"],
    agentId: "agent-001",
    lat: 6.3620,
    lng: 2.4350,
    createdAt: "2025-03-01",
    views: 890
  },
  {
    id: "prop-010",
    title: "Terrain 1000m² Zone Résidentielle",
    type: "terrain",
    transaction: "achat",
    price: 25000000,
    priceLabel: "25 000 000 FCFA",
    surface: 1000,
    rooms: 0,
    bedrooms: 0,
    bathrooms: 0,
    city: "Porto-Novo",
    country: "Bénin",
    quartier: "Akpakpa",
    description: "Grande parcelle de 1000m² en zone résidentielle calme. Titre foncier GeoTrust certifié. Bornage effectué. Viabilité en cours.",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop"
    ],
    verified: true,
    geoTrust: true,
    premium: false,
    features: ["Titre foncier", "Bornage effectué", "Zone résidentielle", "1000m²"],
    agentId: "agent-001",
    lat: 6.4968,
    lng: 2.6289,
    createdAt: "2025-02-08",
    views: 389
  },
  {
    id: "prop-011",
    title: "Appartement Standing Marcory",
    type: "appartement",
    transaction: "location",
    price: 420000,
    priceLabel: "420 000 FCFA/mois",
    surface: 140,
    rooms: 4,
    bedrooms: 3,
    bathrooms: 2,
    city: "Abidjan",
    country: "Côte d'Ivoire",
    quartier: "Marcory",
    description: "Appartement haut standing dans résidence sécurisée avec piscine. Meublé avec goût, cuisine américaine équipée. Proche zones commerciales.",
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop"
    ],
    verified: true,
    geoTrust: false,
    premium: true,
    features: ["Meublé", "Piscine", "Cuisine équipée", "Résidence sécurisée", "Parking"],
    agentId: "agent-002",
    lat: 5.2980,
    lng: -3.9820,
    createdAt: "2025-02-28",
    views: 756
  },
  {
    id: "prop-012",
    title: "Villa Familiale Zone Résidentielle",
    type: "villa",
    transaction: "achat",
    price: 65000000,
    priceLabel: "65 000 000 FCFA",
    surface: 300,
    rooms: 7,
    bedrooms: 4,
    bathrooms: 3,
    city: "Ouagadougou",
    country: "Burkina Faso",
    quartier: "Zone Résidentielle",
    description: "Belle villa familiale sur parcelle de 400m². Jardin arboré, garage double, dépendance pour personnel. Quartier calme et recherché.",
    images: [
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop"
    ],
    verified: true,
    geoTrust: true,
    premium: false,
    features: ["Jardin", "Garage double", "Dépendance", "Climatisation", "Forage"],
    agentId: "agent-004",
    lat: 12.3500,
    lng: -1.5100,
    createdAt: "2025-01-30",
    views: 623
  }
];

// ============ AGENTS ============

export const agents: Agent[] = [
  {
    id: "agent-001",
    name: "Kofi Mensah",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    company: "AfriBayit Immobilière Bénin",
    city: "Cotonou",
    country: "Bénin",
    certified: true,
    rating: 4.8,
    reviews: 124,
    listings: 38,
    phone: "+229 97 00 00 01",
    premium: true
  },
  {
    id: "agent-002",
    name: "Aminata Diallo",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    company: "AfriBayit Immobilière Côte d'Ivoire",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    certified: true,
    rating: 4.9,
    reviews: 89,
    listings: 52,
    phone: "+225 07 00 00 02",
    premium: true
  },
  {
    id: "agent-003",
    name: "Kodjo Amegah",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    company: "AfriBayit Immobilière Togo",
    city: "Lomé",
    country: "Togo",
    certified: true,
    rating: 4.6,
    reviews: 67,
    listings: 25,
    phone: "+228 90 00 00 03",
    premium: false
  },
  {
    id: "agent-004",
    name: "Ousmane Ouédraogo",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    company: "AfriBayit Immobilière Burkina",
    city: "Ouagadougou",
    country: "Burkina Faso",
    certified: true,
    rating: 4.5,
    reviews: 43,
    listings: 19,
    phone: "+226 70 00 00 04",
    premium: false
  }
];

// ============ ARTISANS ============

export const artisans: Artisan[] = [
  {
    id: "art-001",
    name: "Issouf Karim",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
    trade: "Électricien",
    city: "Cotonou",
    country: "Bénin",
    certified: true,
    rating: 4.9,
    reviews: 89,
    specialties: ["Installation électrique", "Domotique", "Panneaux solaires", "Dépannage urgent"],
    available: true,
    emergency: true,
    priceRange: "5 000 - 150 000 FCFA"
  },
  {
    id: "art-002",
    name: "Marie Bamba",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
    trade: "Architecte d'intérieur",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    certified: true,
    rating: 4.8,
    reviews: 56,
    specialties: ["Design d'intérieur", "Rénovation", "Home staging", "Décoration"],
    available: true,
    emergency: false,
    priceRange: "50 000 - 2 000 000 FCFA"
  },
  {
    id: "art-003",
    name: "Abdou Traoré",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    trade: "Plombier",
    city: "Ouagadougou",
    country: "Burkina Faso",
    certified: true,
    rating: 4.7,
    reviews: 72,
    specialties: ["Plomberie sanitaire", "Chauffe-eau", "Fuite urgente", "Installation"],
    available: true,
    emergency: true,
    priceRange: "3 000 - 200 000 FCFA"
  },
  {
    id: "art-004",
    name: "Essohana Agbéko",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face",
    trade: "Maçon",
    city: "Lomé",
    country: "Togo",
    certified: true,
    rating: 4.6,
    reviews: 94,
    specialties: ["Construction", "Rénovation", "Terrassement", "Fondation"],
    available: false,
    emergency: false,
    priceRange: "10 000 - 5 000 000 FCFA"
  },
  {
    id: "art-005",
    name: "Jean-Claude Aka",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    trade: "Peintre",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    certified: false,
    rating: 4.3,
    reviews: 31,
    specialties: ["Peinture intérieure", "Peinture extérieure", "Ravalement", "Décoration murale"],
    available: true,
    emergency: false,
    priceRange: "5 000 - 500 000 FCFA"
  },
  {
    id: "art-006",
    name: "Rachidou Gado",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    trade: "Menuisier",
    city: "Cotonou",
    country: "Bénin",
    certified: true,
    rating: 4.5,
    reviews: 67,
    specialties: ["Menuiserie bois", "Placards sur mesure", "Portes", "Meubles"],
    available: true,
    emergency: false,
    priceRange: "10 000 - 1 500 000 FCFA"
  }
];

// ============ COURSES ============

export const courses: Course[] = [
  {
    id: "course-001",
    title: "Investir dans l'immobilier en Afrique de l'Ouest",
    category: "Investissement",
    instructor: "Dr. Aimé Goudjo",
    rating: 4.9,
    students: 1240,
    duration: "8h30",
    price: 25000,
    image: "https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=400&h=250&fit=crop",
    level: "Intermédiaire",
    certificate: true
  },
  {
    id: "course-002",
    title: "Devenir Agent Immobilier Certifié",
    category: "Certification",
    instructor: "Maître Kofi Asante",
    rating: 4.8,
    students: 890,
    duration: "12h00",
    price: 45000,
    image: "https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=250&fit=crop",
    level: "Débutant",
    certificate: true
  },
  {
    id: "course-003",
    title: "Droit Foncier Africain : Comprendre les Titres",
    category: "Juridique",
    instructor: "Me. Aminata Sanou",
    rating: 4.7,
    students: 650,
    duration: "6h00",
    price: 20000,
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=250&fit=crop",
    level: "Avancé",
    certificate: true
  },
  {
    id: "course-004",
    title: "Estimation Immobilière : Méthodes et Pratiques",
    category: "Technique",
    instructor: "Eng. Pascal Dossou",
    rating: 4.6,
    students: 430,
    duration: "5h30",
    price: 15000,
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop",
    level: "Intermédiaire",
    certificate: false
  },
  {
    id: "course-005",
    title: "Construction Durable en Afrique Tropicale",
    category: "Construction",
    instructor: "Arch. Fatou Diop",
    rating: 4.8,
    students: 780,
    duration: "10h00",
    price: 35000,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=250&fit=crop",
    level: "Intermédiaire",
    certificate: true
  },
  {
    id: "course-006",
    title: "Négociation Immobilière : Les Secrets des Pros",
    category: "Business",
    instructor: "M. Yacouba Konaté",
    rating: 4.5,
    students: 320,
    duration: "4h00",
    price: 10000,
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=250&fit=crop",
    level: "Débutant",
    certificate: false
  }
];

// ============ TRANSACTIONS ============

export const transactions: Transaction[] = [
  {
    id: "txn-001",
    propertyTitle: "Villa Prestige Les Cocotiers",
    amount: 85000000,
    status: "RELEASED",
    date: "2025-01-20",
    buyer: "M. Kouassi Jean",
    seller: "Mme. Dossou Marie"
  },
  {
    id: "txn-002",
    propertyTitle: "Appartement Standing Marcory",
    amount: 420000,
    status: "IN_PROGRESS",
    date: "2025-03-01",
    buyer: "M. Touré Ahmed",
    seller: "SCI Les Palmiers"
  },
  {
    id: "txn-003",
    propertyTitle: "Terrain Constructible Akodessewa",
    amount: 15000000,
    status: "NOTARY_ASSIGNED",
    date: "2025-02-15",
    buyer: "Mme. Lawson Afi",
    seller: "Famille Amegah"
  },
  {
    id: "txn-004",
    propertyTitle: "Penthouse Signature Cocody",
    amount: 120000000,
    status: "FUNDED",
    date: "2025-03-10",
    buyer: "Société InvestAfrik",
    seller: "Groupe Immobilier CI"
  }
];

// ============ USER PROFILE ============

export const currentUser: UserProfile = {
  id: "user-001",
  name: "Kouamé Jean-Marc",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  email: "jeanmarc@email.com",
  phone: "+225 07 12 34 56",
  kycLevel: 2,
  score: 87,
  reputation: "Acteur",
  city: "Abidjan",
  country: "Côte d'Ivoire",
  walletBalance: 2450000,
  escrowHeld: 15000000,
  pendingPayout: 850000
};

// ============ NOTIFICATIONS ============

export const notifications: Notification[] = [
  {
    id: "notif-001",
    type: "transaction",
    title: "Paiement Escrow validé",
    message: "Le paiement de 15 000 000 FCFA pour le terrain d'Akodessewa a été validé et placé en escrow.",
    read: false,
    date: "2025-03-12T14:30:00"
  },
  {
    id: "notif-002",
    type: "message",
    title: "Nouveau message de Aminata",
    message: "Bonjour, j'ai une question concernant la visite prévue demain...",
    read: false,
    date: "2025-03-12T10:15:00"
  },
  {
    id: "notif-003",
    type: "alert",
    title: "KYC Level 2 atteint !",
    message: "Félicitations ! Votre profil a été mis à jour vers le niveau KYC Avancé.",
    read: true,
    date: "2025-03-11T09:00:00"
  },
  {
    id: "notif-004",
    type: "system",
    title: "Mise à jour plateforme",
    message: "Nouvelle fonctionnalité : Rebecca AI peut maintenant analyser les tendances du marché.",
    read: true,
    date: "2025-03-10T16:00:00"
  },
  {
    id: "notif-005",
    type: "promotion",
    title: "Offre Premium -30%",
    message: "Passez au plan Pro Essentiel à 10 500 FCFA/mois au lieu de 15 000 FCFA. Offre limitée !",
    read: false,
    date: "2025-03-09T08:00:00"
  }
];

// ============ FORUM POSTS ============

export const forumPosts: ForumPost[] = [
  {
    id: "post-001",
    title: "Comment vérifier un titre foncier au Bénin ?",
    author: "Kofi_Mensah",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
    replies: 23,
    views: 456,
    category: "Juridique",
    lastActivity: "il y a 2h"
  },
  {
    id: "post-002",
    title: "Meilleurs quartiers pour investir à Abidjan en 2025",
    author: "Aminata_D",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop&crop=face",
    replies: 45,
    views: 1203,
    category: "Investissement",
    lastActivity: "il y a 30min"
  },
  {
    id: "post-003",
    title: "Escrow AfriBayit : retour d'expérience",
    author: "Ousmane_O",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face",
    replies: 18,
    views: 389,
    category: "Transactions",
    lastActivity: "il y a 5h"
  },
  {
    id: "post-004",
    title: "Construction écologique : matériaux locaux",
    author: "Fatou_Diop",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=50&h=50&fit=crop&crop=face",
    replies: 31,
    views: 678,
    category: "Construction",
    lastActivity: "il y a 1h"
  }
];

// ============ HOTELS ============

export const hotels: Hotel[] = [
  {
    id: "hotel-001",
    name: "Hôtel du Lac Palace",
    city: "Cotonou",
    country: "Bénin",
    stars: 5,
    rating: 4.8,
    pricePerNight: 85000,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop",
    amenities: ["Piscine", "Spa", "Restaurant", "Wi-Fi", "Parking", "Gym"],
    available: true
  },
  {
    id: "hotel-002",
    name: "Résidence Cocody Suites",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    stars: 4,
    rating: 4.6,
    pricePerNight: 55000,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=250&fit=crop",
    amenities: ["Piscine", "Restaurant", "Wi-Fi", "Parking"],
    available: true
  },
  {
    id: "hotel-003",
    name: "Hôtel Sarakawa",
    city: "Lomé",
    country: "Togo",
    stars: 4,
    rating: 4.4,
    pricePerNight: 45000,
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=250&fit=crop",
    amenities: ["Piscine", "Restaurant", "Plage", "Wi-Fi"],
    available: true
  },
  {
    id: "hotel-004",
    name: "Bravia Hotel Ouaga",
    city: "Ouagadougou",
    country: "Burkina Faso",
    stars: 4,
    rating: 4.3,
    pricePerNight: 38000,
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=250&fit=crop",
    amenities: ["Piscine", "Restaurant", "Wi-Fi", "Gym"],
    available: false
  }
];

// ============ COUNTRIES & CITIES ============

export const countries = [
  { code: "BJ", name: "Bénin", cities: ["Cotonou", "Porto-Novo", "Parakou", "Ouidah"] },
  { code: "CI", name: "Côte d'Ivoire", cities: ["Abidjan", "Yamoussoukro", "Bouaké", "San-Pédro"] },
  { code: "BF", name: "Burkina Faso", cities: ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora"] },
  { code: "TG", name: "Togo", cities: ["Lomé", "Sokodé", "Kara", "Kpalimé"] }
];

// ============ ESCROW STATES ============

export const escrowStates = [
  { key: "CREATED", label: "Créé", icon: "📋", description: "Transaction initiée" },
  { key: "FUNDED", label: "Financé", icon: "💰", description: "Fonds reçus en escrow" },
  { key: "IN_PROGRESS", label: "En cours", icon: "🔄", description: "Processus en cours" },
  { key: "NOTARY_ASSIGNED", label: "Notaire assigné", icon: "⚖️", description: "Notaire désigné" },
  { key: "DEED_SIGNED", label: "Acte signé", icon: "📝", description: "Acte de vente signé" },
  { key: "RELEASED", label: "Libéré", icon: "✅", description: "Fonds libérés au vendeur" }
];

// ============ KYC LEVELS ============

export const kycLevels = [
  { level: 0, name: "Anonyme", color: "#6b7280", maxActions: "Consultation uniquement", icon: "👤" },
  { level: 1, name: "Standard", color: "#009CDE", maxActions: "Contacts limités, pas de transaction", icon: "🆔" },
  { level: 2, name: "Avancé", color: "#00A651", maxActions: "Transactions, escrow, publications", icon: "✅" },
  { level: 3, name: "Pro", color: "#D4AF37", maxActions: "Accès complet, API, outils pro", icon: "👑" }
];

// ============ PREMIUM TIERS ============

export const premiumTiers = [
  {
    name: "Starter",
    price: 0,
    priceLabel: "Gratuit",
    features: ["3 annonces actives", "Photos limitées (5)", "Support email", "Profil basique"],
    highlighted: false
  },
  {
    name: "Pro Essentiel",
    price: 15000,
    priceLabel: "15 000 FCFA/mois",
    features: ["15 annonces actives", "Photos illimitées", "Badge Pro", "Statistiques", "Support prioritaire", "Rebecca IA basique"],
    highlighted: true
  },
  {
    name: "Pro Avancé",
    price: 35000,
    priceLabel: "35 000 FCFA/mois",
    features: ["50 annonces actives", "Photos illimitées + Vidéo", "Badge Premium Or", "CRM intégré", "Rebecca IA avancée", "Mise en avant", "Rapports hebdomadaires"],
    highlighted: false
  },
  {
    name: "Pro Elite",
    price: 75000,
    priceLabel: "75 000 FCFA/mois",
    features: ["Annonces illimitées", "Tout Pro Avancé +", "Badge Elite Diamant", "Rebecca IA complète", "API Access", "Compte dédié", "Formation mensuelle", "Partenariats exclusifs"],
    highlighted: false
  }
];

// ============ REPUTATION LEVELS ============

export const reputationLevels = [
  { name: "Découvreur", min: 0, max: 100, color: "#6b7280", icon: "🌱" },
  { name: "Acteur", min: 100, max: 300, color: "#009CDE", icon: "⭐" },
  { name: "Expert", min: 300, max: 600, color: "#00A651", icon: "🏆" },
  { name: "Ambassadeur", min: 600, max: Infinity, color: "#D4AF37", icon: "👑" }
];

// ============ GEOMETER SERVICES ============

export const geometerServices = [
  { id: "geo-1", name: "Vérification superficie", price: "50 000 FCFA", icon: "📐", description: "Mesure précise de la superficie réelle du terrain" },
  { id: "geo-2", name: "Inspection terrain", price: "75 000 FCFA", icon: "🔍", description: "Inspection complète : limites, servitudes, risques" },
  { id: "geo-3", name: "Bornage", price: "120 000 FCFA", icon: "📍", description: "Bornage officiel avec pose de bornes" },
  { id: "geo-4", name: "Drone mapping", price: "200 000 FCFA", icon: "🚁", description: "Cartographie aérienne haute résolution" },
  { id: "geo-5", name: "Certificat GeoTrust", price: "30 000 FCFA", icon: "✅", description: "Certificat de conformité géométrique" },
  { id: "geo-6", name: "Topographie complète", price: "350 000 FCFA", icon: "🗺️", description: "Étude topographique complète avec plan" }
];

// ============ HELPER FUNCTIONS ============

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    villa: "Villa",
    appartement: "Appartement",
    terrain: "Terrain",
    bureau: "Bureau",
    commerce: "Commerce",
    chambre: "Studio/Chambre"
  };
  return labels[type] || type;
}

export function getTransactionLabel(t: string): string {
  const labels: Record<string, string> = {
    achat: "À vendre",
    location: "À louer",
    investissement: "Investissement"
  };
  return labels[t] || t;
}
