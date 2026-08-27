// Query actual column names from the database
const { Client } = require('pg');
const DATABASE_URL = process.argv[2];

async function main() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  
  // Get all Float and Text columns that need to be migrated
  const floatCols = await client.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type = 'double precision'
    ORDER BY table_name, column_name
  `);
  
  console.log('=== FLOAT columns to convert to DECIMAL ===');
  floatCols.rows.forEach(c => console.log(`  ${c.table_name}."${c.column_name}" — ${c.data_type}`));
  console.log(`Total: ${floatCols.rows.length}\n`);
  
  // Get all Text columns that are JSON-stored (check for JSON comment patterns)
  const textCols = await client.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type = 'text'
      AND column_name IN ('specialties','notificationPreferences','ocrResult','features','images',
        'conditions','ledgerEntries','metadata','subRatings','modules','completedModules',
        'tags','channels','sentVia','portfolio','specialities','amenities','policies','otaRefs',
        'photos','payload','houseRules','otaSyncStatus','availableForRoom','schedule',
        'languages','experience','education','certifications','evidenceUrls','details',
        'conditions','ledgerEntries')
    ORDER BY table_name, column_name
  `);
  
  console.log('=== TEXT columns to convert to JSONB ===');
  textCols.rows.forEach(c => console.log(`  ${c.table_name}."${c.column_name}" — ${c.data_type}`));
  console.log(`Total: ${textCols.rows.length}\n`);
  
  // Get table names for soft-delete
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  console.log('=== ALL TABLES ===');
  tables.rows.forEach(t => console.log(`  ${t.table_name}`));
  console.log(`Total: ${tables.rows.length}`);
  
  await client.end();
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
