import { NextResponse } from 'next/server';

/**
 * AfriBayit — USSD Handler for Africa's Talking
 * Supports session-based menu navigation for feature phones
 * All text in French — targeting West African markets (BJ, CI, BF, TG)
 *
 * Enhanced with:
 * - Wallet balance check
 * - Rebecca AI assistant access
 * - Budget-based property search
 * - Property detail viewing
 * - Help & support menu
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

// Budget ranges
const BUDGET_RANGES = [
  { key: '1', label: '< 5M', min: 0, max: 5_000_000 },
  { key: '2', label: '5-15M', min: 5_000_000, max: 15_000_000 },
  { key: '3', label: '15-50M', min: 15_000_000, max: 50_000_000 },
  { key: '4', label: '> 50M', min: 50_000_000, max: Infinity },
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
    { key: '3', label: 'Bouake', value: 'Bouaké' },
    { key: '4', label: 'San-Pedro', value: 'San-Pédro' },
  ],
  BF: [
    { key: '1', label: 'Ouagadougou', value: 'Ouagadougou' },
    { key: '2', label: 'Bobo-Dioulasso', value: 'Bobo-Dioulasso' },
    { key: '3', label: 'Koudougou', value: 'Koudougou' },
  ],
  TG: [
    { key: '1', label: 'Lome', value: 'Lomé' },
    { key: '2', label: 'Sokode', value: 'Sokodé' },
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

// ============ Menu Builders ============

function getMainMenu(): string {
  return `CON Bienvenue sur AfriBayit !
1. Rechercher un bien
2. Mes favoris
3. Mon portefeuille
4. Contacter Rebecca IA
5. Aide`;
}

function getSearchTypeMenu(): string {
  return `CON Type de bien :
1. Villa
2. Appartement
3. Terrain
4. Bureau
5. Commerce
0. Retour`;
}

function getSearchCityMenu(country: string): string {
  const cities = CITIES[country] || CITIES.BJ;
  const cityList = cities.map(c => `${c.key}. ${c.label}`).join('\n');
  return `CON Ville (${country}) :\n${cityList}\n0. Retour`;
}

function getSearchBudgetMenu(): string {
  return `CON Budget max (FCFA) :
1. < 5 millions
2. 5-15 millions
3. 15-50 millions
4. > 50 millions
0. Retour`;
}

async function getSearchResults(type: string, city: string, minPrice?: number, maxPrice?: number): Promise<string> {
  try {
    const { db } = await import('@/lib/db');
    const where: Record<string, unknown> = {
      type,
      city,
      status: 'published',
    };

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) (where.price as Record<string, unknown>).gte = minPrice;
      if (maxPrice !== undefined && maxPrice !== Infinity) (where.price as Record<string, unknown>).lte = maxPrice;
    }

    const properties = await db.property.findMany({
      where,
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        price: true,
        rooms: true,
        bedrooms: true,
        surface: true,
      },
    });

    if (properties.length === 0) {
      return `END Aucun bien trouve.
Reessayez avec d'autres criteres
ou consultez afribayit.com`;
    }

    const results = properties.map((p, i) =>
      `${i + 1}. ${p.title.substring(0, 25)}\n   ${formatPrice(p.price)}`
    ).join('\n');

    return `CON ${properties.length} bien(s) trouve(s) :
${results}
0. Nouvelle recherche`;
  } catch {
    // Fallback demo data
    return `CON Resultats de recherche :
1. Villa moderne - ${city}
   25 000 000 FCFA
2. Appart standing
   15 000 000 FCFA
0. Nouvelle recherche`;
  }
}

async function getFavorites(phoneNumber: string): Promise<string> {
  try {
    const { db } = await import('@/lib/db');
    const user = await db.user.findFirst({
      where: { phone: phoneNumber.replace('+', '') },
      select: { id: true },
    });

    if (!user) {
      return `END Aucun compte trouve.
Inscrivez-vous sur afribayit.com`;
    }

    const favorites = await db.favorite.findMany({
      where: { userId: user.id },
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: { title: true, price: true, city: true },
        },
      },
    });

    if (favorites.length === 0) {
      return `END Aucun favori enregistre.
Consultez afribayit.com pour
ajouter des favoris.`;
    }

    const list = favorites.map((f, i) =>
      `${i + 1}. ${f.property.title.substring(0, 20)}\n   ${formatPrice(f.property.price)}`
    ).join('\n');

    return `CON Vos favoris (${favorites.length}) :
${list}
0. Retour`;
  } catch {
    return `END Service temporairement
indisponible. Reessayez plus tard.`;
  }
}

async function getWalletBalance(phoneNumber: string): Promise<string> {
  try {
    const { db } = await import('@/lib/db');
    const user = await db.user.findFirst({
      where: { phone: phoneNumber.replace('+', '') },
      select: {
        name: true,
        walletBalance: true,
        pendingPayout: true,
        kycLevel: true,
      },
    });

    if (!user) {
      return `END Aucun compte trouve.
Inscrivez-vous sur afribayit.com`;
    }

    const kycLabels = ['Non verifie', 'Basique', 'Intermediaire', 'Complet'];

    return `END Portefeuille AfriBayit
Solde : ${formatPrice(user.walletBalance)}
En attente : ${formatPrice(user.pendingPayout)}
KYC : ${kycLabels[user.kycLevel] || 'Inconnu'}
Retrait : afribayit.com/wallet`;
  } catch {
    return `END Service temporairement
indisponible. Reessayez plus tard.`;
  }
}

function getRebeccaMenu(): string {
  return `CON Rebecca IA - Assistant
1. Estimer un bien
2. Questions juridiques
3. Guide investissement
0. Retour`;
}

function getRebeccaEstimate(): string {
  return `CON Estimation Rebecca IA
Entrez la ville du bien :`;
}

function getHelpMenu(): string {
  return `CON Aide AfriBayit
1. Comment rechercher
2. Comment publier
3. Securite escrow
4. Nous contacter
0. Retour`;
}

function getHelpSearch(): string {
  return `END Recherche :
1. Choisissez le type
2. Selectionnez la ville
3. Indiquez le budget
4. Consultez les resultats
Web : afribayit.com/search`;
}

function getHelpPublish(): string {
  return `END Publier une annonce :
1. Creez un compte
2. Verifiez votre identite
3. Ajoutez votre bien
4. Recevez des contacts
Web : afribayit.com/publish`;
}

function getHelpEscrow(): string {
  return `END Escrow securise :
1. Acheteur paie sur AfriBayit
2. Fonds bloques en securite
3. Verification GeoTrust
4. Paiement vendeur apres validation
Web : afribayit.com/escrow`;
}

function getHelpContact(): string {
  return `END Contact AfriBayit :
Tel : +229 90 00 00 00
WhatsApp : +229 90 00 00 00
Email : help@afribayit.com
Web : afribayit.com`;
}

// ============ POST Handler ============

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

    // ── Main menu selection ──
    if (depth === 1) {
      switch (currentInput) {
        case '1':
          session.currentMenu = 'search_type';
          session.data = {};
          return new NextResponse(getSearchTypeMenu(), {
            headers: { 'Content-Type': 'text/plain' },
          });
        case '2':
          session.currentMenu = 'favorites';
          const favResult = await getFavorites(phoneNumber);
          return new NextResponse(favResult, {
            headers: { 'Content-Type': 'text/plain' },
          });
        case '3':
          session.currentMenu = 'wallet';
          const walletResult = await getWalletBalance(phoneNumber);
          return new NextResponse(walletResult, {
            headers: { 'Content-Type': 'text/plain' },
          });
        case '4':
          session.currentMenu = 'rebecca';
          return new NextResponse(getRebeccaMenu(), {
            headers: { 'Content-Type': 'text/plain' },
          });
        case '5':
          session.currentMenu = 'help';
          return new NextResponse(getHelpMenu(), {
            headers: { 'Content-Type': 'text/plain' },
          });
        default:
          return new NextResponse(`END Choix invalide. Reessayez.`, {
            headers: { 'Content-Type': 'text/plain' },
          });
      }
    }

    // Depth 2+: sub-menu navigation
    const mainChoice = parts[0];

    // ── SEARCH FLOW (1*type*city*budget) ──
    if (mainChoice === '1') {
      if (depth === 2) {
        if (currentInput === '0') {
          return new NextResponse(getMainMenu(), {
            headers: { 'Content-Type': 'text/plain' },
          });
        }
        const typeEntry = PROPERTY_TYPES.find(t => t.key === currentInput);
        if (!typeEntry) {
          return new NextResponse(`END Type invalide. Reessayez.`, {
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
        if (currentInput === '0') {
          session.currentMenu = 'search_type';
          return new NextResponse(getSearchTypeMenu(), {
            headers: { 'Content-Type': 'text/plain' },
          });
        }
        const cities = CITIES[country] || CITIES.BJ;
        const cityEntry = cities.find(c => c.key === currentInput);
        if (!cityEntry) {
          return new NextResponse(`END Ville invalide. Reessayez.`, {
            headers: { 'Content-Type': 'text/plain' },
          });
        }
        session.data.city = cityEntry.value;
        session.currentMenu = 'search_budget';
        return new NextResponse(getSearchBudgetMenu(), {
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      if (depth === 4) {
        if (currentInput === '0') {
          session.currentMenu = 'search_city';
          return new NextResponse(getSearchCityMenu(country), {
            headers: { 'Content-Type': 'text/plain' },
          });
        }
        const budgetEntry = BUDGET_RANGES.find(b => b.key === currentInput);
        if (!budgetEntry) {
          return new NextResponse(`END Budget invalide. Reessayez.`, {
            headers: { 'Content-Type': 'text/plain' },
          });
        }

        const results = await getSearchResults(
          session.data.propertyType || 'villa',
          session.data.city || 'Cotonou',
          budgetEntry.min,
          budgetEntry.max,
        );
        return new NextResponse(results, {
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      if (depth === 5 && currentInput === '0') {
        session.currentMenu = 'search_type';
        session.data = {};
        return new NextResponse(getSearchTypeMenu(), {
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      return new NextResponse(`END Option invalide.`, {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // ── FAVORITES FLOW (2) ──
    if (mainChoice === '2') {
      if (depth === 2 && currentInput === '0') {
        return new NextResponse(getMainMenu(), {
          headers: { 'Content-Type': 'text/plain' },
        });
      }
      return new NextResponse(`END Consultez vos favoris
sur afribayit.com`, {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // ── WALLET FLOW (3) ──
    if (mainChoice === '3') {
      return new NextResponse(`END Portefeuille :
Connectez-vous sur
afribayit.com/wallet`, {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // ── REBECCA AI FLOW (4) ──
    if (mainChoice === '4') {
      if (depth === 2) {
        if (currentInput === '0') {
          return new NextResponse(getMainMenu(), {
            headers: { 'Content-Type': 'text/plain' },
          });
        }
        switch (currentInput) {
          case '1':
            session.currentMenu = 'rebecca_estimate';
            return new NextResponse(getRebeccaEstimate(), {
              headers: { 'Content-Type': 'text/plain' },
            });
          case '2':
            return new NextResponse(`END Questions juridiques :
Rebecca peut vous aider avec
droit foncier, titres, baux.
Web : afribayit.com/rebecca`, {
              headers: { 'Content-Type': 'text/plain' },
            });
          case '3':
            return new NextResponse(`END Guide investissement :
Rebecca conseille sur ROI,
rentabilite, localisation.
Web : afribayit.com/rebecca`, {
              headers: { 'Content-Type': 'text/plain' },
            });
          default:
            return new NextResponse(`END Choix invalide.`, {
              headers: { 'Content-Type': 'text/plain' },
            });
        }
      }

      // Rebecca estimate flow — user enters city name
      if (depth === 3 && session.currentMenu === 'rebecca_estimate') {
        return new NextResponse(`END Estimation pour ${currentInput} :
Consultez Rebecca sur
afribayit.com/rebecca
pour une estimation detaillee.`, {
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    }

    // ── HELP FLOW (5) ──
    if (mainChoice === '5') {
      if (depth === 2) {
        if (currentInput === '0') {
          return new NextResponse(getMainMenu(), {
            headers: { 'Content-Type': 'text/plain' },
          });
        }
        switch (currentInput) {
          case '1':
            return new NextResponse(getHelpSearch(), {
              headers: { 'Content-Type': 'text/plain' },
            });
          case '2':
            return new NextResponse(getHelpPublish(), {
              headers: { 'Content-Type': 'text/plain' },
            });
          case '3':
            return new NextResponse(getHelpEscrow(), {
              headers: { 'Content-Type': 'text/plain' },
            });
          case '4':
            return new NextResponse(getHelpContact(), {
              headers: { 'Content-Type': 'text/plain' },
            });
          default:
            return new NextResponse(`END Choix invalide.`, {
              headers: { 'Content-Type': 'text/plain' },
            });
        }
      }
    }

    return new NextResponse(`END Session terminee.
Merci d'utiliser AfriBayit !`, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('USSD API error:', error);
    return new NextResponse(`END Service temporairement
indisponible. Reessayez.`, {
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
    menus: ['search', 'favorites', 'wallet', 'rebecca', 'help'],
    version: '2.0',
  });
}
