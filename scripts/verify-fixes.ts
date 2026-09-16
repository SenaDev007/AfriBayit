// Test rapide de la logique de correction (sans infrastructure de test complète)
// Exécuté avec tsx : npx tsx scripts/verify-fixes.ts

// ─── 1. Réplique de toApiPath (identique à src/lib/api-client.ts) ──────────
function toApiPath(path: string): string {
  let p = path.trim();
  if (!p.startsWith('/')) p = `/${p}`;
  if (!p.startsWith('/api/') && p !== '/api') {
    p = `/api${p}`;
  }
  return p;
}

// ─── 2. Réplique de deepParseJsonStrings (identique à prisma/seed.ts) ──────
function deepParseJsonStrings<T>(value: T): T {
  if (typeof value === 'string') {
    const t = value.trim();
    if ((t.startsWith('[') || t.startsWith('{')) && (t.endsWith(']') || t.endsWith('}'))) {
      try { return JSON.parse(t) as unknown as T; } catch { return value; }
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((v) => deepParseJsonStrings(v)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = deepParseJsonStrings(v);
    }
    return out as unknown as T;
  }
  return value;
}

// ─── 3. Réplique de parseJsonArray (identique à src/lib/db-helpers.ts) ─────
function parseJsonArray<T = unknown>(value: unknown): T[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? (parsed as T[]) : [];
      } catch { return []; }
    }
  }
  return [];
}

// ─── Tests ──────────────────────────────────────────────────────────────────
let failures = 0;
function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures++;
    console.error(`  ✗ ${label}\n      attendu: ${JSON.stringify(expected)}\n      obtenu : ${JSON.stringify(actual)}`);
  } else {
    console.log(`  ✓ ${label}`);
  }
}

console.log('\n── toApiPath : normalisation des chemins API (monolithe) ──');
expect("'/properties' → '/api/properties'", toApiPath('/properties'), '/api/properties');
expect("'/properties?limit=12&country=BJ' garde la query", toApiPath('/properties?limit=12&country=BJ'), '/api/properties?limit=12&country=BJ');
expect("'/api/properties' inchangé (pas de double préfixe)", toApiPath('/api/properties'), '/api/properties');
expect("'/api/properties/featured?limit=8' inchangé", toApiPath('/api/properties/featured?limit=8'), '/api/properties/featured?limit=8');
expect("'/stats' → '/api/stats'", toApiPath('/stats'), '/api/stats');
expect("'properties' (sans slash) → '/api/properties'", toApiPath('properties'), '/api/properties');
expect("'/admin/users/x/roles/y' → '/api/admin/...'", toApiPath('/admin/users/x/roles/y'), '/api/admin/users/x/roles/y');

console.log('\n── deepParseJsonStrings : seed → colonnes Json ──');
const propDef = {
  title: 'Villa Moderne Fidjrossè',
  description: 'Magnifique villa moderne avec vue sur la lagune.',
  images: '["https://images.unsplash.com/photo-1","https://images.unsplash.com/photo-2"]',
  features: '["piscine","jardin"]',
  price: 75000000,
  nested: { amenities: '["wifi","ac"]', note: 'texte simple' },
};
const parsed = deepParseJsonStrings(propDef) as typeof propDef & { nested: { amenities: string[] } };
expect('images devient un vrai tableau', Array.isArray(parsed.images), true);
expect('images[0] est une URL complète', (parsed.images as string[])[0], 'https://images.unsplash.com/photo-1');
expect('features devient un tableau', Array.isArray(parsed.features), true);
expect('title (texte) inchangé', parsed.title, 'Villa Moderne Fidjrossè');
expect('description (texte) inchangé', parsed.description, 'Magnifique villa moderne avec vue sur la lagune.');
expect('champ imbriqué amenities parsé', Array.isArray(parsed.nested.amenities), true);
expect('texte imbriqué inchangé', parsed.nested.note, 'texte simple');

console.log('\n── parseJsonArray : lecture défensive côté API ──');
expect('chaîne JSON → tableau', parseJsonArray<string>('["https://a"]'), ['https://a']);
expect('tableau déjà parsé → inchangé', parseJsonArray<string>(['https://a', 'https://b']), ['https://a', 'https://b']);
expect('null → []', parseJsonArray(null), []);
expect('undefined → []', parseJsonArray(undefined), []);
expect('chaîne non-JSON → []', parseJsonArray('bonjour'), []);
expect('JSON invalide → []', parseJsonArray('["non termine'), []);
expect('JSON objet (pas tableau) → []', parseJsonArray('{"a":1}'), []);
expect("l'ancien bug images[0]==='[' est résolu", parseJsonArray<string>('["https://x"]')[0], 'https://x');

console.log('\n── Simulation bout-en-bout : seed string → DB → API → front ──');
const dbRow = { images: '["https://images.unsplash.com/villa"]' as unknown }; // ancien format stocké
const apiImages = parseJsonArray<string>(dbRow.images);
const primaryImage = apiImages[0] || 'fallback.jpg';
expect("l'URL d'image affichée dans PropertyCard est correcte", primaryImage, 'https://images.unsplash.com/villa');

console.log(`\n${failures === 0 ? '✅ TOUS LES TESTS PASSENT' : `❌ ${failures} ÉCHEC(S)`}\n`);
process.exit(failures === 0 ? 0 : 1);
