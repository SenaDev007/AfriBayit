#!/usr/bin/env bash
# AfriBayit — Git History Purge Script (P1.4 — password rotation)
# Date: juillet 2026
#
# ⚠️ CE SCRIPT RÉÉCRIT L'HISTORIQUE GIT — À EXÉCUTER AVEC PRÉCAUTION
#
# Le password Neon `npg_VPlSR7Z9UiYD` est leaké dans 6 occurrences de
# l'historique git (commits précédents dans .env.example, seed-production.ts,
# run-rls.js). Ce script utilise git-filter-repo pour purger l'historique.
#
# PRÉREQUIS :
# 1. Installer git-filter-repo : pip install git-filter-repo
#    (ou : brew install git-filter-repo sur macOS)
# 2. Faire un backup du repo : git clone --mirror <url> afribayit-backup.git
# 3. Coordonner avec l'équipe — ce script force un force-push qui cassera
#    les clones locaux de tous les contributeurs
# 4. Le password Neon doit déjà être rotaté via le dashboard Neon
#
# APRÈS EXÉCUTION :
# 1. Tous les contributeurs doivent re-cloner le repo
# 2. Le password rotaté doit être mis à jour dans .env local et Vercel
# 3. Vérifier que GitHub n'affiche plus le password dans l'historique

set -euo pipefail

echo "⚠️  CE SCRIPT VA RÉÉCRIRE L'HISTORIQUE GIT"
echo "Assurez-vous d'avoir :"
echo "  1. Fait un backup (git clone --mirror)"
echo "  2. Rotaté le password Neon"
echo "  3. Prévenu l'équipe"
echo ""
read -p "Continuer ? (tapez OUI pour confirmer) : " confirm
if [ "$confirm" != "OUI" ]; then
  echo "Abandon."
  exit 0
fi

cd "$(dirname "$0")/.."

# Vérifier que git-filter-repo est installé
if ! command -v git-filter-repo &> /dev/null; then
  echo "❌ git-filter-repo n'est pas installé"
  echo "   Installez-le : pip install git-filter-repo"
  exit 1
fi

# Créer une branche de backup
echo "📦 Création d'une branche de backup..."
git branch backup/pre-purge-$(date +%Y%m%d)

# Remplacer le password dans tout l'historique
echo "🔧 Purge du password dans l'historique..."
git filter-repo --replace-text <(echo "npg_VPlSR7Z9UiYD==>REDACTED_PASSWORD")

# Vérifier que le password n'apparaît plus
echo "✅ Vérification..."
if git log --all -p | grep -q "npg_VPlSR7Z9UiYD"; then
  echo "❌ Le password apparaît encore dans l'historique"
  exit 1
else
  echo "✅ Le password a été purgé de tout l'historique"
fi

# Force push (dangereux — coordinate avec l'équipe !)
echo ""
echo "⚠️  Pour finaliser, force-push vers GitHub :"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "⚠️  Ensuite, tous les contributeurs doivent :"
echo "   1. Supprimer leur clone local : rm -rf AfriBayit"
echo "   2. Re-cloner : git clone https://github.com/SenaDev007/AfriBayit.git"
echo "   3. Recréer .env avec le nouveau password rotaté"
echo ""
echo "⚠️  Le cache GitHub peut conserver le password 24-48h après le force-push."
echo "   Vérifiez : https://github.com/SenaDev007/AfriBayit/commit/<old-commit>"
echo "   Si toujours visible, contactez GitHub Support pour purge du cache."
