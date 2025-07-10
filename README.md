<p align="center">
  <img src="assets/images/astromich.png" width="300" title="Login With Custom URL">
</p>

> A comprehensive astrophotography image management and analysis application

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](./docker/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Security](https://img.shields.io/badge/Security-Hardened-brightgreen)](docs/containerization-plan.md#security-considerations)
[![UnRAID](https://img.shields.io/badge/UnRAID-Compatible-orange)](./docker/unraid-templates/)

Astromich seamlessly integrates with your astrophotography gallery, providing automatic image synchronization, intelligent plate solving, equipment tracking, and comprehensive metadata management. Perfect for organizing and analyzing your deep-sky imaging collection.

<div align="center">
  <img src="./assets/images/transparent-logo.png" alt="Astromich" width="128" height="128">
  <p><em>🚀 Screenshots and demo coming soon! 📸</em></p>
</div>

## ✨ Features

### 🖼️ **Image Management**
- **Automatic Immich Sync**: Real-time synchronization with your Immich photo library
- **Smart Filtering**: Filter by equipment, targets, dates, and acquisition details
- **Deep Zoom Viewer**: High-resolution image exploration with OpenSeaDragon
- **Metadata Extraction**: Automatic EXIF and XMP sidecar creation
- **Uses Existing Images/Thumbnails**: Doesn't duplicate images, instead view directly from the source (Immich).

### 🔭 **Plate Solving**
- **Astrometry.net Integration**: Automatic coordinate solving for your images
- **Background Processing**: Non-blocking worker processes with job queuing
- **Real-time Updates**: Live progress tracking via WebSocket connections
- **Batch Processing**: Handle multiple images simultaneously
- **Results Storage**: Persistent RA/Dec coordinates and field information

### 📊 **Equipment Tracking**
- **Telescope Catalog**: Manage your telescopes, mounts, and accessories
- **Camera Database**: Track sensors, filters, and imaging configurations
- **Session Logging**: Automatic equipment association from image metadata

### 🎛️ **Admin Interface**
- **Configuration Management**: Secure API key and integration settings
- **Sync Scheduling**: Configurable cron jobs for automated tasks
- **Worker Control**: Enable/disable background processing for plate solving

### 🔒 **Security & Deployment**
- **Docker Ready**: Multi-stage containerization with health checks
- **UnRAID Support**: Ready-to-use container templates
- **Database Options**: PostgreSQL for production, SQLite for development

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/mstelz/Astromich.git
cd Astromich

# Configure environment
cp docker/.env.docker.example .env
# Edit .env with your settings

# Start services
docker compose up -d

# Access the application
open http://localhost:5000
```

### Option 2: UnRAID Template

1. **Install PostgreSQL**: Use any PostgreSQL template from Community Applications
   - **Database Name**: `astromich`
   - **Username**: `astromich`
   - **Password**: Strong password (remember for step 2)
   - **Container Name**: `postgres` (default)
2. **Install Astromich**: Use template URL `https://raw.githubusercontent.com/mstelz/Astromich/main/docker/unraid-templates/astromich.xml`
3. **Configure**: Update DATABASE_URL with your PostgreSQL password and optional API keys
4. **Access**: Navigate to `http://your-server:2284`

### Option 3: Development Setup

```bash
# Clone and install dependencies
git clone https://github.com/mstelz/Astromich.git
cd Astromich
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your development settings

# Start development server
npm run dev

# Access at http://localhost:5173
```

## 📋 Requirements

### System Requirements
- **Docker**: 20.10+ (for containerized deployment)
- **Node.js**: 20+ (for development)
- **Database**: PostgreSQL 15+ (production) or SQLite (development)

### Optional Integrations
- **Immich Server**: For photo library synchronization (core aspect of the software though)
- **Astrometry.net API Key**: For plate solving capabilities

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

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 🗺️ Roadmap
- [ ] Advanced image statistics and analytics
- [ ] Equipment usage reporting
- [ ] XMP Sidecar viewer
- [ ] XMP sidecar reader
- [ ] Advanced search and filtering
- [ ] Bulk image processing workflows
- [ ] Advanced plate solving with local solvers (PixInsight)
- [ ] non-immich image uploads
- [ ] Mobile app companion

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
