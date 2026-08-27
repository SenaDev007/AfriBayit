// Generate migration SQL by querying actual database schema
// Only converts columns that actually exist and are money/rate/JSON type
const { Client } = require('pg');
const fs = require('fs');
const DATABASE_URL = process.argv[2];

// Money column names (camelCase) — only convert these, not ratings/coords/scores
const MONEY_COL_NAMES = new Set([
  'price', 'amount', 'commission', 'balance', 'heldAmount', 'releasedAmount',
  'refundedAmount', 'balanceAfter', 'totalPrice', 'pricePerNight', 'weeklyPrice',
  'monthlyPrice', 'cleaningFee', 'securityDeposit', 'serviceFee', 'breakfastPrice',
  'basePrice', 'basePriceXof', 'dailyRate', 'estimatedBudget', 'quotedPrice',
  'priceOverride', 'priceXof', 'resolutionAmount', 'totalEarnings'
]);

// Rate column names — convert to DECIMAL(5,4)
const RATE_COL_NAMES = new Set(['commissionRate', 'multiplier', 'boostLevel']);

// JSON column names — convert TEXT to JSONB
const JSON_COL_NAMES = new Set([
  'specialties', 'notificationPreferences', 'ocrResult', 'features', 'images',
  'conditions', 'ledgerEntries', 'metadata', 'subRatings', 'modules', 'completedModules',
  'tags', 'channels', 'sentVia', 'portfolio', 'specialities', 'amenities', 'policies',
  'otaRefs', 'photos', 'payload', 'houseRules', 'otaSyncStatus', 'availableForRoom',
  'schedule', 'languages', 'experience', 'education', 'certifications', 'evidenceUrls',
  'details', 'rules'
]);

async function main() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Get all Float columns
  const floatCols = await client.query(`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type = 'double precision'
    ORDER BY table_name, column_name
  `);

  // Get all TEXT columns that should be JSONB
  const textCols = await client.query(`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type = 'text'
    ORDER BY table_name, column_name
  `);

  let sql = '-- AfriBayit — Wave 3 DB Hardening Migration (auto-generated from actual schema)\n\nBEGIN;\n\n';
  let moneyCount = 0, rateCount = 0, jsonCount = 0;

  // 1. Float → DECIMAL(19,4) for money columns
  sql += '-- 1. Float → DECIMAL(19,4) for money columns\n';
  for (const row of floatCols.rows) {
    if (MONEY_COL_NAMES.has(row.column_name)) {
      sql += `ALTER TABLE "${row.table_name}" ALTER COLUMN "${row.column_name}" TYPE DECIMAL(19,4) USING "${row.column_name}"::DECIMAL(19,4);\n`;
      moneyCount++;
    }
  }

  // 2. Float → DECIMAL(5,4) for rate columns
  sql += '\n-- 2. Float → DECIMAL(5,4) for rate columns\n';
  for (const row of floatCols.rows) {
    if (RATE_COL_NAMES.has(row.column_name)) {
      sql += `ALTER TABLE "${row.table_name}" ALTER COLUMN "${row.column_name}" TYPE DECIMAL(5,4) USING "${row.column_name}"::DECIMAL(5,4);\n`;
      rateCount++;
    }
  }

  // 3. TEXT → JSONB
  sql += '\n-- 3. TEXT → JSONB for JSON-stored columns\n';
  for (const row of textCols.rows) {
    if (JSON_COL_NAMES.has(row.column_name)) {
      sql += `ALTER TABLE "${row.table_name}" ALTER COLUMN "${row.column_name}" TYPE JSONB USING NULLIF("${row.column_name}", '')::jsonb;\n`;
      jsonCount++;
    }
  }

  // 4. Add country to wallet_transactions + RLS
  sql += '\n-- 4. Add country to wallet_transactions + RLS\n';
  sql += `ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "country" TEXT;\n`;
  sql += `UPDATE "wallet_transactions" wt SET "country" = u."country" FROM "users" u WHERE wt."userId" = u."id" AND wt."country" IS NULL;\n`;
  sql += `CREATE INDEX IF NOT EXISTS "wallet_transactions_country_idx" ON "wallet_transactions" ("country");\n`;
  sql += `ALTER TABLE "wallet_transactions" ENABLE ROW LEVEL SECURITY;\n`;
  sql += `DROP POLICY IF EXISTS "wallet_transactions_country_isolation" ON "wallet_transactions";\n`;
  sql += `CREATE POLICY "wallet_transactions_country_isolation" ON "wallet_transactions" USING ("country" = current_setting('app.current_country', true) OR current_setting('app.current_country', true) = 'NONE' OR current_setting('app.current_country', true) IS NULL);\n`;

  // 5. Add deletedAt to transactional tables (check which tables exist)
  sql += '\n-- 5. Add deletedAt soft-delete columns\n';
  const softDeleteTables = [
    'properties','property_images','property_legal_docs','virtual_tours',
    'transactions','escrow_accounts','escrow_ledger','transaction_timeline',
    'wallet_transactions','hotels','hotel_bookings','hotel_reviews',
    'guesthouses','guesthouse_bookings','guesthouse_rooms',
    'short_term_rentals','short_term_rental_bookings',
    'artisans','artisan_services','artisan_quotes',
    'courses','course_enrollments','community_posts','community_replies',
    'community_groups','community_events','notaries','notifications',
    'users','kyc_documents','professional_profiles','ambassadors','subscriptions'
  ];
  
  // Get existing tables
  const existingTables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `);
  const existingSet = new Set(existingTables.rows.map(r => r.table_name));
  
  for (const table of softDeleteTables) {
    if (existingSet.has(table)) {
      sql += `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);\n`;
    }
  }

  // 6. Add missing indexes (only for tables that exist)
  sql += '\n-- 6. Add missing indexes\n';
  const indexes = [
    ['property_images', ['propertyId'], 'PropertyImage_propertyId_idx'],
    ['virtual_tours', ['propertyId'], 'VirtualTour_propertyId_idx'],
    ['property_legal_docs', ['propertyId'], 'PropertyLegalDoc_propertyId_idx'],
    ['agent_listings', ['propertyId'], 'AgentListing_propertyId_idx'],
    ['reviews', ['targetType', 'targetId'], 'Review_target_idx'],
    ['escrow_ledger', ['escrowAccountId'], 'EscrowLedger_escrowAccountId_idx'],
    ['transaction_timeline', ['transactionId'], 'TransactionTimeline_transactionId_idx'],
    ['wallet_transactions', ['userId'], 'WalletTransaction_userId_idx'],
    ['hotel_bookings', ['userId'], 'HotelBooking_userId_idx'],
    ['hotel_bookings', ['hotelId', 'checkIn'], 'HotelBooking_hotel_checkIn_idx'],
    ['guesthouse_bookings', ['guesthouseId', 'checkIn'], 'GuesthouseBooking_checkIn_idx'],
    ['short_term_rental_bookings', ['rentalId', 'checkIn'], 'ShortTermRentalBooking_checkIn_idx'],
    ['community_posts', ['authorId'], 'CommunityPost_authorId_idx'],
    ['community_replies', ['postId'], 'CommunityReply_postId_idx'],
    ['certificates', ['userId', 'courseId'], 'Certificate_user_course_idx'],
    ['geometer_missions', ['geometerId'], 'GeometerMission_geometerId_idx'],
    ['chat_messages', ['conversationId'], 'ChatMessage_conversationId_idx'],
    ['notifications', ['userId', 'read'], 'Notification_user_read_idx'],
    ['saved_searches', ['userId'], 'SavedSearch_userId_idx'],
    ['price_alerts', ['userId'], 'PriceAlert_userId_idx'],
    ['favorites', ['userId'], 'Favorite_userId_idx'],
    ['appointments', ['propertyId'], 'Appointment_propertyId_idx'],
    ['properties', ['agentId'], 'Property_agentId_idx'],
    ['transactions', ['propertyId'], 'Transaction_propertyId_idx'],
    ['escrow_accounts', ['transactionId'], 'EscrowAccount_transactionId_idx'],
  ];
  for (const [table, cols, name] of indexes) {
    if (existingSet.has(table)) {
      const colList = cols.map(c => `"${c}"`).join(', ');
      sql += `CREATE INDEX IF NOT EXISTS "${name}" ON "${table}" (${colList});\n`;
    }
  }

  sql += '\nCOMMIT;\n';

  fs.writeFileSync('prisma/migrations/20260820000000_wave3_db_hardening/migration.sql', sql);
  console.log(`Migration SQL generated!`);
  console.log(`  Money columns → DECIMAL(19,4): ${moneyCount}`);
  console.log(`  Rate columns → DECIMAL(5,4): ${rateCount}`);
  console.log(`  TEXT → JSONB: ${jsonCount}`);
  console.log(`  Total statements: ${sql.split(';').length - 1}`);

  await client.end();
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
