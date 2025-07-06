# Astromich 🌟

> A comprehensive astrophotography image management and analysis application

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](./docker/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Security](https://img.shields.io/badge/Security-Hardened-brightgreen)](docs/containerization-plan.md#security-considerations)
[![UnRAID](https://img.shields.io/badge/UnRAID-Compatible-orange)](./docker/unraid-templates/)

Astromich seamlessly integrates with your astrophotography workflow, providing automatic image synchronization, intelligent plate solving, equipment tracking, and comprehensive metadata management. Perfect for organizing and analyzing your deep-sky imaging collection.

<div align="center">
  <img src="assets/images/generated-icon.png" alt="Astromich" width="128" height="128">
  <p><em>🚀 Screenshots and demo coming soon! 📸</em></p>
</div>

## ✨ Features

### 🖼️ **Image Management**
- **Automatic Immich Sync**: Real-time synchronization with your Immich photo library
- **Smart Filtering**: Filter by equipment, targets, dates, and acquisition details
- **Deep Zoom Viewer**: High-resolution image exploration with OpenSeaDragon
- **Metadata Extraction**: Automatic EXIF and XMP sidecar processing
- **Thumbnail Generation**: Fast preview generation and caching

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
- **Statistics Dashboard**: Equipment usage analytics and performance metrics

### 🎛️ **Admin Interface**
- **Configuration Management**: Secure API key and integration settings
- **Sync Scheduling**: Configurable cron jobs for automated tasks
- **Worker Control**: Enable/disable background processing
- **Health Monitoring**: System status and performance metrics

### 🔒 **Security & Deployment**
- **Docker Ready**: Multi-stage containerization with health checks
- **Secret Management**: Secure environment variable configuration
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

1. **Install Database**: Use template URL `https://raw.githubusercontent.com/mstelz/Astromich/main/docker/unraid-templates/astromich-db.xml`
2. **Install Astromich**: Use template URL `https://raw.githubusercontent.com/mstelz/Astromich/main/docker/unraid-templates/astromich.xml`
3. **Configure**: Set database password and optional API keys
4. **Access**: Navigate to `http://your-server:5000`

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

# Access at http://localhost:5000
```

## 📋 Requirements

### System Requirements
- **Docker**: 20.10+ (for containerized deployment)
- **Node.js**: 20+ (for development)
- **Database**: PostgreSQL 15+ (production) or SQLite (development)
- **Memory**: 2GB RAM minimum, 4GB recommended
- **Storage**: 1GB+ depending on image collection size

### Optional Integrations
- **Immich Server**: For photo library synchronization
- **Astrometry.net API Key**: For plate solving capabilities
- **Reverse Proxy**: Nginx/Traefik for SSL termination

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

- **Immich Integration**: Server URL, API keys, sync schedules
- **Astrometry Settings**: API credentials, job limits, auto-processing
- **Worker Management**: Enable/disable background processing
- **Sync Scheduling**: Automated Immich synchronization frequency

> 💡 **Tip**: Configuration via admin interface takes precedence over environment variables and persists across container restarts.

## 🏗️ Architecture

```
┌─────────────────────────────────────┐    ┌─────────────────────┐
│        Astromich Container          │    │   PostgreSQL        │
├─────────────────────────────────────┤    │   Container         │
│  Frontend (React + TypeScript)     │    ├─────────────────────┤
│  ├─ Vite build system              │    │  Database Engine    │
│  ├─ Tailwind CSS + shadcn/ui       │◄──►│  Data Storage       │
│  └─ Real-time WebSocket client     │    │  Connection Pool    │
├─────────────────────────────────────┤    │  Health Checks      │
│  Backend (Express.js + Node.js)    │    └─────────────────────┘
│  ├─ RESTful API endpoints          │
│  ├─ Socket.io server               │    ┌─────────────────────┐
│  ├─ Image proxy & thumbnails       │    │   External APIs     │
│  └─ Session management             │◄──►├─────────────────────┤
├─────────────────────────────────────┤    │  Immich Server      │
│  Worker Manager                     │    │  Astrometry.net     │
│  ├─ Background job processing      │    │  Image Sources      │
│  ├─ Plate solving automation       │    └─────────────────────┘
│  ├─ Crash recovery & monitoring    │
│  └─ Graceful shutdown handling     │
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

## 🔒 Security

Astromich implements comprehensive security measures:

### 🛡️ **Application Security**
- **No embedded secrets**: All API keys via environment variables
- **Non-root execution**: Containers run as dedicated `astromich` user
- **Input validation**: Zod schema validation on all inputs
- **Session management**: Secure session handling with configurable secrets
- **API rate limiting**: Protection against abuse and DoS attacks

### 🔐 **Data Protection**
- **Database encryption**: PostgreSQL with optional encryption at rest
- **Secure headers**: CSP, HSTS, and security headers enabled
- **API key masking**: Sensitive data redacted in logs and UI
- **Volume isolation**: Container data isolated in managed volumes

### 🚨 **Deployment Security**
- **Secret management**: External configuration via environment variables
- **Network isolation**: Internal container networking with minimal exposure
- **Health monitoring**: Automated health checks and failure detection
- **Update strategy**: Rolling updates with zero-downtime deployments

> 📖 **Security Documentation**: See [Security Guide](docs/containerization-plan.md#security-considerations) for detailed security configuration.

## 🐳 Deployment

### Docker Compose (Production)

```bash
# Production deployment
cp docker/.env.docker.example .env
vim .env  # Configure production settings

docker compose -f docker-compose.yml up -d
```

### UnRAID (Home Server)

1. **Database Container**:
   - Template: `astromich-db.xml`
   - Set strong database password
   - Configure data volume: `/mnt/user/appdata/astromich/database`

2. **Application Container**:
   - Template: `astromich.xml`
   - Reference database password from step 1
   - Configure data volume: `/mnt/user/appdata/astromich/config`
   - Set API keys (optional, can configure via admin UI)

3. **Access & Configure**:
   - Web UI: `http://your-server:5000`
   - Admin panel: `http://your-server:5000/admin`
   - Configure Immich and Astrometry.net integrations

### Kubernetes (Advanced)

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgresql.yaml
kubectl apply -f k8s/astromich.yaml

# Configure ingress (optional)
kubectl apply -f k8s/ingress.yaml
```

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Application health
curl http://localhost:5000/api/health

# Database connectivity
docker exec astromich-db pg_isready -U astromich

# Worker status
curl http://localhost:5000/api/admin/worker/status
```

### Backup Procedures

```bash
# Database backup
docker exec astromich-db pg_dump -U astromich astromich > backup-$(date +%Y%m%d).sql

# Configuration backup
tar -czf config-backup-$(date +%Y%m%d).tar.gz /mnt/user/appdata/astromich/config

# Restore database
docker exec -i astromich-db psql -U astromich astromich < backup-20250706.sql
```

### Log Management

```bash
# View application logs
docker compose logs -f astromich

# View worker logs
docker compose logs -f astromich | grep "Worker"

# Database logs
docker compose logs -f astromich-db
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Follow the configured linting rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Use semantic commit messages
- **Testing**: Include tests for new features

## 🗺️ Roadmap

### v1.2.0 - Enhanced Analytics
- [ ] Advanced image statistics and analytics
- [ ] Equipment usage reporting
- [ ] Performance metrics dashboard
- [ ] Export capabilities (CSV, JSON)

### v1.3.0 - Advanced Features
- [ ] Multi-user support with role-based access
- [ ] Advanced search and filtering
- [ ] Bulk image processing workflows
- [ ] Integration with additional services

### v2.0.0 - Major Updates
- [ ] Machine learning for automatic target detection
- [ ] Advanced plate solving with local solvers
- [ ] Mobile app companion
- [ ] API versioning and external integrations

## 🆘 Support

### Documentation
- 📖 **User Guide**: [docs/README.md](docs/README.md)
- 🐳 **Docker Guide**: [docker/README.md](docker/README.md)
- 🔒 **Security Guide**: [docs/containerization-plan.md](docs/containerization-plan.md)
- 📋 **Changelog**: [CHANGELOG.md](CHANGELOG.md)

### Community & Help
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/mstelz/Astromich/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/mstelz/Astromich/discussions)
- 📧 **Email Support**: [astromich@example.com](mailto:astromich@example.com)
- 💬 **Discord Community**: [Join our Discord](https://discord.gg/astromich)

### Troubleshooting
- 🔍 **Common Issues**: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- 📊 **Performance Guide**: [docs/PERFORMANCE.md](docs/PERFORMANCE.md)
- 🔧 **Configuration Examples**: [docs/EXAMPLES.md](docs/EXAMPLES.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Immich](https://immich.app/)** - Inspiration and integration for photo management
- **[Astrometry.net](https://astrometry.net/)** - Plate solving service and algorithms
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful and accessible React components
- **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe database toolkit
- **Astrophotography Community** - Feature requests, testing, and feedback

---

<div align="center">

**Built with ❤️ for the astrophotography community**

[⭐ Star this repo](https://github.com/mstelz/Astromich) | [🐛 Report bug](https://github.com/mstelz/Astromich/issues) | [💡 Request feature](https://github.com/mstelz/Astromich/discussions)

</div>