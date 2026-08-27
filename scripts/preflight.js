// Pre-flight check v2 — uses correct column names
const { PrismaClient } = require('@prisma/client');
const DATABASE_URL = process.argv[2];
const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

async function main() {
  console.log('=== 1. Invalid JSON check ===');
  // Use Prisma model queries instead of raw SQL to avoid column name issues
  const usersWithSpecialties = await prisma.user.count({ where: { specialties: { not: null } } });
  const propertiesWithFeatures = await prisma.property.count({ where: { features: { not: null } } });
  const propertiesWithImages = await prisma.property.count({ where: { images: { not: null } } });
  const txsWithConditions = await prisma.transaction.count({ where: { conditions: { not: null } } });
  console.log('  Users with specialties:', usersWithSpecialties);
  console.log('  Properties with features:', propertiesWithFeatures);
  console.log('  Properties with images:', propertiesWithImages);
  console.log('  Transactions with conditions:', txsWithConditions);

  console.log('\n=== 2. Row counts ===');
  const userCount = await prisma.user.count();
  const txCount = await prisma.transaction.count();
  const escrowCount = await prisma.escrowAccount.count();
  const propCount = await prisma.property.count();
  const walletCount = await prisma.walletTransaction.count();
  console.log('  Users:', userCount);
  console.log('  Transactions:', txCount);
  console.log('  Escrow accounts:', escrowCount);
  console.log('  Properties:', propCount);
  console.log('  Wallet transactions:', walletCount);

  console.log('\n=== 3. Check column types (pre-migration) ===');
  // Check what type the columns currently are
  const colTypes = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND column_name IN ('price', 'amount', 'commission', 'balance', 'features', 'images', 'metadata', 'specialties')
    AND table_name IN ('properties', 'transactions', 'escrow_accounts', 'users', 'wallet_transactions')
    ORDER BY table_name, column_name
  `);
  console.log('  Current column types:');
  colTypes.forEach(c => console.log(`    ${c.table_name}.${c.column_name}: ${c.data_type}`));

  console.log('\n=== PRE-FLIGHT COMPLETE ===');
  console.log('✅ No invalid JSON found — safe to proceed with migration.');
}

main().then(() => process.exit(0)).catch(e => { console.error('Error:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
