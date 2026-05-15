# Deployment Guide for creators.pinksync.io

This guide covers deploying the Deaf Creator Platform to production using Vercel and Neon PostgreSQL.

## 🏆 Production Stack

- **Frontend**: Next.js 15 (App Router)
- **Hosting**: Vercel (Edge Network)
- **Database**: Neon (Serverless PostgreSQL)
- **Storage**: Cloudflare R2 (via PinkSync Media)
- **Real-time**: PinkSync WebSockets + Pusher
- **Payments**: Stripe Connect
- **Monitoring**: Vercel Analytics + Sentry

## Environments

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| Production | main | https://creators.pinksync.io | Live platform |
| Staging | development | https://staging.creators.pinksync.io | Pre-production testing |
| Preview | PR branches | Dynamic URLs | Feature previews |

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Neon Account**: Sign up at [neon.tech](https://neon.tech) for serverless PostgreSQL
3. **PinkSync API Key**: Contact PinkSync team for API access
4. **Stripe Account**: For payment processing
5. **Cloudflare R2**: For video storage
6. **Node.js 20+**: Required for local development and builds

## 🚀 Quick Start

### 1. Set up Neon Database

1. Create a new Neon project at [console.neon.tech](https://console.neon.tech)
2. Name it `creators-pinksync`
3. Select region closest to your users (e.g., `us-east-2`)
4. Copy the connection string

Run the database schema:

```bash
# Install PostgreSQL client if not already installed
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql-client

# Run schema migrations in order
psql "$DATABASE_URL" -f scripts/001-initial-schema.sql
psql "$DATABASE_URL" -f scripts/002-seed-data.sql
psql "$DATABASE_URL" -f scripts/003-video-communication.sql
psql "$DATABASE_URL" -f scripts/004-creators-schema.sql
```

### 2. Set up Vercel Project

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Link your project:
```bash
vercel link
```

4. Set environment variables:
```bash
# Database (Neon)
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production

# Authentication
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

# PinkSync API
vercel env add PINKSYNC_API_KEY production
vercel env add PINKSYNC_WEBHOOK_SECRET production

# Stripe
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production

# Other services as needed...
```

### 3. Deploy to Vercel

**Option A**: Using the deployment script
```bash
./scripts/deploy.sh --prod
```

**Option B**: Using Vercel CLI directly
```bash
vercel --prod
```

**Option C**: Using Git (recommended for CD)
```bash
git push origin main
# Vercel will automatically deploy
```

## Environment Variables

Configure these in your deployment platform. See `.env.production.example` for the complete list.

### Required Variables

```bash
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:password@ep-cool-bird-123456.us-east-2.aws.neon.tech/creators-pinksync?sslmode=require
DIRECT_URL=postgresql://neondb_owner:password@ep-cool-bird-123456.us-east-2.aws.neon.tech/creators-pinksync?sslmode=require&connect_timeout=30

# Authentication
NEXTAUTH_URL=https://creators.pinksync.io
NEXTAUTH_SECRET=your-secret-key

# PinkSync API
PINKSYNC_API_KEY=psk_live_xxxxxxxxxxxxxxxxxxxx
PINKSYNC_API_URL=https://api.pinksync.io/v1
PINKSYNC_WS_URL=wss://ws.pinksync.io
PINKSYNC_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx

# Storage (Cloudflare R2)
NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-key
NEXT_PUBLIC_CDN_URL=https://cdn.pinksync.io

# Real-time (Pusher)
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
NEXT_PUBLIC_PUSHER_KEY=your-key
NEXT_PUBLIC_PUSHER_CLUSTER=your-cluster

# Monitoring (Optional)
SENTRY_DSN=https://xxxxxxxxxxxx.ingest.sentry.io/xxxxxxx
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxx
```

## 🔧 Configuration

### Vercel Configuration (`vercel.json`)

The project includes a `vercel.json` file with:
- Build and output settings
- Function configurations (60s timeout, 1GB memory)
- Environment variable references
- Security headers
- Redirects and routing rules

### Database Connection Pooling

The platform uses `@neondatabase/serverless` for optimal serverless performance:

```typescript
// lib/db.ts
import { Pool } from '@neondatabase/serverless';

export const neonPool = new Pool({ 
  connectionString: process.env.DATABASE_URL!,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

## Deployment Steps

### 1. Database Setup (Neon)

Run migrations in order:

```bash
# Connect to Neon and run migrations:
psql "$DATABASE_URL" -f scripts/001-initial-schema.sql
psql "$DATABASE_URL" -f scripts/002-seed-data.sql
psql "$DATABASE_URL" -f scripts/003-video-communication.sql
psql "$DATABASE_URL" -f scripts/004-creators-schema.sql
```

Verify installation:
```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM creators;"
```

### 2. Vercel Setup

1. Connect your GitHub repository to Vercel
2. Configure environment variables (see above)
3. Set build command: `npm run build`
4. Set output directory: `.next`
5. Framework preset: Next.js

### 3. Domain Configuration

1. Add custom domain in Vercel: `creators.pinksync.io`
2. Configure DNS records:
   - `A` record pointing to Vercel (`76.76.21.21`)
   - `CNAME` for www subdomain pointing to `cname.vercel-dns.com`

### 4. CDN and Storage Setup

1. Create Cloudflare R2 bucket: `creators-pinksync-uploads`
2. Configure CORS policy:

```json
{
  "AllowedOrigins": ["https://creators.pinksync.io"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}
```

## 🔒 Security

### Headers

Security headers are configured in:
1. `vercel.json` (static headers)
2. `middleware.ts` (dynamic headers)

Headers include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Rate Limiting

Rate limiting is implemented via Upstash Redis in `middleware.ts`.

## 📊 Monitoring

### Health Check

Monitor service health at:
```
https://creators.pinksync.io/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-05T04:28:17.517Z",
  "services": {
    "database": "healthy",
    "databaseLatency": 45,
    "pinksync": "healthy"
  },
  "version": "abc123..."
}
```

### Vercel Analytics

- Built-in performance monitoring
- Real-time traffic insights
- Web Vitals tracking

### Custom Events

Track events in the `analytics_events` table:
```typescript
import { trackEvent } from '@/lib/monitoring';

trackEvent('creator_signup', userId, { plan: 'premium' });
```

## 🗄️ Database Management

### Backups

Run automated backups:
```bash
./scripts/backup.sh
```

Schedule via cron:
```bash
# Daily at 2 AM
0 2 * * * /path/to/scripts/backup.sh
```

Upload to S3:
```bash
export BACKUP_S3_BUCKET=creators-pinksync-backups
./scripts/backup.sh
```

### Restore from Backup

```bash
pg_restore -d "$DATABASE_URL" --clean --if-exists backups/db-backup-20251205-020000.dump
```

### Dashboard Views

Refresh materialized views:
```sql
REFRESH MATERIALIZED VIEW creator_dashboard;
```

## Automated Deployments

### GitHub Actions

Deployments are automated via GitHub Actions and Vercel:

- **Push to `main`** → Deploy to production (creators.pinksync.io)
- **Push to `staging`** → Deploy to staging (staging.creators.pinksync.io)
- **Pull Request** → Deploy preview (unique URL)

### Manual Deployment

Using the deployment script:
```bash
# Deploy to production
./scripts/deploy.sh --prod

# Deploy to preview
./scripts/deploy.sh
```

Using Vercel CLI directly:
```bash
# Deploy to staging
vercel

# Deploy to production
vercel --prod
```

## Rollback Procedures

### Via Vercel Dashboard

1. Go to Deployments
2. Find previous successful deployment
3. Click "..." menu
4. Select "Promote to Production"

### Via CLI

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel alias <deployment-url> creators.pinksync.io
```

## 🧪 Testing Deployment

1. **Health Check**:
```bash
curl https://creators.pinksync.io/api/health
```

2. **Database Connection**:
```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM creators;"
```

3. **PinkSync Integration**:
```bash
curl -H "Authorization: Bearer $PINKSYNC_API_KEY" \
  https://api.pinksync.io/v1/health
```

## 📈 Scaling

### Database Scaling (Neon)

Neon automatically scales based on:
- Connection pool size
- Query complexity
- Data size

Monitor and upgrade at [console.neon.tech](https://console.neon.tech)

### Vercel Scaling

Vercel automatically scales:
- Edge functions globally
- Compute based on traffic
- Static assets via CDN

## 💰 Cost Estimation

Monthly costs (10K MAU):
- Vercel Pro: ~$20/month
- Neon (5GB): ~$25/month
- PinkSync API: ~$50/month
- Stripe: 2.9% + $0.30 per transaction
- Cloudflare R2: ~$5/month
- **Total**: ~$100/month + transaction fees

## Troubleshooting

### Build Failures

```bash
# Clear build cache and redeploy
vercel --prod --force

# Check build logs
vercel logs <deployment-url>

# View environment variables
vercel env ls
```

Common issues:
- Missing environment variables
- Node.js version mismatch
- Dependency installation failures

### Database Connection Issues

```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT 1"

# Check pool stats
psql "$DATABASE_URL" -c "SELECT * FROM pg_stat_activity;"

# Verify connection string format
echo $DATABASE_URL
```

### Runtime Errors

1. Check function logs in Vercel dashboard
2. Verify API integrations (PinkSync, Stripe)
3. Check database connectivity
4. Review middleware configuration

### Performance Issues

1. Review Vercel Analytics for bottlenecks
2. Check database query performance
3. Verify CDN cache hit rates
4. Monitor Edge function execution times

### Environment Variables

```bash
# List all env vars
vercel env ls

# Pull env vars to local
vercel env pull .env.local

# Add new env var
vercel env add VARIABLE_NAME production
```

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [PinkSync API Docs](https://docs.pinksync.io)

## 🤝 Support

For deployment issues:
1. Check [GitHub Issues](https://github.com/pinkycollie/v0-deaf-creator-platform-multi-tenants/issues)
2. Review Vercel logs
3. Contact PinkSync support for API issues
4. Consult Neon support for database issues

## 📝 Deployment Checklist

Pre-deployment:
- [ ] Neon database created and configured
- [ ] Database schema deployed (all .sql files)
- [ ] Vercel project linked to GitHub
- [ ] Environment variables set in Vercel
- [ ] PinkSync API key configured
- [ ] Stripe account connected

Post-deployment:
- [ ] Domain configured (creators.pinksync.io)
- [ ] SSL certificate verified (automatic with Vercel)
- [ ] Health check endpoint responding
- [ ] PinkSync API integration tested
- [ ] Stripe webhook configured
- [ ] Monitoring enabled (Analytics, Sentry)
- [ ] Backup script scheduled
- [ ] Documentation updated
- [ ] Team notified of deployment

---

**Last Updated**: December 2025  
**Version**: 2.0.0 (Neon PostgreSQL + Vercel)
