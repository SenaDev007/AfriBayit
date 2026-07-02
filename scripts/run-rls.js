const { Client } = require('pg');

// SECURITY (P1.4 — juillet 2026) : Le password Neon n'est plus hardcodé.
// Vous devez définir DATABASE_URL dans votre environnement.
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL || DATABASE_URL.startsWith('file:')) {
  console.error('❌ DATABASE_URL must be set in environment (.env or CI/CD secret).');
  console.error('   The previous hardcoded password has been rotated and is no longer valid.');
  process.exit(1);
}

async function run() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connecté à la base AfriBayit (Neon)');

    // Tables to enable RLS on
    const tables = [
      'properties', 'transactions', 'hotels', 'artisans',
      'guesthouses', 'notaries', 'courses', 'reviews', 'hotel_bookings'
    ];

    // Step 1: Enable RLS on each table
    for (const table of tables) {
      await client.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      console.log(`  ✓ RLS activé sur: ${table}`);
    }

    // Step 2: Create policies
    const simplePolicyTables = ['properties', 'hotels', 'artisans', 'guesthouses', 'notaries', 'courses'];

    for (const table of simplePolicyTables) {
      const policyName = `${table}_country_isolation`;
      await client.query(`DROP POLICY IF EXISTS "${policyName}" ON "${table}"`);
      await client.query(`
        CREATE POLICY "${policyName}" ON "${table}"
        USING (
          country = current_setting('app.current_country', true)
          OR current_setting('app.current_country', true) = 'ALL'
          OR current_setting('app.current_country', true) = ''
        )
      `);
      console.log(`  ✓ Politique créée: ${policyName}`);
    }

    // Reviews policy (with country IS NULL fallback)
    await client.query(`DROP POLICY IF EXISTS "reviews_country_isolation" ON "reviews"`);
    await client.query(`
      CREATE POLICY "reviews_country_isolation" ON "reviews"
      USING (
        country = current_setting('app.current_country', true)
        OR current_setting('app.current_country', true) = 'ALL'
        OR current_setting('app.current_country', true) = ''
        OR country IS NULL
      )
    `);
    console.log('  ✓ Politique créée: reviews_country_isolation');

    // Transactions policy (scoped via property's country)
    await client.query(`DROP POLICY IF EXISTS "transactions_country_isolation" ON "transactions"`);
    await client.query(`
      CREATE POLICY "transactions_country_isolation" ON "transactions"
      USING (
        "propertyId" IN (
          SELECT id FROM "properties"
          WHERE country = current_setting('app.current_country', true)
        )
        OR current_setting('app.current_country', true) = 'ALL'
        OR current_setting('app.current_country', true) = ''
        OR country = current_setting('app.current_country', true)
      )
    `);
    console.log('  ✓ Politique créée: transactions_country_isolation');

    // Hotel bookings policy (scoped via hotel's country)
    await client.query(`DROP POLICY IF EXISTS "hotel_bookings_country_isolation" ON "hotel_bookings"`);
    await client.query(`
      CREATE POLICY "hotel_bookings_country_isolation" ON "hotel_bookings"
      USING (
        "hotelId" IN (
          SELECT id FROM "hotels"
          WHERE country = current_setting('app.current_country', true)
        )
        OR current_setting('app.current_country', true) = 'ALL'
        OR current_setting('app.current_country', true) = ''
      )
    `);
    console.log('  ✓ Politique créée: hotel_bookings_country_isolation');

    console.log('\n✅ Toutes les politiques RLS sont en place !');

    // Step 3: Verify RLS is enabled
    const result = await client.query(
      `SELECT relname AS table_name, relrowsecurity AS rls_enabled 
       FROM pg_class 
       WHERE relrowsecurity = true 
       ORDER BY relname`
    );
    console.log('\n📋 Vérification - Tables avec RLS activé :');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    console.log(`\nTotal: ${result.rows.length} tables sécurisées`);

    // Also verify policies exist
    const policyResult = await client.query(
      `SELECT tablename, policyname FROM pg_policies WHERE policyname LIKE '%_country_isolation' ORDER BY tablename`
    );
    console.log('\n📋 Politiques de sécurité en place :');
    policyResult.rows.forEach(row => {
      console.log(`  ✓ ${row.tablename} → ${row.policyname}`);
    });
    console.log(`\nTotal: ${policyResult.rows.length} politiques`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.detail) console.error('Détail:', error.detail);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
