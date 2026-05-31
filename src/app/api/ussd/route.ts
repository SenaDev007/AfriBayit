import { NextResponse } from 'next/server';
import { Phone } from 'lucide-react';

/**
 * AfriBayit — USSD Handler for Africa's Talking
 * Supports session-based menu navigation for feature phones
 * All text in French — targeting West African markets (BJ, CI, BF, TG)
 */

interface UssdSession {
  sessionId: string;
  phoneNumber: string;
  serviceCode: string;
  currentMenu: string;
  history: string[];
  data: Record<string, string>;
  createdAt: Date;
}

// In-memory session store (production: use Redis)
const sessions = new Map<string, UssdSession>();

// Session timeout: 3 minutes
const SESSION_TIMEOUT_MS = 3 * 60 * 1000;

function getSession(sessionId: string): UssdSession | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;
  // Check timeout
  if (Date.now() - session.createdAt.getTime() > SESSION_TIMEOUT_MS) {
    sessions.delete(sessionId);
    return undefined;
  }
  return session;
}

function createSession(sessionId: string, phoneNumber: string, serviceCode: string): UssdSession {
  const session: UssdSession = {
    sessionId,
    phoneNumber,
    serviceCode,
    currentMenu: 'main',
    history: [],
    data: {},
    createdAt: new Date(),
  };
  sessions.set(sessionId, session);
  return session;
}

// Property types for search
const PROPERTY_TYPES = [
  { key: '1', label: 'Villa', value: 'villa' },
  { key: '2', label: 'Appartement', value: 'appartement' },
  { key: '3', label: 'Terrain', value: 'terrain' },
  { key: '4', label: 'Bureau', value: 'bureau' },
  { key: '5', label: 'Commerce', value: 'commerce' },
];

// Cities by country
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

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

// Detect country from phone number prefix
function detectCountry(phoneNumber: string): string {
  const cleaned = phoneNumber.replace('+', '');
  if (cleaned.startsWith('229')) return 'BJ';
  if (cleaned.startsWith('225')) return 'CI';
  if (cleaned.startsWith('226')) return 'BF';
  if (cleaned.startsWith('228')) return 'TG';
  return 'BJ'; // default
}

// Main menu
function getMainMenu(): string {
  return `CON AfriBayit - Immobilier Pan-Africain
1. Rechercher un bien
2. Contacter un agent
3. Mon compte`;
}

// Search menu — property type selection
function getSearchTypeMenu(country: string): string {
  return `CON Type de bien :
1. Villa
2. Appartement
3. Terrain
4. Bureau
5. Commerce
0. Retour`;
}

// Search menu — city selection
function getSearchCityMenu(country: string): string {
  const cities = CITIES[country] || CITIES.BJ;
  const cityList = cities.map(c => `${c.key}. ${c.label}`).join('\n');
  return `CON Ville (${country}) :\n${cityList}\n0. Retour`;
}

// Search results (mock — in production, query the database)
async function getSearchResults(type: string, city: string): Promise<string> {
  try {
    const { db } = await import('@/lib/db');
    const properties = await db.property.findMany({
      where: {
        type,
        city,
        status: 'published',
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { name: true, phone: true },
        },
      },
    });

    if (properties.length === 0) {
      return `END Aucun bien trouvé pour ce critère.
Réessayez avec d'autres filtres.`;
    }

    const results = properties.map((p, i) => {
      return `${i + 1}. ${p.title}
   ${formatPrice(p.price)} - ${p.rooms}ch/${p.bedrooms}chb`;
    }).join('\n');

    return `CON ${properties.length} bien(s) trouvé(s) :
${results}
0. Nouvelle recherche`;
  } catch {
    // Fallback demo data
    return `CON Résultats de recherche :
1. Villa moderne - ${city}
   25 000 000 FCFA - 3ch/2chb
2. Appartement standing
   15 000 000 FCFA - 2ch/1chb
0. Nouvelle recherche`;
  }
}

// Agent contact menu
function getAgentContactMenu(): string {
  return `CON Contacter un agent :
1. Agent immobilier
2. Géomètre
3. Notaire
0. Retour`;
}

// Account menu
function getAccountMenu(phoneNumber: string): string {
  const country = detectCountry(phoneNumber);
  return `CON Mon compte AfriBayit
Pays : ${country}
Tel : ${phoneNumber}
---
1. Mes favoris
2. Mes recherches
3. Aide
0. Retour`;
}

// Help text
function getHelpText(): string {
  return `END AfriBayit - Aide
USSD : *XXX# 
Web : afribayit.com
Tel : +229 90 00 00 00
WhatsApp : +229 90 00 00 00`;
}

// POST handler for Africa's Talking USSD
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const sessionId = formData.get('sessionId') as string || '';
    const serviceCode = formData.get('serviceCode') as string || '';
    const phoneNumber = formData.get('phoneNumber') as string || '';
    const text = formData.get('text') as string || '';

    // Get or create session
    let session = getSession(sessionId);
    if (!session) {
      session = createSession(sessionId, phoneNumber, serviceCode);
    }

    const country = detectCountry(phoneNumber);

    // Parse user input from text (Africa's Talking sends full path)
    const parts = text ? text.split('*') : [];
    const currentInput = parts.length > 0 ? parts[parts.length - 1] : '';

    // Handle empty text (initial request)
    if (!text) {
      return new NextResponse(getMainMenu(), {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Navigate based on input path
    const depth = parts.length;

    // Main menu selection
    if (depth === 1) {
      switch (currentInput) {
        case '1':
          // Search — show type menu
          session.currentMenu = 'search_type';
          session.data = {};
          return new NextResponse(getSearchTypeMenu(country), {
            headers: { 'Content-Type': 'text/plain' },
          });
        case '2':
          // Contact agent
          session.currentMenu = 'agent_contact';
          return new NextResponse(getAgentContactMenu(), {
            headers: { 'Content-Type': 'text/plain' },
          });
        case '3':
          // Account
          session.currentMenu = 'account';
          return new NextResponse(getAccountMenu(phoneNumber), {
            headers: { 'Content-Type': 'text/plain' },
          });
        default:
          return new NextResponse(`END Choix invalide. Merci de réessayer.`, {
            headers: { 'Content-Type': 'text/plain' },
          });
      }
    }

    // Depth 2+: sub-menu navigation
    const mainChoice = parts[0];

    // ---- SEARCH FLOW ----
    if (mainChoice === '1') {
      if (depth === 2) {
        // Property type selected
        if (currentInput === '0') {
          return new NextResponse(getMainMenu(), {
            headers: { 'Content-Type': 'text/plain' },
          });
        }
        const typeEntry = PROPERTY_TYPES.find(t => t.key === currentInput);
        if (!typeEntry) {
          return new NextResponse(`END Type invalide. Merci de réessayer.`, {
            headers: { 'Content-Type': 'text/plain' },
          });
        }
        session.data.propertyType = typeEntry.value;
        session.currentMenu = 'search_city';
        return new NextResponse(getSearchCityMenu(country), {
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      if (depth === 3) {
        // City selected — show results
        if (currentInput === '0') {
          session.currentMenu = 'search_type';
          return new NextResponse(getSearchTypeMenu(country), {
            headers: { 'Content-Type': 'text/plain' },
          });
        }
        const cities = CITIES[country] || CITIES.BJ;
        const cityEntry = cities.find(c => c.key === currentInput);
        if (!cityEntry) {
          return new NextResponse(`END Ville invalide. Merci de réessayer.`, {
            headers: { 'Content-Type': 'text/plain' },
          });
        }

        const results = await getSearchResults(session.data.propertyType || 'villa', cityEntry.value);
        return new NextResponse(results, {
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      if (depth === 4 && currentInput === '0') {
        // New search
        session.currentMenu = 'search_type';
        session.data = {};
        return new NextResponse(getSearchTypeMenu(country), {
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      return new NextResponse(`END Option invalide.`, {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // ---- AGENT CONTACT FLOW ----
    if (mainChoice === '2') {
      if (depth === 2) {
        if (currentInput === '0') {
          return new NextResponse(getMainMenu(), {
            headers: { 'Content-Type': 'text/plain' },
          });
        }
        switch (currentInput) {
          case '1':
            return new NextResponse(`END Agent Immobilier
Contactez-nous :
<Phone className="w-4 h-4" /> +229 90 00 00 00
WhatsApp : +229 90 00 00 00
Web : afribayit.com/agents`, {
              headers: { 'Content-Type': 'text/plain' },
            });
          case '2':
            return new NextResponse(`END Géomètre AfriBayit
GeoTrust - Certification foncière
<Phone className="w-4 h-4" /> +229 90 00 00 01
Web : afribayit.com/geotrust`, {
              headers: { 'Content-Type': 'text/plain' },
            });
          case '3':
            return new NextResponse(`END Notaire AfriBayit
Service juridique immobilier
<Phone className="w-4 h-4" /> +229 90 00 00 02
Web : afribayit.com/notaires`, {
              headers: { 'Content-Type': 'text/plain' },
            });
          default:
            return new NextResponse(`END Choix invalide.`, {
              headers: { 'Content-Type': 'text/plain' },
            });
        }
      }
    }

    // ---- ACCOUNT FLOW ----
    if (mainChoice === '3') {
      if (depth === 2) {
        if (currentInput === '0') {
          return new NextResponse(getMainMenu(), {
            headers: { 'Content-Type': 'text/plain' },
          });
        }
        switch (currentInput) {
          case '1':
            return new NextResponse(`END Vos favoris
Connectez-vous sur afribayit.com pour voir vos biens favoris.
<Phone className="w-4 h-4" /> +229 90 00 00 00`, {
              headers: { 'Content-Type': 'text/plain' },
            });
          case '2':
            return new NextResponse(`END Vos recherches
Retrouvez l'historique sur afribayit.com
<Phone className="w-4 h-4" /> +229 90 00 00 00`, {
              headers: { 'Content-Type': 'text/plain' },
            });
          case '3':
            return new NextResponse(getHelpText(), {
              headers: { 'Content-Type': 'text/plain' },
            });
          default:
            return new NextResponse(`END Choix invalide.`, {
              headers: { 'Content-Type': 'text/plain' },
            });
        }
      }
    }

    return new NextResponse(`END Session terminée. Merci d'utiliser AfriBayit !`, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('USSD API error:', error);
    return new NextResponse(`END Service temporairement indisponible. Réessayez plus tard.`, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// GET handler for health check
export async function GET() {
  return NextResponse.json({
    service: 'AfriBayit USSD',
    status: 'active',
    supportedCountries: ['BJ', 'CI', 'BF', 'TG'],
    menus: ['search', 'contact_agent', 'account'],
  });
}
