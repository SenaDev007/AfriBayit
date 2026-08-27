// Migration runner using pg (PostgreSQL driver) directly
// Supports multi-statement SQL within a transaction
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.argv[2];

async function main() {
  const sqlPath = path.join(__dirname, '..', 'prisma', 'migrations', '20260820000000_wave3_db_hardening', 'migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('Reading migration SQL:', sqlPath);
  console.log('SQL length:', sql.length, 'chars\n');

  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    console.log('Applying Wave 3 migration...');
    console.log('This may take 1-3 minutes...\n');
    
    // Execute the entire SQL as one query (pg supports multi-statement)
    await client.query(sql);
    
    console.log('✅ Migration applied successfully!\n');
    
    // Run verification queries
    console.log('=== VERIFICATION ===\n');
    
    // 1. Check DECIMAL columns
    const decimalCols = await client.query(`
      SELECT table_name, column_name, data_type, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND data_type = 'numeric'
        AND numeric_precision = 19
        AND numeric_scale = 4
      ORDER BY table_name, column_name
    `);
    console.log(`1. DECIMAL(19,4) money columns: ${decimalCols.rows.length} (expected 21+ — some may already have been Decimal)`);
    decimalCols.rows.forEach(c => console.log(`   ${c.table_name}.${c.column_name}`));
    
    // 2. Check JSONB columns
    const jsonbCols = await client.query(`
      SELECT count(*) as count FROM information_schema.columns
      WHERE table_schema = 'public' AND data_type = 'jsonb'
    `);
    console.log(`\n2. JSONB columns: ${jsonbCols.rows[0].count} (expected 52+)`);
    
    // 3. Check wallet_transactions.country
    const walletCountry = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'wallet_transactions' AND column_name = 'country'
    `);
    console.log(`\n3. wallet_transactions.country: ${walletCountry.rows.length > 0 ? '✅ exists' : '❌ missing'}`);
    
    // 4. Check wallet_transactions backfill
    const walletBackfill = await client.query(`
      SELECT count(*) as total, count(*) FILTER (WHERE country IS NOT NULL) as with_country,
             count(*) FILTER (WHERE country IS NULL) as without_country
      FROM wallet_transactions
    `);
    console.log(`   Backfill: ${walletBackfill.rows[0].with_country} with country, ${walletBackfill.rows[0].without_country} without (expected 0 without)`);
    
    // 5. Check RLS on wallet_transactions
    const rlsCheck = await client.query(`
      SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'wallet_transactions'
    `);
    console.log(`   RLS enabled: ${rlsCheck.rows[0]?.relrowsecurity ? '✅ yes' : '❌ no'}`);
    
    // 6. Check deleted_at columns
    const deletedAtCols = await client.query(`
      SELECT count(*) as count FROM information_schema.columns
      WHERE table_schema = 'public' AND column_name = 'deleted_at'
    `);
    console.log(`\n4. deleted_at columns: ${deletedAtCols.rows[0].count} (expected 32)`);
    
    // 7. Check new indexes
    const newIndexes = await client.query(`
      SELECT count(*) as count FROM pg_indexes
      WHERE indexname IN (
        'PropertyImage_propertyId_idx','VirtualTour_propertyId_idx',
        'PropertyLegalDoc_propertyId_idx','AgentListing_propertyId_idx',
        'Review_target_idx','EscrowLedger_escrowAccountId_idx',
        'TransactionTimeline_transactionId_idx','WalletTransaction_userId_idx',
        'HotelBooking_userId_idx','HotelBooking_hotel_checkIn_idx',
        'GuesthouseBooking_checkIn_idx','ShortTermRentalBooking_checkIn_idx',
        'CommunityPost_authorId_idx','CommunityReply_postId_idx',
        'Certificate_user_course_idx','GeometerMission_geometerId_idx',
        'ChatMessage_conversationId_idx','Notification_user_read_idx',
        'SavedSearch_userId_idx','PriceAlert_userId_idx',
        'Favorite_userId_idx','Appointment_propertyId_idx',
        'Property_agentId_idx','Transaction_propertyId_idx',
        'EscrowAccount_transactionId_idx','wallet_transactions_country_idx'
      )
    `);
    console.log(`\n5. New indexes: ${newIndexes.rows[0].count} (expected 26)`);
    
    // 8. Check no remaining FLOAT money columns
    const remainingFloat = await client.query(`
      SELECT count(*) as count FROM information_schema.columns
      WHERE table_schema = 'public'
        AND data_type = 'double precision'
        AND column_name IN ('price','amount','commission','balance','held_amount','released_amount','refunded_amount','balance_after','total_price','price_per_night')
    `);
    console.log(`\n6. Remaining FLOAT money columns: ${remainingFloat.rows[0].count} (expected 0)`);
    
    // 9. Check no remaining TEXT JSON columns
    const remainingText = await client.query(`
      SELECT count(*) as count FROM information_schema.columns
      WHERE table_schema = 'public'
        AND data_type = 'text'
        AND column_name IN ('features','images','metadata','specialties','specialities','amenities','policies','ota_refs','conditions','ledger_entries')
    `);
    console.log(`7. Remaining TEXT JSON columns: ${remainingText.rows[0].count} (expected 0)`);
    
    console.log('\n=== MIGRATION COMPLETE ===');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nThe migration was wrapped in BEGIN/COMMIT.');
    console.error('If it failed mid-way, all changes should have been rolled back.');
    throw error;
  } finally {
    await client.end();
  }
}

main().then(() => process.exit(0)).catch(e => { console.error('FATAL:', e); process.exit(1); });
