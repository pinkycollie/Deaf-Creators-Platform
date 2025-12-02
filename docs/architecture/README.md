# Architecture Overview

This document provides an overview of the V0 Deaf Creator Platform architecture.

## System Architecture

The platform follows a microservices-inspired architecture within a monorepo structure, enabling modularity and scalability.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Client Layer                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐              │
│  │   Web App        │  │   Mobile App     │  │   API Clients    │              │
│  │   (Next.js)      │  │   (React Native) │  │   (REST/GraphQL) │              │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘              │
└───────────┼─────────────────────┼─────────────────────┼─────────────────────────┘
            │                     │                     │
            └─────────────────────┼─────────────────────┘
                                  │
┌─────────────────────────────────┼───────────────────────────────────────────────┐
│                              API Layer                                           │
│  ┌──────────────────┐  ┌──────┴───────────┐  ┌──────────────────┐              │
│  │   Authentication │  │   API Gateway    │  │   Rate Limiting  │              │
│  │   (NextAuth)     │  │   (Next.js API)  │  │   (Upstash)      │              │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────┼───────────────────────────────────────────────┐
│                           Service Layer                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Creator    │  │    Video     │  │    Video     │  │ Multi-Channel│        │
│  │   Dispatch   │  │   Matching   │  │    Vision    │  │  Processing  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │    WebRTC    │  │   Signaling  │  │   Content    │  │  Marketplace │        │
│  │   Service    │  │   Service    │  │   Service    │  │   Service    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────┼───────────────────────────────────────────────┐
│                           Data Layer                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   PostgreSQL │  │     Redis    │  │   S3/R2      │  │ Elasticsearch│        │
│  │   (Supabase) │  │   (Upstash)  │  │   Storage    │  │   (Search)   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Multi-Tenancy Architecture

The platform supports multi-tenant isolation at the database level using PostgreSQL Row Level Security (RLS).

### Tenant Isolation

```sql
-- Each tenant has isolated data
CREATE POLICY tenant_isolation_content ON content
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### Request Flow

1. Request includes tenant identifier (subdomain or header)
2. Middleware extracts and validates tenant
3. Database connection sets tenant context
4. RLS policies enforce data isolation

## Video Processing Pipeline

```
┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│   Upload  │───▶│  Ingest   │───▶│  Process  │───▶│  Deliver  │
│  (Client) │    │  (Queue)  │    │ (Workers) │    │   (CDN)   │
└───────────┘    └───────────┘    └───────────┘    └───────────┘
                                        │
                                        ▼
                               ┌───────────────┐
                               │  AI Analysis  │
                               │  - Tagging    │
                               │  - ASL Recog  │
                               │  - Captioning │
                               └───────────────┘
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Backend | Next.js API Routes, Node.js |
| Database | PostgreSQL (Supabase) |
| Cache | Redis (Upstash) |
| Storage | Cloudflare R2 / AWS S3 |
| Real-time | Pusher, WebRTC |
| Blockchain | thirdweb SDK, Ethers.js |
| AI/ML | TensorFlow, CLIP, Custom Models |

## Security

- JWT-based authentication
- Role-based access control (RBAC)
- Multi-tenant data isolation
- API rate limiting
- Input validation and sanitization
- HTTPS/TLS encryption

## Scalability

- Horizontal scaling with serverless functions
- CDN for static assets and video delivery
- Database connection pooling
- Redis caching for hot data
- Queue-based video processing
