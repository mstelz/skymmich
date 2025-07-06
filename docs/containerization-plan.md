# Astromich Containerization Plan

## Overview

This document outlines the containerization strategy for Astromich, an astrophotography image management application. The goal is to create a simple, single-container deployment suitable for UnRAID while maintaining flexibility and resilience.

## Current Architecture Analysis

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: Wouter
- **Real-time**: Socket.io-client
- **Location**: `/apps/client/`
- **Build Output**: Static files served by Express

### Backend
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js (ESM modules)
- **Real-time**: Socket.io server for live updates
- **Features**:
  - RESTful API endpoints
  - Image metadata management
  - Equipment catalog
  - Admin configuration interface
  - Cron job management (Immich sync)
- **Location**: `/apps/server/`

### Worker Process
- **Purpose**: Background plate solving automation
- **Implementation**: Separate Node.js process (`worker.ts`)
- **Features**:
  - Monitors Astrometry.net jobs every 30 seconds
  - Manages up to 3 concurrent jobs (configurable)
  - Real-time updates via Socket.io connection to main server
  - Can be enabled/disabled via admin settings
  - Graceful shutdown handling (SIGINT/SIGTERM)
- **Current Execution**: `npm run dev:worker` (development)

### Database
- **Development**: SQLite (`local.db`) - fallback option
- **Production**: PostgreSQL (separate container)
- **ORM**: Drizzle ORM with dual schema support
- **Migrations**: Located in `/tools/migrations/`

### External Dependencies
- **Immich**: Photo management system (API integration)
- **Astrometry.net**: Plate solving service
- **PostgreSQL**: Database container for production

## Containerization Strategy

### Two-Container Approach

**Rationale**: Keep deployment simple while separating database concerns for better data management, backups, and reliability.

### Container Architecture
```
┌─────────────────────────────────────┐    ┌─────────────────────┐
│        Astromich Container          │    │   PostgreSQL        │
├─────────────────────────────────────┤    │   Container         │
│  Frontend (Static Files)            │    ├─────────────────────┤
│  ├─ Served by Express middleware    │    │  Database Engine    │
│  └─ Built React application         │◄──►│  Data Storage       │
├─────────────────────────────────────┤    │  Connection Pool    │
│  Backend (Express.js)               │    │  Backup Support     │
│  ├─ API endpoints                   │    └─────────────────────┘
│  ├─ Socket.io server                │
│  ├─ Cron job manager                │
│  └─ Static file serving             │
├─────────────────────────────────────┤
│  Worker Manager                     │
│  ├─ Child process spawning          │
│  ├─ Crash detection & restart       │
│  ├─ Enable/disable via config       │
│  └─ Graceful shutdown               │
└─────────────────────────────────────┘
```

### Process Management Strategy

#### Worker Control
- **Environment Variable**: `ENABLE_PLATE_SOLVING=true/false`
- **Runtime Toggle**: Admin UI can enable/disable (restarts worker process)
- **Process Spawning**: Main Node.js app manages worker as child process
- **Crash Recovery**: Automatic restart with exponential backoff
- **Health Monitoring**: Socket.io connection status monitoring

#### Implementation Approach
```javascript
// Pseudo-code for worker management
class WorkerManager {
  constructor() {
    this.workerProcess = null;
    this.enabled = process.env.ENABLE_PLATE_SOLVING === 'true';
  }
  
  async start() {
    if (this.enabled && !this.workerProcess) {
      this.workerProcess = spawn('node', ['dist/worker.js']);
      this.setupProcessHandlers();
    }
  }
  
  async stop() {
    if (this.workerProcess) {
      this.workerProcess.kill('SIGTERM');
      this.workerProcess = null;
    }
  }
  
  async restart() {
    await this.stop();
    await this.start();
  }
}
```

## Implementation Details

### Dockerfile Structure
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
# Build frontend and backend

FROM node:18-alpine AS runtime
# Copy built assets
# Install production dependencies
# Setup process manager
# Expose ports
# Define startup command
```

### Build Process
1. **Stage 1 - Build**:
   - Install all dependencies
   - Build frontend with Vite (`npm run build`)
   - Compile TypeScript backend with esbuild
   - Compile worker process separately

2. **Stage 2 - Runtime**:
   - Copy built frontend to `/app/public`
   - Copy compiled backend to `/app/dist`
   - Install only production dependencies
   - Setup process manager script

### Runtime Configuration
```bash
#!/bin/sh
# startup.sh - Container entry point

# Start main application
node /app/dist/index.js &
MAIN_PID=$!

# Start worker if enabled
if [ "$ENABLE_PLATE_SOLVING" = "true" ]; then
    node /app/dist/worker.js &
    WORKER_PID=$!
fi

# Wait for processes and handle shutdown
wait
```

### Directory Structure in Container
```
/app/
├── dist/           # Compiled backend code
│   ├── index.js    # Main server
│   └── worker.js   # Worker process
├── public/         # Built frontend assets
└── config/         # Volume mount for config files
```

## Deployment Configuration

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  astrorep:
    image: your-registry/astrorep:latest
    container_name: astrorep
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://astrorep:${POSTGRES_PASSWORD}@astrorep-db:5432/astrorep
      - IMMICH_URL=${IMMICH_URL}
      - IMMICH_API_KEY=${IMMICH_API_KEY}
      - ASTROMETRY_API_KEY=${ASTROMETRY_API_KEY}
      - ENABLE_PLATE_SOLVING=${ENABLE_PLATE_SOLVING:-true}
      - PLATE_SOLVE_MAX_CONCURRENT=${PLATE_SOLVE_MAX_CONCURRENT:-3}
    volumes:
      - /mnt/user/appdata/astrorep/config:/app/config
    depends_on:
      astrorep-db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  astrorep-db:
    image: postgres:15-alpine
    container_name: astrorep-db
    restart: unless-stopped
    environment:
      - POSTGRES_DB=astrorep
      - POSTGRES_USER=astrorep
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - /mnt/user/appdata/astrorep/database:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U astrorep -d astrorep"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

volumes:
  astrorep-config:
  astrorep-database:
```

### UnRAID Template (Main Application)

```xml
<?xml version="1.0"?>
<Container version="2">
  <Name>Astromich</Name>
  <Repository>your-registry/astromich:latest</Repository>
  <Registry>https://hub.docker.com/</Registry>
  <Network>bridge</Network>
  <WebUI>http://[IP]:[PORT:5000]/</WebUI>
  <Icon>https://raw.githubusercontent.com/your-repo/astrorep/main/icon.png</Icon>
  
  <Config Name="WebUI Port" Target="5000" Default="5000" Mode="tcp" Description="Port for web interface" Type="Port" Display="always" Required="true" Mask="false">5000</Config>
  
  <Config Name="Config Directory" Target="/app/config" Default="/mnt/user/appdata/astrorep/config" Mode="rw" Description="Configuration storage" Type="Path" Display="always" Required="true" Mask="false">/mnt/user/appdata/astrorep/config</Config>
  
  <Config Name="Database URL" Target="DATABASE_URL" Default="postgresql://astrorep:CHANGE_ME@astrorep-db:5432/astrorep" Mode="" Description="PostgreSQL connection string" Type="Variable" Display="always" Required="true" Mask="true">postgresql://astrorep:CHANGE_ME@astrorep-db:5432/astrorep</Config>
  
  <Config Name="Immich URL" Target="IMMICH_URL" Default="" Mode="" Description="Immich server URL" Type="Variable" Display="always" Required="false" Mask="false"></Config>
  
  <Config Name="Immich API Key" Target="IMMICH_API_KEY" Default="" Mode="" Description="Immich API key for integration" Type="Variable" Display="always" Required="false" Mask="true"></Config>
  
  <Config Name="Astrometry API Key" Target="ASTROMETRY_API_KEY" Default="" Mode="" Description="Astrometry.net API key for plate solving" Type="Variable" Display="always" Required="false" Mask="true"></Config>
  
  <Config Name="Enable Plate Solving" Target="ENABLE_PLATE_SOLVING" Default="true" Mode="" Description="Enable background plate solving worker" Type="Variable" Display="always" Required="false" Mask="false">true</Config>
  
  <Config Name="Max Plate Solve Jobs" Target="PLATE_SOLVE_MAX_CONCURRENT" Default="3" Mode="" Description="Maximum concurrent plate solving jobs" Type="Variable" Display="advanced" Required="false" Mask="false">3</Config>
</Container>
```

### UnRAID Template (PostgreSQL Database)

```xml
<?xml version="1.0"?>
<Container version="2">
  <Name>AstroRep-DB</Name>
  <Repository>postgres:15-alpine</Repository>
  <Registry>https://hub.docker.com/_/postgres</Registry>
  <Network>bridge</Network>
  <Icon>https://raw.githubusercontent.com/docker-library/docs/master/postgres/logo.png</Icon>
  
  <Config Name="Database Data" Target="/var/lib/postgresql/data" Default="/mnt/user/appdata/astrorep/database" Mode="rw" Description="Database files storage" Type="Path" Display="always" Required="true" Mask="false">/mnt/user/appdata/astrorep/database</Config>
  
  <Config Name="Database Name" Target="POSTGRES_DB" Default="astrorep" Mode="" Description="Database name" Type="Variable" Display="always" Required="true" Mask="false">astrorep</Config>
  
  <Config Name="Database User" Target="POSTGRES_USER" Default="astrorep" Mode="" Description="Database username" Type="Variable" Display="always" Required="true" Mask="false">astrorep</Config>
  
  <Config Name="Database Password" Target="POSTGRES_PASSWORD" Default="" Mode="" Description="Database password (CHANGE THIS!)" Type="Variable" Display="always" Required="true" Mask="true"></Config>
</Container>
```

### Environment Variables

#### AstroRep Container
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | HTTP server port |
| `NODE_ENV` | `production` | Application environment |
| `DATABASE_URL` | _(required)_ | PostgreSQL connection string |
| `IMMICH_URL` | _(empty)_ | Immich server base URL |
| `IMMICH_API_KEY` | _(empty)_ | Immich API authentication key |
| `ASTROMETRY_API_KEY` | _(empty)_ | Astrometry.net API key |
| `ENABLE_PLATE_SOLVING` | `true` | Enable/disable worker process |
| `PLATE_SOLVE_MAX_CONCURRENT` | `3` | Max concurrent plate solving jobs |

#### PostgreSQL Container
| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `astrorep` | Database name |
| `POSTGRES_USER` | `astrorep` | Database username |
| `POSTGRES_PASSWORD` | _(required)_ | Database password |

### Volume Mounts

#### AstroRep Container
| Host Path | Container Path | Purpose |
|-----------|----------------|---------|
| `/mnt/user/appdata/astrorep/config` | `/app/config` | Application configuration files |

#### PostgreSQL Container
| Host Path | Container Path | Purpose |
|-----------|----------------|---------|
| `/mnt/user/appdata/astrorep/database` | `/var/lib/postgresql/data` | Database files and WAL logs |

### Networking
- **AstroRep Port**: `5000` (HTTP)
- **PostgreSQL Port**: `5432` (internal communication only)
- **Protocol**: TCP
- **Mode**: Bridge networking (standard for UnRAID)
- **Container Communication**: Docker network for database connections

## Health Checks

### Astromich Container Health
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1
```

### PostgreSQL Container Health
```dockerfile
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD pg_isready -U astrorep -d astrorep || exit 1
```

### Health Endpoint
```javascript
// /api/health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    worker: workerManager.isRunning(),
    database: await checkDatabaseConnection()
  });
});
```

## Security Considerations

### Container Security
- Run as non-root user (`node:node`)
- Read-only filesystem except for data directory
- Drop unnecessary capabilities
- No privileged mode required

### Data Protection
- Database files stored in mounted volume
- API keys handled as environment variables
- No sensitive data in container image
- Regular security updates via base image updates

## Update Strategy

### Rolling Updates
1. Build new container image
2. Stop existing container
3. Start new container with same volume mounts
4. Database migrations run automatically on startup

### Backup Procedures
- **Database**: 
  - Stop PostgreSQL container
  - Backup `/mnt/user/appdata/astrorep/database` directory
  - Or use `pg_dump` for live backups
- **Configuration**: Backup `/mnt/user/appdata/astrorep/config` directory
- **Container**: Pull latest images, no local data stored in containers

## Future Considerations

### Monitoring Options
- **Built-in**: Health check endpoint
- **External**: Prometheus metrics (future enhancement)
- **Logs**: Docker log driver configuration
- **Alerting**: UnRAID notification integration

### Scaling Considerations
- **Current**: Single container, sufficient for home use
- **Future**: If needed, can extract worker to separate container
- **Database**: Can switch to external PostgreSQL for better performance

### Performance Optimizations
- **Frontend**: Serve static files with appropriate caching headers
- **Database**: Connection pooling for PostgreSQL
- **Worker**: Configurable job concurrency limits
- **Memory**: Node.js memory limits via environment variables

## Implementation Checklist

- [ ] Create Dockerfile with multi-stage build
- [ ] Implement worker process manager
- [ ] Add health check endpoint
- [ ] Configure static file serving
- [ ] Setup graceful shutdown handling
- [ ] Create UnRAID template
- [ ] Write deployment documentation
- [ ] Test container in development environment
- [ ] Validate worker enable/disable functionality
- [ ] Test database persistence across container restarts

## Conclusion

This containerization strategy balances simplicity with functionality, providing a single-container deployment that's easy to install on UnRAID while maintaining the flexibility to enable/disable the worker process and handle component failures gracefully. The approach follows UnRAID conventions while ensuring the application remains maintainable and resilient for home users.