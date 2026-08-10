// AfriBayit — USSD State Machine Engine
// Session-based menu navigation for Africa's Talking USSD
// French text, targeting West African markets (BJ, CI, BF, TG)

import { db } from '@/lib/db';

// ── Types ───────────────────────────────────────────────────

interface UssdSession {
  sessionId: string;
  phoneNumber: string;
  serviceCode: string;
  level: number;
  currentMenu: UssdMenu;
  history: UssdMenu[];
  data: Record<string, string>;
  createdAt: Date;
  lastActivityAt: Date;
}

type UssdMenu =
  | 'main'
  | 'search_type'
  | 'search_city'
  | 'search_results'
  | 'search_detail'
  | 'my_bookings'
  | 'booking_detail'
  | 'my_properties'
  | 'property_detail'
  | 'help'
  | 'contact_agent';

interface UssdMenuResult {
  text: string;
  shouldContinue: boolean;
  nextMenu?: UssdMenu;
}

// ── Session Store ───────────────────────────────────────────

const SESSION_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

// In-memory session store (production: use Redis via @/lib/cache/redis)
const sessions = new Map<string, UssdSession>();

function getSession(sessionId: string): UssdSession | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;
  // Check timeout
  if (Date.now() - session.lastActivityAt.getTime() > SESSION_TIMEOUT_MS) {
    sessions.delete(sessionId);
    return undefined;
  }
  return session;
}

function createSession(
  sessionId: string,
  phoneNumber: string,
  serviceCode: string
): UssdSession {
  const session: UssdSession = {
    sessionId,
    phoneNumber,
    serviceCode,
    level: 0,
    currentMenu: 'main',
    history: [],
    data: {},
    createdAt: new Date(),
    lastActivityAt: new Date(),
  };
  sessions.set(sessionId, session);
  return session;
}

function updateSession(
  session: UssdSession,
  nextMenu: UssdMenu,
  data?: Record<string, string>
): void {
  session.history.push(session.currentMenu);
  session.currentMenu = nextMenu;
  session.level += 1;
  session.lastActivityAt = new Date();
  if (data) {
    session.data = { ...session.data, ...data };
  }
}

// ── Country Detection ───────────────────────────────────────

function detectCountry(phoneNumber: string): string {
  const cleaned = phoneNumber.replace('+', '');
  if (cleaned.startsWith('229')) return 'BJ';
  if (cleaned.startsWith('225')) return 'CI';
  if (cleaned.startsWith('226')) return 'BF';
  if (cleaned.startsWith('228')) return 'TG';
  if (cleaned.startsWith('221')) return 'SN';
  return 'BJ'; // default to Bénin
}

// ── Cities by Country ───────────────────────────────────────

const CITIES: Record<string, { key: string; label: string; value: string }[]> = {
  BJ: [
    { key: '1', label: 'Cotonou', value: 'Cotonou' },
    { key: '2', label: 'Porto-Novo', value: 'Porto-Novo' },
    { key: '3', label: 'Parakou', value: 'Parakou' },
    { key: '4', label: 'Abomey-Calavi', value: 'Abomey-Calavi' },
  ],
  CI: [
    { key: '1', label: 'Abidjan', value: 'Abidjan' },
    { key: '2', label: 'Yamoussoukro', value: 'Yamoussoukro' },
    { key: '3', label: 'Bouaké', value: 'Bouaké' },
    { key: '4', label: 'San-Pédro', value: 'San-Pédro' },
  ],
  BF: [
    { key: '1', label: 'Ouagadougou', value: 'Ouagadougou' },
    { key: '2', label: 'Bobo-Dioulasso', value: 'Bobo-Dioulasso' },
    { key: '3', label: 'Koudougou', value: 'Koudougou' },
  ],
  TG: [
    { key: '1', label: 'Lomé', value: 'Lomé' },
    { key: '2', label: 'Sokodé', value: 'Sokodé' },
    { key: '3', label: 'Kara', value: 'Kara' },
  ],
};

// ── Property Types ──────────────────────────────────────────

const PROPERTY_TYPES = [
  { key: '1', label: 'Villa', value: 'villa' },
  { key: '2', label: 'Appartement', value: 'appartement' },
  { key: '3', label: 'Terrain', value: 'terrain' },
  { key: '4', label: 'Bureau', value: 'bureau' },
  { key: '5', label: 'Commerce', value: 'commerce' },
];

// ── Main USSD Handler ───────────────────────────────────────

/**
 * Main USSD handler for Africa's Talking callback.
 * Implements a state machine with session management.
 */
export async function handleUSSD(
  sessionId: string,
  serviceCode: string,
  phoneNumber: string,
  text: string
): Promise<{ response: string; responseType: 'CON' | 'END' }> {
  // Get or create session
  let session = getSession(sessionId);
  if (!session) {
    session = createSession(sessionId, phoneNumber, serviceCode);
  }

  // Parse user input (Africa's Talking sends full navigation path)
  const parts = text ? text.split('*') : [];
  const currentInput = parts.length > 0 ? parts[parts.length - 1] : '';
  const country = detectCountry(phoneNumber);

  // Initial request (empty text)
  if (!text) {
    const result = renderMenu('main', session, country);
    return formatResponse(result);
  }

  // Navigate based on current menu + user input
  const result = await navigateMenu(session, currentInput, parts, country);
  return formatResponse(result);
}

// ── Menu Navigation ─────────────────────────────────────────

async function navigateMenu(
  session: UssdSession,
  currentInput: string,
  parts: string[],
  country: string
): Promise<UssdMenuResult> {
  // Handle global "0" = Back
  if (currentInput === '0' && session.currentMenu !== 'main') {
    const previousMenu = session.history.pop() || 'main';
    session.currentMenu = previousMenu;
    session.level = Math.max(0, session.level - 1);
    return renderMenu(previousMenu, session, country);
  }

  // Handle based on current menu
  switch (session.currentMenu) {
    case 'main':
      return handleMainMenu(session, currentInput, country);

    case 'search_type':
      return handleSearchType(session, currentInput, country);

    case 'search_city':
      return handleSearchCity(session, currentInput, country);

    case 'search_results':
      return handleSearchResults(session, currentInput, country);

    case 'my_bookings':
      return handleMyBookings(session, currentInput, country);

    case 'my_properties':
      return handleMyProperties(session, currentInput, country);

    case 'help':
      return renderMenu('help', session, country);

    case 'contact_agent':
      return handleContactAgent(session, currentInput, country);

    default:
      return {
        text: 'Option invalide. Merci de réessayer.',
        shouldContinue: false,
      };
  }
}

// ── Menu Handlers ───────────────────────────────────────────

function handleMainMenu(
  session: UssdSession,
  input: string,
  country: string
): UssdMenuResult {
  switch (input) {
    case '1': // Search
      updateSession(session, 'search_type');
      return renderMenu('search_type', session, country);

    case '2': // My Bookings
      updateSession(session, 'my_bookings');
      return renderMenu('my_bookings', session, country);

    case '3': // My Properties
      updateSession(session, 'my_properties');
      return renderMenu('my_properties', session, country);

    case '4': // Help
      updateSession(session, 'help');
      return renderMenu('help', session, country);

    default:
      return {
        text: 'Choix invalide. Merci de réessayer.',
        shouldContinue: false,
      };
  }
}

function handleSearchType(
  session: UssdSession,
  input: string,
  country: string
): UssdMenuResult {
  const typeEntry = PROPERTY_TYPES.find((t) => t.key === input);
  if (!typeEntry) {
    return {
      text: 'Type invalide. Merci de réessayer.',
      shouldContinue: false,
    };
  }

  updateSession(session, 'search_city', { propertyType: typeEntry.value });
  return renderMenu('search_city', session, country);
}

function handleSearchCity(
  session: UssdSession,
  input: string,
  country: string
): UssdMenuResult {
  const cities = CITIES[country] || CITIES.BJ;
  const cityEntry = cities.find((c) => c.key === input);
  if (!cityEntry) {
    return {
      text: 'Ville invalide. Merci de réessayer.',
      shouldContinue: false,
    };
  }

  updateSession(session, 'search_results', {
    propertyType: session.data.propertyType,
    city: cityEntry.value,
  });

  return renderMenu('search_results', session, country);
}

async function handleSearchResults(
  session: UssdSession,
  input: string,
  country: string
): Promise<UssdMenuResult> {
  try {
    const { propertyType, city } = session.data;

    const properties = await db.property.findMany({
      where: {
        type: propertyType,
        city,
        country,
        status: 'published',
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { name: true, phone: true } },
      },
    });

    if (properties.length === 0) {
      return {
        text: `Aucun bien ${propertyType} trouvé à ${city}.\nRéessayez avec d'autres critères.`,
        shouldContinue: false,
      };
    }

    const selected = parseInt(input);
    if (isNaN(selected) || selected < 1 || selected > properties.length) {
      // Show results list
      const results = properties
        .map(
          (p, i) =>
            `${i + 1}. ${p.title}\n   ${formatPrice(p.price)} - ${p.bedrooms}chb`
        )
        .join('\n');

      return {
        text: `${properties.length} bien(s) trouvé(s) :\n${results}\n\nEntrez le numéro pour détails\n0. Retour`,
        shouldContinue: true,
        nextMenu: 'search_results',
      };
    }

    // Show property detail
    const property = properties[selected - 1];
    updateSession(session, 'search_detail', {
      propertyId: property.id,
    });

    return {
      text: formatPropertyDetail(property),
      shouldContinue: false,
    };
  } catch {
    return {
      text: 'Erreur de recherche. Réessayez plus tard.',
      shouldContinue: false,
    };
  }
}

async function handleMyBookings(
  session: UssdSession,
  _input: string,
  _country: string
): Promise<UssdMenuResult> {
  try {
    // Find user by phone number
    const phone = session.phoneNumber.replace('+', '');
    const user = await db.user.findFirst({
      where: { phone: { contains: phone.slice(-8) } },
    });

    if (!user) {
      return {
        text: 'Aucun compte trouvé pour ce numéro.\nConnectez-vous sur afribayit.com',
        shouldContinue: false,
      };
    }

    const bookings = await db.hotelBooking.findMany({
      where: { userId: user.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { hotel: { select: { name: true } } },
    });

    if (bookings.length === 0) {
      return {
        text: 'Aucune réservation trouvée.\nRéservez sur afribayit.com',
        shouldContinue: false,
      };
    }

    const list = bookings
      .map(
        (b, i) =>
          `${i + 1}. ${b.hotel.name}\n   ${formatDate(b.checkIn)} → ${formatDate(b.checkOut)}\n   ${b.status} - ${formatPrice(b.totalPrice)}`
      )
      .join('\n');

    return {
      text: `Mes réservations :\n${list}\n0. Retour`,
      shouldContinue: true,
    };
  } catch {
    return {
      text: 'Erreur. Réessayez plus tard.',
      shouldContinue: false,
    };
  }
}

async function handleMyProperties(
  session: UssdSession,
  _input: string,
  country: string
): Promise<UssdMenuResult> {
  try {
    const phone = session.phoneNumber.replace('+', '');
    const user = await db.user.findFirst({
      where: { phone: { contains: phone.slice(-8) } },
    });

    if (!user) {
      return {
        text: 'Aucun compte trouvé.\nConnectez-vous sur afribayit.com',
        shouldContinue: false,
      };
    }

    const properties = await db.property.findMany({
      where: { agentId: user.id, country },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    if (properties.length === 0) {
      return {
        text: 'Aucun bien publié.\nPubliez sur afribayit.com',
        shouldContinue: false,
      };
    }

    const list = properties
      .map(
        (p, i) =>
          `${i + 1}. ${p.title}\n   ${formatPrice(p.price)} - ${p.status}`
      )
      .join('\n');

    return {
      text: `Mes biens :\n${list}\n0. Retour`,
      shouldContinue: true,
    };
  } catch {
    return {
      text: 'Erreur. Réessayez plus tard.',
      shouldContinue: false,
    };
  }
}

function handleContactAgent(
  session: UssdSession,
  input: string,
  _country: string
): UssdMenuResult {
  switch (input) {
    case '1':
      return {
        text: 'Agent Immobilier\nTél: +229 90 00 00 00\nWhatsApp: +229 90 00 00 00\nWeb: afribayit.com/agents',
        shouldContinue: false,
      };
    case '2':
      return {
        text: 'Géomètre GeoTrust\nTél: +229 90 00 00 01\nWeb: afribayit.com/geotrust',
        shouldContinue: false,
      };
    case '3':
      return {
        text: 'Notaire AfriBayit\nTél: +229 90 00 00 02\nWeb: afribayit.com/notaires',
        shouldContinue: false,
      };
    default:
      return {
        text: 'Choix invalide.',
        shouldContinue: false,
      };
  }
}

// ── Menu Renderers ──────────────────────────────────────────

function renderMenu(
  menu: UssdMenu,
  session: UssdSession,
  country: string
): UssdMenuResult {
  switch (menu) {
    case 'main':
      return {
        text: `AfriBayit - Immobilier Pan-Africain\n1. Rechercher un bien\n2. Mes réservations\n3. Mes propriétés\n4. Aide`,
        shouldContinue: true,
      };

    case 'search_type':
      return {
        text: `Type de bien :\n1. Villa\n2. Appartement\n3. Terrain\n4. Bureau\n5. Commerce\n0. Retour`,
        shouldContinue: true,
      };

    case 'search_city': {
      const cities = CITIES[country] || CITIES.BJ;
      const cityList = cities.map((c) => `${c.key}. ${c.label}`).join('\n');
      return {
        text: `Ville (${country}) :\n${cityList}\n0. Retour`,
        shouldContinue: true,
      };
    }

    case 'my_bookings':
      return {
        text: 'Chargement de vos réservations...',
        shouldContinue: true,
      };

    case 'my_properties':
      return {
        text: 'Chargement de vos propriétés...',
        shouldContinue: true,
      };

    case 'help':
      return {
        text: `AfriBayit - Aide\nUSSD : *XXX#\nWeb : afribayit.com\nTél : +229 90 00 00 00\nWhatsApp : +229 90 00 00 00\n\n0. Retour`,
        shouldContinue: true,
      };

    case 'contact_agent':
      return {
        text: 'Contacter un agent :\n1. Agent immobilier\n2. Géomètre\n3. Notaire\n0. Retour',
        shouldContinue: true,
      };

    default:
      return {
        text: 'Menu non disponible.',
        shouldContinue: false,
      };
  }
}

// ── Response Formatting ─────────────────────────────────────

function formatResponse(result: UssdMenuResult): {
  response: string;
  responseType: 'CON' | 'END';
} {
  return {
    response: `${result.shouldContinue ? 'CON' : 'END'} ${result.text}`,
    responseType: result.shouldContinue ? 'CON' : 'END',
  };
}

// ── Utility Functions ───────────────────────────────────────

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });
}

function formatPropertyDetail(property: {
  title: string;
  price: number;
  city: string;
  quartier: string;
  bedrooms: number;
  bathrooms: number;
  surface: number;
  owner: { name: string; phone: string | null };
}): string {
  return `${property.title}
${property.quartier}, ${property.city}
${formatPrice(property.price)}
${property.bedrooms} chb | ${property.bathrooms} SdB | ${property.surface}m²
---
Contact: ${property.owner.name}
${property.owner.phone || 'Voir sur afribayit.com'}`;
}

// ── Session Cleanup (called periodically) ───────────────────

export function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [key, session] of sessions.entries()) {
    if (now - session.lastActivityAt.getTime() > SESSION_TIMEOUT_MS) {
      sessions.delete(key);
    }
  }
}
