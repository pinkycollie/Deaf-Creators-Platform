# Deployment Guide

This document covers deployment procedures for the V0 Deaf Creator Platform.

## Environments

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| Production | main | https://deafcreator.com | Live platform |
| Staging | development | https://staging.deafcreator.com | Pre-production testing |
| Preview | PR branches | Dynamic URLs | Feature previews |

## Prerequisites

1. **Vercel Account** - For hosting and deployments
2. **Supabase Project** - For database and authentication
3. **Cloudflare R2** - For video storage
4. **Pusher Account** - For real-time features

## Environment Variables

Configure these in your deployment platform:

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Storage
NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-key
NEXT_PUBLIC_CDN_URL=https://your-cdn.com

# Authentication
NEXTAUTH_URL=https://deafcreator.com
NEXTAUTH_SECRET=your-secret-key

# Real-time
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
NEXT_PUBLIC_PUSHER_KEY=your-key
NEXT_PUBLIC_PUSHER_CLUSTER=your-cluster

# Web3 (Optional)
THIRDWEB_CLIENT_ID=your-client-id
THIRDWEB_SECRET_KEY=your-secret-key
```

## Deployment Steps

### 1. Database Setup

Run migrations in order:

```bash
# Connect to Supabase SQL editor and run:
./scripts/001-initial-schema.sql
./scripts/002-seed-data.sql
./scripts/003-video-communication.sql
```

### 2. Vercel Setup

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Set build command: `pnpm build`
4. Set output directory: `.next`

### 3. Domain Configuration

1. Add custom domain in Vercel
2. Configure DNS records:
   - `A` record pointing to Vercel
   - `CNAME` for www subdomain

### 4. CDN Setup

1. Create Cloudflare R2 bucket: `deaf-creator-content`
2. Configure CORS policy:

```json
{
  "AllowedOrigins": ["https://deafcreator.com"],
  "AllowedMethods": ["GET", "PUT", "POST"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}
```

## Automated Deployments

### GitHub Actions

Deployments are automated via GitHub Actions:

- **Push to `development`** → Deploy to staging
- **Push to `main`** → Deploy to production
- **Pull Request** → Deploy preview

### Manual Deployment

```bash
# Deploy to staging
vercel --env staging

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
vercel alias <deployment-url> deafcreator.com
```

## Monitoring

### Health Checks

- Vercel automatically monitors deployment health
- Custom health endpoint: `/api/health`

### Logs

- View logs in Vercel dashboard
- Or use CLI: `vercel logs`

### Metrics

- Vercel Analytics for traffic metrics
- Custom metrics via `/api/metrics`

## Troubleshooting

### Build Failures

1. Check build logs in Vercel
2. Verify environment variables are set
3. Ensure dependencies are compatible

### Runtime Errors

1. Check function logs
2. Verify API integrations
3. Check database connectivity

### Performance Issues

1. Review Vercel Analytics
2. Check database query performance
3. Verify CDN cache hit rates
