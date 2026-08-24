-- Post-migration verification
\echo '=== DECIMAL(19,4) money columns ==='
SELECT count(*) FROM information_schema.columns WHERE data_type = 'numeric' AND numeric_precision = 19 AND numeric_scale = 4;
\echo '=== JSONB columns ==='
SELECT count(*) FROM information_schema.columns WHERE data_type = 'jsonb';
\echo '=== wallet_transactions.country + RLS ==='
SELECT column_name FROM information_schema.columns WHERE table_name = 'wallet_transactions' AND column_name = 'country';
\echo '=== deleted_at columns ==='
SELECT count(*) FROM information_schema.columns WHERE column_name = 'deleted_at';
\echo '=== New indexes ==='
SELECT count(*) FROM pg_indexes WHERE indexname LIKE '%_idx' AND tablename IN ('properties','transactions','escrow_accounts','wallet_transactions','hotel_bookings','community_posts','notifications');
