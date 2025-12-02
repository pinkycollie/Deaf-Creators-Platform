# V0 Deaf Creator Platform - Multi-Tenants

A comprehensive video processing platform designed specifically for Deaf creators, featuring multi-channel video processing, creator dispatch, video request matching, and AI-powered video vision models.

## 🎯 Overview

This platform provides a complete ecosystem for video content creation and processing with a focus on accessibility for the Deaf community. The system integrates:

- **Multi-Channel Video Processing**: Scalable video ingestion and delivery pipelines
- **Creator Dispatch System**: Task assignment and creator management
- **Video Request Matching**: AI-powered content matching engine
- **Video Vision Models**: Automated video analysis and tagging

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Deaf Creator Platform                            │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Creator   │  │   Video     │  │   Video     │  │Multi-Channel│    │
│  │  Dispatch   │  │  Request    │  │   Vision    │  │   Video     │    │
│  │   System    │  │  Matching   │  │   Models    │  │ Processing  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│         │               │                │                │             │
│         └───────────────┴────────────────┴────────────────┘             │
│                              │                                          │
│                    ┌─────────┴─────────┐                               │
│                    │  Core Platform    │                               │
│                    │  (Multi-Tenant)   │                               │
│                    └───────────────────┘                               │
├─────────────────────────────────────────────────────────────────────────┤
│                        Accessibility Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │
│  │ Captioning  │  │   ASL       │  │   WCAG      │                    │
│  │   Tools     │  │ Recognition │  │ Compliance  │                    │
│  └─────────────┘  └─────────────┘  └─────────────┘                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
.
├── app/                          # Next.js application
│   ├── api/                      # API routes
│   │   ├── video/               # Video processing endpoints
│   │   │   ├── gestures/        # ASL gesture recognition
│   │   │   ├── recordings/      # Video recording management
│   │   │   └── rooms/           # Video room management
│   │   ├── auth/                # Authentication
│   │   ├── content/             # Content management
│   │   ├── marketplace/         # NFT marketplace
│   │   └── upload/              # File upload handling
│   └── dashboard/               # Dashboard views
├── components/                   # React components
│   ├── video/                   # Video-related components
│   ├── ui/                      # UI component library
│   └── auth/                    # Authentication components
├── lib/                         # Utility libraries
│   ├── auth.ts                  # Authentication utilities
│   ├── database.ts              # Database client
│   ├── storage.ts               # Cloud storage (S3/R2)
│   ├── webrtc.ts                # WebRTC utilities
│   └── signaling.ts             # Real-time signaling
├── scripts/                     # Database scripts
│   ├── 001-initial-schema.sql   # Initial database schema
│   ├── 002-seed-data.sql        # Seed data
│   └── 003-video-communication.sql  # Video communication schema
├── docs/                        # Documentation
│   ├── architecture/            # Architectural diagrams
│   ├── api/                     # API documentation
│   └── accessibility/           # Accessibility guidelines
└── src/                         # Core modules (video processing)
    ├── dispatch_service/        # Creator dispatch logic
    ├── creator_profiles/        # Creator management
    ├── matching_engine/         # Video matching algorithms
    ├── request_api/             # Request handling APIs
    ├── vision_models/           # AI vision models
    ├── input_processor/         # Video ingestion
    └── output_delivery/         # Processed video delivery
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL or Supabase account
- Cloudflare R2 or AWS S3 for storage

### Installation

```bash
# Clone the repository
git clone https://github.com/pinkycollie/v0-deaf-creator-platform-multi-tenants.git
cd v0-deaf-creator-platform-multi-tenants

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run development server
pnpm dev
```

### Environment Variables

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Storage
NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_ACCESS_KEY_ID=
CLOUDFLARE_SECRET_ACCESS_KEY=
NEXT_PUBLIC_CDN_URL=

# Authentication
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Web3
THIRDWEB_CLIENT_ID=
THIRDWEB_SECRET_KEY=

# Real-time
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
```

## 🔧 Core Modules

### 1. Creator Dispatch System

Manages the dispatching of creators to generate videos based on user requirements.

**Features:**
- Task assignment system for video creators
- Communication tools for creators and requesters
- Scheduling and deadline tracking
- Creator profile management

**Directory:** `src/dispatch_service/`, `src/creator_profiles/`

See [Creator Dispatch Documentation](docs/modules/creator-dispatch.md)

### 2. Video Request Matching

Matches user video requests with existing video content from a dynamic library.

**Features:**
- Metadata matching (tags, categories, length)
- AI model for matching by aesthetic and quality
- Real-time search with Elasticsearch integration

**Directory:** `src/matching_engine/`, `src/request_api/`

See [Video Matching Documentation](docs/modules/video-matching.md)

### 3. Video Vision Models

Incorporates AI models for analyzing video content.

**Features:**
- Scene detection and recognition
- Auto-tagging and categorization
- Quality control analysis
- ASL gesture recognition

**Directory:** `src/vision_models/`

See [Vision Models Documentation](docs/modules/vision-models.md)

### 4. Multi-Channel Video Processing

Processes videos across multiple pipelines.

**Features:**
- Input/Output handling for large-scale video processing
- Parallel GPU processing support
- FFMPEG integration for encoding/decoding
- Batch processing with Apache Kafka

**Directory:** `src/input_processor/`, `src/output_delivery/`

See [Video Processing Documentation](docs/modules/video-processing.md)

## ♿ Accessibility Features

This platform is designed with accessibility at its core, specifically for Deaf creators:

- **Automatic Captioning**: AI-powered video transcription
- **ASL Recognition**: Sign language gesture recognition
- **WCAG 2.1 AA Compliance**: Full accessibility standards compliance
- **Visual Notifications**: Non-audio-based alert system
- **High Contrast Mode**: Enhanced visibility options

See [Accessibility Guidelines](docs/accessibility/README.md)

## 🔄 CI/CD Pipeline

GitHub Actions workflows automate:

- **Linting**: ESLint for code quality
- **Testing**: Unit and integration tests
- **Build Verification**: Next.js build checks
- **Deployment**: Staging and production deployments

See [CI/CD Documentation](docs/workflows/README.md)

## 🌿 Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable production code |
| `development` | Integration of new features |
| `feature/*` | Individual feature branches |
| `hotfix/*` | Emergency production fixes |

## 📖 Documentation

- [API Documentation](docs/api/README.md)
- [Architecture Overview](docs/architecture/README.md)
- [Accessibility Guidelines](docs/accessibility/README.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Deployment Guide](docs/deployment/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [Contributing Guidelines](CONTRIBUTING.md) for detailed instructions.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Real-time features powered by [Pusher](https://pusher.com/)
- Blockchain integration via [thirdweb](https://thirdweb.com/)
