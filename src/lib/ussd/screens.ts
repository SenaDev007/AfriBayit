// AfriBayit — USSD Screen Templates
// Pre-formatted USSD screen text in French
// Compact, text-only format for feature phone display

// ── Formatting Constants ────────────────────────────────────

const SEPARATOR = '---';
const LINE_BREAK = '\n';

// ── Main Menu Screen ────────────────────────────────────────

export function mainMenuScreen(): string {
  return `CON AfriBayit - Immobilier
1. Rechercher un bien
2. Mes réservations
3. Mes propriétés
4. Aide`;
}

// ── Search Screens ──────────────────────────────────────────

export function searchTypeScreen(): string {
  return `CON Type de bien :
1. Villa
2. Appartement
3. Terrain
4. Bureau
5. Commerce
0. Retour`;
}

export function searchCityScreen(country: string, cities: { key: string; label: string }[]): string {
  const cityList = cities.map((c) => `${c.key}. ${c.label}`).join(LINE_BREAK);
  return `CON Ville (${country}) :
${cityList}
0. Retour`;
}

export function searchResultsScreen(
  total: number,
  properties: Array<{
    index: number;
    title: string;
    price: number;
    bedrooms: number;
    city: string;
  }>
): string {
  const items = properties
    .map(
      (p) =>
        `${p.index}. ${p.title}
   ${formatCompactPrice(p.price)} - ${p.bedrooms}chb`
    )
    .join(LINE_BREAK);

  return `CON ${total} bien(s) trouvé(s) :
${items}

Entrez le numéro pour détails
0. Nouvelle recherche`;
}

export function searchEmptyScreen(type: string, city: string): string {
  return `END Aucun bien ${type} trouvé à ${city}.
Réessayez avec d'autres critères.`;
}

export function propertyDetailScreen(property: {
  title: string;
  price: number;
  city: string;
  quartier: string;
  bedrooms: number;
  bathrooms: number;
  surface: number;
  ownerName: string;
  ownerPhone: string | null;
}): string {
  return `END ${property.title}
${property.quartier}, ${property.city}
${formatCompactPrice(property.price)}
${property.bedrooms}chb | ${property.bathrooms}SdB | ${property.surface}m²
${SEPARATOR}
Contact: ${property.ownerName}
${property.ownerPhone || 'afribayit.com'}`;
}

// ── Booking Screens ─────────────────────────────────────────

export function bookingListScreen(
  bookings: Array<{
    index: number;
    hotelName: string;
    checkIn: string;
    checkOut: string;
    status: string;
    totalPrice: number;
  }>
): string {
  const items = bookings
    .map(
      (b) =>
        `${b.index}. ${b.hotelName}
   ${b.checkIn} → ${b.checkOut}
   ${b.status} - ${formatCompactPrice(b.totalPrice)}`
    )
    .join(LINE_BREAK);

  return `CON Mes réservations :
${items}
0. Retour`;
}

export function bookingEmptyScreen(): string {
  return `END Aucune réservation trouvée.
Réservez sur afribayit.com`;
}

export function bookingConfirmationScreen(booking: {
  hotelName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  bookingRef: string;
}): string {
  return `END Réservation confirmée !
${booking.hotelName}
${booking.checkIn} → ${booking.checkOut}
${formatCompactPrice(booking.totalPrice)}
Réf: ${booking.bookingRef}
${SEPARATOR}
Détails: afribayit.com/dashboard`;
}

// ── Property Management Screens ─────────────────────────────

export function propertyListScreen(
  properties: Array<{
    index: number;
    title: string;
    price: number;
    status: string;
  }>
): string {
  const items = properties
    .map(
      (p) =>
        `${p.index}. ${p.title}
   ${formatCompactPrice(p.price)} - ${p.status}`
    )
    .join(LINE_BREAK);

  return `CON Mes biens :
${items}
0. Retour`;
}

export function propertyEmptyScreen(): string {
  return `END Aucun bien publié.
Publiez sur afribayit.com/publish`;
}

// ── Help/FAQ Screen ─────────────────────────────────────────

export function helpScreen(): string {
  return `END AfriBayit - Aide
${SEPARATOR}
USSD : *XXX#
Web : afribayit.com
Tél : +229 90 00 00 00
WhatsApp : +229 90 00 00 00
Email : aide@afribayit.com
${SEPARATOR}
Pays : BJ, CI, BF, TG`;
}

// ── Contact Agent Screens ───────────────────────────────────

export function contactAgentMenu(): string {
  return `CON Contacter un agent :
1. Agent immobilier
2. Géomètre
3. Notaire
0. Retour`;
}

export function agentContactScreen(type: 'agent' | 'geometer' | 'notary'): string {
  const contacts = {
    agent: {
      title: 'Agent Immobilier',
      phone: '+229 90 00 00 00',
      whatsapp: '+229 90 00 00 00',
      web: 'afribayit.com/agents',
    },
    geometer: {
      title: 'Géomètre GeoTrust',
      phone: '+229 90 00 00 01',
      whatsapp: '+229 90 00 00 01',
      web: 'afribayit.com/geotrust',
    },
    notary: {
      title: 'Notaire AfriBayit',
      phone: '+229 90 00 00 02',
      whatsapp: '+229 90 00 00 02',
      web: 'afribayit.com/notaires',
    },
  };

  const contact = contacts[type];
  return `END ${contact.title}
Tél: ${contact.phone}
WhatsApp: ${contact.whatsapp}
Web: ${contact.web}`;
}

// ── Error Screens ───────────────────────────────────────────

export function invalidChoiceScreen(): string {
  return 'END Choix invalide. Merci de réessayer.';
}

export function sessionExpiredScreen(): string {
  return 'END Session expirée. Merci de réessayer.';
}

export function serviceUnavailableScreen(): string {
  return 'END Service temporairement indisponible. Réessayez plus tard.';
}

export function noAccountScreen(): string {
  return `END Aucun compte trouvé.
Connectez-vous sur afribayit.com`;
}

// ── Utility ─────────────────────────────────────────────────

function formatCompactPrice(price: number): string {
  if (price >= 1_000_000) {
    return `${(price / 1_000_000).toFixed(1)}M FCFA`;
  }
  if (price >= 1_000) {
    return `${(price / 1_000).toFixed(0)}K FCFA`;
  }
  return `${price} FCFA`;
}
