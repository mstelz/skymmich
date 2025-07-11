<p align="center">
  <img src="assets/images/astromich.png" width="300">
</p>

<p align="center">
  <a href="./docker"><img src="https://img.shields.io/badge/Docker-Ready-blue?logo=docker"/></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" />
  <a href="./docker/unraid-templates"><img src="https://img.shields.io/badge/UnRAID-Compatible-orange)" /></a>
  <a href="https://discord.gg/ffZ8cuJ8Kh"><img src="https://img.shields.io/badge/Discord-Join%20Chat-5865F2?logo=discord&logoColor=white" alt="Join us on Discord" /></a>
</p>

<p align="center">
  <a href="https://github.com/mstelz/Astromich/actions/workflows/docker-build-push.yml"><img src="https://github.com/mstelz/Astromich/actions/workflows/docker-build-push.yml/badge.svg" alt="Build Status" /></a>
  <a href="https://github.com/mstelz/Astromich/actions/workflows/release.yml"><img src="https://github.com/mstelz/Astromich/actions/workflows/release.yml/badge.svg" alt="Release" /></a>
  <a href="https://github.com/mstelz/Astromich/security"><img src="https://img.shields.io/badge/Security-Trivy%20Scanned-brightgreen" alt="Security Scan" /></a>
</p>

**Astromich** is a self-hosted photo gallery and management system designed specifically for astrophotographers. Built to integrate seamlessly with your [Immich](https://immich.app/) photo library, it provides intelligent plate solving, equipment tracking, and comprehensive metadata management tailored for deep-sky imaging workflows.

Perfect for organizing, analyzing, and showcasing your astrophotography collection with full control over your data and infrastructure.

<div align="center">
  <img width="80%" src="assets/images/demo.gif" />
</div>

## ✨ Features

### 🖼️ **Self-Hosted Image Management**
- **Immich Integration**: Seamless synchronization with your self-hosted Immich photo library
- **Astrophotography Filtering**: Filter by telescopes, cameras, targets, constellations, and acquisition details
- **Deep Zoom Viewer**: High-resolution exploration of your deep-sky images with OpenSeaDragon
- **Metadata Preservation**: Automatic EXIF and XMP sidecar handling for astrophotography workflows
- **Zero Duplication**: View images directly from Immich without storage overhead

### 🔭 **Plate Solving**
- **Astrometry.net Integration**: Automatic coordinate solving for your images
- **Background Processing**: Non-blocking worker processes with job queuing
- **Real-time Updates**: Live progress tracking via WebSocket connections
- **Batch Processing**: Handle multiple images simultaneously
- **Results Storage**: Persistent RA/Dec coordinates and field information

### 📊 **Astrophotography Equipment Tracking**
- **Telescope Catalog**: Manage your telescopes, mounts, and accessories with specifications
- **Camera Database**: Track sensors, filters, and imaging configurations specific to astrophotography
- **Session Logging**: Automatic equipment association from EXIF metadata and manual tagging

### 🎛️ **Admin Interface**
- **Configuration Management**: Secure API key and integration settings
- **Sync Scheduling**: Configurable cron jobs for automated tasks
- **Worker Control**: Enable/disable background processing for plate solving

### 🔒 **Security & Deployment**
- **Docker Ready**: Multi-stage containerization with health checks
- **UnRAID Support**: Ready-to-use container templates
- **Database Options**: PostgreSQL for production, SQLite for development

## 🚀 Quick Start

> **Prerequisites**: Astromich requires a running [Immich](https://immich.app/) instance for photo management. Ensure you have Immich set up and accessible before proceeding.

### Option 1: Docker Compose (Recommended)

Complete production setup with PostgreSQL database:

```bash
# Download production compose file and environment template
curl -o docker-compose.prod.yml https://raw.githubusercontent.com/mstelz/Astromich/main/docker-compose.prod.yml
curl -o .env.prod.example https://raw.githubusercontent.com/mstelz/Astromich/main/.env.prod.example

# Configure environment
cp .env.prod.example .env
# Edit .env with your Immich server details and database password

# Start services (PostgreSQL + Astromich from ghcr.io)
docker compose -f docker-compose.prod.yml up -d

# Access the application
open http://localhost:5000
```

**What this includes:**
- PostgreSQL 15 database with persistent storage
- Astromich application from GitHub Container Registry
- Health checks and automatic restarts
- Secure networking between containers
- Volume mounts for configuration and logs

### Option 2: Docker Container

Single container deployment using GitHub Container Registry:

> **⚠️ Database Required**: You'll need a running PostgreSQL database. If you don't have one, use Option 1 (Docker Compose) instead, which includes PostgreSQL automatically.

```bash
# Pull the latest image
docker pull ghcr.io/mstelz/astromich:latest

# Run with Docker (requires existing PostgreSQL)
docker run -d \
  --name astromich \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://user:password@your-postgres-host:5432/astromich" \
  -e IMMICH_URL="http://your-immich-server:2283" \
  -e IMMICH_API_KEY="your-immich-api-key" \
  ghcr.io/mstelz/astromich:latest

# Access the application
open http://localhost:5000
```

### Option 3: UnRAID Template

> **📢 Coming Soon**: Astromich will be available in UnRAID Community Applications for easy one-click installation.

For now, manual installation:

1. **Install PostgreSQL**: Use any PostgreSQL template from Community Applications
   - **Database Name**: `astromich`
   - **Username**: `astromich`
   - **Password**: Strong password (remember for step 2)
   - **Container Name**: `postgres` (default)
2. **Install Astromich**: Use template URL `https://raw.githubusercontent.com/mstelz/Astromich/main/docker/unraid-templates/astromich.xml`
3. **Configure**: Update DATABASE_URL with your PostgreSQL password and optional API keys
4. **Access**: Navigate to `http://your-server:2284`

### Option 4: Development Setup

```bash
# Clone and install dependencies
git clone https://github.com/mstelz/Astromich.git
cd Astromich
npm install

# Option A: Build and run with Docker Compose (builds from source)
cp docker/.env.docker.example .env
# Edit .env with your settings
docker compose up -d

# Option B: Local development server
cp .env.example .env.local
# Edit .env.local with your development settings
npm run dev

# Access at http://localhost:5000 (Docker) or http://localhost:5173 (local)
```

## 📋 Requirements

### Core Requirements
- **Immich Server**: Self-hosted photo management server (currently the only supported photo source)
- **Docker**: 20.10+ (for containerized deployment)
- **Database**: PostgreSQL 15+ (production) or SQLite (development)

### Development Requirements
- **Node.js**: 20+ (for building from source)

### Optional Integrations
- **Astrometry.net API Key**: For automated plate solving capabilities

> **Note**: Support for additional photo sources beyond Immich is planned for future releases, but Immich is currently required as the primary photo library.

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | _(auto)_ | PostgreSQL connection string |
| `PORT` | `5000` | HTTP server port |
| `NODE_ENV` | `development` | Application environment |
| `IMMICH_URL` | _(optional)_ | Immich server base URL |
| `IMMICH_API_KEY` | _(optional)_ | Immich API authentication key |
| `ASTROMETRY_API_KEY` | _(optional)_ | Astrometry.net API key |
| `ENABLE_PLATE_SOLVING` | `true` | Enable background worker |
| `PLATE_SOLVE_MAX_CONCURRENT` | `3` | Max simultaneous jobs |

### Admin Configuration

After startup, access the admin interface at `/admin` to configure:

- **Immich Integration**: Server URL, API keys, album picker, sync schedules
- **Astrometry Settings**: API credentials, job limits, auto-processing
- **Worker Management**: Enable/disable background processing
- **Sync Scheduling**: Automated Immich synchronization frequency

> 💡 **Tip**: Configuration via admin interface takes precedence over environment variables and persists across container restarts.

## 📦 Container Images

Astromich provides ready-to-use container images through GitHub Container Registry:

### Available Images
- **Latest Release**: `ghcr.io/mstelz/astromich:latest`
- **Specific Version**: `ghcr.io/mstelz/astromich:v1.x.x`
- **Development**: `ghcr.io/mstelz/astromich:main`

### Supported Architectures
- `linux/amd64` (x86_64)
- `linux/arm64` (ARM64/Apple Silicon)

### Image Tags
- `latest` - Latest stable release
- `v*.*.*` - Semantic version tags (e.g., `v1.0.0`)
- `main` - Latest development build from main branch
- `sha-*` - Specific commit builds

All images are automatically built, tested, and scanned for vulnerabilities using GitHub Actions.

## 🏗️ Architecture

```
┌─────────────────────────────────────┐    ┌─────────────────────┐
│        Astromich Container          │    │   PostgreSQL        │
├─────────────────────────────────────┤    │   Container         │
│  Frontend (React + TypeScript)      │    ├─────────────────────┤
│  ├─ Vite build system               │    │  Database Engine    │
│  ├─ Tailwind CSS + shadcn/ui        │◄──►│  Data Storage       │
│  └─ Real-time WebSocket client      │    │  Connection Pool    │
├─────────────────────────────────────┤    │  Health Checks      │
│  Backend (Express.js + Node.js)     │    └─────────────────────┘
│  ├─ RESTful API endpoints           │
│  ├─ Socket.io server                │    ┌─────────────────────┐
│  ├─ Image proxy & thumbnails        │    │   External APIs     │
│  └─ Session management              │◄──►├─────────────────────┤
├─────────────────────────────────────┤    │  Immich Server      │
│  Worker Manager                     │    │  Astrometry.net     │
│  ├─ Background job processing       │    │  Image Sources      │
│  ├─ Plate solving automation        │    └─────────────────────┘
│  ├─ Crash recovery & monitoring     │
│  └─ Graceful shutdown handling      │
└─────────────────────────────────────┘
```

## 📁 Project Structure

```
Astromich/
├── apps/
│   ├── client/                 # React frontend application
│   │   ├── src/
│   │   │   ├── components/     # UI components (shadcn/ui)
│   │   │   ├── pages/          # Route components
│   │   │   ├── lib/            # Utilities and API clients
│   │   │   └── hooks/          # Custom React hooks
│   │   └── dist/               # Built frontend assets
│   └── server/                 # Node.js backend application
│       ├── src/
│       │   ├── routes/         # API route handlers
│       │   ├── services/       # Business logic services
│       │   ├── workers/        # Background job processors
│       │   └── db.ts           # Database configuration
│       └── dist/               # Compiled backend code
├── packages/
│   └── shared/                 # Shared types and schemas
│       ├── src/
│       │   ├── db/             # Database schemas (SQLite/PostgreSQL)
│       │   ├── schemas/        # Zod validation schemas
│       │   └── types/          # TypeScript type definitions
├── docker/                     # Containerization files
│   ├── Dockerfile              # Multi-stage container build
│   ├── docker-compose.yml      # Service orchestration
│   ├── startup.sh              # Container entry point
│   └── unraid-templates/       # UnRAID deployment templates
├── tools/                      # Development and migration tools
│   ├── scripts/                # Utility scripts
│   └── migrations/             # Database migration files
├── docs/                       # Documentation
└── assets/                     # Static assets and examples
```

## 🛠️ Development

### Prerequisites

```bash
# Install Node.js 20+
node --version  # v20+
npm --version   # 10+

# Clone repository
git clone https://github.com/mstelz/Astromich.git
cd Astromich
```

### Setup

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Configure your development settings

# Initialize database
npm run db:generate    # Generate migrations
npm run db:migrate     # Apply migrations
```

### Development Commands

```bash
# Start development server (SQLite database)
npm run dev            # Backend only
npm run dev:watch      # Backend with file watching
npm run dev:worker     # Worker process only
npm run dev:all        # Backend + Worker (concurrent)

# Build for production
npm run build          # Build frontend and backend
npm run build:docker   # Build with Docker assets

# Database operations
npm run db:generate    # Generate new migrations
npm run db:migrate     # Apply pending migrations
npm run db:studio      # Open Drizzle Studio (database GUI)

# Docker development
docker compose up -d astromich-db  # Database only
npm run dev                        # Local app + Docker DB
```

### Code Quality

```bash
# Type checking
npm run check          # TypeScript compilation check

# Code formatting
npm run format         # Prettier formatting
npm run lint           # ESLint checking

# Testing
npm run test           # Run test suite
npm run test:watch     # Watch mode testing
```

## 🚢 CI/CD & Deployment

Astromich uses GitHub Actions for continuous integration and deployment. All builds are automatically tested, scanned for vulnerabilities, and containerized.

### Automated Workflows

- **Build & Push**: Automatic Docker image builds on main branch commits
- **PR Testing**: Validates all pull requests with build tests and security scans
- **Release**: Semantic versioning releases with tagged Docker images

### Security

- All images are scanned with Trivy for vulnerabilities
- Critical vulnerabilities block deployments
- SBOM (Software Bill of Materials) generated for each build

For detailed CI/CD documentation, see [docs/CI_CD.md](docs/CI_CD.md).

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 🗺️ Roadmap

### Core Features
- [ ] **Additional Photo Sources**: Support for photo libraries beyond Immich (direct uploads, other self-hosted solutions)
- [ ] Advanced image statistics and analytics for astrophotography sessions
- [ ] Equipment usage reporting and session tracking
- [ ] XMP sidecar viewer and editor for astrophotography metadata

### Advanced Features
- [ ] Advanced search and filtering with saved queries
- [ ] Bulk image processing workflows and batch operations
- [ ] Advanced plate solving with local solvers (ASTAP, PixInsight integration)
- [ ] Mobile app companion for field use
- [ ] Community features (sharing, public galleries)

### Community & Help
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/mstelz/Astromich/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/mstelz/Astromich/discussions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Immich](https://immich.app/)** - Inspiration and integration for photo management
- **[Astrometry.net](https://astrometry.net/)** - Plate solving service and algorithms
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful and accessible React components
- **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe database toolkit

---

<div align="center">

**Built with ❤️ for the astrophotography community**

[⭐ Star this repo](https://github.com/mstelz/Astromich) | [🐛 Report bug](https://github.com/mstelz/Astromich/issues) | [💡 Request feature](https://github.com/mstelz/Astromich/discussions)

</div>
