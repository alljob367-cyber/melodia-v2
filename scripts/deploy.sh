#!/bin/bash
# ============================================================
# MELODIA UP TO AFRICA — Déploiement Automatique
# ============================================================
# Ce script déploie Melodia sur Vercel en production.
# Prérequis: vercel login (une seule fois)
# ============================================================

set -e

echo "🎵 MELODIA UP TO AFRICA — Déploiement Automatique"
echo "=================================================="

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
  echo "📦 Installation de Vercel CLI..."
  npm install -g vercel
fi

# Check if logged in
if ! vercel whoami &> /dev/null 2>&1; then
  echo ""
  echo "🔐 Connexion Vercel requise (une seule fois) :"
  echo "   → Une fenêtre de login va s'ouvrir dans votre navigateur"
  echo ""
  vercel login
fi

echo ""
echo "👤 Connecté en tant que : $(vercel whoami 2>/dev/null)"

# Generate Prisma client
echo ""
echo "⚙️  Génération du client Prisma..."
npx prisma generate

# Deploy to production
echo ""
echo "🚀 Déploiement en production..."
vercel --prod --yes

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "🌐 Votre app est live sur Vercel."
echo "   Dashboard: https://vercel.com/dashboard"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Configurez les variables d'environnement dans Vercel Dashboard"
echo "   2. Ajoutez VERCEL_TOKEN dans GitHub Secrets pour le CI/CD"
echo "   3. Chaque push sur main déploiera automatiquement !"
