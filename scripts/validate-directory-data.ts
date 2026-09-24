/**
 * Validation d'intégrité du dataset annuaire (P1) — vérifie les invariants
 * attendus par la DB : unicité des emails, jointures userEmail → utilisateur,
 * unicité des licenseNumber, métiers alignés sur les filtres du marketplace.
 *
 * Exécution : npx tsx scripts/validate-directory-data.ts
 */
import {
  DIRECTORY_ARTISANS,
  DIRECTORY_ARTISAN_USERS,
  DIRECTORY_NOTARIES,
  DIRECTORY_NOTARY_USERS,
} from '../src/lib/migrations/directory-data';

const errors: string[] = [];
const warnings: string[] = [];

// 1. Unicité des emails utilisateurs
const allUsers = [...DIRECTORY_ARTISAN_USERS, ...DIRECTORY_NOTARY_USERS];
const emails = new Set<string>();
for (const u of allUsers) {
  if (emails.has(u.email)) errors.push(`Email dupliqué : ${u.email}`);
  emails.add(u.email);
}

// 2. Chaque artisan référence un utilisateur existant du même rôle
const artisanEmails = new Set(DIRECTORY_ARTISAN_USERS.map((u) => u.email));
for (const a of DIRECTORY_ARTISANS) {
  if (!artisanEmails.has(a.userEmail)) {
    errors.push(`Artisan sans utilisateur correspondant : ${a.userEmail} (${a.trade})`);
  }
  if (a.certified && !a.portfolio.length) {
    warnings.push(`Artisan certifié sans portfolio : ${a.userEmail}`);
  }
}

// 3. Chaque notaire référence un utilisateur notaire + license unique
const notaryEmails = new Set(DIRECTORY_NOTARY_USERS.map((u) => u.email));
const licenses = new Set<string>();
for (const n of DIRECTORY_NOTARIES) {
  if (!notaryEmails.has(n.userEmail)) {
    errors.push(`Notaire sans utilisateur correspondant : ${n.userEmail}`);
  }
  if (licenses.has(n.licenseNumber)) errors.push(`License dupliquée : ${n.licenseNumber}`);
  licenses.add(n.licenseNumber);
  if (n.certified && !n.certifiedDaysAgo) {
    warnings.push(`Notaire certifié sans certifiedAt : ${n.licenseNumber}`);
  }
}

// 4. Un utilisateur ne peut porter qu'un seul profil (contrainte userId unique)
//    → un même email ne doit pas apparaître à la fois artisan et notaire
for (const u of DIRECTORY_ARTISAN_USERS) {
  if (notaryEmails.has(u.email)) errors.push(`Email double profil : ${u.email}`);
}

// 5. Couverture pays
const countries = new Set([...DIRECTORY_ARTISANS, ...DIRECTORY_NOTARIES].map((x) => x.country));
if (!['BJ', 'CI', 'TG', 'BF'].every((c) => countries.has(c))) {
  errors.push(`Pays manquants : ${[...countries].join(', ')}`);
}

// 6. Métiers alignés sur les filtres du marketplace (extrait de
//    ArtisansMarketplace.TRADES_BY_CATEGORY)
const MARKETPLACE_TRADES = new Set([
  'Maçon', 'Coffreur / Bétonnier', 'Tailleur de pierre', 'Constructeur parpaings', 'Fondationniste',
  'Électricien', 'Plombier', 'Menuisier', 'Charpentier', 'Couvreur',
  'Peintre en bâtiment', 'Carreleur / Faïencier', 'Plâtrier', 'Poseur de revêtement sol', 'Architecte d\'intérieur',
  'Climaticien / Frigoriste', 'Chauffagiste', 'Installateur solaire photovoltaïque', 'Ascensoriste',
  'Paysagiste', 'Terrassier', 'Pisciniste', 'Clôturiste',
  'Rénovateur', 'Étanchéiste', 'Technicien de maintenance', 'Traitement humidité',
  'Domotique / Smart Home', 'Topographe BTP', 'Dessinateur 3D BIM',
]);
for (const a of DIRECTORY_ARTISANS) {
  if (!MARKETPLACE_TRADES.has(a.trade)) {
    errors.push(`Métier hors filtre marketplace : « ${a.trade} » (${a.userEmail})`);
  }
}

console.log(`Users artisans : ${DIRECTORY_ARTISAN_USERS.length}`);
console.log(`Users notaires : ${DIRECTORY_NOTARY_USERS.length}`);
console.log(`Artisans       : ${DIRECTORY_ARTISANS.length}`);
console.log(`Notaires       : ${DIRECTORY_NOTARIES.length}`);
console.log(`Pays couverts  : ${[...countries].sort().join(', ')}`);

const certifiedArtisans = DIRECTORY_ARTISANS.filter((a) => a.certified).length;
console.log(`Artisans certifiés (visibles annuaire) : ${certifiedArtisans}/${DIRECTORY_ARTISANS.length}`);
console.log(`Notaires certifiés (visibles annuaire) : ${DIRECTORY_NOTARIES.filter((n) => n.certified).length}/${DIRECTORY_NOTARIES.length}`);

if (warnings.length) {
  console.log('\n⚠ Avertissements :');
  warnings.forEach((w) => console.log(`  - ${w}`));
}

if (errors.length) {
  console.error('\n❌ Erreurs :');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log('\n✅ Dataset annuaire valide.');
