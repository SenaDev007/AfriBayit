/**
 * Seed des visites virtuelles 360° (retour client 02/10 — « le VR 360°
 * n'est pas fonctionnel » : zéro propriété hasVR, zéro VirtualTour en base).
 *
 * Associe les panoramas équirectangulaires réels (public/panoramas/,
 * CC0 Poly Haven) aux biens publiés, par affinité de type :
 *   villa/appartement → lounges & salles de bain ; commerce → café ;
 *   investissement → pièces neuves ; LCD/séjour → terrasse & studio.
 *
 * Exécution (base de production) :
 *   DATABASE_URL="postgresql://…neon.tech/AfriBayit?sslmode=require" \
 *   npx tsx scripts/seed-vr-tours.ts
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

/** Panorama → contexte immobilier. */
const PANORAMA_ASSIGNMENTS: {
  file: string;
  /** Prisma `type` du bien ciblé (premier critère) */
  types: string[];
  /** Prisma `transaction` (second critère, toléré si absent) */
  transactions?: string[];
  label: string;
}[] = [
  { file: 'lythwood_lounge', types: ['villa', 'maison'], label: 'Séjour — villa' },
  { file: 'wooden_lounge', types: ['villa', 'maison'], label: 'Salon boisé' },
  { file: 'aft_lounge', types: ['appartement'], label: 'Salon — appartement' },
  { file: 'modern_bathroom', types: ['appartement', 'villa'], label: 'Salle de bain' },
  { file: 'small_empty_room_1', types: ['terrain', 'bureau'], label: 'Espace à aménager' },
  { file: 'comfy_cafe', types: ['commerce', 'chambre'], label: 'Espace commerce' },
  { file: 'entrance_hall', types: ['bureau', 'appartement'], label: "Hall d'entrée" },
  { file: 'industrial_wooden_attic', types: ['villa', 'maison'], transactions: ['investissement'], label: 'Combes aménageables' },
  { file: 'sundowner_deck', types: ['villa', 'appartement'], transactions: ['investissement', 'location_courte_duree'], label: 'Terrasse extérieure' },
  { file: 'art_studio', types: ['chambre', 'appartement'], transactions: ['location_courte_duree', 'location'], label: 'Studio meublé' },
];

async function main() {
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('postgres')) {
    console.error('DATABASE_URL (postgresql://…) requis — aucune action effectuée.');
    process.exit(1);
  }

  const properties = await db.property.findMany({
    where: { status: 'published' },
    select: { id: true, title: true, type: true, transaction: true, hasVR: true },
    orderBy: { premium: 'desc' as const },
  });
  console.log(`Biens publiés : ${properties.length}`);

  const withVR = properties.filter((p) => !p.hasVR);
  console.log(`Biens sans VR (candidats) : ${withVR.length}`);

  // Attribution : parcourt les panoramas, prend le premier bien correspondant
  // non encore pourvu (contexte type puis transaction).
  const used = new Set<string>();
  let created = 0;

  for (const assignment of PANORAMA_ASSIGNMENTS) {
    const candidate =
      withVR.find(
        (p) =>
          assignment.types.includes(p.type) &&
          !assignment.transactions &&
          !used.has(p.id),
      ) ||
      withVR.find(
        (p) =>
          assignment.types.includes(p.type) &&
          (!assignment.transactions || assignment.transactions.includes(p.transaction)) &&
          !used.has(p.id),
      ) ||
      withVR.find((p) => !used.has(p.id)); // dernier recours : bien quelconque

    if (!candidate) break;
    used.add(candidate.id);

    const url = `/panoramas/${assignment.file}.jpg`;
    await db.virtualTour.create({
      data: {
        propertyId: candidate.id,
        tourType: '360_photo',
        url,
        thumbnailUrl: url,
        duration: null,
      },
    });
    await db.property.update({
      where: { id: candidate.id },
      data: { hasVR: true },
    });
    created++;
    console.log(
      `+ [${candidate.type}/${candidate.transaction}] « ${candidate.title.slice(0, 48)} » → ${url} (${assignment.label})`,
    );
  }

  const totalVR = await db.property.count({ where: { hasVR: true } });
  const totalTours = await db.virtualTour.count();
  console.log(`\nTerminé : ${created} nouveaux tours — total biens VR : ${totalVR}, tours : ${totalTours}`);
}

main()
  .catch((e) => {
    console.error('Erreur :', e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
