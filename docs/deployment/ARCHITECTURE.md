# Deployment Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│                         creators.pinksync.io                          │
│                         (Vercel Edge Network)                         │
└───────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
        ┌───────────────┐ ┌─────────────┐ ┌──────────────┐
        │   Next.js 15  │ │ Edge Funcs  │ │  Middleware  │
        │  App Router   │ │ (60s, 1GB)  │ │   Security   │
        └───────────────┘ └─────────────┘ └──────────────┘
                    │             │             │
                    └─────────────┼─────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
        ┌───────────────┐ ┌─────────────┐ ┌──────────────┐
        │     Neon      │ │  PinkSync   │ │   Stripe     │
        │  PostgreSQL   │ │     API     │ │   Connect    │
        │  (Serverless) │ │  WebSocket  │ │  (Payments)  │
        └───────────────┘ └─────────────┘ └──────────────┘
                    │
                    ▼
        ┌───────────────────────────────────────────┐
        │         Database Schema                   │
        ├───────────────────────────────────────────┤
        │  • creators (profiles)                    │
        │  • projects (opportunities)               │
        │  • applications (creator applications)    │
        │  • videos (processed content)             │
        │  • payments (transactions)                │
        │  • analytics_events (tracking)            │
        └───────────────────────────────────────────┘
```

## Request Flow

```
User Request → Vercel Edge
              ↓
         Middleware (security headers, rate limit)
              ↓
         Next.js Route Handler
              ↓
         lib/db.ts (connection pool)
              ↓
         Neon PostgreSQL
              ↓
         Response with monitoring
```

## Deployment Flow

```
Git Push to main
    ↓
GitHub → Vercel Webhook
    ↓
Vercel Build (npm ci, npm run build)
    ↓
Deploy to Edge Network
    ↓
Health Check (/api/health)
    ↓
Production Live ✅
```

## Monitoring Flow

```
Application Event
    ↓
lib/monitoring.ts
    ├─→ Console Logs (structured JSON)
    ├─→ Database (analytics_events table)
    └─→ Sentry (optional error tracking)
```

## Backup Flow

```
Cron Schedule (2 AM daily)
    ↓
scripts/backup.sh
    ├─→ pg_dump (compressed)
    ├─→ S3 Upload (optional)
    └─→ Cleanup (30-day retention)
```

## Security Layers

```
1. Vercel Edge
   └─→ DDoS Protection, Global CDN

2. Middleware
   └─→ Security Headers, CORS, Rate Limiting

3. Application
   └─→ NextAuth, Input Validation

4. Database
   └─→ SSL/TLS, Connection Pooling, Row-level Security
```

## File Organization

```
/
├── vercel.json              # Vercel configuration
├── middleware.ts            # Security & routing
├── .env.production.example  # Environment template
├── DEPLOYMENT_STACK.md      # This document
│
├── app/
│   └── api/
│       └── health/
│           └── route.ts     # Health monitoring
│
├── lib/
│   ├── db.ts               # Database connection
│   └── monitoring.ts       # Logging utilities
│
├── scripts/
│   ├── 004-creators-schema.sql  # Database schema
│   ├── deploy.sh                # Deployment automation
│   └── backup.sh                # Backup automation
│
└── docs/
    └── deployment/
        └── README.md       # Deployment guide
```

## Technology Stack

| Layer          | Technology               | Purpose                    |
|----------------|--------------------------|----------------------------|
| Frontend       | Next.js 15 App Router    | React framework            |
| Hosting        | Vercel Edge Network      | Global CDN, serverless     |
| Database       | Neon PostgreSQL          | Serverless PostgreSQL      |
| DB Driver      | @neondatabase/serverless | Connection pooling         |
| Real-time      | PinkSync WebSockets      | Live updates               |
| Payments       | Stripe Connect           | Payment processing         |
| Storage        | Cloudflare R2            | Video/file storage         |
| Monitoring     | Vercel Analytics         | Performance tracking       |
| Rate Limiting  | Upstash Redis            | API rate limiting          |
| Security       | Edge Middleware          | Headers, CORS, auth        |

## Environment Variables

```bash
# Core
DATABASE_URL=postgresql://...           # Neon connection
NEXTAUTH_SECRET=...                     # Auth secret
NEXTAUTH_URL=https://creators.pinksync.io

# PinkSync
PINKSYNC_API_KEY=psk_live_...          # API authentication
PINKSYNC_WEBHOOK_SECRET=whsec_...      # Webhook verification

# Stripe
STRIPE_SECRET_KEY=sk_live_...          # Payment processing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Optional
SENTRY_DSN=...                          # Error tracking
NEXT_PUBLIC_POSTHOG_KEY=...            # Analytics
```

## Quick Commands

```bash
# Setup
vercel link
vercel env pull .env.local

# Deploy
./scripts/deploy.sh --prod

# Monitor
curl https://creators.pinksync.io/api/health
vercel logs

# Backup
./scripts/backup.sh

# Rollback
vercel ls
vercel alias <deployment-url> creators.pinksync.io
```
