#!/bin/bash
# Deployment script for creators.pinksync.io
set -e

echo "🚀 Deploying creators.pinksync.io..."

# Load environment
if [ -f .env.production ]; then
  source .env.production
  echo "✅ Loaded production environment"
else
  echo "⚠️  No .env.production file found, using Vercel environment variables"
fi

# Test database connection (if DATABASE_URL is available)
if [ -n "$DATABASE_URL" ]; then
  echo "🔍 Testing database connection..."
  if command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
      echo "✅ Database connection successful"
    else
      echo "❌ Database connection failed"
      exit 1
    fi
  else
    echo "⚠️  psql not found, skipping database test"
  fi
fi

# Test PinkSync API (if PINKSYNC_API_KEY is available)
if [ -n "$PINKSYNC_API_KEY" ]; then
  echo "🔗 Testing PinkSync API..."
  if curl -s -H "Authorization: Bearer $PINKSYNC_API_KEY" \
    "https://api.pinksync.io/v1/health" | grep -q "healthy" 2>/dev/null; then
    echo "✅ PinkSync API is accessible"
  else
    echo "⚠️  PinkSync API test skipped or not accessible"
  fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Run linting (optional, can be skipped for quick deployments)
if [ "$1" != "--skip-lint" ]; then
  echo "🔍 Running linter..."
  npm run lint || echo "⚠️  Linting warnings found, continuing..."
fi

# Build the application
echo "🏗️  Building Next.js application..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
if [ "$1" = "--prod" ]; then
  echo "📦 Deploying to production..."
  npx vercel --prod --yes
else
  echo "📦 Deploying to preview..."
  npx vercel --yes
fi

echo ""
echo "🎉 Deployment complete!"
echo "🌐 Production URL: https://creators.pinksync.io"
echo "📊 Vercel Dashboard: https://vercel.com"
echo ""
echo "Next steps:"
echo "  1. Verify deployment at https://creators.pinksync.io"
echo "  2. Check health endpoint: https://creators.pinksync.io/api/health"
echo "  3. Monitor logs in Vercel dashboard"
echo ""
