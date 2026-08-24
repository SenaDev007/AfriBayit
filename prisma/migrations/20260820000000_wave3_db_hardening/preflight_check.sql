-- Pre-flight check — run BEFORE migration
\echo '=== 1. Check for invalid JSON strings ==='
SELECT id, specialties FROM users WHERE specialties IS NOT NULL AND specialties != '' AND specialties::text !~ '^\s*(\[|\{|null|true|false|".*"|[0-9])' LIMIT 5;
\echo '=== 2. Count rows ==='
SELECT (SELECT count(*) FROM transactions) AS transactions, (SELECT count(*) FROM properties) AS properties;
\echo '=== 3. Disk space ==='
SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size;
