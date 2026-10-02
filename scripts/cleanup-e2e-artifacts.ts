/**
 * Nettoyage des artefacts E2E créés pendant la validation du 02/10
 * (compte de TEST buyer.bj@afribayit.com — aucun utilisateur réel).
 *
 * Supprime : transactions d'essai + escrows + timelines, rendez-vous d'essai,
 * conversation de test, favoris d'essai (avec contre-passation du compteur).
 *
 *   DATABASE_URL="postgresql://…neon.tech/AfriBayit?sslmode=require" \
 *   npx tsx scripts/cleanup-e2e-artifacts.ts
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const TEST_EMAIL = 'buyer.bj@afribayit.com';

async function main() {
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('postgres')) {
    console.error('DATABASE_URL requis.');
    process.exit(1);
  }
  const user = await db.user.findUnique({ where: { email: TEST_EMAIL } });
  if (!user) {
    console.error('Compte de test introuvable — rien à nettoyer.');
    return;
  }

  // 1. Transactions d'essai (buyerId = test) + dépendances cascade manuelle
  const txs = await db.transaction.findMany({
    where: { buyerId: user.id },
    select: { id: true, propertyId: true },
  });
  for (const tx of txs) {
    await db.transactionTimeline.deleteMany({ where: { transactionId: tx.id } });
    const escrow = await db.escrowAccount.findUnique({ where: { transactionId: tx.id } });
    if (escrow) {
      await db.escrowLedger.deleteMany({ where: { escrowAccountId: escrow.id } });
      await db.escrowAccount.delete({ where: { id: escrow.id } });
    }
    await db.transaction.delete({ where: { id: tx.id } });
  }
  console.log(`Transactions supprimées : ${txs.length}`);

  // 2. Rendez-vous d'essai
  const appts = await db.appointment.deleteMany({ where: { userId: user.id } });
  console.log(`Rendez-vous supprimés : ${appts.count}`);

  // 3. Conversations de test (user_to_user créées par le compte)
  const convs = await db.conversation.findMany({
    where: { type: 'user_to_user', participants: { some: { userId: user.id } } },
    select: { id: true },
  });
  for (const c of convs) {
    await db.chatMessage.deleteMany({ where: { conversationId: c.id } });
    await db.conversationParticipant.deleteMany({ where: { conversationId: c.id } });
    await db.conversation.delete({ where: { id: c.id } });
  }
  console.log(`Conversations supprimées : ${convs.length}`);

  // 4. Favoris d'essai (contre-passation du compteur property.favorites)
  const favs = await db.favorite.findMany({ where: { userId: user.id } });
  for (const f of favs) {
    await db.favorite.delete({ where: { id: f.id } });
    await db.property.update({
      where: { id: f.propertyId },
      data: { favorites: { decrement: 1 } },
    }).catch(() => {});
  }
  console.log(`Favoris supprimés : ${favs.length}`);

  console.log('Nettoyage terminé.');
}

main()
  .catch((e) => {
    console.error('Erreur :', e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
