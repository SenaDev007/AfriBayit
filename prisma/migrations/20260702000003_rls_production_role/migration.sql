-- AfriBayit — RLS Production Role (P2.5 production)
-- Date: juillet 2026
--
-- ⚠️ CRITIQUE : Neon accorde `bypass_rls = true` au propriétaire de la DB
-- (neondb_owner). Pour que RLS soit EFFECTIF en production, il faut :
-- 1. Créer un rôle PostgreSQL non-owner
-- 2. Lui accorder les permissions nécessaires (SELECT, INSERT, UPDATE, DELETE)
-- 3. NE PAS lui accorder BYPASSRLS
-- 4. Utiliser ce rôle dans DATABASE_URL de production (Vercel)
--
-- CE SCRIPT DOIT ÊTRE EXÉCUTÉ PAR LE PROPRIÉTAIRE DE LA DB (neondb_owner)
-- via le SQL Editor du dashboard Neon ou psql.
--
-- ⚠️ Neon note : `CREATE ROLE` et `ALTER ROLE` nécessitent des privilèges
-- spéciaux. Sur Neon, ces opérations peuvent être limitées selon votre plan.
-- Si vous ne pouvez pas créer de rôle, contactez le support Neon ou utilisez
-- le branch Neon avec un rôle dédié.

-- ═══════════════════════════════════════════════════════════════════════
-- ÉTAAPE 1 : Créer le rôle applicatif (non-owner, no bypassrls)
-- ═══════════════════════════════════════════════════════════════════════

-- ⚠️ REMPLACEZ 'afribayit_app' et le mot de passe par vos valeurs sécurisées
-- Générez un mot de passe fort : openssl rand -base64 24

CREATE ROLE afribayit_app WITH LOGIN PASSWORD 'CHANGE_ME_STRONG_PASSWORD_HERE' NOBYPASSRLS;

-- ═══════════════════════════════════════════════════════════════════════
-- ÉTAPE 2 : Accorder les permissions sur le schéma public
-- ═══════════════════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA public TO afribayit_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO afribayit_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO afribayit_app;

-- Permissions pour les futures tables (Prisma migrations)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO afribayit_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO afribayit_app;

-- ═══════════════════════════════════════════════════════════════════════
-- ÉTAPE 3 : Activer FORCE ROW LEVEL SECURITY sur toutes les tables RLS
-- ═══════════════════════════════════════════════════════════════════════
-- FORCE RLS applique les policies MÊME au propriétaire de la table.
-- Sans FORCE, le propriétaire (neondb_owner) bypass RLS automatiquement.
-- Avec FORCE + rôle non-owner (afribayit_app), RLS est effectif.

-- 16 tables couvertes par RLS (cf. migration 20260702000000_enable_rls)
ALTER TABLE properties FORCE ROW LEVEL SECURITY;
ALTER TABLE transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE hotels FORCE ROW LEVEL SECURITY;
ALTER TABLE artisans FORCE ROW LEVEL SECURITY;
ALTER TABLE guesthouses FORCE ROW LEVEL SECURITY;
ALTER TABLE notaries FORCE ROW LEVEL SECURITY;
ALTER TABLE courses FORCE ROW LEVEL SECURITY;
ALTER TABLE reviews FORCE ROW LEVEL SECURITY;
ALTER TABLE hotel_bookings FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents FORCE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE short_term_rentals FORCE ROW LEVEL SECURITY;
ALTER TABLE professional_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════
-- ÉTAPE 4 : Vérification
-- ═══════════════════════════════════════════════════════════════════════

-- Vérifier que le rôle a bien NOBYPASSRLS
SELECT rolname, rolbypassrls FROM pg_roles WHERE rolname = 'afribayit_app';
-- Résultat attendu : afribayit_app | f  (f = false = NOBYPASSRLS)

-- Vérifier que FORCE RLS est activé
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname IN (
  'properties', 'transactions', 'hotels', 'artisans', 'guesthouses',
  'notaries', 'courses', 'reviews', 'hotel_bookings', 'users',
  'kyc_documents', 'notifications', 'subscriptions', 'short_term_rentals',
  'professional_profiles', 'audit_logs'
)
ORDER BY relname;
-- Toutes les lignes doivent avoir relforcerowsecurity = t (true)

-- ═══════════════════════════════════════════════════════════════════════
-- ÉTAPE 5 : Configuration de l'application (à faire côté Vercel)
-- ═══════════════════════════════════════════════════════════════════════
--
-- Une fois ce script exécuté, mettez à jour DATABASE_URL sur Vercel :
--
-- ANCIEN (owner, bypass RLS) :
-- postgresql://neondb_owner:npg_xxx@ep-xxx.neon.tech/AfriBayit?sslmode=require
--
-- NOUVEAU (app role, RLS effectif) :
-- postgresql://afribayit_app:CHANGE_ME_STRONG_PASSWORD_HERE@ep-xxx.neon.tech/AfriBayit?sslmode=require
--
-- ⚠️ Le rôle afribayit_app ne peut PAS créer de tables ni exécuter de migrations
-- Prisma. Pour les migrations, utilisez temporairement le rôle owner (neondb_owner)
-- via un script CI/CD séparé, puis revenez au rôle app pour le runtime.
--
-- Alternative Neon : utiliser les "branches" Neon pour isoler les migrations
-- (rôle owner) du runtime (rôle app).

-- ═══════════════════════════════════════════════════════════════════════
-- ÉTAPE 6 : Test de RLS (à exécuter après changement DATABASE_URL)
-- ═══════════════════════════════════════════════════════════════════════
--
-- Connectez-vous avec le rôle afribayit_app et testez :
--
-- SET app.current_country = 'BJ';
-- SELECT count(*) FROM properties;  -- doit retourner seulement les properties BJ
--
-- SET app.current_country = 'NONE';
-- SELECT count(*) FROM properties;  -- doit retourner 0 (policy refuse NONE sauf si autorisé)
--
-- RESET app.current_country;
-- SELECT count(*) FROM properties;  -- doit retourner 0 (défaut NONE, policy refuse)
